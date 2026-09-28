import { GAMES, SKILLS } from "./catalogue";
import {
  fresh,
  emptyObservation,
  type Progress,
  type Preferences,
  type Observation,
} from "./types";
export const WORLD_KEY = "skylora:learning-world:v1";
const obj = (v: unknown): Record<string, unknown> =>
  v !== null && typeof v === "object" && !Array.isArray(v)
    ? (v as Record<string, unknown>)
    : {};
const count = (v: unknown, max = 1000000) =>
  typeof v === "number" && Number.isFinite(v)
    ? Math.max(0, Math.min(max, Math.floor(v)))
    : 0;
const slug = (v: unknown): v is string =>
  typeof v === "string" && GAMES.some((g) => g.slug === v);
const cleanName = (v: unknown) =>
  typeof v === "string"
    ? v
        .toUpperCase()
        .replace(/[^A-Z ]/g, "")
        .trim()
        .slice(0, 12)
    : "";
export function parseWorld(raw: string | null): Progress {
  const p = fresh();
  try {
    const v = obj(JSON.parse(raw ?? "null"));
    if (v.version !== 1) return p;
    const pref = obj(v.settings);
    p.settings = {
      theme: ["young", "growing", "older"].includes(String(pref.theme))
        ? (pref.theme as Preferences["theme"])
        : "young",
      voice: pref.voice !== false,
      motion: pref.motion !== false,
      accent: ["en-IN", "en-GB", "en-US"].includes(String(pref.accent))
        ? (pref.accent as Preferences["accent"])
        : "en-IN",
      name: cleanName(pref.name),
    };
    p.tutorials = Array.isArray(v.tutorials) ? v.tutorials.filter(slug) : [];
    p.recent = Array.isArray(v.recent)
      ? v.recent.filter(slug).slice(0, 12)
      : [];
    p.lastGame = slug(v.lastGame) ? v.lastGame : null;
    p.lastPlayed =
      typeof v.lastPlayed === "string" && !isNaN(Date.parse(v.lastPlayed))
        ? v.lastPlayed
        : null;
    p.games = Object.fromEntries(
      Object.entries(obj(v.games))
        .filter(([k]) => slug(k))
        .map(([k, val]) => {
          const g = obj(val);
          return [
            k,
            { sessions: count(g.sessions), discoveries: count(g.discoveries) },
          ];
        }),
    );
    const validKeys = Object.entries(SKILLS).flatMap(([world, skills]) =>
      skills.map((s) => `${world}:${s.id}`),
    );
    p.skills = Object.fromEntries(
      Object.entries(obj(v.skills))
        .filter(([k]) => validKeys.includes(k))
        .map(([k, val]) => {
          const o = obj(val),
            r: Observation = emptyObservation();
          for (const key of [
            "independent",
            "supported",
            "attempts",
            "retries",
            "hints",
            "replays",
            "selfReviewed",
          ] as const)
            r[key] = count(o[key]);
          const b = obj(o.responseBands);
          r.responseBands = {
            quick: count(b.quick),
            steady: count(b.steady),
            extended: count(b.extended),
          };
          r.confusions = Object.fromEntries(
            Object.entries(obj(o.confusions))
              .filter(([key]) => key.length < 60 && !key.includes("__"))
              .slice(0, 100)
              .map(([key, n]) => [key, count(n)]),
          );
          r.lastPractised =
            typeof o.lastPractised === "string" &&
            !isNaN(Date.parse(o.lastPractised))
              ? o.lastPractised
              : "";
          return [k, r];
        }),
    );
    const s = obj(v.session);
    if (
      slug(s.game) &&
      Number.isInteger(s.index) &&
      Number(s.index) >= 0 &&
      Number(s.index) < 8 &&
      Number.isInteger(s.seed) &&
      Number(s.seed) >= 0 &&
      Number(s.seed) <= 0x7fffffff
    ) {
      p.session = {
        game: s.game,
        seed: Number(s.seed),
        index: Number(s.index),
        attempts: count(s.attempts),
        hints: count(s.hints),
        replays: count(s.replays),
        selection: Array.isArray(s.selection)
          ? Array.from(
              new Set(
                s.selection.filter(
                  (x): x is string =>
                    typeof x === "string" && /^\d{1,2}$/.test(x),
                ),
              ),
            ).slice(0, 12)
          : [],
        built: count(s.built, 10),
        elapsedMs: count(s.elapsedMs, 3600000),
        solved: s.solved === true,
        choices: [2, 3, 4].includes(Number(s.choices)) ? Number(s.choices) : 2,
        focus:
          typeof s.focus === "string" && s.focus.length <= 20 ? s.focus : null,
        name: cleanName(s.name),
      };
    }
    return p;
  } catch {
    return p;
  }
}
export interface WorldStore {
  load(): { progress: Progress; available: boolean };
  save(p: Progress): boolean;
  clear(): boolean;
}
export const worldStore: WorldStore = {
  load() {
    try {
      return {
        progress: parseWorld(localStorage.getItem(WORLD_KEY)),
        available: true,
      };
    } catch {
      return { progress: fresh(), available: false };
    }
  },
  save(p) {
    try {
      localStorage.setItem(WORLD_KEY, JSON.stringify(p));
      window.dispatchEvent(new Event("skylora-progress"));
      return true;
    } catch {
      return false;
    }
  },
  clear() {
    try {
      localStorage.removeItem(WORLD_KEY);
      window.dispatchEvent(new Event("skylora-progress"));
      return true;
    } catch {
      return false;
    }
  },
};
