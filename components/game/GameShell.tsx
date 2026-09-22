"use client";

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
    <main className="game-shell">
      <header className="game-header">
        <div className="brand-lockup" aria-label="SKYLORA Number Hunt">
          <span className="brand-name">SKYLORA</span>
          <span className="game-name">Number Hunt</span>
        </div>
        <div className="header-actions">
          {onToggleSound && typeof soundEnabled === "boolean" ? (
            <button
              className="icon-button"
              type="button"
              onClick={onToggleSound}
              aria-label={soundEnabled ? "Turn sound off" : "Turn sound on"}
              title={soundEnabled ? "Sound on" : "Sound off"}
            >
              <span aria-hidden="true">{soundEnabled ? "🔊" : "🔇"}</span>
            </button>
          ) : null}
          {showPause && onPause ? (
            <button className="icon-button" type="button" onClick={onPause} aria-label="Pause game" title="Pause">
              <span aria-hidden="true">Ⅱ</span>
            </button>
          ) : null}
        </div>
      </header>
      <div className="game-stage">{children}</div>
    </main>
  );
}
