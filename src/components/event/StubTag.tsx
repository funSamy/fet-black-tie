import type { StubColor } from "@/lib/event";

interface Props {
  color: StubColor;
  priceLabel: string;
  tierLabel: string;
}

const COLOR_MAP: Record<StubColor, string> = {
  yellow: "bg-[var(--color-stub-yellow)] text-[oklch(0.18_0.05_60)]",
  green: "bg-[var(--color-stub-green)] text-[oklch(0.98_0.01_140)]",
  vip: "bg-[var(--color-stub-vip)] text-[oklch(0.98_0.005_295)]",
};

export function StubTag({ color, priceLabel, tierLabel }: Props) {
  return (
    <div
      className={`relative flex h-full min-h-[150px] w-24 flex-col items-center justify-center px-2 py-3 ${COLOR_MAP[color]}`}
      style={{
        // Perforation effect on left edge (where stub joins ticket body)
        backgroundImage:
          "radial-gradient(circle at left center, var(--color-background) 4px, transparent 4.5px)",
        backgroundSize: "12px 12px",
        backgroundRepeat: "repeat-y",
        backgroundPosition: "-6px 0",
      }}
    >
      <span className="font-display text-4xl sm:text-5xl leading-none drop-shadow-sm">
        {priceLabel}
      </span>
      <span className="mt-2 text-center font-condensed text-[10px] sm:text-xs uppercase tracking-widest leading-tight opacity-90">
        {tierLabel}
      </span>
    </div>
  );
}
