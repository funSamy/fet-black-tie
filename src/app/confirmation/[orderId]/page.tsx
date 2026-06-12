import type { Metadata } from "next";
import { ConfirmationPage } from "./confirmation-page";

export const metadata: Metadata = {
  title: "Confirming your ticket — FET Black Tie Event",
};

export default async function Page({ params }: { params: Promise<{ orderId: string }> }) {
  const { orderId } = await params;
  return <ConfirmationPage orderId={orderId} />;
}
