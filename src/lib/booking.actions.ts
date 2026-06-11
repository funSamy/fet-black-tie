"use server";

import { z } from "zod";
import { createId } from "@paralleldrive/cuid2";
import { prisma } from "@/lib/server/db";
import { initiatePayment } from "@/lib/server/fapshi";
import { EVENT, TIER_PRICE, TIER_LABEL, isBookingClosed, type TicketTier } from "@/lib/event";

const TierEnum = z.enum([
  "CLASSIC",
  "CLASSIC_COUPLE",
  "VIP",
  "VIP_COUPLE",
  "TABLE_OF_5",
  "TABLE_OF_5_VIP",
  "TABLE_OF_10",
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

export type CreateBookingResult =
  | { ok: true; orderId: string; paymentLink: string }
  | { ok: false; error: string };

export async function createBooking(input: {
  buyerName: string;
  email: string;
  phoneNumber: string;
  tier: TicketTier;
  origin?: string;
}): Promise<CreateBookingResult> {
  if (isBookingClosed()) {
    return {
      ok: false,
      error: `Online booking closed on ${EVENT.bookingDeadlineLabel}. Tickets may still be available at the door.`,
    };
  }

  const parsed = BookingSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid booking details" };
  }
  const data = parsed.data;

  const tier = data.tier as TicketTier;
  const amount = TIER_PRICE[tier]; // SERVER-AUTHORITATIVE price
  const externalId = createId();

  // 1. Create PENDING order first
  let order: { id: string };
  try {
    order = await prisma.order.create({
      data: {
        externalId,
        buyerName: data.buyerName,
        userEmail: data.email,
        phoneNumber: data.phoneNumber,
        tier,
        amount,
        status: "PENDING",
      },
      select: { id: true },
    });
  } catch {
    return { ok: false, error: "Could not create booking. Please try again." };
  }

  const redirectUrl = data.origin ? `${data.origin}/confirmation/${order.id}` : undefined;

  // 2. Initiate Fapshi payment
  try {
    const pay = await initiatePayment({
      amount,
      email: data.email,
      externalId,
      redirectUrl,
      message: `${TIER_LABEL[tier]} — FET Black Tie Event`,
    });

    await prisma.order.update({
      where: { id: order.id },
      data: { fapshiTransId: pay.transId, fapshiPaymentLink: pay.link },
    });

    return { ok: true, orderId: order.id, paymentLink: pay.link };
  } catch (err) {
    // Mark as FAILED so the user can retry cleanly
    await prisma.order.update({ where: { id: order.id }, data: { status: "FAILED" } });
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Payment could not be initiated.",
    };
  }
}

const OrderLookupSchema = z.object({ orderId: z.string().uuid() });

export interface OrderStatusData {
  id: string;
  status: "PENDING" | "SUCCESSFUL" | "FAILED" | "EXPIRED";
  buyerName: string;
  tier: TicketTier;
  amount: number;
  createdAt: Date;
  tickets: { id: string; qrSlug: string; slotsTotal: number; slotsUsed: number }[];
}

export async function getOrderStatus(input: { orderId: string }): Promise<OrderStatusData | null> {
  const parsed = OrderLookupSchema.safeParse(input);
  if (!parsed.success) return null;

  // Do NOT return userEmail — order UUID is shareable and email is PII.
  const order = await prisma.order.findUnique({
    where: { id: parsed.data.orderId },
    select: { id: true, status: true, buyerName: true, tier: true, amount: true, createdAt: true },
  });
  if (!order) return null;

  const tickets = await prisma.ticket.findMany({
    where: { orderId: order.id },
    select: { id: true, qrSlug: true, slotsTotal: true, slotsUsed: true },
  });

  return {
    ...order,
    tier: order.tier as TicketTier,
    tickets,
  };
}

// Public, read-only ticket lookup for the /checkin/<slug> page that the QR
// code points to. Never consumes a slot — only gatekeepers' scans burn slots.
export interface TicketStatusData {
  buyerName: string;
  tier: TicketTier;
  slotsTotal: number;
  slotsUsed: number;
  isFullyUsed: boolean;
  orderPaid: boolean;
}

export async function getTicketStatus(input: { slug: string }): Promise<TicketStatusData | null> {
  const slug = z.string().trim().min(8).max(200).safeParse(input.slug);
  if (!slug.success) return null;

  const ticket = await prisma.ticket.findUnique({
    where: { qrSlug: slug.data },
    select: {
      slotsTotal: true,
      slotsUsed: true,
      isFullyUsed: true,
      order: { select: { buyerName: true, tier: true, status: true } },
    },
  });
  if (!ticket) return null;

  return {
    buyerName: ticket.order.buyerName,
    tier: ticket.order.tier as TicketTier,
    slotsTotal: ticket.slotsTotal,
    slotsUsed: ticket.slotsUsed,
    isFullyUsed: ticket.isFullyUsed,
    orderPaid: ticket.order.status === "SUCCESSFUL",
  };
}
