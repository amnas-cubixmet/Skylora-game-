"use client";
import Link from "next/link";
import type { ReactNode } from "react";
import { GameShell } from "../game/GameShell";
import { GuideCharacter } from "../english/Art";
import type { Preferences } from "../../lib/world/types";
export function WorldFrame({
  children,
  settings,
  title = "Learning Support World",
  pause,
  toggleVoice,
  inert = false,
}: {
  children: ReactNode;
  settings: Preferences;
  title?: string;
  pause?: () => void;
  toggleVoice?: () => void;
  inert?: boolean;
}) {
  return (
    <div
      className="learning-world"
      data-theme={settings.theme}
      data-motion={settings.motion ? "on" : "off"}
    >
      <GameShell
        adventure
        gameTitle={title}
        showPause={!!pause}
        onPause={pause}
        soundEnabled={settings.voice}
        onToggleSound={toggleVoice}
        inert={inert}
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
      <Link href="/">All worlds</Link>
      <Link href="/learning-progress">My progress</Link>
      <Link href="/rewards">Rewards</Link>
      <Link href="/learning-settings">Settings</Link>
    </nav>
  );
}
