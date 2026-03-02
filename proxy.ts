import { NextRequest, NextResponse } from "next/server";
import { edgeRateLimit } from "@/lib/security/edge-rate-limit";

const WRITE_METHODS = new Set(["POST", "PUT", "PATCH", "DELETE"]);

export function proxy(req: NextRequest) {
  const ip = req.headers.get("x-forwarded-for") ?? "unknown";
  const allowed = edgeRateLimit(`${ip}:${req.nextUrl.pathname}`, 100, 60);

  if (!allowed) {
    return NextResponse.json({ success: false, error: { message: "Too many requests" } }, { status: 429 });
  }

  if (WRITE_METHODS.has(req.method) && req.nextUrl.pathname.startsWith("/api")) {
    const origin = req.headers.get("origin");
    const appUrl = process.env.APP_URL ?? "";
    if (origin && appUrl && !origin.startsWith(appUrl)) {
      return NextResponse.json({ success: false, error: { message: "Invalid origin" } }, { status: 403 });
    }
  }

  const response = NextResponse.next();
  response.headers.set("X-Frame-Options", "DENY");
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("Referrer-Policy", "same-origin");
  response.headers.set(
    "Content-Security-Policy",
    "default-src 'self'; script-src 'self' 'unsafe-inline' https://js.authorize.net; frame-ancestors 'none';",
  );

  return response;
}

export const config = {
  matcher: ["/api/:path*", "/((?!_next/static|_next/image|favicon.ico).*)"],
};
