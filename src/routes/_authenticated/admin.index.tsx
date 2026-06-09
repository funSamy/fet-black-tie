"use client";
import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Loader2, Search, CheckCircle2 } from "lucide-react";
import { listOrders, markOrderPaid } from "@/lib/admin.functions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { TIER_LABEL, formatXAF, type TicketTier } from "@/lib/event";

export const Route = createFileRoute("/_authenticated/admin/")({
  component: OrdersPage,
});

const STATUSES = ["ALL", "SUCCESSFUL", "PENDING", "FAILED", "EXPIRED"] as const;

function OrdersPage() {
  const fetchOrders = useServerFn(listOrders);
  const mark = useServerFn(markOrderPaid);
  const qc = useQueryClient();
  const [status, setStatus] = useState<(typeof STATUSES)[number]>("ALL");
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");

  const { data, isLoading } = useQuery({
    queryKey: ["admin-orders", status, search],
    queryFn: () => fetchOrders({ data: { status, search: search || undefined, limit: 100 } }),
  });

  const markPaid = useMutation({
    mutationFn: (orderId: string) => mark({ data: { orderId } }),
    onSuccess: () => {
      toast.success("Order marked as paid and ticket generated.");
      qc.invalidateQueries({ queryKey: ["admin-orders"] });
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Failed"),
  });

  const s = data?.summary;

  return (
    <div>
      <h1 className="font-display text-3xl text-gradient-gold">Orders</h1>
      <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Stat label="Total" value={s?.total ?? "—"} />
        <Stat label="Paid" value={s?.paid ?? "—"} />
        <Stat label="Pending" value={s?.pending ?? "—"} />
        <Stat label="Revenue" value={s ? formatXAF(s.revenue) : "—"} />
      </div>

      <div className="mt-6 flex flex-wrap items-center gap-2">
        {STATUSES.map((st) => (
          <button
            key={st}
            onClick={() => setStatus(st)}
            className={`rounded-full px-3 py-1 text-xs font-condensed uppercase tracking-widest border ${
              status === st
                ? "border-[var(--color-gold)] text-gold bg-card"
                : "border-border text-muted-foreground hover:text-foreground"
            }`}
          >
            {st}
          </button>
        ))}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            setSearch(searchInput);
          }}
          className="ml-auto flex items-center gap-2"
        >
          <Input
            placeholder="Name, email, phone…"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="w-56"
          />
          <Button type="submit" size="sm" variant="ghost">
            <Search className="h-4 w-4" />
          </Button>
        </form>
      </div>

      <div className="mt-4 overflow-x-auto rounded-xl border border-border">
        <table className="w-full text-sm">
          <thead className="bg-card text-left text-xs uppercase tracking-widest text-muted-foreground">
            <tr>
              <th className="px-3 py-2">Buyer</th>
              <th className="px-3 py-2">Tier</th>
              <th className="px-3 py-2">Amount</th>
              <th className="px-3 py-2">Status</th>
              <th className="px-3 py-2">Phone</th>
              <th className="px-3 py-2">Created</th>
              <th className="px-3 py-2"></th>
            </tr>
          </thead>
          <tbody>
            {isLoading && (
              <tr>
                <td colSpan={7} className="px-3 py-8 text-center">
                  <Loader2 className="mx-auto h-5 w-5 animate-spin text-gold" />
                </td>
              </tr>
            )}
            {!isLoading &&
              (data?.orders ?? []).map((o) => (
                <tr key={o.id} className="border-t border-border">
                  <td className="px-3 py-2">
                    <div className="font-medium">{o.buyer_name}</div>
                    <div className="text-xs text-muted-foreground">{o.user_email}</div>
                  </td>
                  <td className="px-3 py-2">{TIER_LABEL[o.tier as TicketTier]}</td>
                  <td className="px-3 py-2">{formatXAF(o.paid_amount ?? o.amount)}</td>
                  <td className="px-3 py-2">
                    <StatusPill status={o.status} />
                  </td>
                  <td className="px-3 py-2 text-muted-foreground">{o.phone_number}</td>
                  <td className="px-3 py-2 text-xs text-muted-foreground">
                    {new Date(o.created_at).toLocaleString()}
                  </td>
                  <td className="px-3 py-2 text-right">
                    {o.status !== "SUCCESSFUL" && (
                      <Button
                        size="sm"
                        variant="ghost"
                        disabled={markPaid.isPending}
                        onClick={() => markPaid.mutate(o.id)}
                      >
                        <CheckCircle2 className="mr-1 h-4 w-4" /> Mark paid
                      </Button>
                    )}
                  </td>
                </tr>
              ))}
            {!isLoading && (data?.orders ?? []).length === 0 && (
              <tr>
                <td colSpan={7} className="px-3 py-8 text-center text-muted-foreground">
                  No orders found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-border bg-card p-3">
      <div className="text-[10px] uppercase tracking-widest text-muted-foreground">{label}</div>
      <div className="mt-1 font-display text-2xl text-gold">{value}</div>
    </div>
  );
}

function StatusPill({ status }: { status: string }) {
  const map: Record<string, string> = {
    SUCCESSFUL: "bg-emerald-500/15 text-emerald-300",
    PENDING: "bg-amber-500/15 text-amber-300",
    FAILED: "bg-rose-500/15 text-rose-300",
    EXPIRED: "bg-muted text-muted-foreground",
  };
  return (
    <span className={`rounded-full px-2 py-0.5 text-xs font-condensed uppercase tracking-widest ${map[status] ?? ""}`}>
      {status}
    </span>
  );
}
