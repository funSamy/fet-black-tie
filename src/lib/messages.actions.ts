"use server";

import { z } from "zod";
import { prisma } from "@/lib/server/db";

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
