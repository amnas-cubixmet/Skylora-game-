"use client";

import Link from "next/link";
import { useEffect, useReducer } from "react";
import { Icon } from "./Icon";
import { freshProgress, type Progress } from "../../lib/sound-match/types";
import { localProgressStore } from "../../lib/sound-match/storage";
import { soundMatchUnlocked } from "../../lib/sound-match/access";

export function GameLibrary() {
  const [saved, load] = useReducer(
    (_: { progress: Progress; unlocked: boolean }, next: { progress: Progress; unlocked: boolean }) => next,
    { progress: freshProgress(), unlocked: true },
  );

  useEffect(() => {
    load({
      progress: localProgressStore.load().progress,
      unlocked: soundMatchUnlocked(),
    });
  }, []);

  const games = [
    {
      href: "/english-az-adventure",
      icon: "Aa",
      category: "English · Game 01",
      title: "English A–Z Adventure",
      copy: "Meet every letter, explore familiar words, and play with the alphabet.",
      label: "Explore letters",
      locked: false,
      progress: "",
    },
    {
      href: "/sound-match",
      icon: "sound",
      category: "English · Game 02",
      title: "Sound Match",
      copy: "Listen, match and discover sound friends in a magical little garden.",
      label: saved.progress.session ? "Continue Sound Match" : "Play Sound Match",
      locked: !saved.unlocked,
      progress: saved.progress.completedLevels.length
        ? `${saved.progress.completedLevels.length} of 6 places explored`
        : saved.progress.session
          ? "Your listening trail is saved"
          : "Six places to discover",
    },
    {
      href: "/number-hunt",
      icon: "123",
      category: "Maths adventure",
      title: "Number Hunt",
      copy: "Listen, look and discover numbers with gentle, playful practice.",
      label: "Explore numbers",
      locked: false,
      progress: "",
    },
  ];

  return (
    <div className="familiar-game-grid">
      {games.map((game) => {
        const content = (
          <>
            <div className="familiar-game-topline">
              <span className="familiar-game-icon" aria-hidden="true">
                {game.icon === "sound" ? <Icon name="sound" /> : game.icon}
              </span>
              <span className="familiar-game-status">
                {game.locked ? "Locked" : game.progress || "Ready to play"}
              </span>
            </div>
            <p className="familiar-game-category">{game.category}</p>
            <h3>{game.title}</h3>
            <p className="familiar-game-copy">{game.copy}</p>
            <span className="familiar-game-action">
              {game.locked ? "Explore Game 01 first" : `${game.label} →`}
            </span>
          </>
        );

        const className = `familiar-game-card${game.locked ? " is-locked" : ""}`;
        return game.locked ? (
          <div
            key={game.href}
            aria-label="Sound Match, locked until alphabet book completion"
            className={className}
          >
            {content}
          </div>
        ) : (
          <Link key={game.href} href={game.href} className={className}>
            {content}
          </Link>
        );
      })}
    </div>
  );
}
