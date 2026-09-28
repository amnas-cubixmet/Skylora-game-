import { GuideCharacter, WorldScenery } from '../components/english/Art';
import { GameLibrary } from '../components/game/GameLibrary';
export default function HomePage() {
  return <main className="relative min-h-svh overflow-hidden bg-[#faf8f2] px-5 py-10 text-ink sm:px-10">
    <div className="relative z-10 mx-auto max-w-5xl"><p className="font-black tracking-[.2em] text-primary">SKYLORA</p>
      <section className="py-8 sm:py-16"><GuideCharacter mood="happy" className="mb-5 w-32"/><p className="text-sm font-bold uppercase tracking-widest text-primary">A little wonder. A lot to discover.</p><h1 className="max-w-2xl text-4xl font-black tracking-tight sm:text-6xl">Where shall we explore today?</h1><p className="mt-5 max-w-xl text-lg text-muted">Choose a learning adventure. Take your time, listen, and discover something new.</p></section>
      <GameLibrary/><p className="mt-8 text-sm text-muted">Little steps, at your own pace.</p>
    </div><WorldScenery className="pointer-events-none absolute bottom-0 left-0 h-40 w-full opacity-30"/>
  </main>;
}
