import Tokens from "csrf";
import { env } from "@/lib/config/env";

const tokens = new Tokens();

export const csrf = {
  generateToken: () => tokens.create(env.CSRF_SECRET),
  verifyToken: (token: string) => tokens.verify(env.CSRF_SECRET, token),
};
