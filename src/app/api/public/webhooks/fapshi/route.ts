import { z } from "zod";
import { prisma } from "@/lib/server/db";
import { generateTicketsForOrder } from "@/lib/server/tickets";
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

export async function POST(request: Request) {
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

  const order = await prisma.order.findUnique({
    where: { fapshiTransId: payload.transId },
    select: { id: true, status: true, tier: true, amount: true },
  });

  if (!order) return new Response("ok", { status: 200 }); // unknown trans, ack

  // Idempotency: only act on PENDING orders
  if (order.status !== "PENDING") return new Response("ok", { status: 200 });

  if (payload.status === "SUCCESSFUL") {
    const expectedAmount = TIER_PRICE[order.tier as TicketTier];
    if (typeof payload.amount === "number" && payload.amount < expectedAmount) {
      await prisma.order.update({ where: { id: order.id }, data: { status: "FAILED" } });
      return new Response("ok", { status: 200 });
    }

    await prisma.order.update({
      where: { id: order.id },
      data: {
        status: "SUCCESSFUL",
        paidAmount: payload.amount ?? order.amount,
        revenue: payload.revenue ?? null,
        medium: payload.medium ?? null,
        payerName: payload.payerName ?? null,
      },
    });

    // Generate the ticket
    await generateTicketsForOrder(order.id, order.tier as TicketTier);
  } else if (payload.status === "FAILED" || payload.status === "EXPIRED") {
    await prisma.order.update({
      where: { id: order.id },
      data: { status: payload.status },
    });
  }

  return new Response("ok", { status: 200 });
}
