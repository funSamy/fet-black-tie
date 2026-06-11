// Role checks against the user_roles table (replaces the Supabase has_role RPC).
import { prisma } from "./db";

export type AppRole = "admin" | "scanner";

export async function hasRole(userId: string, role: AppRole): Promise<boolean> {
  const row = await prisma.userRole.findUnique({
    where: { userId_role: { userId, role } },
    select: { id: true },
  });
  return row !== null;
}

export async function assertAdmin(userId: string): Promise<void> {
  if (!(await hasRole(userId, "admin"))) {
    throw new Error("Forbidden: admin role required");
  }
}

export async function assertScanner(userId: string): Promise<void> {
  const [admin, scanner] = await Promise.all([
    hasRole(userId, "admin"),
    hasRole(userId, "scanner"),
  ]);
  if (!admin && !scanner) throw new Error("Forbidden: scanner role required");
}
