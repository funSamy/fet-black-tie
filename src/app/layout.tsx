import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import { Toaster } from "@/components/ui/sonner";
import "./globals.css";

const OG_IMAGE =
  "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/dece804b-6afe-423e-9da6-70ff452fded6/id-preview-b33a870b--47f9abf3-228a-4470-8dad-9fc1892b4a7f.lovable.app-1780966681939.png";

export const metadata: Metadata = {
  title: "FET Black Tie Event — 4 July 2026",
  description:
    "The Night of Excellence. University of Buea FET Black Tie Gala — 4 July 2026, The Millennium Hall.",
  openGraph: {
    type: "website",
    title: "FET Black Tie Event — 4 July 2026",
    description:
      "Gala Glow is a Next.js 16 application for managing ticket sales and event check-in for the FET Black Tie Gala.",
    images: [OG_IMAGE],
  },
  twitter: {
    card: "summary_large_image",
    title: "FET Black Tie Event — 4 July 2026",
    description:
      "Gala Glow is a Next.js 16 application for managing ticket sales and event check-in for the FET Black Tie Gala.",
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
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Anton&family=Pinyon+Script&family=DM+Sans:wght@400;500;600;700&display=swap"
        />
      </head>
      <body>
        {children}
        <Toaster richColors position="top-center" />
      </body>
    </html>
  );
}
