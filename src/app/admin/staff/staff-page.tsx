"use client";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { Loader2, UserPlus, ShieldCheck, QrCode, Trash2, ShieldOff } from "lucide-react";
import {
  listStaff,
  createGatekeeper,
  revokeGatekeeper,
  deleteStaffAccount,
  type StaffRow,
} from "@/lib/staff.actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function StaffPage() {
  const [staff, setStaff] = useState<StaffRow[] | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [form, setForm] = useState({ email: "", password: "" });

  const load = useCallback(async () => {
    const res = await listStaff();
    if (res.ok) setStaff(res.staff);
    else toast.error(res.error);
  }, []);

  useEffect(() => {
    let alive = true;
    listStaff().then((res) => {
      if (!alive) return;
      if (res.ok) setStaff(res.staff);
      setIsLoading(false);
    });
    return () => {
      alive = false;
    };
  }, []);

  async function onCreate(e: React.FormEvent) {
    e.preventDefault();
    setCreating(true);
    const res = await createGatekeeper(form);
    if (res.ok) {
      toast.success(res.info ?? "Gatekeeper account created. Share the credentials with them.");
      setForm({ email: "", password: "" });
      await load();
    } else {
      toast.error(res.error);
    }
    setCreating(false);
  }

  async function onRevoke(userId: string) {
    setBusyId(userId);
    const res = await revokeGatekeeper({ userId });
    if (res.ok) {
      toast.success("Gatekeeper access revoked.");
      await load();
    } else {
      toast.error(res.error);
    }
    setBusyId(null);
  }

  async function onDelete(userId: string, email: string) {
    if (!window.confirm(`Delete the account ${email}? This cannot be undone.`)) return;
    setBusyId(userId);
    const res = await deleteStaffAccount({ userId });
    if (res.ok) {
      toast.success("Account deleted.");
      await load();
    } else {
      toast.error(res.error);
    }
    setBusyId(null);
  }

  return (
    <div>
      <h1 className="font-display text-3xl text-gradient-gold">Gatekeepers</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Create accounts for the door team. Gatekeepers sign in at{" "}
        <span className="text-foreground">/auth</span> and land straight on the scanner.
      </p>

      {/* Create form */}
      <form
        onSubmit={onCreate}
        className="mt-5 rounded-xl border border-[var(--color-gold)]/30 bg-card p-4 sm:p-5"
      >
        <div className="font-condensed text-sm uppercase tracking-widest text-gold">
          <UserPlus className="mr-1.5 inline h-4 w-4" /> Add a gatekeeper
        </div>
        <div className="mt-3 grid gap-3 sm:grid-cols-[1fr_1fr_auto] sm:items-end">
          <div>
            <Label htmlFor="gk-email">Email</Label>
            <Input
              id="gk-email"
              type="email"
              required
              placeholder="door-team@example.com"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              className="mt-1.5"
            />
          </div>
          <div>
            <Label htmlFor="gk-pwd">Temporary password</Label>
            <Input
              id="gk-pwd"
              type="text"
              required
              minLength={8}
              placeholder="At least 8 characters"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              className="mt-1.5"
            />
          </div>
          <Button
            type="submit"
            disabled={creating}
            className="bg-gradient-to-r from-[var(--color-gold-dark)] via-[var(--color-gold)] to-[var(--color-gold-light)] text-background font-condensed uppercase tracking-widest"
          >
            {creating ? <Loader2 className="h-4 w-4 animate-spin" /> : "Create account"}
          </Button>
        </div>
        <p className="mt-2 text-xs text-muted-foreground">
          Share the email + password with the gatekeeper — they can start scanning immediately.
        </p>
      </form>

      {/* Staff table */}
      <div className="mt-6 overflow-x-auto rounded-xl border border-border">
        <table className="w-full text-sm">
          <thead className="bg-card text-left text-xs uppercase tracking-widest text-muted-foreground">
            <tr>
              <th className="px-3 py-2">Account</th>
              <th className="px-3 py-2">Access</th>
              <th className="px-3 py-2">Created</th>
              <th className="px-3 py-2"></th>
            </tr>
          </thead>
          <tbody>
            {isLoading && (
              <tr>
                <td colSpan={4} className="px-3 py-8 text-center">
                  <Loader2 className="mx-auto h-5 w-5 animate-spin text-gold" />
                </td>
              </tr>
            )}
            {!isLoading &&
              (staff ?? []).map((s) => (
                <tr key={s.id} className="border-t border-border">
                  <td className="px-3 py-2 font-medium">{s.email}</td>
                  <td className="px-3 py-2">
                    <div className="flex flex-wrap gap-1.5">
                      {s.isAdmin && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-[var(--color-gold)]/15 px-2 py-0.5 text-xs font-condensed uppercase tracking-widest text-gold">
                          <ShieldCheck className="h-3 w-3" /> Admin
                        </span>
                      )}
                      {s.isGatekeeper && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/15 px-2 py-0.5 text-xs font-condensed uppercase tracking-widest text-emerald-300">
                          <QrCode className="h-3 w-3" /> Gatekeeper
                        </span>
                      )}
                      {!s.isAdmin && !s.isGatekeeper && (
                        <span className="rounded-full bg-muted px-2 py-0.5 text-xs font-condensed uppercase tracking-widest text-muted-foreground">
                          No access
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-3 py-2 text-xs text-muted-foreground">
                    {new Date(s.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-3 py-2 text-right">
                    <div className="flex justify-end gap-1.5">
                      {s.isGatekeeper && (
                        <Button
                          size="sm"
                          variant="ghost"
                          disabled={busyId !== null}
                          onClick={() => onRevoke(s.id)}
                        >
                          <ShieldOff className="mr-1 h-4 w-4" /> Revoke
                        </Button>
                      )}
                      {!s.isAdmin && (
                        <Button
                          size="sm"
                          variant="ghost"
                          disabled={busyId !== null}
                          onClick={() => onDelete(s.id, s.email)}
                          className="text-rose-300 hover:text-rose-200"
                        >
                          <Trash2 className="mr-1 h-4 w-4" /> Delete
                        </Button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            {!isLoading && (staff ?? []).length === 0 && (
              <tr>
                <td colSpan={4} className="px-3 py-8 text-center text-muted-foreground">
                  No staff accounts yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
