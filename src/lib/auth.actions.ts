"use server";

import { z } from "zod";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/server/db";
import { createSession, destroySession, getSession } from "@/lib/server/session";

export type AuthResult = { ok: true } | { ok: false; error: string };

const SignUpSchema = z.object({
  email: z.string().trim().email().max(255),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

const SignInSchema = z.object({
  email: z.string().trim().email().max(255),
  password: z.string().min(1),
});

export async function signUp(input: { email: string; password: string }): Promise<AuthResult> {
  const parsed = SignUpSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }
  const email = parsed.data.email.toLowerCase();
  const passwordHash = await bcrypt.hash(parsed.data.password, 10);
  try {
    await prisma.user.create({ data: { email, passwordHash } });
  } catch {
    // Unique violation on email — same message Supabase used.
    return { ok: false, error: "User already registered" };
  }
  return { ok: true };
}

export async function signIn(input: { email: string; password: string }): Promise<AuthResult> {
  const parsed = SignInSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Invalid login credentials" };

  const email = parsed.data.email.toLowerCase();
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user || !(await bcrypt.compare(parsed.data.password, user.passwordHash))) {
    return { ok: false, error: "Invalid login credentials" };
  }

  await createSession(user.id, user.email);
  return { ok: true };
}

export async function signOut(): Promise<{ ok: true }> {
  await destroySession();
  return { ok: true };
}

export async function getSessionInfo(): Promise<{ userId: string; email: string } | null> {
  return getSession();
}
