import { z } from "zod";
import { getUserModel } from "@/models/user";
import { fail, ok, parseBody, logger, withErrorHandling } from "@/lib/http";
import { requireRole } from "@/lib/session";
import { ACCOUNT_STATUSES, ROLES } from "@/lib/roles";

export const GET = withErrorHandling(async () => {
  const { response } = await requireRole("admin");
  if (response) return response;

  const User = await getUserModel();
  if (!User) return fail("Database is not available", 503);

  // Pending accounts first, so the verification queue is front and centre.
  const users = await User.find({})
    .select("name email role status createdAt")
    .sort({ status: 1, createdAt: -1 })
    .limit(200)
    .lean();

  return ok(users);
});

const patchSchema = z.object({
  userId: z.string().min(1),
  status: z.enum(ACCOUNT_STATUSES).optional(),
  role: z.enum(ROLES).optional(),
});

export const PATCH = withErrorHandling(async (req) => {
  const { user: admin, response } = await requireRole("admin");
  if (response) return response;

  const { data, error } = await parseBody(req, patchSchema);
  if (error) return error;

  if (!data.status && !data.role) {
    return fail("Provide a status or role to update", 422);
  }

  const User = await getUserModel();
  if (!User) return fail("Database is not available", 503);

  const update: Record<string, string> = {};
  if (data.status) update.status = data.status;
  if (data.role) update.role = data.role;

  const updated = await User.findByIdAndUpdate(data.userId, update, { new: true })
    .select("name email role status")
    .lean();

  if (!updated) return fail("User not found", 404);

  logger.info("Admin updated user", { by: admin.id, userId: data.userId, update });
  return ok(updated);
});
