import type { Metadata } from "next";
import { AuthPage } from "./auth-page";

export const metadata: Metadata = {
  title: "Staff sign-in — FET Black Tie",
};

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ redirect?: string }>;
}) {
  const { redirect } = await searchParams;
  return <AuthPage redirectTo={redirect} />;
}
