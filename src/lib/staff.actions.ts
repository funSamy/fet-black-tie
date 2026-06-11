"use server";

import { z } from "zod";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/server/db";
import { requireSession } from "@/lib/server/session";
import { assertAdmin } from "@/lib/server/roles";

function errorMessage(e: unknown): string {
  return e instanceof Error ? e.message : "Something went wrong";
}

export interface StaffRow {
  id: string;
  email: string;
  isAdmin: boolean;
  isGatekeeper: boolean;
  createdAt: Date;
}

export type ListStaffResult = { ok: true; staff: StaffRow[] } | { ok: false; error: string };

export async function listStaff(): Promise<ListStaffResult> {
  try {
    const session = await requireSession();
    await assertAdmin(session.userId);

    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        createdAt: true,
        roles: { select: { role: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 200,
    });

    return {
      ok: true,
      staff: users.map((u) => ({
        id: u.id,
        email: u.email,
        isAdmin: u.roles.some((r) => r.role === "admin"),
        isGatekeeper: u.roles.some((r) => r.role === "scanner"),
        createdAt: u.createdAt,
      })),
    };
  } catch (e) {
    return { ok: false, error: errorMessage(e) };
  }
}

const CreateGatekeeperSchema = z.object({
  email: z.string().trim().email().max(255),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

export type StaffMutationResult = { ok: true; info?: string } | { ok: false; error: string };

// Creates a gatekeeper account ready to sign in and scan. If the email
// already has an account, it is simply granted gatekeeper access.
export async function createGatekeeper(input: {
  email: string;
  password: string;
}): Promise<StaffMutationResult> {
  try {
    const session = await requireSession();
    await assertAdmin(session.userId);
    const parsed = CreateGatekeeperSchema.safeParse(input);
    if (!parsed.success) {
      return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
    }
    const email = parsed.data.email.toLowerCase();

    const existing = await prisma.user.findUnique({ where: { email }, select: { id: true } });
    if (existing) {
      await prisma.userRole.upsert({
        where: { userId_role: { userId: existing.id, role: "scanner" } },
        update: {},
        create: { userId: existing.id, role: "scanner" },
      });
      return { ok: true, info: "Account already existed — gatekeeper access granted." };
    }

    const passwordHash = await bcrypt.hash(parsed.data.password, 10);
    await prisma.user.create({
      data: {
        email,
        passwordHash,
        roles: { create: { role: "scanner" } },
      },
    });
    return { ok: true };
  } catch (e) {
    return { ok: false, error: errorMessage(e) };
  }
}

const UserIdSchema = z.object({ userId: z.string().uuid() });

// Removes gatekeeper (scanner) access without touching the account.
export async function revokeGatekeeper(input: { userId: string }): Promise<StaffMutationResult> {
  try {
    const session = await requireSession();
    await assertAdmin(session.userId);
    const { userId } = UserIdSchema.parse(input);
    await prisma.userRole.deleteMany({ where: { userId, role: "scanner" } });
    return { ok: true };
  } catch (e) {
    return { ok: false, error: errorMessage(e) };
  }
}

// Deletes a staff account entirely. Admin accounts and your own account are
// protected — demote via SQL/seed first if you really need to remove an admin.
export async function deleteStaffAccount(input: { userId: string }): Promise<StaffMutationResult> {
  try {
    const session = await requireSession();
    await assertAdmin(session.userId);
    const { userId } = UserIdSchema.parse(input);

    if (userId === session.userId) {
      return { ok: false, error: "You cannot delete your own account." };
    }
    const target = await prisma.user.findUnique({
      where: { id: userId },
      select: { roles: { select: { role: true } } },
    });
    if (!target) return { ok: false, error: "Account not found" };
    if (target.roles.some((r) => r.role === "admin")) {
      return { ok: false, error: "Admin accounts cannot be deleted from here." };
    }

    await prisma.user.delete({ where: { id: userId } });
    return { ok: true };
  } catch (e) {
    return { ok: false, error: errorMessage(e) };
  }
}
