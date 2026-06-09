import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import { TIER_PRICE, type TicketTier } from "@/lib/event";

const PayloadSchema = z.object({
  transId: z.string(),
  status: z.enum(["CREATED", "PENDING", "SUCCESSFUL", "FAILED", "EXPIRED"]),
  medium: z.string().optional(),
  amount: z.number().optional(),
  revenue: z.number().optional(),
  payerName: z.string().optional(),
  email: z.string().optional(),
  externalId: z.string().optional(),
});

export const Route = createFileRoute("/api/public/webhooks/fapshi")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        // 1. Verify webhook secret
        const expected = process.env.FAPSHI_WEBHOOK_SECRET;
        const provided = request.headers.get("x-wh-secret");
        if (!expected || provided !== expected) {
          return new Response("Unauthorized", { status: 401 });
        }

        let body: unknown;
        try {
          body = await request.json();
        } catch {
          return new Response("Bad payload", { status: 400 });
        }

        const parsed = PayloadSchema.safeParse(body);
        if (!parsed.success) return new Response("Invalid payload", { status: 400 });
        const payload = parsed.data;

        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

        const { data: order } = await supabaseAdmin
          .from("orders")
          .select("id, status, tier, amount")
          .eq("fapshi_trans_id", payload.transId)
          .maybeSingle();

        if (!order) return new Response("ok", { status: 200 }); // unknown trans, ack

        // Idempotency: only act on PENDING orders
        if (order.status !== "PENDING") return new Response("ok", { status: 200 });

        if (payload.status === "SUCCESSFUL") {
          const expectedAmount = TIER_PRICE[order.tier as TicketTier];
          if (typeof payload.amount === "number" && payload.amount < expectedAmount) {
            await supabaseAdmin
              .from("orders")
              .update({ status: "FAILED" })
              .eq("id", order.id);
            return new Response("ok", { status: 200 });
          }

          await supabaseAdmin
            .from("orders")
            .update({
              status: "SUCCESSFUL",
              paid_amount: payload.amount ?? order.amount,
              revenue: payload.revenue ?? null,
              medium: payload.medium ?? null,
              payer_name: payload.payerName ?? null,
            })
            .eq("id", order.id);

          // Generate the ticket
          const { TIER_SLOTS } = await import("@/lib/event");
          await supabaseAdmin.from("tickets").insert({
            order_id: order.id,
            slots_total: TIER_SLOTS[order.tier as TicketTier],
          });
        } else if (payload.status === "FAILED" || payload.status === "EXPIRED") {
          await supabaseAdmin
            .from("orders")
            .update({ status: payload.status })
            .eq("id", order.id);
        }

        return new Response("ok", { status: 200 });
      },
    },
  },
});
