// Shared client-safe event constants. NO secrets, NO server imports.

export const EVENT = {
  name: "FET Black Tie Event",
  tagline: "The Night of Excellence",
  organiser: "University of Buea — Faculty of Engineering & Technology",
  date: "4 July 2026",
  time: "6:00 PM",
  dateISO: "2026-07-04T18:00:00",
  venue: "The Millennium Hall",
  contact: "693 463 994",
  currency: "XAF",
} as const;

export type TicketTier =
  | "CLASSIC"
  | "CLASSIC_COUPLE"
  | "VIP"
  | "VIP_COUPLE"
  | "TABLE_OF_5";

export const TIER_PRICE: Record<TicketTier, number> = {
  CLASSIC: 5000,
  CLASSIC_COUPLE: 9000,
  VIP: 10000,
  VIP_COUPLE: 18000,
  TABLE_OF_5: 30000,
};

export const TIER_SLOTS: Record<TicketTier, number> = {
  CLASSIC: 1,
  CLASSIC_COUPLE: 2,
  VIP: 1,
  VIP_COUPLE: 2,
  TABLE_OF_5: 5,
};

export const TIER_LABEL: Record<TicketTier, string> = {
  CLASSIC: "Classic",
  CLASSIC_COUPLE: "Classic Couple",
  VIP: "VIP Classic",
  VIP_COUPLE: "VIP Couple",
  TABLE_OF_5: "Table of 5",
};

export const TIER_STUB_LABEL: Record<TicketTier, string> = {
  CLASSIC: "5K",
  CLASSIC_COUPLE: "9K",
  VIP: "10K",
  VIP_COUPLE: "18K",
  TABLE_OF_5: "30K",
};

export type StubColor = "yellow" | "green" | "vip";
export const TIER_STUB_COLOR: Record<TicketTier, StubColor> = {
  CLASSIC: "green",
  CLASSIC_COUPLE: "green",
  VIP: "vip",
  VIP_COUPLE: "vip",
  TABLE_OF_5: "yellow",
};

export const TIER_DESCRIPTION: Record<TicketTier, string> = {
  CLASSIC: "Standard entry · 1 guest",
  CLASSIC_COUPLE: "Standard entry · 2 guests",
  VIP: "Premium seating · 1 guest",
  VIP_COUPLE: "Premium seating · 2 guests",
  TABLE_OF_5: "Reserved table · 5 guests",
};

export const TIER_ORDER: TicketTier[] = [
  "CLASSIC",
  "CLASSIC_COUPLE",
  "VIP",
  "VIP_COUPLE",
  "TABLE_OF_5",
];

export function formatXAF(n: number): string {
  return new Intl.NumberFormat("en-US").format(n) + " XAF";
}
