// Fapshi reconciliation cron — re-queries PENDING orders and finalizes them.
// Called by an external scheduler every few minutes. No PII returned.
import { prisma } from "@/lib/server/db";
import { getPaymentStatus } from "@/lib/server/fapshi";
import { ensureTicketForOrder } from "@/lib/server/tickets";
import { type TicketTier } from "@/lib/event";

// Up to 50 sequential Fapshi lookups — allow more than the serverless
// default execution window (Vercel Hobby caps at 60s).
export const maxDuration = 60;

export async function POST() {
  // Pull PENDING orders from the last 24h that have a fapshi_trans_id
  const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000);

  let pending;
  try {
    pending = await prisma.order.findMany({
      where: {
        status: "PENDING",
        createdAt: { gte: cutoff },
        fapshiTransId: { not: null },
      },
      select: { id: true, tier: true, amount: true, fapshiTransId: true, createdAt: true },
      take: 50,
    });
  } catch (e) {
    return Response.json(
      { ok: false, error: e instanceof Error ? e.message : "Query failed" },
      { status: 500 },
    );
  }

  let updated = 0;
  let failed = 0;
  let stillPending = 0;

  for (const o of pending) {
    try {
      const status = await getPaymentStatus(o.fapshiTransId!);
      if (status.status === "SUCCESSFUL") {
        await prisma.order.update({
          where: { id: o.id },
          data: {
            status: "SUCCESSFUL",
            paidAmount: status.amount ?? o.amount,
            revenue: status.revenue ?? null,
            medium: status.medium ?? null,
            payerName: status.payerName ?? null,
          },
        });

        // Generate ticket if missing
        await ensureTicketForOrder(o.id, o.tier as TicketTier);
        updated++;
      } else if (status.status === "FAILED" || status.status === "EXPIRED") {
        await prisma.order.update({
          where: { id: o.id },
          data: { status: status.status },
        });
        failed++;
      } else {
        stillPending++;
      }
    } catch (e) {
      console.error("[reconcile]", o.id, e);
    }
  }

  return Response.json({
    ok: true,
    scanned: pending.length,
    updated,
    failed,
    stillPending,
  });
}
