import { z } from "zod";
import { orderService } from "@/application/orders/order.service";
import { requireAuth } from "@/lib/security/auth-context";
import { AppError } from "@/lib/http/errors";
import { fail, ok } from "@/lib/http/response";

const schema = z.object({
  items: z.array(
    z.object({
      productId: z.string().min(1),
      quantity: z.number().int().positive().max(100),
      metadata: z.record(z.any()).optional(),
    }),
  ),
  topupMetadata: z.record(z.any()).optional(),
});

export async function POST(req: Request) {
  try {
    const auth = await requireAuth();
    const body = await req.json();
    const input = schema.parse(body);

    const order = await orderService.createOrder({
      userId: auth.sub,
      items: input.items,
      topupMetadata: input.topupMetadata,
    });

    return ok({ order }, 201);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return fail("Validation failed", 422, "VALIDATION_ERROR");
    }
    if (error instanceof AppError) {
      return fail(error.message, error.statusCode, error.code);
    }
    return fail("Internal server error", 500, "INTERNAL_ERROR");
  }
}
