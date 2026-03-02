import { z } from "zod";

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  APP_URL: z.string().url(),
  JWT_SECRET: z.string().min(32),
  JWT_ISSUER: z.string().min(1),
  JWT_AUDIENCE: z.string().min(1),
  DATABASE_URL: z.string().min(1),
  REDIS_URL: z.string().min(1),
  AUTHORIZE_NET_ENV: z.enum(["sandbox", "production"]).default("sandbox"),
  AUTHORIZE_NET_API_LOGIN_ID: z.string().min(1),
  AUTHORIZE_NET_TRANSACTION_KEY: z.string().min(1),
  AUTHORIZE_NET_SIGNATURE_KEY: z.string().min(1),
  AUTHORIZE_NET_CLIENT_KEY: z.string().min(1),
  CSRF_SECRET: z.string().min(16),
});

const rawEnv = {
  NODE_ENV: process.env.NODE_ENV,
  APP_URL: process.env.APP_URL,
  JWT_SECRET: process.env.JWT_SECRET,
  JWT_ISSUER: process.env.JWT_ISSUER,
  JWT_AUDIENCE: process.env.JWT_AUDIENCE,
  DATABASE_URL: process.env.DATABASE_URL,
  REDIS_URL: process.env.REDIS_URL,
  AUTHORIZE_NET_ENV: process.env.AUTHORIZE_NET_ENV,
  AUTHORIZE_NET_API_LOGIN_ID: process.env.AUTHORIZE_NET_API_LOGIN_ID,
  AUTHORIZE_NET_TRANSACTION_KEY: process.env.AUTHORIZE_NET_TRANSACTION_KEY,
  AUTHORIZE_NET_SIGNATURE_KEY: process.env.AUTHORIZE_NET_SIGNATURE_KEY,
  AUTHORIZE_NET_CLIENT_KEY: process.env.AUTHORIZE_NET_CLIENT_KEY,
  CSRF_SECRET: process.env.CSRF_SECRET,
};

const developmentFallbacks = {
  APP_URL: "http://localhost:3000",
  JWT_SECRET: "dev-only-secret-change-me-dev-only-secret",
  JWT_ISSUER: "shopyourproduct",
  JWT_AUDIENCE: "shopyourproduct-users",
  DATABASE_URL: "postgresql://postgres:postgres@localhost:5432/shopyourproduct",
  REDIS_URL: "redis://localhost:6379",
  AUTHORIZE_NET_API_LOGIN_ID: "sandbox_login_id",
  AUTHORIZE_NET_TRANSACTION_KEY: "sandbox_transaction_key",
  AUTHORIZE_NET_SIGNATURE_KEY: "sandbox_signature_key",
  AUTHORIZE_NET_CLIENT_KEY: "sandbox_client_key",
  CSRF_SECRET: "dev-only-csrf-secret-change-me",
};

const definedEnv = Object.fromEntries(
  Object.entries(rawEnv).filter(([, value]) => value !== undefined),
);

export const env =
  rawEnv.NODE_ENV === "production"
    ? envSchema.parse(rawEnv)
    : envSchema.parse({
        ...developmentFallbacks,
        ...definedEnv,
      });
