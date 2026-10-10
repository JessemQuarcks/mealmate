import { getRestaurantsModel } from "@/models/restaurant";
import { fail, logger, ok, parseBody, withErrorHandling } from "@/lib/http";
import { requireRole } from "@/lib/session";
import { z } from "zod";

const restaurantSchema = z.object({
  id: z.number({ required_error: "Please add restaurant Id" }),
  name: z.string().optional(),
});

export const POST = withErrorHandling(async (req) => {
  const { response } = await requireRole("admin");
  if (response) return response;

  const { data, error } = await parseBody(req, restaurantSchema);
  if (error) return error;

  const Restaurants = await getRestaurantsModel();
  if (!Restaurants) {
    return fail("Database is not available", 503);
  }

  const created = await Restaurants.create(data);
  logger.info("Restaurant created", { id: created.id });
  return ok(created, 201);
});
