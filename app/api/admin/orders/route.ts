import { prisma } from "@/lib/db/prisma";
import { requireAuth } from "@/lib/security/auth-context";
import { requireRole } from "@/lib/rbac/roles";
import { fail, ok } from "@/lib/http/response";

export async function GET() {
  try {
    const auth = await requireAuth();
    requireRole(auth.role, ["ADMIN", "SUPPORT"]);

    const orders = await prisma.order.findMany({
      orderBy: { createdAt: "desc" },
      take: 200,
      include: { items: true, user: { select: { id: true, email: true } } },
    });

    return ok({ orders });
  } catch {
    return fail("Forbidden", 403, "FORBIDDEN");
  }
}
