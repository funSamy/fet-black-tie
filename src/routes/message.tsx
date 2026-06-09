"use client";
import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { Loader2, Send } from "lucide-react";
import { submitMessage } from "@/lib/messages.functions";
import { UniversityLogos } from "@/components/event/UniversityLogos";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export const Route = createFileRoute("/message")({
  head: () => ({
    meta: [
      { title: "Send a shout-out — FET Black Tie Event" },
      {
        name: "description",
        content:
          "Send an anonymous shout-out to be projected on the wall at the FET Black Tie Gala.",
      },
    ],
  }),
  component: MessagePage,
});

function MessagePage() {
  const send = useServerFn(submitMessage);
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);
  const [form, setForm] = useState({ content: "", displayName: "" });

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      await send({ data: form });
      setSent(true);
      setForm({ content: "", displayName: "" });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not send");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-10 sm:px-6">
      <header className="mb-8 flex items-center justify-between">
        <UniversityLogos />
        <Link
          to="/"
          className="text-xs font-condensed uppercase tracking-widest text-muted-foreground hover:text-gold"
        >
          ← Home
        </Link>
      </header>

      <div className="font-script text-3xl text-gold">From the crowd</div>
      <h1 className="font-display text-5xl text-gradient-gold leading-none">
        Send a shout-out
      </h1>
      <p className="mt-4 text-muted-foreground">
        Drop a message for the crowd. Approved messages will be projected on the
        wall during the gala. You can stay anonymous.
      </p>

      <form
        onSubmit={onSubmit}
        className="mt-8 rounded-2xl border border-[var(--color-gold)]/40 bg-card/95 p-6 sm:p-8 shadow-gold"
      >
        <div className="space-y-4">
          <div>
            <Label htmlFor="content">Your message</Label>
            <Textarea
              id="content"
              required
              minLength={2}
              maxLength={500}
              rows={4}
              placeholder="Say something kind, funny, or unforgettable."
              value={form.content}
              onChange={(e) => setForm({ ...form, content: e.target.value })}
              className="mt-1.5 bg-background border-border focus:border-[var(--color-gold)] resize-none"
            />
            <div className="mt-1 text-right text-xs text-muted-foreground">
              {form.content.length} / 500
            </div>
          </div>
          <div>
            <Label htmlFor="name">Display name (optional)</Label>
            <Input
              id="name"
              maxLength={40}
              placeholder="Leave blank to stay anonymous"
              value={form.displayName}
              onChange={(e) => setForm({ ...form, displayName: e.target.value })}
              className="mt-1.5 bg-background border-border focus:border-[var(--color-gold)]"
            />
          </div>
        </div>

        <Button
          type="submit"
          disabled={busy}
          className="mt-6 w-full bg-gradient-to-r from-[var(--color-gold-dark)] via-[var(--color-gold)] to-[var(--color-gold-light)] text-background font-condensed uppercase tracking-widest hover:opacity-95 shadow-gold"
        >
          {busy ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Sending…
            </>
          ) : (
            <>
              <Send className="mr-2 h-4 w-4" /> Send to the wall
            </>
          )}
        </Button>

        {sent && (
          <p
            className="mt-4 text-center text-sm text-[var(--color-stub-green)]"
            style={{ animation: "fade-in 0.4s ease-out" }}
          >
            ✓ Sent. A moderator will approve it before it shows on the projector.
          </p>
        )}
      </form>
    </div>
  );
}
