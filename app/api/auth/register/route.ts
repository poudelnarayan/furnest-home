import { z } from "zod";
import { authService } from "@/application/auth/auth.service";
import { fail, ok } from "@/lib/http/response";
import { AppError } from "@/lib/http/errors";

const schema = z.object({
  email: z.string().email(),
  fullName: z.string().min(2).max(120),
  password: z.string().min(10).max(128),
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const input = schema.parse(body);
    const result = await authService.register(input);

    return ok(
      {
        userId: result.userId,
        verificationToken: result.verificationToken,
      },
      201,
    );
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
