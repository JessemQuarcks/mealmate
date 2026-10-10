import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";
import { canAccessPath, requiredRolesForPath, type Role } from "@/lib/roles";

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  const required = requiredRolesForPath(pathname);
  if (required === undefined) return NextResponse.next(); // public route

  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });

  if (!token) {
    const signInUrl = new URL("/signin", req.url);
    signInUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(signInUrl);
  }

  if (!canAccessPath(pathname, token.role as Role | undefined)) {
    return NextResponse.redirect(new URL("/forbidden", req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/account/:path*",
    "/Checkout/:path*",
    "/history/:path*",
    "/vendor/:path*",
    "/admin/:path*",
    "/courier/:path*",
  ],
};
