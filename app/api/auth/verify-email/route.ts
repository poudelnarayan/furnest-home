import { z } from "zod";
import { authService } from "@/application/auth/auth.service";
import { AppError } from "@/lib/http/errors";
import { fail, ok } from "@/lib/http/response";

const schema = z.object({ token: z.string().min(32) });

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { token } = schema.parse(body);
    await authService.verifyEmail(token);
    return ok({ verified: true });
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
