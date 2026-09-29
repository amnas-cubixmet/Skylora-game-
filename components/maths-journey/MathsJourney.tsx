"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { GuideCharacter } from "../english/Art";
import { GameShell } from "../game/GameShell";
import { MATHS_WORLDS, STARTER_MATHS_MISSION } from "../../lib/maths-journey/content";
import {
  freshMathsProgress,
  loadMathsProgress,
  saveMathsProgress,
} from "../../lib/maths-journey/storage";
import type { MathsChoice, MathsProgress, MathsRound } from "../../lib/maths-journey/types";
import styles from "./MathsJourney.module.css";

type Screen = "home" | "playing" | "complete";

function Dots({ count, compact = false }: { count: number; compact?: boolean }) {
  return (
    <span className={compact ? styles.compactDots : styles.dots} aria-hidden="true">
      {Array.from({ length: count }, (_, index) => (
        <span key={index} />
      ))}
    </span>
  );
}

function RoundVisual({ round }: { round: MathsRound }) {
  if (round.visualType === "objects") {
    return (
      <div className={styles.mainVisual} aria-label={`${round.visualValue} objects`}>
        <Dots count={Number(round.visualValue)} />
      </div>
    );
  }

  if (round.visualType === "compare") {
    const values = Array.isArray(round.visualValue) ? round.visualValue : [2, 5];
    return (
      <div className={styles.compareVisual} aria-hidden="true">
        <div><Dots count={values[0] ?? 2} compact /></div>
        <span>↔</span>
        <div><Dots count={values[1] ?? 5} compact /></div>
      </div>
    );
  }

  if (round.visualType === "number-line") {
    const values = Array.isArray(round.visualValue) ? round.visualValue : [1, 2, 3, 4, 5];
    return (
      <div className={styles.numberLine} aria-hidden="true">
        <span className={styles.line} />
        {values.map((value) => (
          <span className={styles.numberTick} key={value}>
            <i />
            <b>{value}</b>
          </span>
        ))}
      </div>
    );
  }

  if (round.visualType === "sequence") {
    const values = Array.isArray(round.visualValue) ? round.visualValue : [2, 0, 4];
    return (
      <div className={styles.sequenceVisual} aria-hidden="true">
        {values.map((value, index) => (
          <span key={`${value}-${index}`} className={value === 0 ? styles.missing : ""}>
            {value === 0 ? "?" : value}
          </span>
        ))}
      </div>
    );
  }

  if (round.visualType === "equation" || round.visualType === "money") {
    return <div className={styles.equationVisual}>{String(round.visualValue ?? "")}</div>;
  }

  return <div className={styles.equationVisual}>{String(round.visualValue ?? "")}</div>;
}

function ChoiceContent({ choice, round }: { choice: MathsChoice; round: MathsRound }) {
  if (round.visualType === "compare" && choice.count) {
    return (
      <>
        <Dots count={choice.count} compact />
        <span className={styles.choiceValue}>{choice.value}</span>
      </>
    );
  }

  return <span className={styles.choiceValue}>{choice.value}</span>;
}

export function MathsJourney() {
  const [screen, setScreen] = useState<Screen>("home");
  const [progress, setProgress] = useState<MathsProgress>(freshMathsProgress);
  const [roundIndex, setRoundIndex] = useState(0);
  const [attempts, setAttempts] = useState(0);
  const [totalAttempts, setTotalAttempts] = useState(0);
  const [firstTryCorrect, setFirstTryCorrect] = useState(0);
  const [firstTryIds, setFirstTryIds] = useState<string[]>([]);
  const [wrongId, setWrongId] = useState<string | null>(null);
  const [correctId, setCorrectId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState("");
  const [storageAvailable, setStorageAvailable] = useState(true);
  const answerLocked = useRef(false);
  const transitionRef = useRef<number | null>(null);

  const round = STARTER_MATHS_MISSION[roundIndex];
  const currentWorld = MATHS_WORLDS.find((world) => world.id === round?.world);
  const hintStage = attempts >= 3 ? 3 : attempts >= 2 ? 2 : attempts >= 1 ? 1 : 0;

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      setProgress(loadMathsProgress());
    });
    return () => {
      window.cancelAnimationFrame(frame);
      if (transitionRef.current !== null) window.clearTimeout(transitionRef.current);
      if ("speechSynthesis" in window) window.speechSynthesis.cancel();
    };
  }, []);

  const practised = useMemo(
    () => new Set(progress.masteredRoundIds).size,
    [progress.masteredRoundIds],
  );

  function speak(text: string) {
    if (!progress.soundEnabled || typeof window === "undefined" || !("speechSynthesis" in window)) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = "en-IN";
    utterance.rate = 0.86;
    utterance.pitch = 1.02;
    const voices = window.speechSynthesis.getVoices();
    utterance.voice =
      voices.find((voice) => voice.lang.toLowerCase().startsWith("en-in")) ??
      voices.find((voice) => voice.lang.toLowerCase().startsWith("en-gb")) ??
      voices.find((voice) => voice.lang.toLowerCase().startsWith("en")) ??
      null;
    window.speechSynthesis.speak(utterance);
  }

  function persist(next: MathsProgress) {
    setProgress(next);
    setStorageAvailable(saveMathsProgress(next));
  }

  function toggleSound() {
    if (progress.soundEnabled && typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
    }
    persist({ ...progress, soundEnabled: !progress.soundEnabled });
  }

  function resetRound() {
    setAttempts(0);
    setWrongId(null);
    setCorrectId(null);
    setFeedback("");
    answerLocked.current = false;
  }

  function startMission() {
    if (transitionRef.current !== null) window.clearTimeout(transitionRef.current);
    setRoundIndex(0);
    setTotalAttempts(0);
    setFirstTryCorrect(0);
    setFirstTryIds([]);
    resetRound();
    setScreen("playing");
    window.setTimeout(() => speak(STARTER_MATHS_MISSION[0].spokenPrompt), 100);
  }

  function leaveMission() {
    if (transitionRef.current !== null) window.clearTimeout(transitionRef.current);
    if (typeof window !== "undefined" && "speechSynthesis" in window) window.speechSynthesis.cancel();
    resetRound();
    setScreen("home");
  }

  function finishMission(
    nextFirstTryCorrect: number,
    attemptsMade: number,
    nextFirstTryIds: string[],
  ) {
    const accuracy = Math.round((nextFirstTryCorrect / STARTER_MATHS_MISSION.length) * 100);
    const next: MathsProgress = {
      ...progress,
      stars: progress.stars + Math.max(1, Math.ceil(nextFirstTryCorrect / 2)),
      completedMissions: progress.completedMissions + 1,
      bestAccuracy: Math.max(progress.bestAccuracy, accuracy),
      masteredRoundIds: Array.from(new Set([...progress.masteredRoundIds, ...nextFirstTryIds])),
    };
    persist(next);
    setTotalAttempts(attemptsMade);
    setScreen("complete");
    speak("Amazing maths! Mission complete.");
  }

  function choose(choiceId: string) {
    if (!round || answerLocked.current) return;

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

    answerLocked.current = true;
    const firstTry = attempts === 0;
    const nextFirstTryCorrect = firstTry ? firstTryCorrect + 1 : firstTryCorrect;
    const nextFirstTryIds = firstTry ? [...firstTryIds, round.id] : firstTryIds;

    setFirstTryCorrect(nextFirstTryCorrect);
    setFirstTryIds(nextFirstTryIds);
    setCorrectId(choiceId);
    setWrongId(null);
    setFeedback("Great!");
    speak(round.reinforcement);

    transitionRef.current = window.setTimeout(() => {
      if (roundIndex + 1 >= STARTER_MATHS_MISSION.length) {
        finishMission(nextFirstTryCorrect, nextAttemptsMade, nextFirstTryIds);
        return;
      }

      const nextIndex = roundIndex + 1;
      setRoundIndex(nextIndex);
      resetRound();
      window.setTimeout(() => speak(STARTER_MATHS_MISSION[nextIndex].spokenPrompt), 120);
    }, 950);
  }

  if (screen === "playing" && round) {
    return (
      <GameShell
        gameplay
        gameTitle="Maths Journey"
        onBack={leaveMission}
        backLabel="Back to Maths Journey"
        soundEnabled={progress.soundEnabled}
        onToggleSound={toggleSound}
      >
        <section className={styles.playScreen}>
          <div
            className={styles.progressRow}
            aria-label={`Round ${roundIndex + 1} of ${STARTER_MATHS_MISSION.length}`}
          >
            {STARTER_MATHS_MISSION.map((item, index) => (
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

          <RoundVisual round={round} />

          <div className={`${styles.choiceGrid} ${round.choices.length === 2 ? styles.twoChoices : ""}`}>
            {round.choices.map((choice) => {
              const isCorrect = correctId === choice.id;
              const wasWrong = wrongId === choice.id;
              const isHinted = hintStage >= 2 && choice.id === round.correctId;
              const isDimmed = hintStage >= 3 && choice.id !== round.correctId && !wasWrong;
              return (
                <button
                  key={choice.id}
                  type="button"
                  className={[
                    styles.choice,
                    isCorrect ? styles.choiceCorrect : "",
                    wasWrong ? styles.choiceWrong : "",
                    isHinted ? styles.choiceHinted : "",
                    isDimmed ? styles.choiceDimmed : "",
                  ].filter(Boolean).join(" ")}
                  onClick={() => choose(choice.id)}
                  disabled={Boolean(correctId)}
                  aria-label={choice.label}
                >
                  <ChoiceContent choice={choice} round={round} />
                </button>
              );
            })}
          </div>

          <div className={styles.feedback} data-success={Boolean(correctId)} aria-live="polite">
            {feedback || " "}
          </div>
        </section>
      </GameShell>
    );
  }

  if (screen === "complete") {
    const accuracy = Math.round((firstTryCorrect / STARTER_MATHS_MISSION.length) * 100);
    return (
      <GameShell adventure gameTitle="Maths Journey">
        <section className={styles.complete}>
          <div className={styles.starBurst} aria-hidden="true">★ ✦ ★</div>
          <GuideCharacter mood="celebrating" className={styles.completeGuide} />
          <p className={styles.eyebrow}>MISSION COMPLETE</p>
          <h1>Maths star!</h1>
          <div className={styles.completeStats}>
            <div><strong>{firstTryCorrect}</strong><span>First try</span></div>
            <div><strong>{accuracy}%</strong><span>Accuracy</span></div>
            <div><strong>{totalAttempts}</strong><span>Taps</span></div>
          </div>
          <button className={styles.primaryButton} type="button" onClick={startMission}>
            Play again
          </button>
          <button className={styles.secondaryButton} type="button" onClick={() => setScreen("home")}>
            Journey map
          </button>
        </section>
      </GameShell>
    );
  }

  return (
    <GameShell
      adventure
      gameTitle="Maths Journey"
      soundEnabled={progress.soundEnabled}
      onToggleSound={toggleSound}
    >
      <div className={styles.home}>
        <section className={styles.hero}>
          <div className={styles.heroCopy}>
            <p className={styles.eyebrow}>SKYLORA MATHS JOURNEY</p>
            <h1>Touch. Count. Build. Think.</h1>
            <div className={styles.heroActions}>
              <button type="button" className={styles.primaryButton} onClick={startMission}>
                <span aria-hidden="true">▶</span>
                Start mission
              </button>
              <Link className={styles.secondaryButton} href="/number-hunt">
                Number Hunt
              </Link>
            </div>
            <div className={styles.miniStats}>
              <span>★ {progress.stars}</span>
              <span>{progress.completedMissions} missions</span>
              <span>{practised} independent skills</span>
            </div>
          </div>

          <div className={styles.heroBoard} aria-hidden="true">
            <div className={styles.numberBubble}>1</div>
            <div className={styles.numberBubble}>2</div>
            <div className={styles.numberBubble}>3</div>
            <GuideCharacter mood="happy" className={styles.guide} />
            <div className={styles.counterTray}><Dots count={5} compact /></div>
          </div>
        </section>

        <section className={styles.mapSection} aria-labelledby="maths-map-title">
          <div className={styles.sectionHead}>
            <div>
              <p className={styles.eyebrow}>YOUR MATHS ADVENTURE</p>
              <h2 id="maths-map-title">Maths world map</h2>
            </div>
            {progress.bestAccuracy > 0 ? (
              <span className={styles.best}>Best {progress.bestAccuracy}%</span>
            ) : null}
          </div>

          <div className={styles.worldMap}>
            {MATHS_WORLDS.map((world, index) => (
              <div
                key={world.id}
                className={[
                  styles.worldNode,
                  world.unlocked ? styles.worldUnlocked : styles.worldLocked,
                  index % 2 ? styles.nodeRight : styles.nodeLeft,
                ].join(" ")}
              >
                <span className={styles.worldStep}>{String(world.id).padStart(2, "0")}</span>
                <div className={styles.worldIcon} aria-hidden="true">
                  {world.unlocked ? world.icon : "🔒"}
                </div>
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
            <h2>Quantity → Count → Compare → Build → Add → Take away</h2>
          </div>
          <button type="button" className={styles.primaryButton} onClick={startMission}>
            Play now
          </button>
        </section>

        {!storageAvailable ? (
          <p className={styles.storageNote}>
            Progress saving is blocked in this browser. You can still play this visit.
          </p>
        ) : null}
      </div>
    </GameShell>
  );
}
