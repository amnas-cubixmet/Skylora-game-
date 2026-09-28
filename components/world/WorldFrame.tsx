"use client";
import Link from "next/link";
import type { ReactNode } from "react";
import { GameShell } from "../game/GameShell";
import { GuideCharacter } from "../english/Art";
import type { Preferences } from "../../lib/world/types";
export function WorldFrame({
  children,
  settings,
  title = "Learning World",
  pause,
  toggleVoice,
  inert = false,
  gameplay = false,
  backHref,
  backLabel,
}: {
  children: ReactNode;
  settings: Preferences;
  title?: string;
  pause?: () => void;
  toggleVoice?: () => void;
  inert?: boolean;
  gameplay?: boolean;
  backHref?: string;
  backLabel?: string;
}) {
  return (
    <div
      className="learning-world"
      data-theme={settings.theme}
      data-motion={settings.motion ? "on" : "off"}
    >
      <GameShell
        adventure
        gameplay={gameplay}
        gameTitle={title}
        backHref={backHref}
        backLabel={backLabel}
        showPause={!!pause}
        onPause={pause}
        soundEnabled={settings.voice}
        onToggleSound={toggleVoice}
        inert={inert}
        headerContent={gameplay ? undefined : <WorldNav />}
      >
        {children}
      </GameShell>
    </div>
  );
}
export function Guide({ celebrate = false }: { celebrate?: boolean }) {
  return (
    <div className="world-guide">
      <GuideCharacter
        mood={celebrate ? "celebrating" : "listening"}
        className="w-28"
      />
    </div>
  );
}
export function WorldNav() {
  return (
    <nav aria-label="Learning world" className="world-nav">
      <Link href="/learning-progress" aria-label="My progress">
        <span className="world-nav-icon" aria-hidden="true">↗</span>
        <span className="world-nav-label">Progress</span>
      </Link>
      <Link href="/rewards" aria-label="Rewards">
        <span className="world-nav-icon" aria-hidden="true">★</span>
        <span className="world-nav-label">Rewards</span>
      </Link>
      <Link href="/learning-settings" aria-label="Learning settings">
        <span className="world-nav-icon" aria-hidden="true">⚙</span>
        <span className="world-nav-label">Settings</span>
      </Link>
    </nav>
  );
}
