import type { Metadata } from "next";
import { MessagePage } from "./message-page";

export const metadata: Metadata = {
  title: "Send a shout-out — FET Black Tie Event",
  description: "Send an anonymous shout-out to be projected on the wall at the FET Black Tie Gala.",
};

export default function Page() {
  return <MessagePage />;
}
