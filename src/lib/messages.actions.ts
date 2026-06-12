"use server";

import { z } from "zod";
import { prisma } from "@/lib/server/db";
import { requireSession } from "@/lib/server/session";
import { assertAdmin } from "@/lib/server/roles";

const MessageSchema = z.object({
  content: z.string().trim().min(2).max(500),
  displayName: z.string().trim().max(40).optional().or(z.literal("")),
});

export type SubmitMessageResult = { ok: true } | { ok: false; error: string };

export async function submitMessage(input: {
  content: string;
  displayName?: string;
}): Promise<SubmitMessageResult> {
  const parsed = MessageSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid message" };
  }
  try {
    await prisma.anonymousMessage.create({
      data: {
        content: parsed.data.content,
        displayName: parsed.data.displayName || null,
        status: "PENDING",
      },
    });
  } catch {
    return { ok: false, error: "Could not send your message. Please try again." };
  }
  return { ok: true };
}

// ---------------------------------------------------------------------------
// Public wall — approved messages only.
// ---------------------------------------------------------------------------

export interface BoardMessage {
  id: string;
  content: string;
  displayName: string | null;
  approvedAt: Date | null;
}

export async function getApprovedMessages(): Promise<BoardMessage[]> {
  return prisma.anonymousMessage.findMany({
    where: { status: "APPROVED" },
    select: { id: true, content: true, displayName: true, approvedAt: true },
    orderBy: [{ approvedAt: "desc" }, { createdAt: "desc" }],
    take: 200,
  });
}

// ---------------------------------------------------------------------------
// Admin moderation.
// ---------------------------------------------------------------------------

export type MessageStatusFilter = "PENDING" | "APPROVED" | "DELETED";

export interface AdminMessageRow {
  id: string;
  content: string;
  displayName: string | null;
  status: MessageStatusFilter;
  approvedAt: Date | null;
  createdAt: Date;
}

export interface MessageCounts {
  pending: number;
  approved: number;
  deleted: number;
}

export type ListMessagesResult =
  | { ok: true; messages: AdminMessageRow[]; counts: MessageCounts }
  | { ok: false; error: string };

function errorMessage(e: unknown): string {
  return e instanceof Error ? e.message : "Something went wrong";
}

export async function listMessagesAdmin(input: {
  status: MessageStatusFilter;
}): Promise<ListMessagesResult> {
  try {
    const session = await requireSession();
    await assertAdmin(session.userId);
    const status = z.enum(["PENDING", "APPROVED", "DELETED"]).parse(input.status);

    const [messages, pending, approved, deleted] = await Promise.all([
      prisma.anonymousMessage.findMany({
        where: { status },
        select: {
          id: true,
          content: true,
          displayName: true,
          status: true,
          approvedAt: true,
          createdAt: true,
        },
        orderBy: { createdAt: "desc" },
        take: 300,
      }),
      prisma.anonymousMessage.count({ where: { status: "PENDING" } }),
      prisma.anonymousMessage.count({ where: { status: "APPROVED" } }),
      prisma.anonymousMessage.count({ where: { status: "DELETED" } }),
    ]);

    return {
      ok: true,
      messages: messages.map((m) => ({ ...m, status: m.status as MessageStatusFilter })),
      counts: { pending, approved, deleted },
    };
  } catch (e) {
    return { ok: false, error: errorMessage(e) };
  }
}

export type ModerateResult = { ok: true } | { ok: false; error: string };

const IdSchema = z.object({ id: z.string().uuid() });

async function setMessageStatus(
  input: { id: string },
  status: MessageStatusFilter,
): Promise<ModerateResult> {
  try {
    const session = await requireSession();
    await assertAdmin(session.userId);
    const { id } = IdSchema.parse(input);
    await prisma.anonymousMessage.update({
      where: { id },
      data: {
        status,
        approvedAt: status === "APPROVED" ? new Date() : null,
      },
    });
    return { ok: true };
  } catch (e) {
    return { ok: false, error: errorMessage(e) };
  }
}

// Publish to the wall.
export async function approveMessage(input: { id: string }): Promise<ModerateResult> {
  return setMessageStatus(input, "APPROVED");
}

// Take a published message off the wall (back to review queue).
export async function unpublishMessage(input: { id: string }): Promise<ModerateResult> {
  return setMessageStatus(input, "PENDING");
}

// Soft-delete (kept in DB, never shown).
export async function deleteMessage(input: { id: string }): Promise<ModerateResult> {
  return setMessageStatus(input, "DELETED");
}

// Bring a deleted message back to the review queue.
export async function restoreMessage(input: { id: string }): Promise<ModerateResult> {
  return setMessageStatus(input, "PENDING");
}
