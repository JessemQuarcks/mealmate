import type { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { getUserModel } from "@/models/user";
import { DEFAULT_ROLE, Role, AccountStatus } from "@/lib/roles";
import { isSuperadminEmail } from "@/lib/superadmin";
import { logger } from "@/lib/http";

export const authOptions: NextAuthOptions = {
  session: { strategy: "jwt" },
  pages: {
    signIn: "/signin",
  },
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_ID ?? "",
      clientSecret: process.env.GOOGLE_SECRET ?? "",
    }),
    CredentialsProvider({
      name: "Email and password",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

        const User = await getUserModel();
        if (!User) return null;

        const user = await User.findOne({ email: credentials.email.toLowerCase() })
          .select("+passwordHash")
          .exec();
        if (!user || !user.passwordHash) return null;

        const valid = await bcrypt.compare(credentials.password, user.passwordHash);
        if (!valid) return null;

        return {
          id: String(user._id),
          email: user.email,
          name: user.name,
          image: user.image,
          role: user.role,
          status: user.status,
        };
      },
    }),
  ],
  callbacks: {
    // For Google sign-in, create the user record on first login (default role).
    async signIn({ user, account }) {
      if (account?.provider !== "google" || !user.email) return true;
      try {
        const User = await getUserModel();
        if (!User) return false;
        await User.findOneAndUpdate(
          { email: user.email.toLowerCase() },
          {
            $setOnInsert: {
              email: user.email.toLowerCase(),
              provider: "google",
              role: DEFAULT_ROLE,
              status: "active",
            },
            $set: { name: user.name, image: user.image },
          },
          { upsert: true, new: true }
        );
        return true;
      } catch (err) {
        logger.error("Google signIn upsert failed", err);
        return false;
      }
    },

    async jwt({ token, user }) {
      // `user` is only present on initial sign-in.
      if (user) {
        const maybeRole = (user as { role?: Role }).role;
        if (maybeRole) {
          // Credentials provider already supplied our fields.
          token.id = (user as { id: string }).id;
          token.role = maybeRole;
          token.status = (user as { status: AccountStatus }).status;
        } else if (user.email) {
          // Google: read the role/status we just persisted.
          const User = await getUserModel();
          const dbUser = await User?.findOne({ email: user.email.toLowerCase() }).exec();
          if (dbUser) {
            token.id = String(dbUser._id);
            token.role = dbUser.role;
            token.status = dbUser.status;
          }
        }
      }
      if (!token.role) token.role = DEFAULT_ROLE;
      if (!token.status) token.status = "active";

      // Superadmins are elevated to admin on every session, so a single account
      // (e.g. the project owner) can access every role area.
      if (user?.email) token.email = user.email;
      if (isSuperadminEmail(token.email)) {
        token.role = "admin";
        token.status = "active";
      }
      return token;
    },

    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id;
        session.user.role = token.role;
        session.user.status = token.status;
      }
      return session;
    },
  },
};
