interface Props {
  className?: string;
}

// Three University of Buea shields — placeholder marks until real logos are dropped in.
// Kept inline-SVG so they tint with the gold palette.
export function UniversityLogos({ className = "" }: Props) {
  return (
    <div
      className={`flex items-center gap-2 ${className}`}
      aria-label="University of Buea — Faculty of Engineering & Technology"
    >
      {[0, 1, 2].map((i) => (
        <div
          key={i}
          className="relative h-10 w-10 sm:h-12 sm:w-12 rounded-full bg-gradient-to-b from-[var(--color-gold-light)] to-[var(--color-gold-dark)] p-[1.5px] shadow-gold"
        >
          <div className="h-full w-full rounded-full bg-card flex items-center justify-center">
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
                UB
              </text>
            </svg>
          </div>
        </div>
      ))}
    </div>
  );
}
