import Redis from "ioredis";
import { env } from "@/lib/config/env";

declare global {
  var redisGlobal: Redis | undefined;
}

export const redis =
  global.redisGlobal ??
  new Redis(env.REDIS_URL, {
    maxRetriesPerRequest: 2,
    enableReadyCheck: true,
    lazyConnect: false,
  });

if (process.env.NODE_ENV !== "production") {
  global.redisGlobal = redis;
}
