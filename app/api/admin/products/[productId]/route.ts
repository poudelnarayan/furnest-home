import { z } from "zod";
import { InventoryMode, Prisma, ProductType } from "@prisma/client";
import { prisma } from "@/lib/db/prisma";
import { requireAuth } from "@/lib/security/auth-context";
import { requireRole } from "@/lib/rbac/roles";
import { fail, ok } from "@/lib/http/response";
import { slugify } from "@/lib/utils/slug";

const updateSchema = z.object({
  name: z.string().min(2).optional(),
  category: z.string().min(2).optional(),
  description: z.string().min(10).optional(),
  priceCents: z.number().int().positive().optional(),
  type: z.enum(["digital", "physical"]).optional(),
  image: z.string().url().optional(),
  badge: z.string().max(40).optional(),
  active: z.boolean().optional(),
});

export async function PATCH(req: Request, { params }: { params: Promise<{ productId: string }> }) {
  try {
    const auth = await requireAuth();
    requireRole(auth.role, ["ADMIN"]);

    const { productId } = await params;
    const input = updateSchema.parse(await req.json());

    let categoryId: string | undefined;
    if (input.category) {
      const categorySlug = slugify(input.category);
      const category = await prisma.category.upsert({
        where: { slug: categorySlug },
        create: { slug: categorySlug, name: input.category },
        update: { name: input.category },
      });
      categoryId = category.id;
    }

    const existing = await prisma.product.findUnique({ where: { id: productId } });
    if (!existing) {
      return fail("Product not found", 404, "NOT_FOUND");
    }

    const oldMeta = (existing.metadata ?? {}) as { image?: string; badge?: string };
    const mergedMeta = {
      image: input.image ?? oldMeta.image,
      badge: input.badge ?? oldMeta.badge,
    };

    const product = await prisma.product.update({
      where: { id: productId },
      data: {
        name: input.name,
        description: input.description,
        categoryId,
        unitPriceCents: input.priceCents ? BigInt(input.priceCents) : undefined,
        type:
          input.type === "physical"
            ? ProductType.PHYSICAL
            : input.type === "digital"
              ? ProductType.DIGITAL_INSTANT
              : undefined,
        inventoryMode:
          input.type === "physical"
            ? InventoryMode.TRACKED
            : input.type === "digital"
              ? InventoryMode.UNLIMITED
              : undefined,
        active: input.active,
        metadata: mergedMeta as Prisma.InputJsonValue,
      },
      include: { category: true },
    });

    return ok({ product });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return fail("Validation failed", 422, "VALIDATION_ERROR");
    }
    return fail("Bad request", 400, "BAD_REQUEST");
  }
}
