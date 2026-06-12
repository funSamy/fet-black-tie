"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createBooking } from "@/lib/booking.actions";
import { TIER_LABEL, TIER_PRICE, TIER_DESCRIPTION, formatXAF, type TicketTier } from "@/lib/event";

interface Props {
  tier: TicketTier;
  onCancel: () => void;
}

export function BookingForm({ tier, onCancel }: Props) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState({
    buyerName: "",
    email: "",
    phoneNumber: "",
  });

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      const res = await createBooking({
        ...form,
        tier,
        origin: typeof window !== "undefined" ? window.location.origin : undefined,
      });
      if (!res.ok) throw new Error(res.error);
      if (res.paymentLink) {
        // Send the user to Fapshi to complete the payment
        window.location.href = res.paymentLink;
      } else {
        router.push(`/confirmation/${res.orderId}`);
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Booking failed";
      toast.error(msg);
      setBusy(false);
    }
  }

  return (
    <form
      onSubmit={onSubmit}
      className="rounded-2xl border border-[var(--color-gold)]/40 bg-card/95 p-6 sm:p-8 shadow-gold backdrop-blur"
      style={{ animation: "fade-in 0.4s ease-out" }}
    >
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <div className="font-script text-lg text-gold">You're booking</div>
          <div className="font-display text-3xl text-gradient-gold leading-none">
            {TIER_LABEL[tier]}
          </div>
          <div className="mt-1 text-sm text-muted-foreground">{TIER_DESCRIPTION[tier]}</div>
        </div>
        <div className="text-right">
          <div className="text-[10px] uppercase tracking-widest text-muted-foreground">Total</div>
          <div className="font-display text-3xl text-gold">{formatXAF(TIER_PRICE[tier])}</div>
        </div>
      </div>

      <div className="space-y-4">
        <div>
          <Label htmlFor="buyerName">Full name</Label>
          <Input
            id="buyerName"
            required
            minLength={2}
            maxLength={100}
            placeholder="As it appears on your ID"
            value={form.buyerName}
            onChange={(e) => setForm({ ...form, buyerName: e.target.value })}
            className="mt-1.5 bg-background border-border focus:border-[var(--color-gold)]"
          />
        </div>
        <div>
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            required
            placeholder="you@example.com"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            className="mt-1.5 bg-background border-border focus:border-[var(--color-gold)]"
          />
        </div>
        <div>
          <Label htmlFor="phone">Phone (MTN / Orange)</Label>
          <Input
            id="phone"
            type="tel"
            required
            inputMode="numeric"
            pattern="^6[5-9][0-9]{7}$"
            placeholder="670000000"
            value={form.phoneNumber}
            onChange={(e) => setForm({ ...form, phoneNumber: e.target.value })}
            className="mt-1.5 bg-background border-border focus:border-[var(--color-gold)]"
          />
          <p className="mt-1 text-xs text-muted-foreground">
            Cameroonian mobile money number — 9 digits starting with 6.
          </p>
        </div>
      </div>

      <div className="mt-6 flex flex-col-reverse sm:flex-row gap-3 sm:justify-end">
        <Button
          type="button"
          variant="ghost"
          onClick={onCancel}
          disabled={busy}
          className="text-muted-foreground hover:text-foreground"
        >
          Choose a different tier
        </Button>
        <Button
          type="submit"
          disabled={busy}
          className="bg-gradient-to-r from-[var(--color-gold-dark)] via-[var(--color-gold)] to-[var(--color-gold-light)] text-background font-condensed uppercase tracking-widest hover:opacity-95 shadow-gold"
        >
          {busy ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Securing your spot…
            </>
          ) : (
            <>Continue to payment</>
          )}
        </Button>
      </div>

      <p className="mt-4 text-center text-xs text-muted-foreground">
        You'll be redirected to Fapshi to pay with MTN Mobile Money or Orange Money.
      </p>
      <p className="mt-2 text-center text-xs text-[oklch(0.85_0.16_30)]">
        Heads up: mobile money transaction charges apply — please add the operator fee on top when
        approving the payment.
      </p>
    </form>
  );
}
