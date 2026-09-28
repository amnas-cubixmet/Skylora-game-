import { notFound } from "next/navigation";
import { GAMES, gameBySlug } from "../../lib/world/catalogue";
import { WorldGame } from "../../components/world/WorldGame";
export function generateStaticParams() {
  return GAMES.map((g) => ({ gameSlug: g.slug }));
}
export async function generateMetadata({
  params,
}: {
  params: Promise<{ gameSlug: string }>;
}) {
  const g = gameBySlug((await params).gameSlug);
  return { title: g ? `${g.title} · SKYLORA` : "SKYLORA" };
}
export default async function GamePage({
  params,
}: {
  params: Promise<{ gameSlug: string }>;
}) {
  const game = gameBySlug((await params).gameSlug);
  if (!game) notFound();
  return <WorldGame game={game} />;
}
