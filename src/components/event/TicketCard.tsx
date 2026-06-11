import { MapPin, Calendar, Clock } from "lucide-react";
import {
  TIER_LABEL,
  TIER_STUB_LABEL,
  TIER_STUB_COLOR,
  TIER_DESCRIPTION,
  TIER_PRICE,
  EVENT,
  formatXAF,
  type TicketTier,
} from "@/lib/event";
import { UniversityLogos } from "./UniversityLogos";
import { StubTag } from "./StubTag";

interface Props {
  tier: TicketTier;
  selected?: boolean;
  onSelect?: (tier: TicketTier) => void;
}

export function TicketCard({ tier, selected, onSelect }: Props) {
  const label = TIER_LABEL[tier];

  return (
    <button
      type="button"
      onClick={() => onSelect?.(tier)}
      data-tier-card
      className={`group relative flex w-full overflow-hidden rounded-xl border text-left transition-all duration-300
        ${
          selected
            ? "border-[var(--color-gold)] ring-gold scale-[1.01]"
            : "border-border hover:border-[var(--color-gold)]/60 hover:shadow-gold"
        }`}
    >
      {/* Body */}
      <div className="relative flex-1 bg-gradient-to-br from-card to-[var(--color-surface-2)] p-5 sm:p-6">
        {/* Subtle radial glow on hover */}
        <div className="pointer-events-none absolute -top-20 -left-20 h-48 w-48 rounded-full bg-[var(--color-gold)]/0 blur-3xl transition-colors duration-500 group-hover:bg-[var(--color-gold)]/10" />

        <div className="flex items-center justify-between gap-3">
          <UniversityLogos />
          <div className="text-right">
            <div className="text-[10px] uppercase tracking-widest text-muted-foreground">
              Faculty of Engineering
            </div>
            <div className="text-[10px] uppercase tracking-widest text-muted-foreground">
              University of Buea
            </div>
          </div>
        </div>

        <div className="mt-4 sm:mt-5">
          <h3 className="font-display text-3xl sm:text-4xl text-gradient-gold leading-none">
            {EVENT.name}
          </h3>
          <p className="mt-1 font-script text-lg sm:text-xl text-gold">{EVENT.tagline}</p>
        </div>

        <div className="mt-4 flex flex-wrap gap-2 text-[11px] sm:text-xs font-condensed uppercase tracking-wider">
          <span className="inline-flex items-center gap-1 rounded-full bg-background/60 px-2.5 py-1 text-foreground">
            <MapPin className="h-3 w-3 text-gold" />
            {EVENT.venue}
          </span>
          <span className="inline-flex items-center gap-1 rounded-full bg-background/60 px-2.5 py-1 text-foreground">
            <Calendar className="h-3 w-3 text-gold" />
            {EVENT.date}
          </span>
          <span className="inline-flex items-center gap-1 rounded-full bg-background/60 px-2.5 py-1 text-foreground">
            <Clock className="h-3 w-3 text-gold" />
            {EVENT.time}
          </span>
        </div>

        <div className="mt-5 flex items-end justify-between gap-4">
          <div>
            <div className="font-condensed text-2xl uppercase tracking-wide text-foreground">
              {label}
            </div>
            <div className="text-xs text-muted-foreground">{TIER_DESCRIPTION[tier]}</div>
          </div>
          <div className="text-right">
            <div className="text-[10px] uppercase tracking-widest text-muted-foreground">Total</div>
            <div className="font-display text-2xl text-gold">{formatXAF(TIER_PRICE[tier])}</div>
          </div>
        </div>
      </div>

      {/* Tear-off stub */}
      <StubTag color={TIER_STUB_COLOR[tier]} priceLabel={TIER_STUB_LABEL[tier]} tierLabel={label} />
    </button>
  );
}
