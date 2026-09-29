import type { JourneyProgress } from "./types";

const KEY = "skylora.english-journey.v2";
const LEGACY_KEY = "skylora.english-journey.v1";

export const freshJourneyProgress = (): JourneyProgress => ({
  version: 2,
  stars: 0,
  completedMissions: 0,
  bestAccuracy: 0,
  masteredActivityIds: [],
  completedLevelIds: [],
  skillStats: {},
  soundEnabled: true,
  lastLevelId: null,
});

export function loadJourneyProgress(): JourneyProgress {
  if (typeof window === "undefined") return freshJourneyProgress();
  try {
    const raw = window.localStorage.getItem(KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as Partial<JourneyProgress>;
      if (parsed.version === 2) {
        return {
          ...freshJourneyProgress(),
          ...parsed,
          masteredActivityIds: Array.isArray(parsed.masteredActivityIds) ? parsed.masteredActivityIds : [],
          completedLevelIds: Array.isArray(parsed.completedLevelIds) ? parsed.completedLevelIds : [],
          skillStats: parsed.skillStats && typeof parsed.skillStats === "object" ? parsed.skillStats : {},
        };
      }
    }

    const legacyRaw = window.localStorage.getItem(LEGACY_KEY);
    if (legacyRaw) {
      const legacy = JSON.parse(legacyRaw) as {
        stars?: number;
        completedMissions?: number;
        bestAccuracy?: number;
        masteredRoundIds?: string[];
        soundEnabled?: boolean;
      };
      return {
        ...freshJourneyProgress(),
        stars: legacy.stars ?? 0,
        completedMissions: legacy.completedMissions ?? 0,
        bestAccuracy: legacy.bestAccuracy ?? 0,
        masteredActivityIds: Array.isArray(legacy.masteredRoundIds) ? legacy.masteredRoundIds : [],
        soundEnabled: legacy.soundEnabled ?? true,
      };
    }
  } catch {
    return freshJourneyProgress();
  }
  return freshJourneyProgress();
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

export const JOURNEY_STORAGE_KEY = KEY;
