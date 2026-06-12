"use client";
import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { Loader2, Check, Trash2, Undo2, EyeOff, ExternalLink } from "lucide-react";
import {
  listMessagesAdmin,
  approveMessage,
  unpublishMessage,
  deleteMessage,
  restoreMessage,
  type AdminMessageRow,
  type MessageCounts,
  type MessageStatusFilter,
} from "@/lib/messages.actions";
import { Button } from "@/components/ui/button";

const TABS: { key: MessageStatusFilter; label: string }[] = [
  { key: "PENDING", label: "Pending" },
  { key: "APPROVED", label: "On the wall" },
  { key: "DELETED", label: "Deleted" },
];

export function MessagesPage() {
  const [tab, setTab] = useState<MessageStatusFilter>("PENDING");
  const [messages, setMessages] = useState<AdminMessageRow[]>([]);
  const [counts, setCounts] = useState<MessageCounts | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = useCallback(async (status: MessageStatusFilter) => {
    const res = await listMessagesAdmin({ status });
    if (res.ok) {
      setMessages(res.messages);
      setCounts(res.counts);
    } else {
      toast.error(res.error);
    }
  }, []);

  useEffect(() => {
    let alive = true;
    setIsLoading(true);
    listMessagesAdmin({ status: tab }).then((res) => {
      if (!alive) return;
      if (res.ok) {
        setMessages(res.messages);
        setCounts(res.counts);
      }
      setIsLoading(false);
    });
    return () => {
      alive = false;
    };
  }, [tab]);

  async function act(
    id: string,
    fn: (input: { id: string }) => Promise<{ ok: boolean; error?: string }>,
    successMsg: string,
  ) {
    setBusyId(id);
    const res = await fn({ id });
    if (res.ok) {
      toast.success(successMsg);
      await load(tab);
    } else {
      toast.error(res.error ?? "Failed");
    }
    setBusyId(null);
  }

  const countFor = (key: MessageStatusFilter) =>
    counts === null
      ? null
      : key === "PENDING"
        ? counts.pending
        : key === "APPROVED"
          ? counts.approved
          : counts.deleted;

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl text-gradient-gold">Shout-outs</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Review messages from the crowd. Approved messages show on the public wall.
          </p>
        </div>
        <Button asChild size="sm" variant="ghost">
          <Link href="/board" target="_blank">
            <ExternalLink className="mr-1.5 h-4 w-4" /> Open the wall
          </Link>
        </Button>
      </div>

      <div className="mt-5 flex flex-wrap items-center gap-2">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`rounded-full px-3 py-1 text-xs font-condensed uppercase tracking-widest border ${
              tab === t.key
                ? "border-[var(--color-gold)] text-gold bg-card"
                : "border-border text-muted-foreground hover:text-foreground"
            }`}
          >
            {t.label}
            {countFor(t.key) !== null && (
              <span className="ml-1.5 rounded-full bg-background/60 px-1.5 py-0.5 text-[10px]">
                {countFor(t.key)}
              </span>
            )}
          </button>
        ))}
      </div>

      <div className="mt-5 space-y-3">
        {isLoading && (
          <div className="flex justify-center py-10">
            <Loader2 className="h-5 w-5 animate-spin text-gold" />
          </div>
        )}

        {!isLoading && messages.length === 0 && (
          <div className="rounded-xl border border-dashed border-border bg-card/40 p-8 text-center text-muted-foreground">
            Nothing here.
          </div>
        )}

        {!isLoading &&
          messages.map((m) => (
            <div
              key={m.id}
              className="flex flex-col gap-3 rounded-xl border border-border bg-card p-4 sm:flex-row sm:items-start sm:justify-between"
            >
              <div className="min-w-0">
                <p className="text-sm leading-relaxed text-foreground">“{m.content}”</p>
                <div className="mt-2 text-xs text-muted-foreground">
                  <span className="font-script text-base text-gold">
                    — {m.displayName || "Anonymous"}
                  </span>
                  <span className="ml-3">{new Date(m.createdAt).toLocaleString()}</span>
                </div>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                {m.status === "PENDING" && (
                  <>
                    <Button
                      size="sm"
                      disabled={busyId !== null}
                      onClick={() => act(m.id, approveMessage, "Published to the wall.")}
                      className="bg-[var(--color-stub-green)] text-background hover:opacity-90"
                    >
                      <Check className="mr-1 h-4 w-4" /> Approve
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      disabled={busyId !== null}
                      onClick={() => act(m.id, deleteMessage, "Message deleted.")}
                    >
                      <Trash2 className="mr-1 h-4 w-4" /> Delete
                    </Button>
                  </>
                )}
                {m.status === "APPROVED" && (
                  <>
                    <Button
                      size="sm"
                      variant="ghost"
                      disabled={busyId !== null}
                      onClick={() => act(m.id, unpublishMessage, "Removed from the wall.")}
                    >
                      <EyeOff className="mr-1 h-4 w-4" /> Unpublish
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      disabled={busyId !== null}
                      onClick={() => act(m.id, deleteMessage, "Message deleted.")}
                    >
                      <Trash2 className="mr-1 h-4 w-4" /> Delete
                    </Button>
                  </>
                )}
                {m.status === "DELETED" && (
                  <Button
                    size="sm"
                    variant="ghost"
                    disabled={busyId !== null}
                    onClick={() => act(m.id, restoreMessage, "Restored to review queue.")}
                  >
                    <Undo2 className="mr-1 h-4 w-4" /> Restore
                  </Button>
                )}
              </div>
            </div>
          ))}
      </div>
    </div>
  );
}
