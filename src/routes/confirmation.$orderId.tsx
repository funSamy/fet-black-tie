"use client";
import { useEffect, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { Loader2, CheckCircle2, XCircle, Home, MessageCircle } from "lucide-react";
import { getOrderStatus } from "@/lib/booking.functions";
import { EVENT, TIER_LABEL, TIER_SLOTS, formatXAF } from "@/lib/event";
import { UniversityLogos } from "@/components/event/UniversityLogos";
import { QRDisplay } from "@/components/event/QRDisplay";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/confirmation/$orderId")({
  head: () => ({
    meta: [{ title: "Confirming your ticket — FET Black Tie Event" }],
  }),
  component: ConfirmationPage,
});

type Order = Awaited<ReturnType<typeof getOrderStatus>>;

function ConfirmationPage() {
  const { orderId } = Route.useParams();
  const fetchStatus = useServerFn(getOrderStatus);
  const [order, setOrder] = useState<Order>(null);
  const [origin, setOrigin] = useState("");

  useEffect(() => {
    setOrigin(typeof window !== "undefined" ? window.location.origin : "");
    let alive = true;
    let timer: ReturnType<typeof setTimeout>;

    const tick = async () => {
      try {
        const o = await fetchStatus({ data: { orderId } });
        if (!alive) return;
        setOrder(o);
        if (o && o.status === "PENDING") {
          timer = setTimeout(tick, 5000);
        }
      } catch {
        if (alive) timer = setTimeout(tick, 8000);
      }
    };
    void tick();
    return () => {
      alive = false;
      clearTimeout(timer);
    };
  }, [orderId, fetchStatus]);

  if (order === null) {
    return (
      <Center>
        <Loader2 className="h-8 w-8 animate-spin text-gold" />
        <p className="mt-4 text-muted-foreground">Looking up your order…</p>
      </Center>
    );
  }

  if (order.status === "PENDING") {
    return (
      <Center>
        <PulsingRings />
        <div className="font-script text-3xl text-gold mt-4">Hold tight</div>
        <h1 className="font-display text-4xl text-foreground mt-1">
          Confirming your payment
        </h1>
        <p className="mt-3 max-w-md text-center text-muted-foreground">
          Complete the payment on the Fapshi screen. This page will update
          automatically once we receive confirmation.
        </p>
      </Center>
    );
  }

  if (order.status === "FAILED" || order.status === "EXPIRED") {
    return (
      <Center>
        <XCircle className="h-12 w-12 text-destructive" />
        <h1 className="font-display text-4xl text-foreground mt-4">
          {order.status === "EXPIRED" ? "Payment expired" : "Payment failed"}
        </h1>
        <p className="mt-2 max-w-md text-center text-muted-foreground">
          No worries — your seat hasn't been charged. You can book again from the
          home page.
        </p>
        <Button asChild className="mt-6">
          <Link to="/">
            <Home className="mr-2 h-4 w-4" /> Back to home
          </Link>
        </Button>
      </Center>
    );
  }

  // SUCCESSFUL
  const ticket = order.tickets[0];
  const qrValue = ticket && origin ? `${origin}/checkin/${ticket.qr_slug}` : "";

  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
      <header className="mb-8 flex items-center justify-between">
        <UniversityLogos />
        <Link
          to="/"
          className="text-xs font-condensed uppercase tracking-widest text-muted-foreground hover:text-gold"
        >
          ← Home
        </Link>
      </header>

      <div className="text-center">
        <CheckCircle2 className="mx-auto h-12 w-12 text-[var(--color-stub-green)]" />
        <div className="mt-4 font-script text-3xl text-gold">You're in</div>
        <h1 className="font-display text-5xl text-gradient-gold leading-none">
          See you at the Gala
        </h1>
      </div>

      <div className="mt-10 rounded-2xl border border-[var(--color-gold)]/40 bg-card p-6 sm:p-8 shadow-gold">
        <div className="flex flex-col items-center gap-6 sm:flex-row sm:items-start sm:gap-8">
          <div className="shrink-0">
            {qrValue && <QRDisplay value={qrValue} />}
          </div>
          <div className="flex-1 text-center sm:text-left">
            <div className="text-[10px] font-condensed uppercase tracking-widest text-muted-foreground">
              Ticket holder
            </div>
            <div className="font-display text-2xl text-foreground leading-tight">
              {order.buyer_name}
            </div>

            <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
              <Field label="Tier" value={TIER_LABEL[order.tier]} />
              <Field label="Guests" value={`${TIER_SLOTS[order.tier]}`} />
              <Field label="Paid" value={formatXAF(order.amount)} />
              <Field label="Order" value={order.id.slice(0, 8).toUpperCase()} />
            </div>

            <div className="mt-5 rounded-lg bg-background/60 p-3">
              <div className="text-[10px] font-condensed uppercase tracking-widest text-muted-foreground">
                Event
              </div>
              <div className="mt-1 text-sm text-foreground">
                {EVENT.venue} · {EVENT.date} · {EVENT.time}
              </div>
            </div>
          </div>
        </div>
      </div>

      {ticket && origin && (
        <WhatsAppShare
          origin={origin}
          buyerName={order.buyer_name}
          tier={order.tier}
          slots={TIER_SLOTS[order.tier]}
          qrSlug={ticket.qr_slug}
        />
      )}

      <p className="mt-6 text-center text-xs text-muted-foreground">
        Save this page or screenshot the QR code — it's your entry pass. The QR is
        scannable {ticket?.slots_total ?? 1} time
        {(ticket?.slots_total ?? 1) > 1 ? "s" : ""} at the door.
      </p>
    </div>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-[10px] font-condensed uppercase tracking-widest text-muted-foreground">
        {label}
      </div>
      <div className="font-condensed text-base text-foreground">{value}</div>
    </div>
  );
}

function Center({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-4">
      {children}
    </div>
  );
}

function PulsingRings() {
  return (
    <div className="relative h-32 w-32">
      {[0, 1, 2].map((i) => (
        <div
          key={i}
          className="absolute inset-0 rounded-full border-2 border-[var(--color-gold)]/60"
          style={{
            animation: `pulse-ring 2s ease-out ${i * 0.6}s infinite`,
          }}
        />
      ))}
      <div className="absolute inset-0 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-gold" />
      </div>
      <style>{`
        @keyframes pulse-ring {
          0% { transform: scale(0.6); opacity: 1; }
          100% { transform: scale(1.6); opacity: 0; }
function WhatsAppShare({
  origin,
  buyerName,
  tier,
  slots,
  qrSlug,
}: {
  origin: string;
  buyerName: string;
  tier: string;
  slots: number;
  qrSlug: string;
}) {
  const checkinUrl = `${origin}/checkin/${qrSlug}`;
  const tierLabel = TIER_LABEL[tier as keyof typeof TIER_LABEL] ?? tier;
  const eventLine = `${EVENT.venue} · ${EVENT.date} · ${EVENT.time}`;

  const message = encodeURIComponent(
    `🎉 *FET Black Tie Event — Ticket Confirmed*\n\n` +
      `👤 *Name:* ${buyerName}\n` +
      `🎫 *Tier:* ${tierLabel}\n` +
      `👥 *Guests:* ${slots}\n` +
      `📍 *Event:* ${eventLine}\n\n` +
      `🔗 *Your entry QR code:*\n${checkinUrl}\n\n` +
      `Save this message — you'll need the QR link at the door. See you at the Gala! 🥂`
  );

  // wa.me uses full international format; Cameroon is +237
  // We don't have the number here, so open WhatsApp without a specific recipient
  // and let the user choose the contact (themselves or a friend)
  const waLink = `https://wa.me/?text=${message}`;

  return (
    <div className="mt-6 flex flex-col items-center gap-3">
      <a
        href={waLink}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-2 rounded-xl bg-[#25D366] px-6 py-3 text-sm font-semibold text-white shadow-lg transition-transform hover:scale-[1.02] active:scale-[0.98]"
      >
        <MessageCircle className="h-5 w-5" />
        Save to my WhatsApp
      </a>
      <p className="text-xs text-muted-foreground">
        Tap to open WhatsApp and send your ticket to yourself
      </p>
    </div>
  );
}
      `}</style>
    </div>
  );
}
