import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import { Toaster } from "@/components/ui/sonner";

// Self-hosted fonts (same families the design system references in globals.css).
import "@fontsource/bebas-neue";
import "@fontsource/anton";
import "@fontsource/pinyon-script";
import "@fontsource/dm-sans/400.css";
import "@fontsource/dm-sans/500.css";
import "@fontsource/dm-sans/600.css";
import "@fontsource/dm-sans/700.css";

import "./globals.css";
import { SITE_URL } from "@/lib/site";

const OG_IMAGE =
  "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/dece804b-6afe-423e-9da6-70ff452fded6/id-preview-b33a870b--47f9abf3-228a-4470-8dad-9fc1892b4a7f.lovable.app-1780966681939.png";

const DESCRIPTION =
  "The Night of Excellence. University of Buea FET Black Tie Gala — 4 July 2026, Amelia Apart Hotel, Bokwai-Buea.";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: "FET Black Tie Event — 4 July 2026",
  description: DESCRIPTION,
  openGraph: {
    type: "website",
    title: "FET Black Tie Event — 4 July 2026",
    description: DESCRIPTION,
    images: [OG_IMAGE],
  },
  twitter: {
    card: "summary_large_image",
    title: "FET Black Tie Event — 4 July 2026",
    description: DESCRIPTION,
    images: [OG_IMAGE],
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#0A0A0E",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>
        {children}
        <Toaster richColors position="top-center" />
      </body>
    </html>
  );
}
