import type { ReactNode } from "react";

interface Props {
  icon: ReactNode;
  label: string;
  className?: string;
}

export function EventBadge({ icon, label, className = "" }: Props) {
  return (
    <div
      className={`inline-flex items-center gap-2 rounded-full border border-[var(--color-gold)]/40 bg-card/80 px-4 py-2 backdrop-blur ${className}`}
    >
      <span className="text-gold">{icon}</span>
      <span className="font-condensed text-sm sm:text-base uppercase tracking-wider text-foreground">
        {label}
      </span>
    </div>
  );
}
