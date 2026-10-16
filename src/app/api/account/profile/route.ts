import { z } from "zod";
import { getUserModel } from "@/models/user";
import { fail, logger, ok, parseBody, withErrorHandling } from "@/lib/http";
import { requireRole } from "@/lib/session";

export const dynamic = "force-dynamic";

const addressSchema = z.object({
  label: z.string().max(40).optional(),
  line1: z.string().min(1, "Address line is required").max(160),
  line2: z.string().max(160).optional(),
  city: z.string().max(80).optional(),
  lat: z.number().optional(),
  lng: z.number().optional(),
});

const updateSchema = z.object({
  name: z.string().max(80).optional(),
  phone: z.string().max(30).optional(),
  addresses: z.array(addressSchema).max(10).optional(),
});

/** The signed-in user's editable profile. */
export const GET = withErrorHandling(async () => {
  const { user, response } = await requireRole();
  if (response) return response;

  const User = await getUserModel();
  if (!User) return fail("Database is not available", 503);

  const doc = await User.findById(user.id).lean();
  if (!doc) return fail("Account not found", 404);

  return ok({
    name: doc.name ?? "",
    email: doc.email,
    phone: doc.phone ?? "",
    role: doc.role,
    status: doc.status,
    addresses: doc.addresses ?? [],
  });
});

/** Update name, phone and saved delivery addresses. */
export const PATCH = withErrorHandling(async (req) => {
  const { user, response } = await requireRole();
  if (response) return response;

  const { data, error } = await parseBody(req, updateSchema);
  if (error) return error;

  const User = await getUserModel();
  if (!User) return fail("Database is not available", 503);

  const update: Record<string, unknown> = {};
  if (data.name !== undefined) update.name = data.name;
  if (data.phone !== undefined) update.phone = data.phone;
  if (data.addresses !== undefined) update.addresses = data.addresses;

  const doc = await User.findByIdAndUpdate(user.id, update, { new: true }).lean();
  if (!doc) return fail("Account not found", 404);

  logger.info("Profile updated", { user: user.id });
  return ok({
    name: doc.name ?? "",
    email: doc.email,
    phone: doc.phone ?? "",
    role: doc.role,
    status: doc.status,
    addresses: doc.addresses ?? [],
  });
});
