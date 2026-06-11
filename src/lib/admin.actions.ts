"use server";

import { z } from "zod";
import { prisma } from "@/lib/server/db";
import { getSession, requireSession } from "@/lib/server/session";
import { assertAdmin, assertScanner, hasRole } from "@/lib/server/roles";
import { burnTicketSlot, generateTicketsForOrder } from "@/lib/server/tickets";
import { TIER_LABEL, type TicketTier } from "@/lib/event";

function errorMessage(e: unknown): string {
  return e instanceof Error ? e.message : "Something went wrong";
}

export interface AdminAccess {
  authenticated: boolean;
  isAdmin: boolean;
  isScanner: boolean;
}

export async function getMyAdminAccess(): Promise<AdminAccess> {
  const session = await getSession();
  if (!session) return { authenticated: false, isAdmin: false, isScanner: false };
  const [isAdmin, isScanner] = await Promise.all([
    hasRole(session.userId, "admin"),
    hasRole(session.userId, "scanner"),
  ]);
  return { authenticated: true, isAdmin, isScanner };
}

const ListSchema = z.object({
  status: z.enum(["ALL", "PENDING", "SUCCESSFUL", "FAILED", "EXPIRED"]).default("ALL"),
  search: z.string().trim().max(100).optional(),
  limit: z.number().int().min(1).max(200).default(100),
});

export interface AdminOrderRow {
  id: string;
  buyerName: string;
  userEmail: string;
  phoneNumber: string;
  tier: TicketTier;
  amount: number;
  paidAmount: number | null;
  status: "PENDING" | "SUCCESSFUL" | "FAILED" | "EXPIRED";
  medium: string | null;
  createdAt: Date;
}

export interface OrdersSummary {
  total: number;
  paid: number;
  pending: number;
  revenue: number;
}

export type ListOrdersResult =
  | { ok: true; orders: AdminOrderRow[]; summary: OrdersSummary }
  | { ok: false; error: string };

export async function listOrders(input: {
  status?: "ALL" | "PENDING" | "SUCCESSFUL" | "FAILED" | "EXPIRED";
  search?: string;
  limit?: number;
}): Promise<ListOrdersResult> {
  try {
    const session = await requireSession();
    await assertAdmin(session.userId);
    const data = ListSchema.parse(input);

    const search = data.search;
    const orders = await prisma.order.findMany({
      where: {
        ...(data.status !== "ALL" ? { status: data.status } : {}),
        ...(search
          ? {
              OR: [
                { buyerName: { contains: search, mode: "insensitive" } },
                { userEmail: { contains: search, mode: "insensitive" } },
                { phoneNumber: { contains: search, mode: "insensitive" } },
                { externalId: { contains: search, mode: "insensitive" } },
              ],
            }
          : {}),
      },
      select: {
        id: true,
        buyerName: true,
        userEmail: true,
        phoneNumber: true,
        tier: true,
        amount: true,
        paidAmount: true,
        status: true,
        medium: true,
        createdAt: true,
      },
      orderBy: { createdAt: "desc" },
      take: data.limit,
    });

    // Aggregate stats
    const stats = await prisma.order.findMany({
      select: { status: true, amount: true, paidAmount: true },
    });
    const summary: OrdersSummary = {
      total: stats.length,
      paid: stats.filter((o) => o.status === "SUCCESSFUL").length,
      pending: stats.filter((o) => o.status === "PENDING").length,
      revenue: stats
        .filter((o) => o.status === "SUCCESSFUL")
        .reduce((sum, o) => sum + (o.paidAmount ?? o.amount ?? 0), 0),
    };

    return {
      ok: true,
      orders: orders.map((o) => ({ ...o, tier: o.tier as TicketTier })),
      summary,
    };
  } catch (e) {
    return { ok: false, error: errorMessage(e) };
  }
}

const ScanSchema = z.object({ qrSlug: z.string().trim().min(8).max(200) });

export type ScanOutcome =
  | { outcome: "UNKNOWN" }
  | { outcome: "UNPAID"; buyerName: string }
  | {
      outcome: "OK";
      buyerName: string;
      slotsTotal: number;
      slotsUsed: number;
      fullyUsed: boolean;
      justFilled: boolean;
      tierLabel: string;
    };

export type ScanTicketResult = { ok: true; data: ScanOutcome } | { ok: false; error: string };

export async function scanTicket(input: { qrSlug: string }): Promise<ScanTicketResult> {
  try {
    const session = await requireSession();
    await assertScanner(session.userId);
    const data = ScanSchema.parse(input);

    const r = await burnTicketSlot(data.qrSlug);
    if (!r) {
      return { ok: true, data: { outcome: "UNKNOWN" } };
    }
    if (!r.orderPaid) {
      return { ok: true, data: { outcome: "UNPAID", buyerName: r.buyerName } };
    }
    // Fresh vs duplicate: the burn short-circuits when the ticket was already
    // fully used (returns slotsUsed == slotsTotal without a bump).
    const justFilled = r.slotsUsed === r.slotsTotal;
    return {
      ok: true,
      data: {
        outcome: "OK",
        buyerName: r.buyerName,
        slotsTotal: r.slotsTotal,
        slotsUsed: r.slotsUsed,
        fullyUsed: r.isFullyUsed,
        justFilled,
        tierLabel: r.tier ? TIER_LABEL[r.tier] : "",
      },
    };
  } catch (e) {
    return { ok: false, error: errorMessage(e) };
  }
}

const MarkSchema = z.object({ orderId: z.string().uuid() });

export type MarkOrderPaidResult =
  | { ok: true; alreadyPaid?: boolean }
  | { ok: false; error: string };

export async function markOrderPaid(input: { orderId: string }): Promise<MarkOrderPaidResult> {
  try {
    const session = await requireSession();
    await assertAdmin(session.userId);
    const data = MarkSchema.parse(input);

    const order = await prisma.order.findUnique({
      where: { id: data.orderId },
      select: { id: true, status: true, tier: true, amount: true },
    });
    if (!order) return { ok: false, error: "Order not found" };
    if (order.status === "SUCCESSFUL") return { ok: true, alreadyPaid: true };

    await prisma.order.update({
      where: { id: order.id },
      data: { status: "SUCCESSFUL", paidAmount: order.amount },
    });

    // Generate ticket if none
    const existing = await prisma.ticket.findMany({
      where: { orderId: order.id },
      select: { id: true },
    });
    if (existing.length === 0) {
      await generateTicketsForOrder(order.id, order.tier as TicketTier);
    }
    return { ok: true };
  } catch (e) {
    return { ok: false, error: errorMessage(e) };
  }
}
