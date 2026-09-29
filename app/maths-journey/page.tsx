import type { Metadata } from "next";
import { MathsJourney } from "../../components/maths-journey/MathsJourney";

export const metadata: Metadata = {
  title: "SKYLORA · Maths Journey",
  description: "A connected, game-first maths adventure from quantity and counting to practical everyday maths.",
};

export default function MathsJourneyPage() {
  return <MathsJourney />;
}
