import { prisma } from "@/lib/db/prisma";
import { products as staticProducts, type Product } from "@/lib/data/products";

export async function getCatalogProducts(): Promise<Product[]> {
  // In local/dev preview mode, allow storefront pages to render without DB wiring.
  if (!process.env.DATABASE_URL) {
    return staticProducts;
  }

  try {
    const dbProducts = await prisma.product.findMany({
      where: { active: true },
      include: { category: true },
      orderBy: { createdAt: "desc" },
    });

    if (!dbProducts.length) {
      return staticProducts;
    }

    return dbProducts.map((product) => {
      const metadata = (product.metadata ?? {}) as { image?: string; badge?: string };
      return {
        id: product.id,
        slug: product.slug,
        name: product.name,
        category: product.category.name,
        type: product.type === "PHYSICAL" ? "physical" : "digital",
        priceCents: Number(product.unitPriceCents),
        image:
          metadata.image ??
          "https://images.unsplash.com/photo-1542751371-adc38448a05e?w=1200&q=80&auto=format&fit=crop",
        description: product.description,
        badge: metadata.badge,
      };
    });
  } catch {
    return staticProducts;
  }
}
