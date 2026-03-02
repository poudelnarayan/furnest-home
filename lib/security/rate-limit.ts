import { redis } from "@/lib/cache/redis";

type RateLimitOptions = {
  key: string;
  limit: number;
  windowSeconds: number;
};

export async function rateLimit({ key, limit, windowSeconds }: RateLimitOptions): Promise<boolean> {
  const redisKey = `ratelimit:${key}`;
  const current = await redis.incr(redisKey);
  if (current === 1) {
    await redis.expire(redisKey, windowSeconds);
  }
  return current <= limit;
}
