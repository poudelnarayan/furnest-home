import { prisma } from "@/lib/db/prisma";
import { requireAuth } from "@/lib/security/auth-context";
import { fail, ok } from "@/lib/http/response";

export async function GET() {
  try {
    const auth = await requireAuth();

    const [wallet, transactions] = await Promise.all([
      prisma.wallet.findUnique({ where: { userId: auth.sub } }),
      prisma.walletLedgerEntry.findMany({
        where: { userId: auth.sub },
        orderBy: { createdAt: "desc" },
        take: 100,
      }),
    ]);

    return ok({ wallet, transactions });
  } catch {
    return fail("Unauthorized", 401, "UNAUTHORIZED");
  }
}
