"use client";
import { useEffect, useRef, useState } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { MapPin, Calendar, Clock, Crown } from "lucide-react";
import { EVENT } from "@/lib/event";
import { UniversityLogos } from "./UniversityLogos";

gsap.registerPlugin(ScrollTrigger);

// Hero artwork. Drop the official event flyer at public/flyer.jpg and it is
// used automatically; until then a poster built from the design system fills
// the slot so the hero never looks empty.
export function FlyerShowcase() {
  const wrapRef = useRef<HTMLDivElement | null>(null);
  const cardRef = useRef<HTMLDivElement | null>(null);
  const imgRef = useRef<HTMLImageElement | null>(null);
  const [missing, setMissing] = useState(false);

  // The image often 404s before hydration attaches onError, so re-check the
  // loaded state once mounted.
  useEffect(() => {
    const img = imgRef.current;
    if (img && img.complete && img.naturalWidth === 0) setMissing(true);
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) return;
    const wrap = wrapRef.current;
    const card = cardRef.current;
    if (!wrap || !card) return;

    const ctx = gsap.context(() => {
      // Entrance
      gsap.fromTo(
        card,
        { opacity: 0, y: 60, rotate: 6, scale: 0.94 },
        { opacity: 1, y: 0, rotate: 2, scale: 1, duration: 1, ease: "power3.out", delay: 0.5 },
      );
      // Slow float loop
      gsap.to(card, {
        y: -10,
        duration: 2.6,
        ease: "sine.inOut",
        yoyo: true,
        repeat: -1,
        delay: 1.6,
      });
      // Scroll parallax: the flyer drifts and straightens as you scroll past the hero
      gsap.to(wrap, {
        y: 90,
        rotate: -2,
        ease: "none",
        scrollTrigger: {
          trigger: wrap,
          start: "top 80%",
          end: "bottom top",
          scrub: 0.6,
        },
      });
    }, wrap);

    return () => ctx.revert();
  }, []);

  return (
    <div ref={wrapRef} className="relative" aria-hidden>
      {/* Glow behind the flyer */}
      <div className="absolute -inset-8 rounded-4xl bg-[radial-gradient(circle_at_center,oklch(0.78_0.16_84/0.18),transparent_70%)] blur-2xl" />

      <div
        ref={cardRef}
        className="relative w-75 sm:w-85 xl:w-95 rotate-2 rounded-2xl border border-gold/50 shadow-gold overflow-hidden"
      >
        {!missing ? (
          // Official flyer artwork from /public — decorative, dimensions unknown
          // until the file is provided, so plain <img> with onError fallback.
          // eslint-disable-next-line @next/next/no-img-element
          <img
            ref={imgRef}
            src="/flyer.jpg"
            alt=""
            className="block w-full"
            onError={() => setMissing(true)}
          />
        ) : (
          <PosterFallback />
        )}
      </div>
    </div>
  );
}

// CSS rendition of the printed flyer: deep blue → black → red wash,
// crests on top, blazing gold title, venue/date chips.
function PosterFallback() {
  return (
    <div
      className="relative flex flex-col items-center px-6 py-8 text-center"
      style={{
        background:
          "linear-gradient(135deg, oklch(0.28 0.12 262) 0%, oklch(0.13 0.012 270) 42%, oklch(0.3 0.13 29) 100%)",
      }}
    >
      <UniversityLogos />
      <div className="mt-3 font-condensed text-[11px] uppercase tracking-[0.18em] text-foreground leading-snug">
        University of Buea
        <br />
        <span className="text-[9px] text-muted-foreground tracking-[0.22em]">
          Faculty of Engineering and Technology
        </span>
      </div>

      <div className="mt-6 font-display text-6xl leading-[0.9] text-gradient-gold drop-shadow-[0_4px_12px_oklch(0.78_0.16_84/0.35)]">
        FET
        <br />
        BLACK TIE
        <br />
        EVENT
      </div>

      <div className="mt-3 font-script text-2xl text-gold">{EVENT.tagline}</div>

      <div className="mt-6 inline-flex items-center gap-1.5 rounded-md bg-(--color-red-spot) px-3 py-1 font-condensed text-xs uppercase tracking-widest text-white">
        <Crown className="h-3.5 w-3.5" /> Mister & Miss FET
      </div>

      <div className="mt-6 w-full space-y-2 text-left">
        <PosterLine icon={<MapPin className="h-3.5 w-3.5" />} text={EVENT.venue} />
        <PosterLine icon={<Calendar className="h-3.5 w-3.5" />} text={EVENT.date} />
        <PosterLine
          icon={<Clock className="h-3.5 w-3.5" />}
          text={`${EVENT.time} · Dress code: ${EVENT.dressCode}`}
        />
      </div>

      <div className="mt-6 w-full border-t border-white/15 pt-3 text-[10px] font-condensed uppercase tracking-[0.25em] text-muted-foreground">
        Contact · {EVENT.contact}
      </div>
    </div>
  );
}

function PosterLine({ icon, text }: { icon: React.ReactNode; text: string }) {
  return (
    <div className="flex items-center gap-2 rounded-md bg-black/35 px-3 py-1.5">
      <span className="text-gold">{icon}</span>
      <span className="font-condensed text-xs uppercase tracking-wider text-foreground">
        {text}
      </span>
    </div>
  );
}
