import { ok } from "@/lib/http/response";
import { getCatalogProducts } from "@/lib/data/catalog";

export async function GET() {
  const products = await getCatalogProducts();
  return ok({ products });
}
