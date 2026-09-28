import type { Mechanic } from "./catalogue";
export type Option = {
  id: string;
  label: string;
  picture?: string;
  quantity?: number;
};
export type Activity = {
  id: string;
  skill: string;
  contentVersion: string;
  reason: "new" | "review" | "remediation" | "transfer";
  mechanic: Mechanic;
  instruction: string;
  spoken: string;
  prompt?: string;
  picture?: string;
  options: Option[];
  answer: string;
  tokens?: string[];
  trace?: string;
  guide?: "full" | "dotted" | "faint" | "none";
  quantity?: number;
  initial?: number;
  start?: number;
  steps?: number;
  limit?: number;
  hint: string;
  reinforcement: string;
  item: string;
};
export type Observation = {
  independent: number;
  supported: number;
  attempts: number;
  retries: number;
  hints: number;
  replays: number;
  selfReviewed: number;
  responseBands: { quick: number; steady: number; extended: number };
  confusions: Record<string, number>;
  lastPractised: string;
};
export type Preferences = {
  theme: "young" | "growing" | "older";
  voice: boolean;
  motion: boolean;
  accent: "en-IN" | "en-GB" | "en-US";
  name: string;
};
export type Session = {
  game: string;
  seed: number;
  index: number;
  attempts: number;
  hints: number;
  replays: number;
  selection: string[];
  built: number;
  elapsedMs: number;
  solved: boolean;
  choices: number;
  focus: string | null;
  name: string;
};
export type Progress = {
  version: 1;
  settings: Preferences;
  tutorials: string[];
  games: Record<string, { sessions: number; discoveries: number }>;
  skills: Record<string, Observation>;
  session: Session | null;
  recent: string[];
  lastGame: string | null;
  lastPlayed: string | null;
};
export const emptyObservation = (): Observation => ({
  independent: 0,
  supported: 0,
  attempts: 0,
  retries: 0,
  hints: 0,
  replays: 0,
  selfReviewed: 0,
  responseBands: { quick: 0, steady: 0, extended: 0 },
  confusions: {},
  lastPractised: "",
});
export const fresh = (): Progress => ({
  version: 1,
  settings: {
    theme: "young",
    voice: true,
    motion: true,
    accent: "en-IN",
    name: "",
  },
  tutorials: [],
  games: {},
  skills: {},
  session: null,
  recent: [],
  lastGame: null,
  lastPlayed: null,
});
