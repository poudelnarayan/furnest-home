import { cookies } from "next/headers";
import { verifyAccessToken, type AuthClaims } from "@/lib/security/jwt";
import { AppError } from "@/lib/http/errors";

export async function requireAuth(): Promise<AuthClaims> {
  const cookieStore = await cookies();
  const token = cookieStore.get("access_token")?.value;

  if (!token) {
    throw new AppError("Unauthorized", "UNAUTHORIZED", 401);
  }

  return verifyAccessToken(token);
}
