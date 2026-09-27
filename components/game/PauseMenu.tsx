"use client";

import { gameStyles as ui } from "./styles";


import { useState } from "react";

type PauseMenuProps = {
  soundEnabled: boolean;
  onContinue: () => void;
  onRestart: () => void;
  onToggleSound: () => void;
  onExit: () => void;
};

export function PauseMenu({ soundEnabled, onContinue, onRestart, onToggleSound, onExit }: PauseMenuProps) {
  const [confirmRestart, setConfirmRestart] = useState(false);

  return (
    <div className={ui["modal-backdrop"]} role="presentation">
      <section className={ui["pause-card"]} role="dialog" aria-modal="true" aria-labelledby="pause-title">
        {!confirmRestart ? (
          <>
            <p className={ui["eyebrow"]}>TAKE YOUR TIME</p>
            <h2 id="pause-title">Game paused</h2>
            <p>Your progress is safe. Continue whenever you are ready.</p>
            <div className={ui["menu-stack"]}>
              <button className={ui["primary-button"]} type="button" onClick={onContinue}>Continue</button>
              <button className={ui["secondary-button"]} type="button" onClick={() => setConfirmRestart(true)}>Restart Level</button>
              <button className={ui["secondary-button"]} type="button" onClick={onToggleSound}>Sound {soundEnabled ? "Off" : "On"}</button>
              <button className={ui["text-button"]} type="button" onClick={onExit}>Exit Game</button>
            </div>
          </>
        ) : (
          <>
            <p className={ui["eyebrow"]}>RESTART LEVEL?</p>
            <h2 id="pause-title">Start this level again?</h2>
            <p>The progress from this level will reset. Your earlier completed levels stay saved.</p>
            <div className={ui["menu-stack"]}>
              <button className={ui["primary-button"]} type="button" onClick={onRestart}>Yes, restart</button>
              <button className={ui["secondary-button"]} type="button" onClick={() => setConfirmRestart(false)}>Keep playing</button>
            </div>
          </>
        )}
      </section>
    </div>
  );
}
