import type { MathsProgress } from "./types";

const KEY = "skylora.maths-journey.v1";

export const freshMathsProgress = (): MathsProgress => ({
  version: 1,
  stars: 0,
  completedMissions: 0,
  bestAccuracy: 0,
  masteredRoundIds: [],
  soundEnabled: true,
});

export function loadMathsProgress(): MathsProgress {
  if (typeof window === "undefined") return freshMathsProgress();
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return freshMathsProgress();
    const parsed = JSON.parse(raw) as Partial<MathsProgress>;
    if (parsed.version !== 1) return freshMathsProgress();
    return {
      ...freshMathsProgress(),
      ...parsed,
      masteredRoundIds: Array.isArray(parsed.masteredRoundIds) ? parsed.masteredRoundIds : [],
    };
  } catch {
    return freshMathsProgress();
  }
}

export function saveMathsProgress(progress: MathsProgress): boolean {
  if (typeof window === "undefined") return false;
  try {
    window.localStorage.setItem(KEY, JSON.stringify(progress));
    window.dispatchEvent(new Event("skylora-maths-journey-progress"));
    return true;
  } catch {
    return false;
  }
}
