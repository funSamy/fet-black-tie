"use client";
import { useEffect, useState, type ReactNode } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { getMyAdminAccess, type AdminAccess } from "@/lib/admin.actions";
import { signOut as signOutAction } from "@/lib/auth.actions";
import { Button } from "@/components/ui/button";
import {
  Loader2,
  ShieldAlert,
  LogOut,
  QrCode,
  LayoutDashboard,
  MessageSquare,
  Users,
} from "lucide-react";

export function AdminShell({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [access, setAccess] = useState<AdminAccess | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    let alive = true;
    getMyAdminAccess()
      .then((a) => {
        if (!alive) return;
        if (!a.authenticated) {
          router.replace(`/auth?redirect=${encodeURIComponent(pathname)}`);
          return;
        }
        setAccess(a);
      })
      .catch(() => {
        if (alive) setError(true);
      });
    return () => {
      alive = false;
    };
  }, [router, pathname]);

  // Gatekeepers go straight to the scanner — that's their whole job. Done in
  // its own effect (a commit after the access state lands) so the replace is
  // not swallowed by the still-settling navigation that mounted this shell.
  const goToScan = !!access && !access.isAdmin && access.isScanner && pathname === "/admin";
  useEffect(() => {
    if (goToScan) router.replace("/admin/scan");
  }, [goToScan, router]);

  async function signOut() {
    await signOutAction();
    router.replace("/auth");
  }

  if ((!access && !error) || goToScan) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-gold" />
      </div>
    );
  }

  if (error || (!access?.isAdmin && !access?.isScanner)) {
    return (
      <div className="flex min-h-screen items-center justify-center px-4">
        <div className="max-w-md text-center">
          <ShieldAlert className="mx-auto h-10 w-10 text-gold" />
          <h1 className="mt-3 font-display text-2xl text-gradient-gold">No access</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Your account doesn't have admin or gatekeeper privileges. Ask an organiser to grant
            access.
          </p>
          <Button variant="ghost" onClick={signOut} className="mt-4">
            <LogOut className="mr-2 h-4 w-4" /> Sign out
          </Button>
        </div>
      </div>
    );
  }

  const navLink =
    "inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 hover:bg-card aria-[current=page]:bg-card aria-[current=page]:text-gold";

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-10 border-b border-border bg-background/85 backdrop-blur">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-x-4 gap-y-2 px-4 py-3">
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
            <span className="font-display text-xl text-gradient-gold">FET · Admin</span>
            <nav className="flex flex-wrap items-center gap-1 text-sm">
              {access.isAdmin && (
                <>
                  <Link
                    href="/admin"
                    aria-current={pathname === "/admin" ? "page" : undefined}
                    className={navLink}
                  >
                    <LayoutDashboard className="h-4 w-4" /> Orders
                  </Link>
                  <Link
                    href="/admin/messages"
                    aria-current={pathname.startsWith("/admin/messages") ? "page" : undefined}
                    className={navLink}
                  >
                    <MessageSquare className="h-4 w-4" /> Shout-outs
                  </Link>
                  <Link
                    href="/admin/staff"
                    aria-current={pathname.startsWith("/admin/staff") ? "page" : undefined}
                    className={navLink}
                  >
                    <Users className="h-4 w-4" /> Gatekeepers
                  </Link>
                </>
              )}
              <Link
                href="/admin/scan"
                aria-current={pathname.startsWith("/admin/scan") ? "page" : undefined}
                className={navLink}
              >
                <QrCode className="h-4 w-4" /> Scan
              </Link>
            </nav>
          </div>
          <Button variant="ghost" size="sm" onClick={signOut}>
            <LogOut className="mr-2 h-4 w-4" /> Sign out
          </Button>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-6">{children}</main>
    </div>
  );
}
