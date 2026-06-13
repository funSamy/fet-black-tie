"use client";
import { useEffect, useRef, useState } from "react";

interface LogoSpec {
  candidates: string[];
  alt: string;
  initials: string;
}

// Real crests live in /public/logos/ as ub-logo, fet-logo and fetsa-logo
// (.png or .jpg both work — each slot tries png first, then jpg, then the
// gold shield fallback). Dark/transparent crests stay readable because every
// logo is rendered on a white disc inside the gold ring.
const LOGOS: LogoSpec[] = [
  {
    candidates: ["/logos/ub-logo.png", "/logos/ub-logo.jpg"],
    alt: "University of Buea",
    initials: "UB",
  },
  {
    candidates: ["/logos/fet-logo.png", "/logos/fet-logo.jpg"],
    alt: "Faculty of Engineering & Technology",
    initials: "FET",
  },
  {
    candidates: ["/logos/fetsa-logo.png", "/logos/fetsa-logo.jpg"],
    alt: "FET Students' Association",
    initials: "FETSA",
  },
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
        <LogoBadge key={logo.alt} logo={logo} />
      ))}
    </div>
  );
}

function LogoBadge({ logo }: { logo: LogoSpec }) {
  const imgRef = useRef<HTMLImageElement | null>(null);
  const [srcIndex, setSrcIndex] = useState(0);
  const missing = srcIndex >= logo.candidates.length;

  // A 404 can fire before hydration attaches onError, so re-check the loaded
  // state after mount (and after each candidate swap).
  useEffect(() => {
    const img = imgRef.current;
    if (img && img.complete && img.naturalWidth === 0) {
      setSrcIndex((i) => i + 1);
    }
  }, [srcIndex]);

  return (
    <div className="relative h-10 w-10 sm:h-12 sm:w-12 rounded-full bg-linear-to-b from-(--color-gold-light) to-(--color-gold-dark) p-[1.5px] shadow-gold">
      <div
        className={`h-full w-full rounded-full flex items-center justify-center overflow-hidden ${
          missing ? "bg-card" : "bg-white"
        }`}
      >
        {missing ? (
          <ShieldFallback initials={logo.initials} />
        ) : (
          // Tiny decorative crest from /public — plain <img> keeps the
          // candidate-chain onError fallback simple.
          // eslint-disable-next-line @next/next/no-img-element
          <img
            ref={imgRef}
            src={logo.candidates[srcIndex]}
            alt={logo.alt}
            className="h-full w-full object-contain p-0.5"
            onError={() => setSrcIndex((i) => i + 1)}
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
