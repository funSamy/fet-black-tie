"use client";
import { useEffect, useState, type ReactNode } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { getMyAdminAccess, type AdminAccess } from "@/lib/admin.actions";
import { signOut as signOutAction } from "@/lib/auth.actions";
import { Button } from "@/components/ui/button";
import { Loader2, ShieldAlert, LogOut, QrCode, LayoutDashboard } from "lucide-react";

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

  async function signOut() {
    await signOutAction();
    router.replace("/auth");
  }

  if (!access && !error) {
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
            Your account doesn't have admin or scanner privileges. Ask an organiser to grant access.
          </p>
          <Button variant="ghost" onClick={signOut} className="mt-4">
            <LogOut className="mr-2 h-4 w-4" /> Sign out
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-10 border-b border-border bg-background/85 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3">
          <div className="flex items-center gap-4">
            <span className="font-display text-xl text-gradient-gold">FET · Admin</span>
            <nav className="flex items-center gap-1 text-sm">
              {access.isAdmin && (
                <Link
                  href="/admin"
                  aria-current={pathname === "/admin" ? "page" : undefined}
                  className="inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 hover:bg-card aria-[current=page]:bg-card aria-[current=page]:text-gold"
                >
                  <LayoutDashboard className="h-4 w-4" /> Orders
                </Link>
              )}
              <Link
                href="/admin/scan"
                aria-current={pathname.startsWith("/admin/scan") ? "page" : undefined}
                className="inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 hover:bg-card aria-[current=page]:bg-card aria-[current=page]:text-gold"
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
