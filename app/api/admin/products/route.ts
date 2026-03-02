import { z } from "zod";
import { InventoryMode, Prisma, ProductType } from "@prisma/client";
import { prisma } from "@/lib/db/prisma";
import { requireAuth } from "@/lib/security/auth-context";
import { requireRole } from "@/lib/rbac/roles";
import { fail, ok } from "@/lib/http/response";
import { slugify } from "@/lib/utils/slug";

const createSchema = z.object({
  name: z.string().min(2),
  category: z.string().min(2),
  description: z.string().min(10),
  priceCents: z.number().int().positive(),
  type: z.enum(["digital", "physical"]),
  image: z.string().url().optional(),
  badge: z.string().max(40).optional(),
  active: z.boolean().default(true),
});

export async function GET() {
  try {
    const auth = await requireAuth();
    requireRole(auth.role, ["ADMIN", "SUPPORT"]);

    const products = await prisma.product.findMany({
      include: { category: true },
      orderBy: { createdAt: "desc" },
      take: 300,
    });

    return ok({ products });
  } catch {
    return fail("Forbidden", 403, "FORBIDDEN");
  }
}

export async function POST(req: Request) {
  try {
    const auth = await requireAuth();
    requireRole(auth.role, ["ADMIN"]);

    const input = createSchema.parse(await req.json());
    const categorySlug = slugify(input.category);

    const category = await prisma.category.upsert({
      where: { slug: categorySlug },
      create: { slug: categorySlug, name: input.category },
      update: { name: input.category },
    });

    const productSlugBase = slugify(input.name);
    const sku = `SKU-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

    const product = await prisma.product.create({
      data: {
        categoryId: category.id,
        sku,
        slug: `${productSlugBase}-${Date.now().toString().slice(-4)}`,
        name: input.name,
        description: input.description,
        type: input.type === "physical" ? ProductType.PHYSICAL : ProductType.DIGITAL_INSTANT,
        inventoryMode: input.type === "physical" ? InventoryMode.TRACKED : InventoryMode.UNLIMITED,
        unitPriceCents: BigInt(input.priceCents),
        active: input.active,
        metadata: {
          image: input.image,
          badge: input.badge,
        } as Prisma.InputJsonValue,
      },
      include: { category: true },
    });

    return ok({ product }, 201);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return fail("Validation failed", 422, "VALIDATION_ERROR");
    }
    return fail("Bad request", 400, "BAD_REQUEST");
  }
}
