"use client";

import { useEffect, useMemo, useReducer, useRef, useState } from "react";
import { CompletionScreen } from "../game/CompletionScreen";
import { GameShell } from "../game/GameShell";
import { PauseMenu } from "../game/PauseMenu";
import { ProgressDots } from "../game/ProgressDots";
import { cancelAudio, speakRetry, speakSuccess, speakTarget } from "../../lib/number-hunt/audio";
import { emitGameEvent } from "../../lib/number-hunt/analytics";
import { DEFAULT_PROGRESS, LEVELS, getLevelConfig } from "../../lib/number-hunt/config";
import { generateQuestion, pairKey } from "../../lib/number-hunt/question-generator";
import { loadProgress, saveProgress } from "../../lib/number-hunt/storage";
import type {
  GameStatus,
  LevelSessionStats,
  Question,
  SavedProgress,
} from "../../lib/number-hunt/types";
import { NumberCard } from "./NumberCard";

type GameState = {
  status: GameStatus;
  pausedFrom: GameStatus;
  level: number;
  round: number;
  question: Question | null;
  attemptsForQuestion: number;
  lastWrong: number | null;
  sessionStats: LevelSessionStats;
  errorMessage: string;
};

type Action =
  | { type: "READY" }
  | { type: "START"; level: number; round: number; question: Question; stats: LevelSessionStats }
  | { type: "WRONG"; selected: number; hintUsed: boolean }
  | { type: "CORRECT"; stats: LevelSessionStats }
  | { type: "NEXT"; round: number; question: Question }
  | { type: "LEVEL_COMPLETE" }
  | { type: "GAME_COMPLETE" }
  | { type: "PAUSE" }
  | { type: "RESUME" }
  | { type: "HOME" }
  | { type: "ERROR"; message: string };

const EMPTY_STATS: LevelSessionStats = {
  stars: 0,
  firstTryCorrect: 0,
  attempts: 0,
  hintsUsed: 0,
  responseTimeMs: 0,
};

const INITIAL_STATE: GameState = {
  status: "LOADING",
  pausedFrom: "PLAYING",
  level: 1,
  round: 0,
  question: null,
  attemptsForQuestion: 0,
  lastWrong: null,
  sessionStats: EMPTY_STATS,
  errorMessage: "",
};

function reducer(state: GameState, action: Action): GameState {
  switch (action.type) {
    case "READY":
      return { ...state, status: "READY", question: null, errorMessage: "" };
    case "START":
      return {
        ...state,
        status: "PLAYING",
        pausedFrom: "PLAYING",
        level: action.level,
        round: action.round,
        question: action.question,
        attemptsForQuestion: 0,
        lastWrong: null,
        sessionStats: action.stats,
        errorMessage: "",
      };
    case "WRONG": {
      const attemptsForQuestion = state.attemptsForQuestion + 1;
      return {
        ...state,
        status: attemptsForQuestion >= 2 ? "HINT" : "TRY_AGAIN",
        attemptsForQuestion,
        lastWrong: action.selected,
        sessionStats: {
          ...state.sessionStats,
          attempts: state.sessionStats.attempts + 1,
          hintsUsed: state.sessionStats.hintsUsed + (action.hintUsed ? 1 : 0),
        },
      };
    }
    case "CORRECT":
      return {
        ...state,
        status: "CORRECT",
        lastWrong: null,
        sessionStats: action.stats,
      };
    case "NEXT":
      return {
        ...state,
        status: "PLAYING",
        round: action.round,
        question: action.question,
        attemptsForQuestion: 0,
        lastWrong: null,
      };
    case "LEVEL_COMPLETE":
      return { ...state, status: "LEVEL_COMPLETE", question: null };
    case "GAME_COMPLETE":
      return { ...state, status: "GAME_COMPLETE", question: null };
    case "PAUSE":
      return { ...state, pausedFrom: state.status, status: "PAUSED" };
    case "RESUME":
      return { ...state, status: state.pausedFrom === "PAUSED" ? "PLAYING" : state.pausedFrom };
    case "HOME":
      return { ...INITIAL_STATE, status: "READY", level: state.level };
    case "ERROR":
      return { ...state, status: "ERROR", errorMessage: action.message };
    default:
      return state;
  }
}

function statsFromActive(progress: SavedProgress, level: number): LevelSessionStats {
  const active = progress.activeLevel;
  if (!active || active.level !== level) return { ...EMPTY_STATS };
  return {
    stars: active.stars,
    firstTryCorrect: active.firstTryCorrect,
    attempts: active.attempts,
    hintsUsed: active.hintsUsed,
    responseTimeMs: active.responseTimeMs,
  };
}

function recentProgressLabel(progress: SavedProgress): "Improving" | "Stable" | "Needs Practice" {
  const records = Object.entries(progress.levelRecords)
    .map(([level, record]) => ({ level: Number(level), accuracy: record.accuracy }))
    .sort((a, b) => a.level - b.level);
  if (records.length < 2) return "Stable";
  const previous = records[records.length - 2].accuracy;
  const latest = records[records.length - 1].accuracy;
  if (latest - previous >= 5) return "Improving";
  if (previous - latest >= 8) return "Needs Practice";
  return "Stable";
}

export function NumberHuntGame() {
  const [state, dispatch] = useReducer(reducer, INITIAL_STATE);
  const [progress, setProgress] = useState<SavedProgress>(DEFAULT_PROGRESS);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [storageAvailable, setStorageAvailable] = useState(true);
  const progressRef = useRef<SavedProgress>(DEFAULT_PROGRESS);
  const questionStartedAtRef = useRef(0);
  const transitionTimerRef = useRef<number | null>(null);
  const speechTimerRef = useRef<number | null>(null);

  const commitProgress = (next: SavedProgress) => {
    progressRef.current = next;
    setProgress(next);
    const saved = saveProgress(next);
    if (!saved) setStorageAvailable(false);
  };

  const updateProgress = (updater: (current: SavedProgress) => SavedProgress): SavedProgress => {
    const next = updater(progressRef.current);
    commitProgress(next);
    return next;
  };

  const clearTimers = () => {
    if (transitionTimerRef.current !== null) window.clearTimeout(transitionTimerRef.current);
    if (speechTimerRef.current !== null) window.clearTimeout(speechTimerRef.current);
    transitionTimerRef.current = null;
    speechTimerRef.current = null;
  };

  const announceTarget = (target: number) => {
    if (!soundEnabled) return;
    if (speechTimerRef.current !== null) window.clearTimeout(speechTimerRef.current);
    speechTimerRef.current = window.setTimeout(() => speakTarget(target, true), 260);
  };

  useEffect(() => {
    const initTimer = window.setTimeout(() => {
      const loaded = loadProgress();
      progressRef.current = loaded.progress;
      setProgress(loaded.progress);
      setStorageAvailable(loaded.available);
      dispatch({ type: "READY" });
    }, 0);

    return () => {
      window.clearTimeout(initTimer);
      if (transitionTimerRef.current !== null) window.clearTimeout(transitionTimerRef.current);
      if (speechTimerRef.current !== null) window.clearTimeout(speechTimerRef.current);
      cancelAudio();
    };
  }, []);

  useEffect(() => {
    const handleVisibility = () => {
      if (!document.hidden) return;
      if (["PLAYING", "TRY_AGAIN", "HINT"].includes(state.status)) {
        cancelAudio();
        dispatch({ type: "PAUSE" });
      }
    };
    document.addEventListener("visibilitychange", handleVisibility);
    return () => document.removeEventListener("visibilitychange", handleVisibility);
  }, [state.status]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      if (state.status === "PAUSED") dispatch({ type: "RESUME" });
      else if (["PLAYING", "TRY_AGAIN", "HINT"].includes(state.status)) dispatch({ type: "PAUSE" });
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [state.status]);

  const startLevel = (level: number, forceRestart = false) => {
    try {
      clearTimers();
      cancelAudio();
      const config = getLevelConfig(level);
      const current = progressRef.current;
      const resumable = !forceRestart && current.activeLevel?.level === level ? current.activeLevel : null;
      const completedRounds = resumable?.completedRounds ?? 0;
      const safeRound = completedRounds >= config.rounds ? 0 : completedRounds;
      const previousTarget = resumable?.previousTarget ?? null;
      const question = generateQuestion(config, previousTarget, current.confusedPairs);
      const stats = resumable ? statsFromActive(current, level) : { ...EMPTY_STATS };

      if (!resumable) {
        updateProgress((saved) => ({
          ...saved,
          currentLevel: level,
          activeLevel: {
            level,
            completedRounds: 0,
            stars: 0,
            firstTryCorrect: 0,
            attempts: 0,
            hintsUsed: 0,
            responseTimeMs: 0,
            previousTarget: null,
          },
        }));
      }

      dispatch({ type: "START", level, round: safeRound, question, stats });
      questionStartedAtRef.current = performance.now();
      emitGameEvent("game_started", { level, resumed: Boolean(resumable) });
      emitGameEvent("level_started", { level, resumed: Boolean(resumable) });
      emitGameEvent("question_shown", { level, round: safeRound + 1, target: question.target });
      announceTarget(question.target);
    } catch (error) {
      dispatch({ type: "ERROR", message: error instanceof Error ? error.message : "Unable to start the game." });
    }
  };

  const finishLevel = (level: number, stats: LevelSessionStats) => {
    const config = getLevelConfig(level);
    const accuracy = Math.round((stats.firstTryCorrect / config.rounds) * 100);
    const averageResponseMs = config.rounds > 0 ? Math.round(stats.responseTimeMs / config.rounds) : 0;
    updateProgress((saved) => ({
      ...saved,
      currentLevel: level < 10 ? level + 1 : 10,
      highestUnlockedLevel: Math.max(saved.highestUnlockedLevel, Math.min(10, level + 1)),
      levelRecords: {
        ...saved.levelRecords,
        [String(level)]: {
          stars: stats.stars,
          questions: config.rounds,
          accuracy,
          attempts: stats.attempts,
          hintsUsed: stats.hintsUsed,
          averageResponseMs,
        },
      },
      activeLevel: null,
    }));
    emitGameEvent("level_completed", { level, accuracy, attempts: stats.attempts, hintsUsed: stats.hintsUsed });
    dispatch({ type: level === 10 ? "GAME_COMPLETE" : "LEVEL_COMPLETE" });
  };

  const handleAnswer = (value: number) => {
    if (!state.question) return;
    if (!["PLAYING", "TRY_AGAIN", "HINT"].includes(state.status)) return;

    const target = state.question.target;
    emitGameEvent("answer_selected", {
      level: state.level,
      round: state.round + 1,
      target,
      selected: value,
      attempt: state.attemptsForQuestion + 1,
    });

    if (value !== target) {
      const nextWrongAttempt = state.attemptsForQuestion + 1;
      const hintUsed = nextWrongAttempt === 2;
      const key = pairKey(target, value);

      updateProgress((saved) => ({
        ...saved,
        attempts: saved.attempts + 1,
        hintsUsed: saved.hintsUsed + (hintUsed ? 1 : 0),
        confusedPairs: {
          ...saved.confusedPairs,
          [key]: (saved.confusedPairs[key] ?? 0) + 1,
        },
        activeLevel:
          saved.activeLevel?.level === state.level
            ? {
                ...saved.activeLevel,
                attempts: saved.activeLevel.attempts + 1,
                hintsUsed: saved.activeLevel.hintsUsed + (hintUsed ? 1 : 0),
              }
            : saved.activeLevel,
      }));

      dispatch({ type: "WRONG", selected: value, hintUsed });
      cancelAudio();
      speakRetry(soundEnabled);
      emitGameEvent("answer_retry", { level: state.level, target, selected: value, attempt: nextWrongAttempt });
      if (hintUsed) emitGameEvent("hint_used", { level: state.level, target, round: state.round + 1 });
      return;
    }

    const responseTimeMs = Math.max(0, Math.round(performance.now() - questionStartedAtRef.current));
    const firstTry = state.attemptsForQuestion === 0;
    const completedStats: LevelSessionStats = {
      stars: state.sessionStats.stars + 1,
      firstTryCorrect: state.sessionStats.firstTryCorrect + (firstTry ? 1 : 0),
      attempts: state.sessionStats.attempts + 1,
      hintsUsed: state.sessionStats.hintsUsed,
      responseTimeMs: state.sessionStats.responseTimeMs + responseTimeMs,
    };

    updateProgress((saved) => ({
      ...saved,
      stars: saved.stars + 1,
      totalQuestions: saved.totalQuestions + 1,
      correctAnswers: saved.correctAnswers + (firstTry ? 1 : 0),
      attempts: saved.attempts + 1,
      totalResponseTimeMs: saved.totalResponseTimeMs + responseTimeMs,
      activeLevel:
        saved.activeLevel?.level === state.level
          ? {
              ...saved.activeLevel,
              completedRounds: saved.activeLevel.completedRounds + 1,
              stars: saved.activeLevel.stars + 1,
              firstTryCorrect: saved.activeLevel.firstTryCorrect + (firstTry ? 1 : 0),
              attempts: saved.activeLevel.attempts + 1,
              responseTimeMs: saved.activeLevel.responseTimeMs + responseTimeMs,
              previousTarget: target,
            }
          : saved.activeLevel,
    }));

    dispatch({ type: "CORRECT", stats: completedStats });
    cancelAudio();
    speakSuccess(target, soundEnabled);
    emitGameEvent("answer_correct", { level: state.level, target, round: state.round + 1, firstTry, responseTimeMs });
    emitGameEvent("question_completed", {
      level: state.level,
      round: state.round + 1,
      target,
      attempts: state.attemptsForQuestion + 1,
      responseTimeMs,
    });

    transitionTimerRef.current = window.setTimeout(() => {
      const config = getLevelConfig(state.level);
      if (state.round + 1 >= config.rounds) {
        finishLevel(state.level, completedStats);
        return;
      }

      try {
        const nextQuestion = generateQuestion(config, target, progressRef.current.confusedPairs);
        const nextRound = state.round + 1;
        dispatch({ type: "NEXT", round: nextRound, question: nextQuestion });
        questionStartedAtRef.current = performance.now();
        emitGameEvent("question_shown", { level: state.level, round: nextRound + 1, target: nextQuestion.target });
        announceTarget(nextQuestion.target);
      } catch (error) {
        dispatch({ type: "ERROR", message: error instanceof Error ? error.message : "Unable to prepare the next question." });
      }
    }, 1300);
  };

  const toggleSound = () => {
    setSoundEnabled((enabled) => {
      if (enabled) cancelAudio();
      return !enabled;
    });
  };

  const pauseGame = () => {
    clearTimers();
    cancelAudio();
    dispatch({ type: "PAUSE" });
  };

  const resumeGame = () => {
    dispatch({ type: "RESUME" });
    if (state.question && soundEnabled) announceTarget(state.question.target);
  };

  const restartLevel = () => {
    const level = state.level;
    const current = progressRef.current;
    const active = current.activeLevel?.level === level ? current.activeLevel : null;
    if (active) {
      commitProgress({
        ...current,
        stars: Math.max(0, current.stars - active.stars),
        totalQuestions: Math.max(0, current.totalQuestions - active.completedRounds),
        correctAnswers: Math.max(0, current.correctAnswers - active.firstTryCorrect),
        attempts: Math.max(0, current.attempts - active.attempts),
        hintsUsed: Math.max(0, current.hintsUsed - active.hintsUsed),
        totalResponseTimeMs: Math.max(0, current.totalResponseTimeMs - active.responseTimeMs),
        currentLevel: level,
        activeLevel: null,
      });
    }
    startLevel(level, true);
  };

  const exitGame = () => {
    clearTimers();
    cancelAudio();
    emitGameEvent("game_exited", { level: state.level, round: state.round + 1 });
    dispatch({ type: "HOME" });
  };

  const globalAccuracy = progress.totalQuestions > 0 ? Math.round((progress.correctAnswers / progress.totalQuestions) * 100) : 0;
  const averageAttempts = progress.totalQuestions > 0 ? (progress.attempts / progress.totalQuestions).toFixed(1) : "0.0";
  const topConfusions = useMemo(
    () =>
      Object.entries(progress.confusedPairs)
        .filter(([, count]) => count > 0)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 3)
        .map(([key]) => key.replace(":", " ↔ ")),
    [progress.confusedPairs],
  );
  const recentProgress = recentProgressLabel(progress);

  if (state.status === "LOADING") {
    return (
      <GameShell>
        <section className="center-state" aria-live="polite">
          <div className="loading-bubbles" aria-hidden="true"><span /><span /><span /></div>
          <p>Getting Number Hunt ready…</p>
        </section>
      </GameShell>
    );
  }

  if (state.status === "ERROR") {
    return (
      <GameShell soundEnabled={soundEnabled} onToggleSound={toggleSound}>
        <section className="center-state error-card" role="alert">
          <p className="eyebrow">SOMETHING WENT WRONG</p>
          <h1>Number Hunt needs a fresh start.</h1>
          <p>{state.errorMessage}</p>
          <button className="primary-button" type="button" onClick={() => dispatch({ type: "READY" })}>Back to Home</button>
        </section>
      </GameShell>
    );
  }

  if (state.status === "READY") {
    const resume = progress.activeLevel;
    return (
      <GameShell soundEnabled={soundEnabled} onToggleSound={toggleSound}>
        <section className="home-grid">
          <div className="hero-card">
            <p className="eyebrow">SKYLORA • GAME 01</p>
            <h1>Number Hunt</h1>
            <p className="hero-copy">Listen, look, and find the number. There is no timer, no lives, and no penalty for trying again.</p>
            <div className="sample-numbers" aria-hidden="true"><span>2</span><span>7</span><span>4</span><span>9</span></div>
            {resume ? (
              <button className="primary-button large-button" type="button" onClick={() => startLevel(resume.level)}>
                Resume Level {resume.level} • Question {Math.min(resume.completedRounds + 1, 10)}
              </button>
            ) : (
              <button className="primary-button large-button" type="button" onClick={() => startLevel(progress.currentLevel)}>
                Start Level {progress.currentLevel}
              </button>
            )}
            <p className="support-note">Learning-support activity only. Gameplay does not diagnose a learning condition.</p>
          </div>

          <aside className="progress-panel" aria-label="Number Hunt progress">
            <div className="panel-heading">
              <div><p className="eyebrow">YOUR JOURNEY</p><h2>Choose a level</h2></div>
              <div className="star-total" aria-label={`${progress.stars} stars earned`}>★ {progress.stars}</div>
            </div>
            <div className="level-grid">
              {LEVELS.map((level) => {
                const unlocked = level.level <= progress.highestUnlockedLevel;
                const completed = Boolean(progress.levelRecords[String(level.level)]);
                return (
                  <button
                    key={level.level}
                    type="button"
                    className={`level-button ${completed ? "is-complete" : ""}`}
                    disabled={!unlocked}
                    onClick={() => startLevel(level.level)}
                    aria-label={`Level ${level.level}${unlocked ? "" : ", locked"}`}
                  >
                    <strong>{level.level}</strong>
                    <span>{completed ? "Done" : unlocked ? `${level.min}–${level.max}` : "Locked"}</span>
                  </button>
                );
              })}
            </div>

            <div className="learning-summary">
              <h3>Learning progress</h3>
              <div className="summary-row"><span>Accuracy</span><strong>{globalAccuracy}%</strong></div>
              <div className="summary-row"><span>Average attempts</span><strong>{averageAttempts}</strong></div>
              <div className="summary-row"><span>Hints used</span><strong>{progress.hintsUsed}</strong></div>
              <div className="summary-row"><span>Recent progress</span><strong>{recentProgress}</strong></div>
              <div className="summary-row summary-wide"><span>Needs more practice</span><strong>{topConfusions.length ? topConfusions.join(", ") : "No pattern yet"}</strong></div>
            </div>
            {!storageAvailable ? <p className="storage-note">This browser is blocking local storage. You can still play, but progress may not remain after refresh.</p> : null}
          </aside>
        </section>
      </GameShell>
    );
  }

  if (state.status === "LEVEL_COMPLETE" || state.status === "GAME_COMPLETE") {
    return (
      <GameShell soundEnabled={soundEnabled} onToggleSound={toggleSound}>
        <CompletionScreen
          level={state.level}
          stats={state.sessionStats}
          isGameComplete={state.status === "GAME_COMPLETE"}
          onNext={() => startLevel(Math.min(10, state.level + 1), true)}
          onReplay={() => startLevel(state.level, true)}
          onHome={() => dispatch({ type: "HOME" })}
        />
      </GameShell>
    );
  }

  const question = state.question;
  if (!question) return null;

  const hintStage: 0 | 1 | 2 = state.attemptsForQuestion >= 3 ? 2 : state.attemptsForQuestion >= 2 ? 1 : 0;
  const showSuccess = state.status === "CORRECT";
  const milestone = showSuccess && state.round === 4;
  const feedback = showSuccess
    ? milestone
      ? "Amazing! Keep going!"
      : `Great! That is ${question.target}.`
    : state.status === "HINT"
      ? "Take another look. A gentle hint is here."
      : state.status === "TRY_AGAIN"
        ? "Try again. You can do it."
        : "Tap the matching number.";

  return (
    <GameShell
      soundEnabled={soundEnabled}
      onToggleSound={toggleSound}
      showPause={state.status !== "CORRECT"}
      onPause={pauseGame}
    >
      <section className={`play-area state-${state.status.toLowerCase()}`}>
        <div className="play-topline">
          <span className="level-pill">Level {state.level}</span>
          <span className="stars-pill" aria-label={`${state.sessionStats.stars} stars this level`}>★ {state.sessionStats.stars}</span>
        </div>

        <ProgressDots current={state.round} total={10} />

        <div className="instruction-block">
          <div className="instruction-line">
            <p>Find the number</p>
            <button
              className="replay-button"
              type="button"
              onClick={() => {
                cancelAudio();
                speakTarget(question.target, soundEnabled);
              }}
              disabled={!soundEnabled}
              aria-label="Repeat the number instruction"
            >
              <span aria-hidden="true">🔊</span>
              <span>Repeat</span>
            </button>
          </div>
          <div className="target-number" aria-label={`Target number ${question.target}`}>{question.target}</div>
        </div>

        <p className={`feedback ${showSuccess ? "success-feedback" : ""}`} aria-live="polite">{feedback}</p>

        <div className={`number-grid choices-${question.options.length}`}>
          {question.options.map((value) => (
            <NumberCard
              key={value}
              value={value}
              isTarget={value === question.target}
              showSuccess={showSuccess}
              isSelectedWrong={!showSuccess && state.lastWrong === value}
              hintStage={hintStage}
              disabled={showSuccess || state.status === "PAUSED"}
              onSelect={handleAnswer}
            />
          ))}
        </div>

        <div className="play-footer">
          <span>Question {state.round + 1} of 10</span>
          <span>No timer • Take your time</span>
        </div>
      </section>

      {state.status === "PAUSED" ? (
        <PauseMenu
          soundEnabled={soundEnabled}
          onContinue={resumeGame}
          onRestart={restartLevel}
          onToggleSound={toggleSound}
          onExit={exitGame}
        />
      ) : null}
    </GameShell>
  );
}
