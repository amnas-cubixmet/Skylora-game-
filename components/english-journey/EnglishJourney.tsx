"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { GameShell } from "../game/GameShell";
import { GuideCharacter, Picture } from "../english/Art";
import { TracePad } from "./TracePad";
import {
  ALL_LEVELS,
  JOURNEY_WORLDS,
  LETTER_LEVELS,
  LEVEL_BY_ID,
  TOTAL_JOURNEY_LEVELS,
  firstIncompleteLevel,
  isLevelUnlocked,
  levelsForWorld,
} from "../../lib/english-journey/content";
import {
  freshJourneyProgress,
  loadJourneyProgress,
  saveJourneyProgress,
} from "../../lib/english-journey/storage";
import type {
  JourneyActivity,
  JourneyLevel,
  JourneyProgress,
  SkillMetric,
} from "../../lib/english-journey/types";
import styles from "./EnglishJourney.module.css";

type Screen = "home" | "levels" | "playing" | "complete";
type PickedToken = { token: string; index: number };

function emptyMetric(): SkillMetric {
  return { encounters: 0, firstTryCorrect: 0, attempts: 0, hints: 0 };
}

export function EnglishJourney() {
  const [screen, setScreen] = useState<Screen>("home");
  const [progress, setProgress] = useState<JourneyProgress>(freshJourneyProgress);
  const [worldId, setWorldId] = useState(1);
  const [level, setLevel] = useState<JourneyLevel>(LETTER_LEVELS[0]);
  const [activities, setActivities] = useState<JourneyActivity[]>(LETTER_LEVELS[0].activities.filter((a) => a.world === 1));
  const [activityIndex, setActivityIndex] = useState(0);
  const [attempts, setAttempts] = useState(0);
  const [hints, setHints] = useState(0);
  const [wrongId, setWrongId] = useState<string | null>(null);
  const [correctId, setCorrectId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState("");
  const [picked, setPicked] = useState<PickedToken[]>([]);
  const [speaking, setSpeaking] = useState(false);
  const [firstTryCorrect, setFirstTryCorrect] = useState(0);
  const [totalAttempts, setTotalAttempts] = useState(0);
  const [storageAvailable, setStorageAvailable] = useState(true);
  const lockRef = useRef(false);
  const timerRef = useRef<number | null>(null);

  const activity = activities[activityIndex];
  const world = JOURNEY_WORLDS.find((item) => item.id === worldId) ?? JOURNEY_WORLDS[0];
  const recommended = useMemo(
    () => firstIncompleteLevel(progress.completedLevelIds, progress.skillStats),
    [progress.completedLevelIds, progress.skillStats],
  );

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => setProgress(loadJourneyProgress()));
    return () => {
      window.cancelAnimationFrame(frame);
      if (timerRef.current !== null) window.clearTimeout(timerRef.current);
      if ("speechSynthesis" in window) window.speechSynthesis.cancel();
    };
  }, []);

  function speak(text: string) {
    if (!progress.soundEnabled || typeof window === "undefined" || !("speechSynthesis" in window)) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = "en-IN";
    utterance.rate = 0.86;
    utterance.pitch = 1.03;
    const voices = window.speechSynthesis.getVoices();
    utterance.voice =
      voices.find((voice) => voice.lang.toLowerCase().startsWith("en-in")) ??
      voices.find((voice) => voice.lang.toLowerCase().startsWith("en-gb")) ??
      voices.find((voice) => voice.lang.toLowerCase().startsWith("en")) ??
      null;
    window.speechSynthesis.speak(utterance);
  }

  function persist(next: JourneyProgress) {
    setProgress(next);
    setStorageAvailable(saveJourneyProgress(next));
  }

  function toggleSound() {
    if (progress.soundEnabled && "speechSynthesis" in window) window.speechSynthesis.cancel();
    persist({ ...progress, soundEnabled: !progress.soundEnabled });
  }

  function resetActivity() {
    setAttempts(0);
    setHints(0);
    setWrongId(null);
    setCorrectId(null);
    setFeedback("");
    setPicked([]);
    setSpeaking(false);
    lockRef.current = false;
  }

  function activitiesFor(selected: JourneyLevel) {
    return selected.activities;
  }

  function startLevel(levelId: string, selectedWorld = LEVEL_BY_ID[levelId]?.world ?? 1) {
    const nextLevel = LEVEL_BY_ID[levelId];
    if (!nextLevel) return;
    const nextActivities = activitiesFor(nextLevel);
    if (!nextActivities.length) return;
    if (timerRef.current !== null) window.clearTimeout(timerRef.current);
    setWorldId(selectedWorld);
    setLevel(nextLevel);
    setActivities(nextActivities);
    setActivityIndex(0);
    setFirstTryCorrect(0);
    setTotalAttempts(0);
    resetActivity();
    setScreen("playing");
    window.setTimeout(() => speak(nextActivities[0].spokenPrompt), 100);
  }

  function openWorld(id: number) {
    setWorldId(id);
    setScreen("levels");
  }

  function leaveSession() {
    if (timerRef.current !== null) window.clearTimeout(timerRef.current);
    if ("speechSynthesis" in window) window.speechSynthesis.cancel();
    resetActivity();
    setScreen("levels");
  }

  function recordActivity(item: JourneyActivity, firstTry: boolean, attemptCount: number, hintCount: number) {
    const nextStats = { ...progress.skillStats };
    for (const tag of item.masteryTags) {
      const current = nextStats[tag] ?? emptyMetric();
      nextStats[tag] = {
        encounters: current.encounters + 1,
        firstTryCorrect: current.firstTryCorrect + (firstTry ? 1 : 0),
        attempts: current.attempts + Math.max(1, attemptCount),
        hints: current.hints + hintCount,
      };
    }
    const mastered =
      firstTry && hintCount === 0
        ? Array.from(new Set([...progress.masteredActivityIds, item.id]))
        : progress.masteredActivityIds;
    const next = { ...progress, skillStats: nextStats, masteredActivityIds: mastered };
    setProgress(next);
    setStorageAvailable(saveJourneyProgress(next));
    return next;
  }

  function finishLevel(baseProgress: JourneyProgress, correctFirst: number, attemptsMade: number) {
    const accuracy = Math.round((correctFirst / Math.max(1, activities.length)) * 100);
    const key = level.id;
    const next: JourneyProgress = {
      ...baseProgress,
      stars: baseProgress.stars + Math.max(1, correctFirst),
      completedMissions: baseProgress.completedMissions + 1,
      bestAccuracy: Math.max(baseProgress.bestAccuracy, accuracy),
      completedLevelIds: Array.from(new Set([...baseProgress.completedLevelIds, key])),
      lastLevelId: level.id,
    };
    persist(next);
    setTotalAttempts(attemptsMade);
    setScreen("complete");
    speak("Amazing. Level complete.");
  }

  function advance(baseProgress: JourneyProgress, firstTry: boolean, attemptsMade: number) {
    if (!activity || lockRef.current) return;
    lockRef.current = true;
    const nextFirst = firstTry ? firstTryCorrect + 1 : firstTryCorrect;
    setFirstTryCorrect(nextFirst);
    setFeedback("Great!");
    speak(activity.reinforcement);

    timerRef.current = window.setTimeout(() => {
      if (activityIndex + 1 >= activities.length) {
        finishLevel(baseProgress, nextFirst, attemptsMade);
        return;
      }
      const nextIndex = activityIndex + 1;
      setActivityIndex(nextIndex);
      resetActivity();
      window.setTimeout(() => speak(activities[nextIndex].spokenPrompt), 100);
    }, 900);
  }

  function succeed(attemptCount = attempts + 1) {
    if (!activity || lockRef.current) return;
    const firstTry = attempts === 0 && hints === 0;
    const nextAttemptsMade = totalAttempts + Math.max(1, attemptCount);
    setTotalAttempts(nextAttemptsMade);
    const nextProgress = recordActivity(activity, firstTry, attemptCount, hints);
    advance(nextProgress, firstTry, nextAttemptsMade);
  }

  function choose(choiceId: string) {
    if (!activity || lockRef.current) return;
    if (choiceId !== activity.correctId) {
      const nextAttempts = attempts + 1;
      setAttempts(nextAttempts);
      setWrongId(choiceId);
      setHints(nextAttempts >= 2 ? 1 : hints);
      setFeedback(nextAttempts >= 2 ? "Look again" : "Try again");
      speak(nextAttempts >= 2 ? activity.spokenPrompt : `Try again. ${activity.spokenPrompt}`);
      return;
    }
    setCorrectId(choiceId);
    setWrongId(null);
    succeed();
  }

  function pickToken(token: string, index: number) {
    if (!activity || lockRef.current || picked.some((item) => item.index === index)) return;
    const next = [...picked, { token, index }];
    setPicked(next);
    const answer = activity.answer ?? [];
    if (next.length < answer.length) return;

    const correct = next.every((item, itemIndex) => item.token === answer[itemIndex]);
    if (correct) {
      succeed(attempts + 1);
      return;
    }

    const nextAttempts = attempts + 1;
    setAttempts(nextAttempts);
    setHints(nextAttempts >= 2 ? 1 : hints);
    setFeedback(nextAttempts >= 2 ? `Start with “${answer[0]}”` : "Try again");
    speak("Try again.");
    timerRef.current = window.setTimeout(() => setPicked([]), 650);
  }

  function undoToken(index: number) {
    if (lockRef.current) return;
    setPicked((current) => current.filter((_, itemIndex) => itemIndex !== index));
  }

  function passiveComplete() {
    if (!activity || lockRef.current) return;
    speak(activity.reinforcement);
    succeed(1);
  }

  function speakingTurn() {
    if (!activity || speaking || lockRef.current) return;
    setSpeaking(true);
    setFeedback("Your turn…");
    if ("speechSynthesis" in window) window.speechSynthesis.cancel();
    timerRef.current = window.setTimeout(() => {
      setFeedback("Nice speaking!");
      succeed(1);
    }, 2600);
  }

  const worldLevels = levelsForWorld(worldId);

  if (screen === "playing" && activity) {
    const answer = activity.answer ?? [];
    const hintToken = attempts >= 2 ? answer[picked.length] : undefined;
    return (
      <GameShell
        gameplay
        gameTitle="English Journey"
        onBack={leaveSession}
        backLabel="Back to levels"
        soundEnabled={progress.soundEnabled}
        onToggleSound={toggleSound}
      >
        <section className={styles.playScreen}>
          <div className={styles.sessionTop}>
            <span>{level.code}</span>
            <div className={styles.progressTrack} aria-label={`Activity ${activityIndex + 1} of ${activities.length}`}>
              {activities.map((item, index) => (
                <i
                  key={item.id}
                  className={
                    index < activityIndex
                      ? styles.progressDone
                      : index === activityIndex
                        ? styles.progressCurrent
                        : styles.progressDot
                  }
                />
              ))}
            </div>
            <span>{activityIndex + 1}/{activities.length}</span>
          </div>

          <div className={styles.promptArea}>
            <button type="button" className={styles.replay} onClick={() => speak(activity.spokenPrompt)} aria-label="Replay instruction">
              <span aria-hidden="true">🔊</span>
            </button>
            <div>
              <span className={styles.skillLabel}>{activity.skill}</span>
              <h1>{activity.prompt}</h1>
            </div>
          </div>

          <div className={styles.activityStage}>
            {activity.kind === "teach-letter" ? (
              <button type="button" className={styles.letterMovie} onClick={passiveComplete} aria-label={`Meet letter ${activity.target}`}>
                <span className={styles.movieLetter}>{activity.target}</span>
                {activity.target ? <Picture value={activity.target} className={styles.moviePicture} /> : null}
                <span className={styles.movieWord}>{activity.word}</span>
                <span className={styles.tapCue}>Tap to meet</span>
              </button>
            ) : null}

            {activity.kind === "choice" ? (
              <div className={styles.choiceGrid}>
                {(activity.choices ?? []).map((choice) => {
                  const hinted = attempts >= 2 && choice.id === activity.correctId;
                  return (
                    <button
                      key={choice.id}
                      type="button"
                      className={[
                        styles.choice,
                        correctId === choice.id ? styles.choiceCorrect : "",
                        wrongId === choice.id ? styles.choiceWrong : "",
                        hinted ? styles.choiceHinted : "",
                        attempts >= 3 && choice.id !== activity.correctId ? styles.choiceDimmed : "",
                      ].filter(Boolean).join(" ")}
                      onClick={() => choose(choice.id)}
                      disabled={Boolean(correctId)}
                      aria-label={choice.label}
                    >
                      {choice.pictureKey ? <Picture value={choice.pictureKey} className={styles.choicePicture} /> : null}
                      {choice.visual ? <span className={styles.choiceVisual}>{choice.visual}</span> : null}
                      <span className={styles.choiceLabel}>{choice.label}</span>
                    </button>
                  );
                })}
              </div>
            ) : null}

            {activity.kind === "word-builder" || activity.kind === "sentence-builder" || activity.kind === "paragraph-builder" ? (
              <div className={styles.builder}>
                {activity.word ? <div className={styles.builderWord}>{activity.word}</div> : null}
                <div className={activity.kind === "paragraph-builder" ? styles.paragraphSlots : styles.answerSlots}>
                  {answer.map((token, index) => (
                    <button
                      type="button"
                      key={`${token}-slot-${index}`}
                      className={styles.answerSlot}
                      onClick={() => undoToken(index)}
                      aria-label={picked[index] ? `Remove ${picked[index].token}` : `Empty position ${index + 1}`}
                    >
                      {picked[index]?.token ?? ""}
                    </button>
                  ))}
                </div>
                <div className={activity.kind === "paragraph-builder" ? styles.paragraphTiles : styles.tileGrid}>
                  {(activity.tiles ?? []).map((token, index) => {
                    const used = picked.some((item) => item.index === index);
                    const hinted = hintToken === token && !used;
                    return (
                      <button
                        type="button"
                        key={`${token}-${index}`}
                        className={hinted ? `${styles.tile} ${styles.tileHinted}` : styles.tile}
                        disabled={used}
                        onClick={() => pickToken(token, index)}
                      >
                        {token}
                      </button>
                    );
                  })}
                </div>
              </div>
            ) : null}

            {activity.kind === "trace" && activity.target ? (
              <TracePad letter={activity.target} onComplete={() => succeed(1)} />
            ) : null}

            {activity.kind === "read" ? (
              <button type="button" className={styles.readCard} onClick={passiveComplete}>
                <span className={styles.readText}>{activity.modelText}</span>
                <span className={styles.readSupport}>{activity.supportText ?? "Tap to hear"}</span>
              </button>
            ) : null}

            {activity.kind === "speak" ? (
              <div className={styles.speakCard}>
                <GuideCharacter mood={speaking ? "listening" : "happy"} className={styles.speakGuide} />
                <button type="button" className={styles.modelSpeech} onClick={() => speak(activity.modelText ?? activity.spokenPrompt)}>
                  <span aria-hidden="true">🔊</span>
                  <strong>{activity.modelText}</strong>
                </button>
                <button type="button" className={speaking ? `${styles.micButton} ${styles.micActive}` : styles.micButton} onClick={speakingTurn} disabled={speaking}>
                  <span aria-hidden="true">●</span>
                  {speaking ? "Speak now" : "Your turn"}
                </button>
                <span className={styles.speakNote}>No accent score</span>
              </div>
            ) : null}
          </div>

          <div className={styles.feedback} data-success={feedback === "Great!" || feedback === "Nice speaking!"} aria-live="polite">
            {feedback || activity.supportText || " "}
          </div>
        </section>
      </GameShell>
    );
  }

  if (screen === "complete") {
    const accuracy = Math.round((firstTryCorrect / Math.max(1, activities.length)) * 100);
    const nextLevel = ALL_LEVELS[ALL_LEVELS.findIndex((item) => item.id === level.id) + 1];
    return (
      <GameShell adventure gameTitle="English Journey">
        <section className={styles.complete}>
          <div className={styles.starBurst} aria-hidden="true">★ ✦ ★</div>
          <GuideCharacter mood="celebrating" className={styles.completeGuide} />
          <p className={styles.eyebrow}>LEVEL COMPLETE</p>
          <h1>{level.title}</h1>
          <div className={styles.completeStats}>
            <div><strong>{firstTryCorrect}</strong><span>First try</span></div>
            <div><strong>{accuracy}%</strong><span>Accuracy</span></div>
            <div><strong>★ {Math.max(1, firstTryCorrect)}</strong><span>Stars</span></div>
          </div>
          {nextLevel ? (
            <button type="button" className={styles.primaryButton} onClick={() => startLevel(nextLevel.id, nextLevel.world)}>
              Next learning level
            </button>
          ) : null}
          <button type="button" className={styles.secondaryButton} onClick={() => setScreen("levels")}>
            Level map
          </button>
        </section>
      </GameShell>
    );
  }

  if (screen === "levels") {
    return (
      <GameShell adventure gameTitle="English Journey" soundEnabled={progress.soundEnabled} onToggleSound={toggleSound}>
        <div className={styles.levelPage}>
          <button type="button" className={styles.backText} onClick={() => setScreen("home")}>← Journey map</button>
          <div className={styles.levelHero}>
            <span className={styles.worldNumber}>{String(world.id).padStart(2, "0")}</span>
            <div>
              <p className={styles.eyebrow}>{world.stage}</p>
              <h1>{world.title}</h1>
              <p>{world.description}</p>
            </div>
          </div>
          <div className={styles.levelGrid}>
            {worldLevels.map((item) => {
              const done = progress.completedLevelIds.includes(item.id);
              const locked = !done && !isLevelUnlocked(item, progress.completedLevelIds);
              return (
                <button
                  type="button"
                  key={item.id}
                  className={done ? `${styles.levelCard} ${styles.levelDone}` : styles.levelCard}
                  disabled={locked}
                  onClick={() => startLevel(item.id, worldId)}
                >
                  <span className={styles.levelCode}>{done ? "✓" : locked ? "•" : item.code}</span>
                  <strong>{item.title}</strong>
                  <span>{locked ? "Learn the step before" : item.subtitle}</span>
                </button>
              );
            })}
          </div>
        </div>
      </GameShell>
    );
  }

  return (
    <GameShell adventure gameTitle="English Journey" soundEnabled={progress.soundEnabled} onToggleSound={toggleSound}>
      <div className={styles.home}>
        <section className={styles.hero}>
          <div className={styles.heroCopy}>
            <p className={styles.eyebrow}>SKYLORA ENGLISH JOURNEY</p>
            <h1>Learn English. One skill at a time.</h1>
            <p className={styles.heroText}>250 connected levels: letters, writing, sounds, words, speaking, reading, sentences and paragraphs.</p>
            <div className={styles.heroActions}>
              <button type="button" className={styles.primaryButton} onClick={() => startLevel(recommended.id, recommended.world)}>
                <span aria-hidden="true">▶</span>
                Continue learning
              </button>
              <button type="button" className={styles.secondaryButton} onClick={() => openWorld(1)}>
                A–Z levels
              </button>
            </div>
            <div className={styles.miniStats}>
              <span>★ {progress.stars}</span>
              <span>{progress.completedLevelIds.length}/{TOTAL_JOURNEY_LEVELS} levels</span>
              <span>{progress.masteredActivityIds.length} independent skills</span>
            </div>
          </div>
          <div className={styles.heroCharacter} aria-hidden="true">
            <div className={styles.floatChip}>A a</div>
            <div className={styles.floatChip}>CAT</div>
            <div className={styles.floatChip}>I am.</div>
            <GuideCharacter mood="happy" className={styles.guide} />
          </div>
        </section>

        <section className={styles.pathIntro}>
          <p className={styles.eyebrow}>CONNECTED LEARNING PATH</p>
          <h2>ABC → Write → Phonics → Words → Speak → Read → Paragraphs</h2>
        </section>

        <section className={styles.worldGrid} aria-label="English learning worlds">
          {JOURNEY_WORLDS.map((item) => {
            const count = levelsForWorld(item.id).length;
            const completed = levelsForWorld(item.id).filter((levelItem) =>
              progress.completedLevelIds.includes(levelItem.id),
            ).length;
            return (
              <button type="button" className={styles.worldCard} key={item.id} onClick={() => openWorld(item.id)}>
                <span className={styles.worldIndex}>{String(item.id).padStart(2, "0")}</span>
                <span className={styles.worldIcon} aria-hidden="true">{item.icon}</span>
                <span className={styles.worldCopy}>
                  <strong>{item.title}</strong>
                  <small>{item.description}</small>
                  <i>{completed}/{count} levels</i>
                </span>
              </button>
            );
          })}
        </section>

        <section className={styles.systemCard}>
          <div>
            <p className={styles.eyebrow}>INSIDE ONE JOURNEY</p>
            <h2>A–Z Adventure is now the first learning world.</h2>
            <p>No separate game jump. Letter learning, handwriting and later English skills share the same progress system.</p>
          </div>
          <button type="button" className={styles.primaryButton} onClick={() => openWorld(1)}>Start with A</button>
        </section>

        {!storageAvailable ? <p className={styles.storageNote}>Progress cannot be saved in this browser, but this visit still works.</p> : null}
      </div>
    </GameShell>
  );
}
