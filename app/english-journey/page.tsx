import type { Metadata } from "next";
import { EnglishJourney } from "../../components/english-journey/EnglishJourney";

export const metadata: Metadata = {
  title: "SKYLORA · English Journey",
  description: "Letters-first connected English learning: handwriting, phonics, words, speaking, reading, sentences and paragraphs.",
};

export default function EnglishJourneyPage() {
  return <EnglishJourney />;
}
