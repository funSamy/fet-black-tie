"use client";
import { useEffect, useRef } from "react";
import { gsap } from "gsap";

interface Props {
  children: string;
  className?: string;
}

export function SplitHeadline({ children, className = "" }: Props) {
  const ref = useRef<HTMLHeadingElement | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const el = ref.current;
    if (!el) return;

    const spans = el.querySelectorAll<HTMLElement>("[data-char]");
    if (reduce) {
      gsap.set(spans, { opacity: 1, y: 0, rotateX: 0 });
      return;
    }

    const ctx = gsap.context(() => {
      gsap.fromTo(
        spans,
        { opacity: 0, y: 60, rotateX: -40 },
        {
          opacity: 1,
          y: 0,
          rotateX: 0,
          duration: 0.8,
          ease: "power3.out",
          stagger: 0.035,
        },
      );
    }, ref);

    return () => ctx.revert();
  }, [children]);

  const words = children.split(" ");
  return (
    <h1 ref={ref} className={className} style={{ perspective: "800px" }} aria-label={children}>
      {words.map((word, wi) => (
        <span key={wi} className="inline-block whitespace-nowrap" aria-hidden>
          {Array.from(word).map((ch, ci) => (
            <span
              key={ci}
              data-char
              className="inline-block will-change-transform"
              style={{ opacity: 0 }}
            >
              {ch}
            </span>
          ))}
          {wi < words.length - 1 && <span className="inline-block">&nbsp;</span>}
        </span>
      ))}
    </h1>
  );
}
