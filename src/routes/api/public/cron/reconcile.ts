// Fapshi reconciliation cron — re-queries PENDING orders and finalizes them.
// Called by pg_cron every few minutes. No PII returned.
import { createFileRoute } from "@tanstack/react-router";
import { TIER_SLOTS, type TicketTier } from "@/lib/event";

export const Route = createFileRoute("/api/public/cron/reconcile")({
  server: {
    handlers: {
      POST: async () => {
        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
        const { getPaymentStatus } = await import("@/lib/fapshi.server");

        // Pull PENDING orders from the last 24h that have a fapshi_trans_id
        const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
        const { data: pending, error } = await supabaseAdmin
          .from("orders")
          .select("id, tier, amount, fapshi_trans_id, created_at")
          .eq("status", "PENDING")
          .gte("created_at", cutoff)
          .not("fapshi_trans_id", "is", null)
          .limit(50);

        if (error) {
          return Response.json({ ok: false, error: error.message }, { status: 500 });
        }

        let updated = 0;
        let failed = 0;
        let stillPending = 0;

        for (const o of pending ?? []) {
          try {
            const status = await getPaymentStatus(o.fapshi_trans_id!);
            if (status.status === "SUCCESSFUL") {
              await supabaseAdmin
                .from("orders")
                .update({
                  status: "SUCCESSFUL",
                  paid_amount: status.amount ?? o.amount,
                  revenue: status.revenue ?? null,
                  medium: status.medium ?? null,
                  payer_name: status.payerName ?? null,
                })
                .eq("id", o.id);

              // Generate ticket if missing
              const { data: existing } = await supabaseAdmin
                .from("tickets")
                .select("id")
                .eq("order_id", o.id);
              if (!existing || existing.length === 0) {
                await supabaseAdmin.from("tickets").insert({
                  order_id: o.id,
                  slots_total: TIER_SLOTS[o.tier as TicketTier],
                });
              }
              updated++;
            } else if (status.status === "FAILED" || status.status === "EXPIRED") {
              await supabaseAdmin
                .from("orders")
                .update({ status: status.status })
                .eq("id", o.id);
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
          scanned: pending?.length ?? 0,
          updated,
          failed,
          stillPending,
        });
      },
    },
  },
});
