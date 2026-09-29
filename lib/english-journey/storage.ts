import type { JourneyProgress } from "./types";

const KEY = "skylora.english-journey.v1";

export const freshJourneyProgress = (): JourneyProgress => ({
  version: 1,
  stars: 0,
  completedMissions: 0,
  bestAccuracy: 0,
  masteredRoundIds: [],
  soundEnabled: true,
});

export function loadJourneyProgress(): JourneyProgress {
  if (typeof window === "undefined") return freshJourneyProgress();
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return freshJourneyProgress();
    const parsed = JSON.parse(raw) as Partial<JourneyProgress>;
    if (parsed.version !== 1) return freshJourneyProgress();
    return {
      ...freshJourneyProgress(),
      ...parsed,
      masteredRoundIds: Array.isArray(parsed.masteredRoundIds) ? parsed.masteredRoundIds : [],
    };
  } catch {
    return freshJourneyProgress();
  }
}

export function saveJourneyProgress(progress: JourneyProgress): boolean {
  if (typeof window === "undefined") return false;
  try {
    window.localStorage.setItem(KEY, JSON.stringify(progress));
    window.dispatchEvent(new Event("skylora-english-journey-progress"));
    return true;
  } catch {
    return false;
  }
}
