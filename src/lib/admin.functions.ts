import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { TIER_LABEL, type TicketTier } from "./event";

async function assertAdmin(userId: string) {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data, error } = await supabaseAdmin.rpc("has_role", {
    _user_id: userId,
    _role: "admin",
  });
  if (error) throw new Error("Permission check failed");
  if (!data) throw new Error("Forbidden: admin role required");
}

async function assertScanner(userId: string) {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const [admin, scanner] = await Promise.all([
    supabaseAdmin.rpc("has_role", { _user_id: userId, _role: "admin" }),
    supabaseAdmin.rpc("has_role", { _user_id: userId, _role: "scanner" }),
  ]);
  if (!admin.data && !scanner.data) throw new Error("Forbidden: scanner role required");
}

export const getMyAdminAccess = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const [admin, scanner] = await Promise.all([
      supabaseAdmin.rpc("has_role", { _user_id: context.userId, _role: "admin" }),
      supabaseAdmin.rpc("has_role", { _user_id: context.userId, _role: "scanner" }),
    ]);
    return {
      isAdmin: !!admin.data,
      isScanner: !!scanner.data,
    };
  });

const ListSchema = z.object({
  status: z.enum(["ALL", "PENDING", "SUCCESSFUL", "FAILED", "EXPIRED"]).default("ALL"),
  search: z.string().trim().max(100).optional(),
  limit: z.number().int().min(1).max(200).default(100),
});

export const listOrders = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => ListSchema.parse(d))
  .handler(async ({ context, data }) => {
    await assertAdmin(context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    let q = supabaseAdmin
      .from("orders")
      .select("id, buyer_name, user_email, phone_number, tier, amount, paid_amount, status, medium, created_at")
      .order("created_at", { ascending: false })
      .limit(data.limit);
    if (data.status !== "ALL") q = q.eq("status", data.status);
    if (data.search) {
      const s = `%${data.search}%`;
      q = q.or(
        `buyer_name.ilike.${s},user_email.ilike.${s},phone_number.ilike.${s},external_id.ilike.${s}`,
      );
    }
    const { data: rows, error } = await q;
    if (error) throw new Error(error.message);

    // Aggregate stats
    const { data: stats } = await supabaseAdmin
      .from("orders")
      .select("status, amount, paid_amount");
    const summary = {
      total: stats?.length ?? 0,
      paid: stats?.filter((o) => o.status === "SUCCESSFUL").length ?? 0,
      pending: stats?.filter((o) => o.status === "PENDING").length ?? 0,
      revenue: (stats ?? [])
        .filter((o) => o.status === "SUCCESSFUL")
        .reduce((sum, o) => sum + (o.paid_amount ?? o.amount ?? 0), 0),
    };
    return { orders: rows ?? [], summary };
  });

const ScanSchema = z.object({ qrSlug: z.string().trim().min(8).max(200) });

export const scanTicket = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => ScanSchema.parse(d))
  .handler(async ({ context, data }) => {
    await assertScanner(context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: rows, error } = await supabaseAdmin.rpc("burn_ticket_slot", {
      _qr_slug: data.qrSlug,
    });
    if (error) throw new Error(error.message);
    const r = rows?.[0];
    if (!r) {
      return { outcome: "UNKNOWN" as const };
    }
    if (!r.order_paid) {
      return { outcome: "UNPAID" as const, buyerName: r.buyer_name };
    }
    if (r.is_fully_used && r.slots_used === r.slots_total && r.slots_used > 0) {
      // Re-check: was this scan the one that filled it?
      // burn_ticket_slot already incremented if not previously full. If slots_used incremented to == total now and was not full before, treat as OK.
    }
    // Determine fresh vs duplicate by checking if slots_used > slots_total would be impossible.
    // The RPC short-circuits when is_fully_used was already true (returns slots_used == slots_total without bump).
    // We can't distinguish here perfectly, so trust is_fully_used + slots_used:
    const justFilled = r.slots_used === r.slots_total;
    // Fetch order tier for display
    const { data: ord } = await supabaseAdmin
      .from("orders")
      .select("tier")
      .eq("id", r.order_id)
      .maybeSingle();
    return {
      outcome: "OK" as const,
      buyerName: r.buyer_name,
      slotsTotal: r.slots_total,
      slotsUsed: r.slots_used,
      fullyUsed: r.is_fully_used,
      justFilled,
      tierLabel: ord?.tier ? TIER_LABEL[ord.tier as TicketTier] : "",
    };
  });

const MarkSchema = z.object({ orderId: z.string().uuid() });

export const markOrderPaid = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => MarkSchema.parse(d))
  .handler(async ({ context, data }) => {
    await assertAdmin(context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { TIER_SLOTS } = await import("./event");

    const { data: order, error } = await supabaseAdmin
      .from("orders")
      .select("id, status, tier, amount")
      .eq("id", data.orderId)
      .maybeSingle();
    if (error || !order) throw new Error("Order not found");
    if (order.status === "SUCCESSFUL") return { ok: true, alreadyPaid: true };

    await supabaseAdmin
      .from("orders")
      .update({ status: "SUCCESSFUL", paid_amount: order.amount })
      .eq("id", order.id);

    // Generate ticket if none
    const { data: existing } = await supabaseAdmin
      .from("tickets")
      .select("id")
      .eq("order_id", order.id);
    if (!existing || existing.length === 0) {
      await supabaseAdmin.from("tickets").insert({
        order_id: order.id,
        slots_total: TIER_SLOTS[order.tier as TicketTier],
      });
    }
    return { ok: true };
  });
