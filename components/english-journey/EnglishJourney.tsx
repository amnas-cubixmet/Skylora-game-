"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { GameShell } from "../game/GameShell";
import { GuideCharacter } from "../english/Art";
import { JOURNEY_WORLDS, STARTER_MISSION } from "../../lib/english-journey/content";
import {
  freshJourneyProgress,
  loadJourneyProgress,
  saveJourneyProgress,
} from "../../lib/english-journey/storage";
import type { JourneyProgress } from "../../lib/english-journey/types";
import styles from "./EnglishJourney.module.css";

type Screen = "home" | "playing" | "complete";

export function EnglishJourney() {
  const [screen, setScreen] = useState<Screen>("home");
  const [progress, setProgress] = useState<JourneyProgress>(freshJourneyProgress);
  const [roundIndex, setRoundIndex] = useState(0);
  const [attempts, setAttempts] = useState(0);
  const [totalAttempts, setTotalAttempts] = useState(0);
  const [firstTryCorrect, setFirstTryCorrect] = useState(0);
  const [wrongId, setWrongId] = useState<string | null>(null);
  const [correctId, setCorrectId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState("");
  const [storageAvailable, setStorageAvailable] = useState(true);
  const lockedRef = useRef(false);
  const transitionRef = useRef<number | null>(null);

  const round = STARTER_MISSION[roundIndex];
  const currentWorld = JOURNEY_WORLDS.find((world) => world.id === round?.world);
  const hintStage = attempts >= 3 ? 3 : attempts >= 2 ? 2 : attempts >= 1 ? 1 : 0;

  useEffect(() => {
    setProgress(loadJourneyProgress());
    return () => {
      if (transitionRef.current) window.clearTimeout(transitionRef.current);
      if (typeof window !== "undefined" && "speechSynthesis" in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  const masteredCount = useMemo(
    () => new Set(progress.masteredRoundIds).size,
    [progress.masteredRoundIds],
  );

  function speak(text: string) {
    if (!progress.soundEnabled || typeof window === "undefined" || !("speechSynthesis" in window)) {
      return;
    }
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = "en-IN";
    utterance.rate = 0.88;
    utterance.pitch = 1.05;
    const voices = window.speechSynthesis.getVoices();
    const voice =
      voices.find((item) => item.lang.toLowerCase().startsWith("en-in")) ??
      voices.find((item) => item.lang.toLowerCase().startsWith("en-gb")) ??
      voices.find((item) => item.lang.toLowerCase().startsWith("en"));
    if (voice) utterance.voice = voice;
    window.speechSynthesis.speak(utterance);
  }

  function persist(next: JourneyProgress) {
    setProgress(next);
    setStorageAvailable(saveJourneyProgress(next));
  }

  function toggleSound() {
    const next = { ...progress, soundEnabled: !progress.soundEnabled };
    if (progress.soundEnabled && typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
    }
    persist(next);
  }

  function resetRoundState() {
    setAttempts(0);
    setWrongId(null);
    setCorrectId(null);
    setFeedback("");
    lockedRef.current = false;
  }

  function startMission() {
    if (transitionRef.current) window.clearTimeout(transitionRef.current);
    setRoundIndex(0);
    setTotalAttempts(0);
    setFirstTryCorrect(0);
    resetRoundState();
    setScreen("playing");
    window.setTimeout(() => speak(STARTER_MISSION[0].spokenPrompt), 80);
  }

  function leaveMission() {
    if (transitionRef.current) window.clearTimeout(transitionRef.current);
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
    }
    resetRoundState();
    setScreen("home");
  }

  function finishMission(correctOnFirstTry: number, attemptsMade: number) {
    const accuracy = Math.round((correctOnFirstTry / STARTER_MISSION.length) * 100);
    const mastered = STARTER_MISSION.map((item) => item.id);
    const next: JourneyProgress = {
      ...progress,
      stars: progress.stars + Math.max(1, correctOnFirstTry),
      completedMissions: progress.completedMissions + 1,
      bestAccuracy: Math.max(progress.bestAccuracy, accuracy),
      masteredRoundIds: Array.from(new Set([...progress.masteredRoundIds, ...mastered])),
    };
    persist(next);
    setTotalAttempts(attemptsMade);
    setScreen("complete");
    speak("Amazing! Mission complete.");
  }

  function choose(choiceId: string) {
    if (!round || lockedRef.current) return;
    const nextAttemptsMade = totalAttempts + 1;
    setTotalAttempts(nextAttemptsMade);

    if (choiceId !== round.correctId) {
      const nextAttempts = attempts + 1;
      setAttempts(nextAttempts);
      setWrongId(choiceId);
      setFeedback(nextAttempts >= 2 ? "Look again" : "Try again");
      speak(nextAttempts >= 2 ? round.spokenPrompt : `Try again. ${round.spokenPrompt}`);
      return;
    }

    lockedRef.current = true;
    const firstTry = attempts === 0;
    const nextFirstTryCorrect = firstTry ? firstTryCorrect + 1 : firstTryCorrect;
    setFirstTryCorrect(nextFirstTryCorrect);
    setCorrectId(choiceId);
    setWrongId(null);
    setFeedback("Great!");
    speak(round.reinforcement);

    transitionRef.current = window.setTimeout(() => {
      if (roundIndex + 1 >= STARTER_MISSION.length) {
        finishMission(nextFirstTryCorrect, nextAttemptsMade);
        return;
      }
      const nextIndex = roundIndex + 1;
      setRoundIndex(nextIndex);
      resetRoundState();
      window.setTimeout(() => speak(STARTER_MISSION[nextIndex].spokenPrompt), 120);
    }, 950);
  }

  if (screen === "playing" && round) {
    return (
      <GameShell
        gameplay
        gameTitle="English Journey"
        onBack={leaveMission}
        backLabel="Back to English Journey"
        soundEnabled={progress.soundEnabled}
        onToggleSound={toggleSound}
      >
        <section className={styles.playScreen} aria-live="polite">
          <div className={styles.progressRow} aria-label={`Round ${roundIndex + 1} of ${STARTER_MISSION.length}`}>
            {STARTER_MISSION.map((item, index) => (
              <span
                key={item.id}
                className={
                  index < roundIndex
                    ? styles.progressDone
                    : index === roundIndex
                      ? styles.progressCurrent
                      : styles.progressDot
                }
              />
            ))}
          </div>

          <div className={styles.worldPill}>
            <span aria-hidden="true">{currentWorld?.icon}</span>
            <span>{currentWorld?.shortTitle}</span>
          </div>

          <div className={styles.promptArea}>
            <button
              type="button"
              className={styles.replay}
              onClick={() => speak(round.spokenPrompt)}
              aria-label="Replay instruction"
            >
              <span aria-hidden="true">🔊</span>
            </button>
            <h1>{round.prompt}</h1>
          </div>

          <div className={styles.choiceGrid}>
            {round.choices.map((choice) => {
              const isCorrect = correctId === choice.id;
              const wasWrong = wrongId === choice.id;
              const isHinted = hintStage >= 2 && choice.id === round.correctId;
              const isDimmed = hintStage >= 3 && choice.id !== round.correctId && !wasWrong;
              const toneClass = choice.tone ? styles[`tone${choice.tone[0].toUpperCase()}${choice.tone.slice(1)}`] : "";
              return (
                <button
                  key={choice.id}
                  type="button"
                  className={[
                    styles.choice,
                    toneClass,
                    isCorrect ? styles.choiceCorrect : "",
                    wasWrong ? styles.choiceWrong : "",
                    isHinted ? styles.choiceHinted : "",
                    isDimmed ? styles.choiceDimmed : "",
                  ].filter(Boolean).join(" ")}
                  onClick={() => choose(choice.id)}
                  disabled={Boolean(correctId)}
                  aria-label={choice.label}
                >
                  <span className={styles.choiceVisual} aria-hidden="true">{choice.visual}</span>
                  <span className={styles.choiceLabel}>{choice.label}</span>
                </button>
              );
            })}
          </div>

          <div className={styles.feedback} data-success={Boolean(correctId)}>
            {feedback || " "}
          </div>
        </section>
      </GameShell>
    );
  }

  if (screen === "complete") {
    const accuracy = Math.round((firstTryCorrect / STARTER_MISSION.length) * 100);
    return (
      <GameShell adventure gameTitle="English Journey">
        <section className={styles.complete}>
          <div className={styles.starBurst} aria-hidden="true">★ ✦ ★</div>
          <GuideCharacter mood="celebrating" className={styles.completeGuide} />
          <p className={styles.eyebrow}>MISSION COMPLETE</p>
          <h1>Amazing!</h1>
          <div className={styles.completeStats}>
            <div><strong>{firstTryCorrect}</strong><span>First try</span></div>
            <div><strong>{accuracy}%</strong><span>Accuracy</span></div>
            <div><strong>{totalAttempts}</strong><span>Taps</span></div>
          </div>
          <button type="button" className={styles.primaryButton} onClick={startMission}>
            Play again
          </button>
          <button type="button" className={styles.secondaryButton} onClick={() => setScreen("home")}>
            Journey map
          </button>
        </section>
      </GameShell>
    );
  }

  return (
    <GameShell adventure gameTitle="English Journey" soundEnabled={progress.soundEnabled} onToggleSound={toggleSound}>
      <div className={styles.home}>
        <section className={styles.hero}>
          <div className={styles.heroCopy}>
            <p className={styles.eyebrow}>SKYLORA ENGLISH JOURNEY</p>
            <h1>Play your way into English.</h1>
            <div className={styles.heroActions}>
              <button type="button" className={styles.primaryButton} onClick={startMission}>
                <span aria-hidden="true">▶</span>
                Start mission
              </button>
              <Link className={styles.secondaryButton} href="/english-az-adventure">
                A–Z game
              </Link>
            </div>
            <div className={styles.miniStats}>
              <span>★ {progress.stars}</span>
              <span>{progress.completedMissions} missions</span>
              <span>{masteredCount} discoveries</span>
            </div>
          </div>
          <div className={styles.heroCharacter} aria-hidden="true">
            <div className={styles.floatChip}>Aa</div>
            <div className={styles.floatChip}>🔊</div>
            <div className={styles.floatChip}>📖</div>
            <GuideCharacter mood="happy" className={styles.guide} />
          </div>
        </section>

        <section className={styles.mapSection} aria-labelledby="journey-map-title">
          <div className={styles.sectionHead}>
            <div>
              <p className={styles.eyebrow}>YOUR ADVENTURE</p>
              <h2 id="journey-map-title">English world map</h2>
            </div>
            {progress.bestAccuracy > 0 ? <span className={styles.best}>Best {progress.bestAccuracy}%</span> : null}
          </div>

          <div className={styles.worldMap}>
            {JOURNEY_WORLDS.map((world, index) => (
              <div
                key={world.id}
                className={[
                  styles.worldNode,
                  world.unlocked ? styles.worldUnlocked : styles.worldLocked,
                  index % 2 ? styles.nodeRight : styles.nodeLeft,
                ].join(" ")}
              >
                <span className={styles.worldStep}>{String(world.id).padStart(2, "0")}</span>
                <div className={styles.worldIcon} aria-hidden="true">{world.unlocked ? world.icon : "🔒"}</div>
                <div className={styles.worldText}>
                  <strong>{world.title}</strong>
                  <span>{world.unlocked ? "Ready" : "Coming next"}</span>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className={styles.missionCard}>
          <div>
            <p className={styles.eyebrow}>STARTER MISSION</p>
            <h2>Listen → Words → Sounds → Letters → Phonics</h2>
          </div>
          <button type="button" className={styles.primaryButton} onClick={startMission}>
            Play now
          </button>
        </section>

        {!storageAvailable ? (
          <p className={styles.storageNote}>Progress saving is blocked in this browser. You can still play this visit.</p>
        ) : null}
      </div>
    </GameShell>
  );
}
