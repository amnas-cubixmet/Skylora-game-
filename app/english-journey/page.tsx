import type { Metadata } from "next";
import { EnglishJourney } from "../../components/english-journey/EnglishJourney";

export const metadata: Metadata = {
  title: "SKYLORA · English Journey",
  description: "A connected, game-first English adventure for listening, words, sounds, letters and early phonics.",
};

export default function EnglishJourneyPage() {
  return <EnglishJourney />;
}
