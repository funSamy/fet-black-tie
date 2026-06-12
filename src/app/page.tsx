import type { Metadata } from "next";
import { LandingPage } from "./landing-page";

export const metadata: Metadata = {
  title: "FET Black Tie Event — 4 July 2026 · Amelia Apart Hotel",
  description:
    "The Night of Excellence. University of Buea Faculty of Engineering & Technology Black Tie Gala — 4 July 2026, Amelia Apart Hotel, Bokwai-Buea, 6PM. Reserve your ticket.",
  openGraph: {
    title: "FET Black Tie Event — 4 July 2026",
    description:
      "The Night of Excellence at Amelia Apart Hotel, Bokwai-Buea. Reserve Classic, VIP or a full table.",
    url: "/",
  },
  alternates: {
    canonical: "/",
  },
};

export default function Page() {
  return <LandingPage />;
}
