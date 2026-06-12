// Server-only ticket helpers (replace the Supabase burn_ticket_slot RPC and
// the ticket-generation inserts).
import { prisma } from "./db";
import { TIER_SLOTS, type TicketTier } from "@/lib/event";

// Single ticket per order (multi-slot scanned multiple times at gate).
export async function generateTicketsForOrder(orderId: string, tier: TicketTier): Promise<void> {
  await prisma.ticket.create({
    data: { orderId, slotsTotal: TIER_SLOTS[tier] },
  });
}

// Creates the ticket only when the order doesn't have one yet.
export async function ensureTicketForOrder(orderId: string, tier: TicketTier): Promise<void> {
  const existing = await prisma.ticket.findFirst({ where: { orderId }, select: { id: true } });
  if (!existing) await generateTicketsForOrder(orderId, tier);
}

export interface BurnResult {
  ticketId: string;
  orderId: string;
  slotsTotal: number;
  slotsUsed: number;
  isFullyUsed: boolean;
  buyerName: string;
  tier: TicketTier;
  orderPaid: boolean;
}

// Atomic slot-burn for the door scanner. Mirrors the original SQL function:
// locks the ticket row, refuses unpaid orders, short-circuits fully-used
// tickets, otherwise consumes one slot. Returns null for unknown slugs.
export async function burnTicketSlot(qrSlug: string): Promise<BurnResult | null> {
  return prisma.$transaction(async (tx) => {
    const locked = await tx.$queryRaw<{ id: string }[]>`
      SELECT id FROM tickets WHERE qr_slug = ${qrSlug} FOR UPDATE
    `;
    if (locked.length === 0) return null;

    const ticket = await tx.ticket.findUnique({
      where: { id: locked[0].id },
      include: { order: { select: { status: true, buyerName: true, tier: true } } },
    });
    if (!ticket) return null;

    const base = {
      ticketId: ticket.id,
      orderId: ticket.orderId,
      buyerName: ticket.order.buyerName,
      tier: ticket.order.tier as TicketTier,
    };

    if (ticket.order.status !== "SUCCESSFUL") {
      return {
        ...base,
        slotsTotal: ticket.slotsTotal,
        slotsUsed: ticket.slotsUsed,
        isFullyUsed: ticket.isFullyUsed,
        orderPaid: false,
      };
    }

    if (ticket.isFullyUsed) {
      return {
        ...base,
        slotsTotal: ticket.slotsTotal,
        slotsUsed: ticket.slotsUsed,
        isFullyUsed: true,
        orderPaid: true,
      };
    }

    const updated = await tx.ticket.update({
      where: { id: ticket.id },
      data: {
        slotsUsed: { increment: 1 },
        isFullyUsed: ticket.slotsUsed + 1 >= ticket.slotsTotal,
        firstScanAt: ticket.firstScanAt ?? new Date(),
        lastScanAt: new Date(),
      },
    });

    return {
      ...base,
      slotsTotal: updated.slotsTotal,
      slotsUsed: updated.slotsUsed,
      isFullyUsed: updated.isFullyUsed,
      orderPaid: true,
    };
  });
}
