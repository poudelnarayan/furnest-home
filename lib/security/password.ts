import bcrypt from "bcryptjs";

const SALT_ROUNDS = 12;

export const password = {
  hash: (plain: string) => bcrypt.hash(plain, SALT_ROUNDS),
  verify: (plain: string, hash: string) => bcrypt.compare(plain, hash),
};
