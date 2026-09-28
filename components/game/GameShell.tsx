"use client";

import Link from "next/link";
import { useEffect, type ReactNode } from "react";
import { Icon } from "./Icon";
import { gameStyles as ui } from "./styles";

type GameShellProps = {
  children: ReactNode;
  gameTitle?: string;
  adventure?: boolean;
  gameplay?: boolean;
  inert?: boolean;
  onBack?: () => void;
  backHref?: string;
  backLabel?: string;
  onPause?: () => void;
  showPause?: boolean;
  soundEnabled?: boolean;
  onToggleSound?: () => void;
};

export function GameShell({
  children,
  onPause,
  showPause = false,
  soundEnabled,
  onToggleSound,
  gameTitle = "Number Hunt",
  adventure = false,
  gameplay = false,
  inert = false,
  onBack,
  backHref,
  backLabel = "Back",
}: GameShellProps) {
  useEffect(() => {
    if (!gameplay) return;
    const className = "skylora-gameplay-active";
    document.documentElement.classList.add(className);
    document.body.classList.add(className);
    return () => {
      document.documentElement.classList.remove(className);
      document.body.classList.remove(className);
    };
  }, [gameplay]);

  const shellClass = gameplay
    ? "skylora-gameplay-shell"
    : adventure
      ? "relative min-h-screen min-h-svh min-h-dvh overflow-x-clip bg-[#faf8f2] text-ink"
      : ui["game-shell"];
  const stageClass = gameplay
    ? "skylora-gameplay-stage"
    : adventure
      ? "relative mx-auto w-full max-w-6xl px-3 py-3 sm:px-6 sm:py-8"
      : ui["game-stage"];
  const controlClass = gameplay ? "skylora-gameplay-control" : ui["icon-button"];

  return (
    <main
      inert={inert}
      style={
        gameplay
          ? undefined
          : {
              paddingTop: "env(safe-area-inset-top)",
              paddingLeft: "env(safe-area-inset-left)",
              paddingRight: "env(safe-area-inset-right)",
            }
      }
      className={shellClass}
    >
      <header className={gameplay ? "skylora-gameplay-topbar" : ui["game-header"]}>
        {gameplay ? (
          <div className="skylora-gameplay-back">
            {onBack ? (
              <button className={controlClass} type="button" onClick={onBack} aria-label={backLabel} title={backLabel}>
                <Icon name="back" />
              </button>
            ) : (
              <Link href={backHref ?? "/"} className={controlClass} aria-label={backLabel} title={backLabel}>
                <Icon name="back" />
              </Link>
            )}
            <span className="sr-only">{gameTitle}</span>
          </div>
        ) : (
          <div className={ui["brand-lockup"]} aria-label={`SKYLORA ${gameTitle}`}>
            <Link href="/" className={ui["brand-name"]} aria-label="SKYLORA all games">
              SKYLORA
            </Link>
            <span className={ui["game-name"]}>{gameTitle}</span>
          </div>
        )}

        <div className={gameplay ? "skylora-gameplay-actions" : ui["header-actions"]}>
          {onToggleSound && typeof soundEnabled === "boolean" ? (
            <button
              className={controlClass}
              type="button"
              onClick={onToggleSound}
              aria-label={soundEnabled ? "Turn sound off" : "Turn sound on"}
              title={soundEnabled ? "Sound on" : "Sound off"}
            >
              <Icon name={soundEnabled ? "sound" : "mute"} />
            </button>
          ) : null}
          {showPause && onPause ? (
            <button className={controlClass} type="button" onClick={onPause} aria-label="Pause game" title="Pause">
              <Icon name="pause" />
            </button>
          ) : null}
        </div>
      </header>
      <div className={stageClass}>{children}</div>
    </main>
  );
}
