"use client";

import Link from "next/link";
import { Icon } from "./Icon";
import { gameStyles as ui } from "./styles";


import type { ReactNode } from "react";

type GameShellProps = {
  children: ReactNode;
  gameTitle?: string;
  adventure?: boolean;
  inert?: boolean;
  onPause?: () => void;
  showPause?: boolean;
  soundEnabled?: boolean;
  onToggleSound?: () => void;
};

export function GameShell({ children, onPause, showPause = false, soundEnabled, onToggleSound, gameTitle = "Number Hunt", adventure = false, inert = false }: GameShellProps) {
  return (
    <main inert={inert} style={{paddingTop:'env(safe-area-inset-top)',paddingLeft:'env(safe-area-inset-left)',paddingRight:'env(safe-area-inset-right)'}} className={adventure ? "relative min-h-svh overflow-x-clip bg-[#faf8f2] text-ink" : ui["game-shell"]}>
      <header className={ui["game-header"]}>
        <div className={ui["brand-lockup"]} aria-label={`SKYLORA ${gameTitle}`}>
          <Link href="/" className={ui["brand-name"]} aria-label="SKYLORA all games">SKYLORA</Link>
          <span className={ui["game-name"]}>{gameTitle}</span>
        </div>
        <div className={ui["header-actions"]}>
          {onToggleSound && typeof soundEnabled === "boolean" ? (
            <button
              className={ui["icon-button"]}
              type="button"
              onClick={onToggleSound}
              aria-label={soundEnabled ? "Turn sound off" : "Turn sound on"}
              title={soundEnabled ? "Sound on" : "Sound off"}
            >
              <Icon name={soundEnabled ? "sound" : "mute"}/>
            </button>
          ) : null}
          {showPause && onPause ? (
            <button className={ui["icon-button"]} type="button" onClick={onPause} aria-label="Pause game" title="Pause">
              <Icon name="pause"/>
            </button>
          ) : null}
        </div>
      </header>
      <div className={adventure ? "relative mx-auto w-full max-w-6xl px-3 py-3 sm:px-6 sm:py-8" : ui["game-stage"]}>{children}</div>
    </main>
  );
}
