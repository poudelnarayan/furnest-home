import { OrderStatus, Prisma } from "@prisma/client";
import { prisma } from "@/lib/db/prisma";
import { AppError } from "@/lib/http/errors";

export const orderService = {
  async createOrder(input: {
    userId: string;
    items: Array<{ productId: string; quantity: number; metadata?: Prisma.InputJsonValue }>;
    topupMetadata?: Prisma.InputJsonValue;
  }) {
    if (!input.items.length) {
      throw new AppError("Order must include at least one item", "ORDER_ITEMS_REQUIRED", 400);
    }

    return prisma.$transaction(async (tx) => {
      const productIds = input.items.map((item) => item.productId);
      const products = await tx.product.findMany({ where: { id: { in: productIds }, active: true } });

      if (products.length !== productIds.length) {
        throw new AppError("Some products are invalid or inactive", "INVALID_PRODUCTS", 400);
      }

      const productMap = new Map(products.map((p) => [p.id, p]));

      let subtotal = BigInt(0);
      const orderItemsData = input.items.map((item) => {
        const product = productMap.get(item.productId)!;
        const total = product.unitPriceCents * BigInt(item.quantity);
        subtotal += total;

        return {
          productId: product.id,
          quantity: item.quantity,
          unitPriceCents: product.unitPriceCents,
          totalPriceCents: total,
          metadata: item.metadata,
        };
      });

      const order = await tx.order.create({
        data: {
          userId: input.userId,
          orderNumber: `ORD-${Date.now()}`,
          status: OrderStatus.PENDING,
          subtotalCents: subtotal,
          totalCents: subtotal,
          paymentExpiresAt: new Date(Date.now() + 1000 * 60 * 15),
          topupMetadata: input.topupMetadata,
          items: {
            create: orderItemsData,
          },
        },
        include: { items: true },
      });

      return order;
    });
  },
};
