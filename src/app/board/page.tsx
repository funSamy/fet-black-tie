import type { Metadata } from "next";
import { BoardPage } from "./board-page";

export const metadata: Metadata = {
  title: "The Wall — FET Black Tie Event",
  description:
    "Live shout-out wall of the FET Black Tie Gala. Approved messages from the crowd, projected during the night.",
};

export default function Page() {
  return <BoardPage />;
}
