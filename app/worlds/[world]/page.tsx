import { notFound } from "next/navigation";
import { WORLDS } from "../../../lib/world/catalogue";
import { WorldHub } from "../../../components/world/WorldHub";
export function generateStaticParams() {
  return WORLDS.map((w) => ({ world: w.id }));
}
export default async function WorldPage({
  params,
}: {
  params: Promise<{ world: string }>;
}) {
  const { world: id } = await params;
  const world = WORLDS.find((w) => w.id === id);
  if (!world) notFound();
  return <WorldHub world={world.id} />;
}
