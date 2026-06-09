"use client";
import { useEffect, useRef } from "react";

// Red-amber spotlight that follows the cursor — recreates the Miss FET flyer glow.
// Lightweight: uses requestAnimationFrame with linear easing, no gsap dependency.
export function SpotlightCursor() {
  const ref = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduceMotion) return;

    const el = ref.current;
    if (!el) return;

    let targetX = window.innerWidth / 2;
    let targetY = window.innerHeight / 3;
    let x = targetX;
    let y = targetY;
    let raf = 0;

    const onMove = (e: MouseEvent) => {
      targetX = e.clientX;
      targetY = e.clientY;
    };

    const tick = () => {
      x += (targetX - x) * 0.08;
      y += (targetY - y) * 0.08;
      el.style.transform = `translate3d(${x - 400}px, ${y - 400}px, 0)`;
      raf = requestAnimationFrame(tick);
    };

    window.addEventListener("mousemove", onMove, { passive: true });
    raf = requestAnimationFrame(tick);

    return () => {
      window.removeEventListener("mousemove", onMove);
      cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <div
      ref={ref}
      aria-hidden
      className="pointer-events-none fixed left-0 top-0 z-0 h-[800px] w-[800px] will-change-transform"
      style={{
        background:
          "radial-gradient(circle, oklch(0.55 0.22 28 / 0.18) 0%, oklch(0.78 0.16 84 / 0.10) 30%, transparent 65%)",
        filter: "blur(20px)",
      }}
    />
  );
}
