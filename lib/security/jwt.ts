import { SignJWT, jwtVerify } from "jose";
import { env } from "@/lib/config/env";

const secret = new TextEncoder().encode(env.JWT_SECRET);

type Role = "USER" | "SUPPORT" | "ADMIN";

export type AuthClaims = {
  sub: string;
  email: string;
  role: Role;
};

export async function signAccessToken(claims: AuthClaims): Promise<string> {
  return new SignJWT({ email: claims.email, role: claims.role })
    .setProtectedHeader({ alg: "HS256", typ: "JWT" })
    .setSubject(claims.sub)
    .setIssuer(env.JWT_ISSUER)
    .setAudience(env.JWT_AUDIENCE)
    .setIssuedAt()
    .setExpirationTime("15m")
    .sign(secret);
}

export async function verifyAccessToken(token: string): Promise<AuthClaims> {
  const { payload } = await jwtVerify(token, secret, {
    issuer: env.JWT_ISSUER,
    audience: env.JWT_AUDIENCE,
  });

  return {
    sub: payload.sub!,
    email: String(payload.email),
    role: payload.role as Role,
  };
}
