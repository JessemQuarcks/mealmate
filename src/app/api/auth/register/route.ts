import bcrypt from "bcryptjs";
import { z } from "zod";
import { getUserModel } from "@/models/user";
import { fail, logger, ok, parseBody, withErrorHandling } from "@/lib/http";
import { SELF_ASSIGNABLE_ROLES } from "@/lib/roles";

const registerSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("A valid email is required"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  // Clients are active immediately; vendors/couriers start pending verification.
  role: z.enum(["client", "vendor", "courier"]).optional(),
});

export const POST = withErrorHandling(async (req) => {
  const { data, error } = await parseBody(req, registerSchema);
  if (error) return error;

  const role = data.role ?? "client";
  if (!SELF_ASSIGNABLE_ROLES.includes(role)) {
    return fail("That role cannot be self-assigned", 422);
  }

  const User = await getUserModel();
  if (!User) return fail("Database is not available", 503);

  const email = data.email.toLowerCase();
  const existing = await User.findOne({ email }).exec();
  if (existing) {
    return fail("An account with this email already exists", 409);
  }

  const passwordHash = await bcrypt.hash(data.password, 12);
  // Vendors and couriers require review before they can act (Phase 3 / Phase 7).
  const status = role === "client" ? "active" : "pending";

  const user = await User.create({
    name: data.name,
    email,
    passwordHash,
    provider: "credentials",
    role,
    status,
  });

  const id = String(user._id);
  logger.info("User registered", { id, role: user.role });
  return ok({ id, email: user.email, role: user.role, status: user.status }, 201);
});
