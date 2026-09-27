"use client";

import { gameStyles as ui } from "./styles";


import type { ReactNode } from "react";

type GameShellProps = {
  children: ReactNode;
  onPause?: () => void;
  showPause?: boolean;
  soundEnabled?: boolean;
  onToggleSound?: () => void;
};

export function GameShell({ children, onPause, showPause = false, soundEnabled, onToggleSound }: GameShellProps) {
  return (
    <main className={ui["game-shell"]}>
      <header className={ui["game-header"]}>
        <div className={ui["brand-lockup"]} aria-label="SKYLORA Number Hunt">
          <span className={ui["brand-name"]}>SKYLORA</span>
          <span className={ui["game-name"]}>Number Hunt</span>
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
              <span aria-hidden="true">{soundEnabled ? "🔊" : "🔇"}</span>
            </button>
          ) : null}
          {showPause && onPause ? (
            <button className={ui["icon-button"]} type="button" onClick={onPause} aria-label="Pause game" title="Pause">
              <span aria-hidden="true">Ⅱ</span>
            </button>
          ) : null}
        </div>
      </header>
      <div className={ui["game-stage"]}>{children}</div>
    </main>
  );
}
