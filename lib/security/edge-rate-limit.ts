type WindowState = {
  count: number;
  resetAt: number;
};

declare global {
  var edgeRateLimitMap: Map<string, WindowState> | undefined;
}

const store = global.edgeRateLimitMap ?? new Map<string, WindowState>();

if (!global.edgeRateLimitMap) {
  global.edgeRateLimitMap = store;
}

export function edgeRateLimit(key: string, limit: number, windowSeconds: number): boolean {
  const now = Date.now();
  const existing = store.get(key);

  if (!existing || existing.resetAt <= now) {
    store.set(key, { count: 1, resetAt: now + windowSeconds * 1000 });
    return true;
  }

  existing.count += 1;
  store.set(key, existing);
  return existing.count <= limit;
}
