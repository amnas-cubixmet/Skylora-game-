"use client";
import Link from "next/link";
import { useCallback, useEffect, useReducer, useRef, useState } from "react";
import { GAMES, WORLDS, type Game } from "../../lib/world/catalogue";
import {
  initial,
  reducer,
  SESSION_LENGTH,
  type Action,
} from "../../lib/world/progress";
import { worldStore } from "../../lib/world/storage";
import { worldEvent } from "../../lib/world/analytics";
import { SoundAudioController } from "../../lib/sound-match/audio";
import { Dialog } from "../game/Dialog";
import { WorldFrame, Guide } from "./WorldFrame";
import { ActivityArea } from "./ActivityArea";
export function WorldGame({ game }: { game: Game }) {
  const [s, dispatch] = useReducer(reducer, initial),
    [audioError, setAudioError] = useState(false),
    [speaking, setSpeaking] = useState(false),
    [switching, setSwitching] = useState(false);
  const stateRef = useRef(s),
    audio = useRef<SoundAudioController | null>(null),
    lock = useRef(false),
    token = useRef(0),
    started = useRef(0),
    heading = useRef<HTMLHeadingElement>(null),
    roundSeen = useRef("");
  const { progress: p, activity: q, status } = s,
    session = p.session,
    paused = status === "PAUSED";
  useEffect(() => {
    stateRef.current = s;
    lock.current = status !== "PLAYING";
  }, [s, status]);
  const stop = useCallback(() => {
    token.current++;
    audio.current?.stop();
    setSpeaking(false);
  }, []);
  const speak = useCallback(async (text: string) => {
    const id = ++token.current,
      settings = stateRef.current.progress.settings;
    setSpeaking(settings.voice);
    const ok = await audio.current?.play(
      [{ text }],
      settings.voice,
      settings.accent,
      settings.theme === "older",
    );
    if (id === token.current) {
      setSpeaking(false);
      setAudioError(settings.voice && !ok);
    }
    return !!ok;
  }, []);
  const act = useCallback(
    (a: Action) => {
      if (["HOME", "PAUSE", "NEXT", "START", "ERROR"].includes(a.type)) stop();
      if (a.type === "RESUME") started.current = Date.now();
      dispatch(a);
    },
    [stop],
  );
  useEffect(() => {
    const controller = new SoundAudioController(),
      counter = token;
    audio.current = controller;
    const loaded = worldStore.load();
    dispatch({
      type: "LOAD",
      progress: loaded.progress,
      available: loaded.available,
    });
    return () => {
      controller.dispose();
      counter.current++;
    };
  }, []);
  useEffect(() => {
    if (status !== "LOADING") {
      const ok = worldStore.save(p);
      if (!ok && s.available) dispatch({ type: "STORAGE_FAILED" });
    }
  }, [p, status, s.available]);
  useEffect(() => {
    if (status !== "PLAYING" || !q || roundSeen.current === q.id) return;
    roundSeen.current = q.id;
    heading.current?.focus();
    started.current = Date.now();
    worldEvent("round_presented", game.id, q.skill, q.reason);
    const timer = setTimeout(() => void speak(q.spoken), 160);
    return () => clearTimeout(timer);
  }, [status, q, game.id, speak]);
  useEffect(() => {
    if (status !== "ANSWER_FEEDBACK" || !q) return;
    void speak(
      `${s.feedback} ${!s.correct && (session?.attempts ?? 0) >= 2 ? q.spoken : ""}`,
    );
    if (!s.correct) {
      const timer = setTimeout(() => dispatch({ type: "RETRY" }), 1000);
      return () => clearTimeout(timer);
    }
  }, [status, s.feedback, s.correct, q, speak, session?.attempts]);
  useEffect(() => {
    if (status === "ANSWER_FEEDBACK" && s.correct && q) {
      const timer = setTimeout(() => {
        roundSeen.current = "";
        act({ type: "NEXT" });
      }, 1100);
      return () => clearTimeout(timer);
    }
  // A correct child interaction advances after the short in-place celebration.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, s.correct, q?.id]);
  useEffect(() => {
    if (status === "TUTORIAL")
      void speak(
        `${game.description} Listen or look, then try the activity. Hints and replay are always here.`,
      );
  }, [status, game.description, speak]);
  useEffect(() => {
    if (status === "GAME_COMPLETE") {
      heading.current?.focus();
      worldEvent("session_completed", game.id);
    }
  }, [status, game.id]);
  useEffect(() => {
    const hide = () => {
      if (document.hidden) {
        stop();
        dispatch({ type: "PAUSE" });
      }
    };
    const keys = (e: KeyboardEvent) => {
      if (
        e.ctrlKey ||
        e.metaKey ||
        e.altKey ||
        e.repeat ||
        document.querySelector('[role="dialog"]') ||
        /INPUT|TEXTAREA|SELECT/.test((e.target as HTMLElement).tagName)
      )
        return;
      if (e.key === "Escape") {
        stop();
        dispatch({ type: "PAUSE" });
      }
      if (
        e.key.toLowerCase() === "r" &&
        stateRef.current.status === "PLAYING"
      ) {
        dispatch({ type: "REPLAY" });
        worldEvent("audio_replayed", game.id);
        void speak(stateRef.current.activity!.spoken);
      }
    };
    document.addEventListener("visibilitychange", hide);
    document.addEventListener("keydown", keys);
    return () => {
      document.removeEventListener("visibilitychange", hide);
      document.removeEventListener("keydown", keys);
    };
  }, [stop, speak, game.id]);
  function start(restart = false) {
    if (!restart && p.session && p.session.game !== game.slug) {
      setSwitching(true);
      return;
    }
    roundSeen.current = "";
    worldEvent("game_started", game.id);
    act({
      type: "START",
      game,
      seed: Math.floor(Math.random() * 0x7fffffff),
      restart,
    });
  }
  function answer(value: string, supported = false, selfReviewed = false) {
    if (lock.current || stateRef.current.status !== "PLAYING") return;
    lock.current = true;
    stop();
    const state = stateRef.current;
    dispatch({
      type: "ANSWER",
      value,
      date: new Date().toISOString(),
      elapsed: Date.now() - started.current,
      supported: supported || !state.progress.settings.voice || audioError,
      selfReviewed,
    });
    worldEvent(
      value === state.activity?.answer ? "answer_correct" : "answer_retry",
      game.id,
      state.activity?.skill,
    );
  }
  function replay() {
    if (status !== "PLAYING" || !q) return;
    act({ type: "REPLAY" });
    worldEvent("audio_replayed", game.id, q.skill);
    void speak(q.spoken);
  }
  function hint() {
    if (status !== "PLAYING" || !q) return;
    act({ type: "HINT" });
    worldEvent("hint_requested", game.id, q.skill);
    void speak((session?.hints ?? 0) >= 1 ? q.hint : q.spoken);
  }
  const active = ["PLAYING", "ANSWER_FEEDBACK", "PAUSED"].includes(status),
    world = WORLDS.find((w) => w.id === game.world)!,
    nextGame = GAMES[GAMES.findIndex((g) => g.slug === game.slug) + 1];
  return (
    <WorldFrame
      settings={p.settings}
      title={game.title}
      gameplay={active}
      backHref={`/worlds/${game.world}`}
      backLabel={`Back to ${world.title}`}
      pause={active && !paused && status !== "ANSWER_FEEDBACK" ? () => act({ type: "PAUSE" }) : undefined}
      toggleVoice={() => {
        stop();
        dispatch({
          type: "PREFERENCES",
          settings: { ...p.settings, voice: !p.settings.voice },
        });
      }}
      inert={paused || switching}
    >
      {!active && <Link
        onClick={() => {
          stop();
          worldEvent("game_exited", game.id);
        }}
        className="world-back"
        href={`/worlds/${game.world}`}
      >
        ← {world.title}
      </Link>}
      {status === "LOADING" && (
        <section className="world-welcome" role="status">
          <Guide />
          <p>Opening your adventure…</p>
        </section>
      )}
      {status === "READY" && (
        <section className="world-welcome">
          <p className="world-eyebrow">
            {game.id} · {world.title}
          </p>
          <Guide />
          <h1>{game.title}</h1>
          <p>{game.description}</p>
          <span className="world-note">
            Eight little discoveries. Take your time.
          </span>
          {game.id === "W10" && !p.settings.name ? (
            <>
              <p>
                Add a preferred name in settings to begin this personal writing
                activity.
              </p>
              <Link className="world-primary" href="/learning-settings">
                Set up My Name
              </Link>
            </>
          ) : (
            <button className="world-primary" onClick={() => start()}>
              {session?.game === game.slug ? "Continue adventure" : "Play"} →
            </button>
          )}
          <button
            className="world-secondary"
            onClick={() => void speak(game.description)}
          >
            Hear how to play
          </button>
          {p.games[game.slug]?.sessions > 0 && (
            <span className="world-badge">✦ {game.badge}</span>
          )}
        </section>
      )}
      {status === "TUTORIAL" && (
        <section className="world-welcome">
          <Guide />
          <p className="world-eyebrow">A little practice first</p>
          <h1>Here’s how we play.</h1>
          <p>{game.description}</p>
          <div className="world-tutorial-steps">
            <span>1 · Listen or look</span>
            <span>2 · Try the activity</span>
            <span>3 · Discover together</span>
          </div>
          <p>
            {q?.mechanic === "order"
              ? "Tap tiles in order. Undo lets you change your last tile."
              : q?.mechanic === "trace"
                ? "Follow each stroke from its numbered dot. Keyboard practice is below the drawing."
                : q?.mechanic === "copy"
                  ? "Draw a letter, compare it with the model, and tell us when you have practised."
                  : q?.mechanic === "build"
                    ? "Add or remove one object at a time, then check your group."
                    : "Tap your match. Hints and replay are always here."}
          </p>
          <button
            className="world-secondary"
            onClick={() => void speak(`${game.description} ${q?.spoken ?? ""}`)}
          >
            Hear the instructions
          </button>
          <button
            className="world-primary"
            onClick={() => {
              stop();
              act({ type: "TUTORIAL_DONE" });
            }}
          >
            Let’s try it →
          </button>
          <button
            className="world-text-button"
            onClick={() => {
              stop();
              act({ type: "TUTORIAL_DONE" });
            }}
          >
            Skip introduction
          </button>
        </section>
      )}
      {active && q && session && (
        <section
          className={`world-round skylora-activity-screen skylora-activity-card ${s.correct ? "is-correct" : ""}`}
          data-testid="world-round"
          data-round={q.id}
        >
          <div className="world-round-top world-progress-only">
            <span className="sr-only">{game.title}</span>
            <div
              className="world-gems"
              role="img"
              aria-label={`${session.index + Number(s.correct)} of ${SESSION_LENGTH} discoveries`}
            >
              {Array.from({ length: SESSION_LENGTH }, (_, i) => (
                <span
                  key={i}
                  className={
                    i < session.index + Number(s.correct) ? "earned" : ""
                  }
                  aria-hidden="true"
                >
                  ✦
                </span>
              ))}
            </div>
          </div>
          <h1 ref={heading} tabIndex={-1}>
            {q.instruction}
          </h1>
          <div className="world-round-controls">
            <button
              className={`skylora-round-action ${speaking ? "listening" : ""}`}
              disabled={!p.settings.voice}
              onClick={replay}
              aria-label={speaking ? "Listening" : "Replay instruction"}
              title="Replay"
            >
              <span aria-hidden="true">🔊</span>
            </button>
            <button
              className="skylora-round-action"
              onClick={hint}
              disabled={status !== "PLAYING"}
              aria-label="Show hint"
              title="Hint"
            >
              <span aria-hidden="true">💡</span>
            </button>
          </div>
          {(!p.settings.voice || audioError) && (
            <p className="sr-only" role="status">
              {audioError ? "Voice is unavailable." : "Voice is off."} A visual clue is ready.
            </p>
          )}
          <ActivityArea
            key={q.id}
            q={q}
            session={session}
            disabled={status !== "PLAYING"}
            visualSupport={!p.settings.voice || audioError}
            onAnswer={answer}
            onTile={(index) => act({ type: "TILE", index })}
            onUndo={() => act({ type: "UNDO" })}
            onBuild={(value) => act({ type: "BUILD", value })}
            onHint={() => act({ type: "HINT" })}
          />
          <div
            role="status"
            aria-live="polite"
            className={`world-feedback skylora-round-feedback ${s.correct ? "positive" : ""}`}
          >
            {s.correct ? "✨ Great!" : status === "ANSWER_FEEDBACK" ? "Try again!" : ""}
          </div>
        </section>
      )}
      {status === "GAME_COMPLETE" && (
        <section className="world-welcome">
          <Guide celebrate />
          <p className="world-eyebrow">A lovely moment to take a break</p>
          <h1 ref={heading} tabIndex={-1}>
            Adventure complete!
          </h1>
          <span className="world-badge">✦ {game.badge}</span>
          <p>You listened, practised and made new discoveries.</p>
          <Link className="world-primary" href={`/worlds/${game.world}`}>
            Back to my world
          </Link>
          <button className="world-secondary" onClick={() => start(true)}>
            Play again
          </button>
          {nextGame?.world === game.world && (
            <Link className="world-secondary" href={`/${nextGame.slug}`}>
              Next adventure: {nextGame.title}
            </Link>
          )}
        </section>
      )}
      {status === "ERROR" && (
        <section className="world-welcome" role="alert">
          <h1>Let’s try that again.</h1>
          <button className="world-primary" onClick={() => start(true)}>
            Restart this adventure
          </button>
          <Link href="/" className="world-secondary">
            Back to worlds
          </Link>
        </section>
      )}
      {!s.available && (
        <p role="status" className="world-storage-note">
          Progress cannot be saved in this browser. You can still practise.
        </p>
      )}
      {paused && (
        <Dialog
          labelledBy="world-pause"
          onClose={() => act({ type: "RESUME" })}
          className="world-dialog bg-white p-6 rounded-3xl"
        >
          <h2 id="world-pause">A little break.</h2>
          <p>Your adventure can wait.</p>
          <button
            className="world-primary"
            onClick={() => {
              started.current = Date.now();
              act({ type: "RESUME" });
            }}
          >
            Resume
          </button>
          <button
            className="world-secondary"
            onClick={() => {
              act({ type: "RESUME" });
              if (q) void speak(q.spoken);
            }}
          >
            Replay instruction
          </button>
          <button
            className="world-secondary"
            onClick={() => {
              act({ type: "HOME" });
            }}
          >
            Welcome screen
          </button>
          <Link
            className="world-secondary"
            href="/learning-settings"
            onClick={stop}
          >
            Sound & accessibility settings
          </Link>
          <Link className="world-secondary" href="/" onClick={stop}>
            Exit to worlds
          </Link>
        </Dialog>
      )}
      {switching && (
        <Dialog
          labelledBy="switch-world"
          onClose={() => setSwitching(false)}
          className="world-dialog bg-white p-6 rounded-3xl"
        >
          <h2 id="switch-world">Begin another adventure?</h2>
          <p>
            Your completed discoveries stay safe. This replaces the unfinished
            activity.
          </p>
          <button
            className="world-primary"
            onClick={() => {
              setSwitching(false);
              start(true);
            }}
          >
            Start this adventure
          </button>
          <button
            className="world-secondary"
            onClick={() => setSwitching(false)}
          >
            Keep current activity
          </button>
        </Dialog>
      )}
    </WorldFrame>
  );
}
