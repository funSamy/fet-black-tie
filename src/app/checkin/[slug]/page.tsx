import type { Metadata } from "next";
import Link from "next/link";
import { CheckCircle2, XCircle, AlertTriangle, QrCode } from "lucide-react";
import { getTicketStatus } from "@/lib/booking.actions";
import { EVENT, TIER_LABEL } from "@/lib/event";
import { UniversityLogos } from "@/components/event/UniversityLogos";

export const metadata: Metadata = {
  title: "Ticket check — FET Black Tie Event",
};

// The page a guest's QR code links to. Read-only: it shows the ticket's
// validity but never consumes a slot — only the gatekeepers' scanner burns
// slots at the door.
export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const ticket = await getTicketStatus({ slug });

  return (
    <div className="mx-auto max-w-xl px-4 py-12 sm:px-6">
      <header className="mb-10 flex items-center justify-between">
        <UniversityLogos />
        <Link
          href="/"
          className="text-xs font-condensed uppercase tracking-widest text-muted-foreground hover:text-gold"
        >
          ← Home
        </Link>
      </header>

      {!ticket ? (
        <div className="rounded-2xl border border-rose-500/40 bg-rose-500/10 p-8 text-center">
          <XCircle className="mx-auto h-10 w-10 text-rose-300" />
          <h1 className="mt-3 font-display text-3xl text-foreground">Unknown ticket</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            This QR code does not match any ticket. If you believe this is a mistake, contact the
            organisers on {EVENT.contact}.
          </p>
        </div>
      ) : (
        <div className="rounded-2xl border border-gold/40 bg-card p-6 sm:p-8 shadow-gold">
          <div className="text-center">
            {ticket.orderPaid ? (
              ticket.isFullyUsed ? (
                <AlertTriangle className="mx-auto h-10 w-10 text-amber-300" />
              ) : (
                <CheckCircle2 className="mx-auto h-10 w-10 text-(--color-stub-green)" />
              )
            ) : (
              <XCircle className="mx-auto h-10 w-10 text-rose-300" />
            )}
            <div className="mt-3 font-script text-2xl text-gold">Entry pass</div>
            <h1 className="font-display text-4xl text-gradient-gold leading-none">
              {ticket.buyerName}
            </h1>
            <p className="mt-2 font-condensed uppercase tracking-widest text-sm text-foreground">
              {TIER_LABEL[ticket.tier]}
            </p>
          </div>

          <div className="mt-6 grid grid-cols-2 gap-3 text-center text-sm">
            <div className="rounded-lg bg-background/60 p-3">
              <div className="text-[10px] font-condensed uppercase tracking-widest text-muted-foreground">
                Payment
              </div>
              <div
                className={ticket.orderPaid ? "text-(--color-stub-green)" : "text-rose-300"}
              >
                {ticket.orderPaid ? "Confirmed" : "Not confirmed"}
              </div>
            </div>
            <div className="rounded-lg bg-background/60 p-3">
              <div className="text-[10px] font-condensed uppercase tracking-widest text-muted-foreground">
                Entries used
              </div>
              <div className="text-foreground">
                {ticket.slotsUsed} / {ticket.slotsTotal}
              </div>
            </div>
          </div>

          <div className="mt-6 rounded-lg bg-background/60 p-3 text-center text-sm text-foreground">
            {EVENT.venue} · {EVENT.date} · {EVENT.time}
          </div>

          <p className="mt-6 flex items-center justify-center gap-2 text-center text-xs text-muted-foreground">
            <QrCode className="h-4 w-4" />
            Present this QR at the door — the gate team scans it to admit your group.
          </p>
        </div>
      )}
    </div>
  );
}
