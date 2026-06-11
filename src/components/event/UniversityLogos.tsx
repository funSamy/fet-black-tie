"use client";
import { useEffect, useRef, useState } from "react";

interface LogoSpec {
  src: string;
  alt: string;
  initials: string;
}

// Real crests are loaded from /public/logos/. Drop in:
//   public/logos/ub-logo.png    — University of Buea crest
//   public/logos/fet-logo.png   — Faculty of Engineering & Technology crest
//   public/logos/fetsa-logo.png — FET Students' Association crest
// Until a file exists, the gold shield fallback below is shown for that slot.
const LOGOS: LogoSpec[] = [
  { src: "/logos/ub-logo.png", alt: "University of Buea", initials: "UB" },
  { src: "/logos/fet-logo.png", alt: "Faculty of Engineering & Technology", initials: "FET" },
  { src: "/logos/fetsa-logo.png", alt: "FET Students' Association", initials: "UB" },
];

interface Props {
  className?: string;
}

export function UniversityLogos({ className = "" }: Props) {
  return (
    <div
      className={`flex items-center gap-2 ${className}`}
      aria-label="University of Buea — Faculty of Engineering & Technology"
    >
      {LOGOS.map((logo) => (
        <LogoBadge key={logo.src} logo={logo} />
      ))}
    </div>
  );
}

function LogoBadge({ logo }: { logo: LogoSpec }) {
  const imgRef = useRef<HTMLImageElement | null>(null);
  const [missing, setMissing] = useState(false);

  // The crest often 404s before hydration attaches onError, so re-check the
  // loaded state once mounted.
  useEffect(() => {
    const img = imgRef.current;
    if (img && img.complete && img.naturalWidth === 0) setMissing(true);
  }, []);

  return (
    <div className="relative h-10 w-10 sm:h-12 sm:w-12 rounded-full bg-gradient-to-b from-[var(--color-gold-light)] to-[var(--color-gold-dark)] p-[1.5px] shadow-gold">
      <div
        className={`h-full w-full rounded-full flex items-center justify-center overflow-hidden ${
          missing ? "bg-card" : "bg-white"
        }`}
      >
        {missing ? (
          <ShieldFallback initials={logo.initials} />
        ) : (
          // Tiny decorative crest from /public — plain <img> keeps the
          // graceful onError fallback simple.
          // eslint-disable-next-line @next/next/no-img-element
          <img
            ref={imgRef}
            src={logo.src}
            alt={logo.alt}
            className="h-full w-full object-contain p-0.5"
            onError={() => setMissing(true)}
          />
        )}
      </div>
    </div>
  );
}

function ShieldFallback({ initials }: { initials: string }) {
  return (
    <svg viewBox="0 0 32 32" className="h-6 w-6 sm:h-7 sm:w-7 text-gold">
      <path
        fill="currentColor"
        d="M16 2 L28 7 V16 C28 23 22 28 16 30 C10 28 4 23 4 16 V7 Z"
        opacity="0.18"
      />
      <path
        d="M16 2 L28 7 V16 C28 23 22 28 16 30 C10 28 4 23 4 16 V7 Z"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
      />
      <text
        x="16"
        y="20"
        textAnchor="middle"
        fontSize="9"
        fontFamily="Bebas Neue, Impact, sans-serif"
        fill="currentColor"
      >
        {initials}
      </text>
    </svg>
  );
}
