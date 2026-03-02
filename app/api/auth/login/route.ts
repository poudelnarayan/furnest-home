import { z } from "zod";
import { authService } from "@/application/auth/auth.service";
import { fail, ok } from "@/lib/http/response";
import { AppError } from "@/lib/http/errors";

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(10).max(128),
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const input = schema.parse(body);
    const result = await authService.login(input);

    const response = ok({ user: { id: result.user.id, email: result.user.email, role: result.user.role } });
    response.cookies.set({
      name: "access_token",
      value: result.accessToken,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      path: "/",
      maxAge: 60 * 15,
    });

    return response;
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
