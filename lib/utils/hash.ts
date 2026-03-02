import crypto from "crypto";

export function sha256(input: string): string {
  return crypto.createHash("sha256").update(input).digest("hex");
}

export function hmacSha512Hex(keyHex: string, payload: string): string {
  const key = Buffer.from(keyHex, "hex");
  return crypto.createHmac("sha512", key).update(payload, "utf8").digest("hex");
}
