"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { Loader2 } from "lucide-react";
import { getApprovedMessages, type BoardMessage } from "@/lib/messages.actions";
import { UniversityLogos } from "@/components/event/UniversityLogos";

const POLL_MS = 8000;

// Public shout-out wall — designed to be projected fullscreen at the gala.
// Polls for newly approved messages so the projector updates by itself.
export function BoardPage() {
  const [messages, setMessages] = useState<BoardMessage[] | null>(null);

  useEffect(() => {
    let alive = true;
    let timer: ReturnType<typeof setTimeout>;

    const tick = async () => {
      try {
        const rows = await getApprovedMessages();
        if (!alive) return;
        setMessages(rows);
      } catch {
        /* keep showing the last batch */
      } finally {
        if (alive) timer = setTimeout(tick, POLL_MS);
      }
    };
    void tick();
    return () => {
      alive = false;
      clearTimeout(timer);
    };
  }, []);

  return (
    <div className="min-h-screen">
      <header className="mx-auto flex max-w-7xl items-center justify-between px-4 py-5 sm:px-6 lg:px-8">
        <UniversityLogos />
        <nav className="flex items-center gap-4 text-xs sm:text-sm">
          <Link
            href="/message"
            className="font-condensed uppercase tracking-widest text-muted-foreground hover:text-gold transition-colors"
          >
            Send a shout-out
          </Link>
          <Link
            href="/"
            className="font-condensed uppercase tracking-widest text-muted-foreground hover:text-gold transition-colors"
          >
            ← Home
          </Link>
        </nav>
      </header>

      <main className="mx-auto max-w-7xl px-4 pb-20 sm:px-6 lg:px-8">
        <div className="mt-4 flex flex-wrap items-end justify-between gap-4">
          <div>
            <div className="font-script text-3xl text-gold">From the crowd</div>
            <h1 className="font-display text-6xl sm:text-7xl text-gradient-gold leading-none">
              The Wall
            </h1>
          </div>
          <div className="flex items-center gap-2 pb-2 text-xs font-condensed uppercase tracking-widest text-muted-foreground">
            <span className="relative flex h-2.5 w-2.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[var(--color-stub-green)] opacity-60" />
              <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-[var(--color-stub-green)]" />
            </span>
            Live · updates automatically
          </div>
        </div>

        {messages === null ? (
          <div className="flex min-h-[40vh] items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-gold" />
          </div>
        ) : messages.length === 0 ? (
          <div className="mt-16 rounded-2xl border border-dashed border-border bg-card/40 p-12 text-center">
            <div className="font-script text-3xl text-gold">The wall is warming up</div>
            <p className="mt-2 text-muted-foreground">
              Approved shout-outs will appear here.{" "}
              <Link href="/message" className="text-gold underline-offset-4 hover:underline">
                Be the first to send one.
              </Link>
            </p>
          </div>
        ) : (
          <div className="mt-10 columns-1 gap-4 sm:columns-2 lg:columns-3 [&>*]:mb-4">
            {messages.map((m, i) => (
              <figure
                key={m.id}
                className="break-inside-avoid rounded-2xl border border-[var(--color-gold)]/30 bg-card/90 p-5 shadow-gold"
                style={{ animation: `fade-in 0.5s ease-out ${Math.min(i * 0.05, 0.8)}s both` }}
              >
                <blockquote className="text-lg leading-relaxed text-foreground">
                  “{m.content}”
                </blockquote>
                <figcaption className="mt-3 font-script text-xl text-gold">
                  — {m.displayName || "Anonymous"}
                </figcaption>
              </figure>
            ))}
          </div>
        )}
      </main>

      <style>{`
        @keyframes fade-in {
          from { opacity: 0; transform: translateY(12px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
