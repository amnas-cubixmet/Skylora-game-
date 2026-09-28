import { GAMES, type Game } from "./catalogue";
import { activityFor } from "./activities";
import {
  emptyObservation,
  fresh,
  type Activity,
  type Progress,
  type Session,
} from "./types";
export const SESSION_LENGTH = 8;
export function stage(o: Progress["skills"][string] | undefined) {
  if (!o || !o.attempts) return "Not started";
  if (
    o.independent >= 8 &&
    o.independent / (o.independent + o.supported + o.retries) >= 0.8
  )
    return "Consistent";
  if (o.independent >= 3) return "Developing";
  return "Practising";
}
export function recommendation(p: Progress, world?: string): Game {
  const games = GAMES.filter((g) => !world || g.world === world);
  return (
    games.find(
      (g) =>
        stage(p.skills[`${g.world}:${g.skill}`]) !== "Consistent" &&
        !p.games[g.slug]?.sessions,
    ) ??
    games.find(
      (g) => stage(p.skills[`${g.world}:${g.skill}`]) !== "Consistent",
    ) ??
    games[0]
  );
}
export function newSession(g: Game, p: Progress, seed: number): Session {
  const record = p.skills[`${g.world}:${g.skill}`],
    confusion =
      Object.entries(record?.confusions ?? {})
        .sort((a, b) => b[1] - a[1])[0]?.[0]
        .split("→")[0] ?? null;
  return {
    game: g.slug,
    seed,
    index: 0,
    attempts: 0,
    hints: 0,
    replays: 0,
    selection: [],
    built: 0,
    elapsedMs: 0,
    solved: false,
    choices:
      stage(record) === "Consistent"
        ? 4
        : stage(record) === "Developing"
          ? 3
          : 2,
    focus: confusion,
    name: p.settings.name,
  };
}
export type Status =
  | "LOADING"
  | "READY"
  | "TUTORIAL"
  | "PLAYING"
  | "ANSWER_FEEDBACK"
  | "PAUSED"
  | "GAME_COMPLETE"
  | "ERROR";
export type State = {
  status: Status;
  progress: Progress;
  activity: Activity | null;
  feedback: string;
  correct: boolean;
  beforePause: Status;
  available: boolean;
};
export const initial: State = {
  status: "LOADING",
  progress: fresh(),
  activity: null,
  feedback: "",
  correct: false,
  beforePause: "PLAYING",
  available: true,
};
export type Action =
  | { type: "PREFERENCES"; settings: Progress["settings"] }
  | { type: "LOAD"; progress: Progress; available?: boolean }
  | { type: "START"; game: Game; seed: number; restart?: boolean }
  | { type: "TUTORIAL_DONE" }
  | {
      type: "ANSWER";
      value: string;
      date: string;
      elapsed: number;
      supported?: boolean;
      selfReviewed?: boolean;
    }
  | { type: "TILE"; index: string }
  | { type: "BUILD"; value: number }
  | { type: "UNDO" }
  | {
      type:
        | "HINT"
        | "REPLAY"
        | "NEXT"
        | "PAUSE"
        | "RESUME"
        | "HOME"
        | "RETRY"
        | "ERROR"
        | "STORAGE_FAILED";
    };
export function reducer(s: State, a: Action): State {
  const p = s.progress,
    session = p.session,
    q = s.activity;
  if (a.type === "LOAD")
    return {
      ...initial,
      status: "READY",
      progress: a.progress,
      available: a.available !== false,
    };
  if (a.type === "PREFERENCES")
    return { ...s, progress: { ...p, settings: a.settings } };
  if (a.type === "STORAGE_FAILED") return { ...s, available: false };
  if (a.type === "ERROR") return { ...s, status: "ERROR" };
  if (a.type === "HOME") return { ...s, status: "READY", activity: null };
  if (a.type === "START") {
    const next =
        !a.restart && session?.game === a.game.slug
          ? session
          : newSession(a.game, p, a.seed),
      activity = activityFor(a.game, next);
    if (a.restart || session?.game !== a.game.slug)
      next.built = activity.initial ?? 0;
    if (next.solved)
      return reducer(
        {
          ...s,
          status: "ANSWER_FEEDBACK",
          correct: true,
          activity,
          progress: { ...p, session: next },
        },
        { type: "NEXT" },
      );
    const status = p.tutorials.includes(a.game.slug) ? "PLAYING" : "TUTORIAL";
    return {
      ...s,
      status,
      activity,
      correct: false,
      feedback: "",
      progress: { ...p, session: next, lastGame: a.game.slug },
    };
  }
  if (a.type === "TUTORIAL_DONE" && session)
    return {
      ...s,
      status: "PLAYING",
      progress: {
        ...p,
        tutorials: Array.from(new Set([...p.tutorials, session.game])),
      },
    };
  if (a.type === "PAUSE" && ["PLAYING", "ANSWER_FEEDBACK"].includes(s.status))
    return { ...s, status: "PAUSED", beforePause: s.status };
  if (a.type === "RESUME" && s.status === "PAUSED")
    return { ...s, status: s.beforePause };
  if (a.type === "RETRY" && s.status === "ANSWER_FEEDBACK" && !s.correct)
    return { ...s, status: "PLAYING" };
  if (
    a.type === "NEXT" &&
    s.status === "ANSWER_FEEDBACK" &&
    s.correct &&
    session
  ) {
    const game = GAMES.find((g) => g.slug === session.game)!;
    if (session.index === SESSION_LENGTH - 1) {
      const old = p.games[game.slug] ?? { sessions: 0, discoveries: 0 };
      return {
        ...s,
        status: "GAME_COMPLETE",
        activity: null,
        progress: {
          ...p,
          session: null,
          games: {
            ...p.games,
            [game.slug]: { ...old, sessions: old.sessions + 1 },
          },
          recent: [game.slug, ...p.recent.filter((x) => x !== game.slug)].slice(
            0,
            12,
          ),
        },
      };
    }
    const next = {
      ...session,
      index: session.index + 1,
      attempts: 0,
      hints: 0,
      replays: 0,
      selection: [],
      built: 0,
      elapsedMs: 0,
      solved: false,
    };
    const nextActivity = activityFor(game, next);
    next.built = nextActivity.initial ?? 0;
    return {
      ...s,
      status: "PLAYING",
      correct: false,
      feedback: "",
      activity: nextActivity,
      progress: { ...p, session: next },
    };
  }
  if (s.status !== "PLAYING" || !q || !session) return s;
  if (a.type === "TILE") {
    if (
      !q.tokens ||
      session.selection.includes(a.index) ||
      !q.tokens[Number(a.index)] ||
      session.selection.length >= q.tokens.length
    )
      return s;
    return {
      ...s,
      progress: {
        ...p,
        session: { ...session, selection: [...session.selection, a.index] },
      },
    };
  }
  if (a.type === "UNDO")
    return {
      ...s,
      progress: {
        ...p,
        session: { ...session, selection: session.selection.slice(0, -1) },
      },
    };
  if (a.type === "BUILD")
    return {
      ...s,
      progress: {
        ...p,
        session: {
          ...session,
          built: Math.max(0, Math.min(q.limit ?? 10, Math.round(a.value))),
        },
      },
    };
  if (a.type === "HINT" || a.type === "REPLAY") {
    const hint = a.type === "HINT";
    return {
      ...s,
      feedback: hint
        ? session.hints > 1
          ? q.hint
          : "Listen once more. Look closely."
        : s.feedback,
      progress: {
        ...p,
        session: {
          ...session,
          hints: session.hints + Number(hint),
          replays: session.replays + Number(!hint),
        },
      },
    };
  }
  if (a.type === "ANSWER") {
    const correct = a.value === q.answer,
      assisted =
        !!a.supported ||
        !!a.selfReviewed ||
        session.hints > 0 ||
        session.replays > 0 ||
        session.attempts > 0;
    const o = p.skills[q.skill] ?? emptyObservation(),
      band =
        a.elapsed < 5000 ? "quick" : a.elapsed < 20000 ? "steady" : "extended";
    // Names and freehand paths never enter observations or events.
    const target =
        q.item === "preferred-name"
          ? "name-practice"
          : q.item || q.trace || q.answer,
      selected = q.item === "preferred-name" ? "other" : a.value.slice(0, 20);
    const observation = {
      ...o,
      attempts: o.attempts + 1,
      independent: o.independent + Number(correct && !assisted),
      supported: o.supported + Number(correct && assisted),
      selfReviewed: o.selfReviewed + Number(correct && a.selfReviewed),
      retries: o.retries + Number(!correct),
      hints: o.hints + (correct ? session.hints : 0),
      replays: o.replays + (correct ? session.replays : 0),
      responseBands: { ...o.responseBands, [band]: o.responseBands[band] + 1 },
      confusions: correct
        ? o.confusions
        : {
            ...o.confusions,
            [`${target}→${selected}`]:
              (o.confusions[`${target}→${selected}`] ?? 0) + 1,
          },
      lastPractised: a.date,
    };
    const oldGame = p.games[session.game] ?? { sessions: 0, discoveries: 0 };
    return {
      ...s,
      status: "ANSWER_FEEDBACK",
      correct,
      feedback: correct
        ? q.reinforcement
        : session.attempts === 0
          ? "Try once more."
          : session.attempts === 1
            ? "Let’s listen again."
            : "Look for the gentle clue. You can finish it.",
      progress: {
        ...p,
        lastPlayed: a.date,
        skills: { ...p.skills, [q.skill]: observation },
        games: {
          ...p.games,
          [session.game]: {
            ...oldGame,
            discoveries: oldGame.discoveries + Number(correct),
          },
        },
        session: {
          ...session,
          solved: correct,
          attempts: session.attempts + 1,
          hints: session.hints + Number(!correct && session.attempts >= 1),
          elapsedMs: session.elapsedMs + a.elapsed,
        },
      },
    };
  }
  return s;
}
