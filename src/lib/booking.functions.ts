import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { createId } from "@paralleldrive/cuid2";
import {
  TIER_PRICE,
  TIER_SLOTS,
  TIER_LABEL,
  type TicketTier,
} from "./event";

const TierEnum = z.enum([
  "CLASSIC",
  "CLASSIC_COUPLE",
  "VIP",
  "VIP_COUPLE",
  "TABLE_OF_5",
]);

const BookingSchema = z.object({
  buyerName: z.string().trim().min(2).max(100),
  email: z.string().trim().email().max(255),
  phoneNumber: z
    .string()
    .trim()
    .regex(/^6[5-9]\d{7}$/, "Enter a valid Cameroonian number (e.g. 670000000)"),
  tier: TierEnum,
  origin: z.string().url().optional(),
});

export const createBooking = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => BookingSchema.parse(data))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { initiatePayment } = await import("./fapshi.server");

    const tier = data.tier as TicketTier;
    const amount = TIER_PRICE[tier]; // SERVER-AUTHORITATIVE price
    const externalId = createId();

    // 1. Create PENDING order first
    const { data: order, error: insertErr } = await supabaseAdmin
      .from("orders")
      .insert({
        external_id: externalId,
        buyer_name: data.buyerName,
        user_email: data.email,
        phone_number: data.phoneNumber,
        tier,
        amount,
        status: "PENDING",
      })
      .select("id")
      .single();

    if (insertErr || !order) {
      throw new Error("Could not create booking. Please try again.");
    }

    const redirectUrl = data.origin
      ? `${data.origin}/confirmation/${order.id}`
      : undefined;

    // 2. Initiate Fapshi payment
    try {
      const pay = await initiatePayment({
        amount,
        email: data.email,
        externalId,
        redirectUrl,
        message: `${TIER_LABEL[tier]} — FET Black Tie Event`,
      });

      await supabaseAdmin
        .from("orders")
        .update({
          fapshi_trans_id: pay.transId,
          fapshi_payment_link: pay.link,
        })
        .eq("id", order.id);

      return {
        orderId: order.id,
        paymentLink: pay.link,
      };
    } catch (err) {
      // Mark as FAILED so the user can retry cleanly
      await supabaseAdmin
        .from("orders")
        .update({ status: "FAILED" })
        .eq("id", order.id);
      throw err;
    }
  });

const OrderLookupSchema = z.object({ orderId: z.string().uuid() });

export const getOrderStatus = createServerFn({ method: "GET" })
  .inputValidator((d: unknown) => OrderLookupSchema.parse(d))
  .handler(async ({ data }) => {
    const { supabase } = await import("@/integrations/supabase/client");
    const { data: order, error } = await supabase
      .from("orders")
      .select("id, status, buyer_name, tier, amount, user_email, created_at")
      .eq("id", data.orderId)
      .maybeSingle();
    if (error || !order) return null;

    const { data: tickets } = await supabase
      .from("tickets")
      .select("id, qr_slug, slots_total, slots_used")
      .eq("order_id", order.id);

    return {
      ...order,
      tier: order.tier as TicketTier,
      tickets: tickets ?? [],
    };
  });

// Provided so the webhook handler can generate tickets atomically. Public for testing.
export async function generateTicketsForOrder(orderId: string, tier: TicketTier) {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const slots = TIER_SLOTS[tier];
  // Single ticket per order (multi-slot scanned multiple times at gate).
  await supabaseAdmin.from("tickets").insert({
    order_id: orderId,
    slots_total: slots,
  });
}
