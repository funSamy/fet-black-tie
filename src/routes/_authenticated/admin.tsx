"use client";
import { createFileRoute, Link, Outlet, useNavigate, useRouter } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { getMyAdminAccess } from "@/lib/admin.functions";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Loader2, ShieldAlert, LogOut, QrCode, LayoutDashboard } from "lucide-react";

export const Route = createFileRoute("/_authenticated/admin")({
  component: AdminLayout,
  head: () => ({ meta: [{ title: "Admin — FET Black Tie" }] }),
});

function AdminLayout() {
  const router = useRouter();
  const navigate = useNavigate();
  const fetchAccess = useServerFn(getMyAdminAccess);
  const { data, isLoading, error } = useQuery({
    queryKey: ["admin-access"],
    queryFn: () => fetchAccess(),
    retry: false,
  });

  async function signOut() {
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  }

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-gold" />
      </div>
    );
  }

  if (error || (!data?.isAdmin && !data?.isScanner)) {
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
              {data.isAdmin && (
                <Link
                  to="/admin"
                  activeOptions={{ exact: true }}
                  className="inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 hover:bg-card aria-[current=page]:bg-card aria-[current=page]:text-gold"
                >
                  <LayoutDashboard className="h-4 w-4" /> Orders
                </Link>
              )}
              <Link
                to="/admin/scan"
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
      <main className="mx-auto max-w-6xl px-4 py-6">
        <Outlet />
      </main>
    </div>
  );
}
