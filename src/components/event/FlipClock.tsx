"use client";
import { useEffect, useState } from "react";

interface Props {
  targetISO: string;
}

function diff(target: number) {
  const now = Date.now();
  const ms = Math.max(0, target - now);
  const s = Math.floor(ms / 1000);
  return {
    days: Math.floor(s / 86400),
    hours: Math.floor((s % 86400) / 3600),
    minutes: Math.floor((s % 3600) / 60),
    seconds: s % 60,
  };
}

export function FlipClock({ targetISO }: Props) {
  const target = new Date(targetISO).getTime();
  const [mounted, setMounted] = useState(false);
  const [time, setTime] = useState(() => diff(target));

  useEffect(() => {
    setMounted(true);
    setTime(diff(target));
    const id = setInterval(() => setTime(diff(target)), 1000);
    return () => clearInterval(id);
  }, [target]);

  const cells: { label: string; value: number }[] = [
    { label: "Days", value: time.days },
    { label: "Hours", value: time.hours },
    { label: "Min", value: time.minutes },
    { label: "Sec", value: time.seconds },
  ];

  return (
    <div className="flex items-center gap-2 sm:gap-3">
      {cells.map((c) => (
        <div key={c.label} className="flex flex-col items-center">
          <div className="relative overflow-hidden rounded-md bg-gradient-to-b from-[var(--color-surface-2)] to-card px-3 py-2 sm:px-4 sm:py-3 min-w-[60px] sm:min-w-[72px] border border-border shadow-gold">
            <span
              key={c.value}
              suppressHydrationWarning
              className="block font-display text-3xl sm:text-4xl text-gradient-gold text-center tabular-nums leading-none"
              style={{
                animation: "fade-in 0.4s ease-out",
              }}
            >
              {mounted ? c.value.toString().padStart(2, "0") : "--"}
            </span>
          </div>
          <span className="mt-1.5 font-condensed text-[10px] sm:text-xs uppercase tracking-widest text-muted-foreground">
            {c.label}
          </span>
        </div>
      ))}
    </div>
  );
}
