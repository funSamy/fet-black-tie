import type { Metadata } from "next";
import { LandingPage } from "./landing-page";

export const metadata: Metadata = {
  title: "FET Black Tie Event — 4 July 2026 · Millennium Hall",
  description:
    "The Night of Excellence. University of Buea Faculty of Engineering & Technology Black Tie Gala — 4 July 2026, The Millennium Hall, 6PM. Reserve your ticket.",
  openGraph: {
    title: "FET Black Tie Event — 4 July 2026",
    description:
      "The Night of Excellence at The Millennium Hall. Reserve Classic, VIP or Table of 5.",
    url: "https://blacktie-sparkle.lovable.app/",
  },
  alternates: {
    canonical: "https://blacktie-sparkle.lovable.app/",
  },
};

export default function Page() {
  return <LandingPage />;
}
