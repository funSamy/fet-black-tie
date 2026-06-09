"use client";
import { useEffect, useRef, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { gsap } from "gsap";
import { MapPin, Calendar, Clock, Sparkles } from "lucide-react";
import { EVENT, TIER_ORDER, type TicketTier } from "@/lib/event";
import { UniversityLogos } from "@/components/event/UniversityLogos";
import { EventBadge } from "@/components/event/EventBadge";
import { TicketCard } from "@/components/event/TicketCard";
import { SpotlightCursor } from "@/components/event/SpotlightCursor";
import { SplitHeadline } from "@/components/event/SplitHeadline";
import { FlipClock } from "@/components/event/FlipClock";
import { BookingForm } from "@/components/event/BookingForm";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "FET Black Tie Event — 4 July 2026 · Millennium Hall" },
      {
        name: "description",
        content:
          "The Night of Excellence. University of Buea Faculty of Engineering & Technology Black Tie Gala — 4 July 2026, The Millennium Hall, 6PM. Reserve your ticket.",
      },
      { property: "og:title", content: "FET Black Tie Event — 4 July 2026" },
      {
        property: "og:description",
        content:
          "The Night of Excellence at The Millennium Hall. Reserve Classic, VIP or Table of 5.",
      },
    ],
  }),
  component: LandingPage,
});

function LandingPage() {
  const [selected, setSelected] = useState<TicketTier | null>(null);
  const cardsRef = useRef<HTMLDivElement | null>(null);
  const ctaRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) return;

    const ctx = gsap.context(() => {
      gsap.fromTo(
        "[data-stagger-in]",
        { opacity: 0, y: 20 },
        {
          opacity: 1,
          y: 0,
          duration: 0.7,
          ease: "power2.out",
          stagger: 0.1,
          delay: 0.3,
        },
      );
      if (cardsRef.current) {
        gsap.fromTo(
          cardsRef.current.querySelectorAll("[data-tier-card]"),
          { opacity: 0, y: 60, rotate: -1.5 },
          {
            opacity: 1,
            y: 0,
            rotate: 0,
            duration: 0.7,
            ease: "power3.out",
            stagger: 0.12,
            delay: 0.6,
          },
        );
      }
    });
    return () => ctx.revert();
  }, []);

  // Smooth-scroll booking into view when a tier is picked
  useEffect(() => {
    if (selected && ctaRef.current) {
      ctaRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [selected]);

  return (
    <div className="relative min-h-screen overflow-x-hidden">
      <SpotlightCursor />

      <div className="relative z-10">
        {/* Top bar */}
        <header className="mx-auto flex max-w-7xl items-center justify-between px-4 py-5 sm:px-6 lg:px-8">
          <UniversityLogos />
          <nav className="flex items-center gap-4 text-xs sm:text-sm">
            <Link
              to="/message"
              className="font-condensed uppercase tracking-widest text-muted-foreground hover:text-gold transition-colors"
            >
              Send a shout-out
            </Link>
          </nav>
        </header>

        {/* HERO */}
        <section className="mx-auto max-w-7xl px-4 pt-8 pb-20 sm:px-6 sm:pt-16 sm:pb-28 lg:px-8">
          <div data-stagger-in className="inline-flex items-center gap-2 rounded-full border border-[var(--color-red-spot)]/40 bg-[var(--color-red-spot)]/10 px-3 py-1 text-[11px] font-condensed uppercase tracking-widest text-[oklch(0.85_0.16_30)]">
            <Sparkles className="h-3 w-3" />
            Faculty of Engineering & Technology
          </div>

          <SplitHeadline className="mt-5 font-display text-[15vw] sm:text-[12vw] lg:text-[9rem] leading-[0.85] text-gradient-gold">
            {EVENT.name}
          </SplitHeadline>

          <p
            data-stagger-in
            className="mt-4 font-script text-3xl sm:text-5xl text-gold"
          >
            {EVENT.tagline}
          </p>

          <div data-stagger-in className="mt-8 flex flex-wrap gap-2 sm:gap-3">
            <EventBadge icon={<MapPin className="h-4 w-4" />} label={EVENT.venue} />
            <EventBadge icon={<Calendar className="h-4 w-4" />} label={EVENT.date} />
            <EventBadge icon={<Clock className="h-4 w-4" />} label={EVENT.time} />
          </div>

          <div data-stagger-in className="mt-10">
            <div className="text-[10px] font-condensed uppercase tracking-[0.3em] text-muted-foreground mb-3">
              Doors open in
            </div>
            <FlipClock targetISO={EVENT.dateISO} />
          </div>

          <p
            data-stagger-in
            className="mt-10 max-w-2xl text-base sm:text-lg text-muted-foreground leading-relaxed"
          >
            One unforgettable evening of black tie elegance, the Mister & Miss FET
            pageant, fine dining and live entertainment — hosted by the University
            of Buea's Faculty of Engineering & Technology.
          </p>
        </section>

        {/* TIERS */}
        <section className="mx-auto max-w-7xl px-4 pb-20 sm:px-6 lg:px-8">
          <div className="mb-8 flex items-end justify-between gap-4 border-b border-border pb-4">
            <div>
              <div className="font-script text-2xl text-gold">Reserve your seat</div>
              <h2 className="font-display text-4xl sm:text-5xl text-foreground leading-none mt-1">
                Choose your ticket
              </h2>
            </div>
            <div className="hidden sm:block text-right text-xs font-condensed uppercase tracking-widest text-muted-foreground">
              All prices in XAF · Paid via mobile money
            </div>
          </div>

          <div
            ref={cardsRef}
            className="grid grid-cols-1 gap-4 lg:grid-cols-2"
          >
            {TIER_ORDER.map((tier) => (
              <TicketCard
                key={tier}
                tier={tier}
                selected={selected === tier}
                onSelect={(t) => setSelected(t)}
              />
            ))}
          </div>
        </section>

        {/* BOOKING */}
        <section
          ref={ctaRef}
          className="mx-auto max-w-3xl px-4 pb-24 sm:px-6 lg:px-8"
        >
          {selected ? (
            <BookingForm tier={selected} onCancel={() => setSelected(null)} />
          ) : (
            <div className="rounded-2xl border border-dashed border-border bg-card/40 p-8 text-center">
              <div className="font-script text-2xl text-gold mb-1">Almost there</div>
              <p className="text-muted-foreground">
                Select a ticket above to continue to checkout.
              </p>
            </div>
          )}
        </section>

        {/* Footer */}
        <footer className="border-t border-border">
          <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-8 sm:px-6 sm:flex-row sm:items-center sm:justify-between lg:px-8">
            <div className="flex items-center gap-3">
              <UniversityLogos />
              <div>
                <div className="font-condensed uppercase tracking-widest text-xs text-foreground">
                  {EVENT.organiser}
                </div>
                <div className="text-xs text-muted-foreground">
                  {EVENT.venue} · {EVENT.date} · {EVENT.time}
                </div>
              </div>
            </div>
            <div className="text-xs text-muted-foreground">
              Questions? Call {EVENT.contact}
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}
