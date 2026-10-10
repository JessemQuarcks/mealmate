import { getProductsModel } from "@/models/products";
import { fail, logger, ok, parseBody, withErrorHandling } from "@/lib/http";
import { requireRole } from "@/lib/session";
import { z } from "zod";

const productSchema = z.object({
  id: z.string(),
  name: z.string(),
  price: z.number().nonnegative(),
  image: z.string(),
});

const productsSchema = z.object({
  id: z.number(),
  products: z.array(productSchema),
});

export const POST = withErrorHandling(async (req) => {
  const { response } = await requireRole(["vendor", "admin"]);
  if (response) return response;

  const { data, error } = await parseBody(req, productsSchema);
  if (error) return error;

  const Products = await getProductsModel();
  if (!Products) {
    return fail("Database is not available", 503);
  }

  const created = await Products.create(data);
  logger.info("Products inserted", { id: created.id });
  return ok(created, 201);
});
