import { seededRandom, shuffleSeeded } from "./random";
import type { LearningRound, LearningSessionPlan, PracticeReason } from "./types";

export const SESSION_MIN_ROUNDS = 6;
export const SESSION_MAX_ROUNDS = 10;
export const DEFAULT_SESSION_ROUNDS = 10;

const reasonPriority: Record<PracticeReason, number> = {
  remediation: 0,
  new: 1,
  review: 2,
  transfer: 3,
};

export function clampSessionLength(length: number) {
  return Math.max(
    SESSION_MIN_ROUNDS,
    Math.min(SESSION_MAX_ROUNDS, Math.round(length)),
  );
}

export function buildSessionPlan({
  id,
  pool,
  seed,
  length = DEFAULT_SESSION_ROUNDS,
  focusSkill,
}: {
  id: string;
  pool: LearningRound[];
  seed: number;
  length?: number;
  focusSkill?: string | null;
}): LearningSessionPlan {
  if (!pool.length) throw new Error("Learning session needs at least one round");

  const count = Math.min(clampSessionLength(length), pool.length);
  const rng = seededRandom(seed);
  const ranked = [...pool].sort((a, b) => {
    const focusA = focusSkill && a.skill === focusSkill ? -1 : 0;
    const focusB = focusSkill && b.skill === focusSkill ? -1 : 0;
    return focusA - focusB || reasonPriority[a.reason] - reasonPriority[b.reason];
  });

  const selected: LearningRound[] = [];
  const usedEngines = new Set<string>();

  for (const round of ranked) {
    if (selected.length >= count) break;
    if (!usedEngines.has(round.engine)) {
      selected.push(round);
      usedEngines.add(round.engine);
    }
  }

  if (selected.length < count) {
    const remaining = shuffleSeeded(
      ranked.filter((round) => !selected.some((item) => item.id === round.id)),
      rng,
    );
    selected.push(...remaining.slice(0, count - selected.length));
  }

  return {
    id,
    rounds: selected,
    estimatedMinutes: Math.max(1, Math.ceil(selected.length * 0.4)),
  };
}
