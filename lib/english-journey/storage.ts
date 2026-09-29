import type { JourneyProgress } from "./types";

const KEY = "skylora.english-journey.v3";
const LEGACY_V2_KEY = "skylora.english-journey.v2";
const LEGACY_V1_KEY = "skylora.english-journey.v1";

const LEGACY_LEVEL_MAP: Record<string, string> = {
  "phonics-satpin": "phonics-satpin",
  "words-first": "words-first",
  "vocab-school": "vocab-school",
  "spell-cvc": "spell-cvc",
  "sentence-i-see": "sentence-i-see",
  "speak-hello": "speak-hello",
  "read-mini": "read-mini",
  "grammar-actions": "grammar-actions",
  "story-rain": "story-rain",
  "rhyme-cat": "rhyme-cat",
  "comprehension-school": "comprehension-school",
  "paragraph-my-dog": "paragraph-my-dog",
  "creative-picture": "creative-picture",
  "real-life-shop": "real-life-shop",
};

function migrateLevelId(id: string) {
  if (id.startsWith("writing:letter-")) return `write-${id.slice("writing:letter-".length)}`;
  return LEGACY_LEVEL_MAP[id] ?? id;
}

export const freshJourneyProgress = (): JourneyProgress => ({
  version: 3,
  stars: 0,
  completedMissions: 0,
  bestAccuracy: 0,
  masteredActivityIds: [],
  completedLevelIds: [],
  skillStats: {},
  soundEnabled: true,
  lastLevelId: null,
});

function normalizeV3(parsed: Partial<JourneyProgress>): JourneyProgress {
  return {
    ...freshJourneyProgress(),
    ...parsed,
    version: 3,
    masteredActivityIds: Array.isArray(parsed.masteredActivityIds) ? parsed.masteredActivityIds : [],
    completedLevelIds: Array.isArray(parsed.completedLevelIds) ? parsed.completedLevelIds : [],
    skillStats: parsed.skillStats && typeof parsed.skillStats === "object" ? parsed.skillStats : {},
  };
}

export function loadJourneyProgress(): JourneyProgress {
  if (typeof window === "undefined") return freshJourneyProgress();
  try {
    const raw = window.localStorage.getItem(KEY);
    if (raw) return normalizeV3(JSON.parse(raw) as Partial<JourneyProgress>);

    const v2Raw = window.localStorage.getItem(LEGACY_V2_KEY);
    if (v2Raw) {
      const legacy = JSON.parse(v2Raw) as {
        stars?: number;
        completedMissions?: number;
        bestAccuracy?: number;
        masteredActivityIds?: string[];
        completedLevelIds?: string[];
        skillStats?: JourneyProgress["skillStats"];
        soundEnabled?: boolean;
        lastLevelId?: string | null;
      };
      const migrated: JourneyProgress = {
        ...freshJourneyProgress(),
        stars: legacy.stars ?? 0,
        completedMissions: legacy.completedMissions ?? 0,
        bestAccuracy: legacy.bestAccuracy ?? 0,
        masteredActivityIds: Array.isArray(legacy.masteredActivityIds) ? legacy.masteredActivityIds : [],
        completedLevelIds: Array.isArray(legacy.completedLevelIds)
          ? Array.from(new Set(legacy.completedLevelIds.map(migrateLevelId)))
          : [],
        skillStats: legacy.skillStats && typeof legacy.skillStats === "object" ? legacy.skillStats : {},
        soundEnabled: legacy.soundEnabled ?? true,
        lastLevelId: legacy.lastLevelId ? migrateLevelId(legacy.lastLevelId) : null,
      };
      window.localStorage.setItem(KEY, JSON.stringify(migrated));
      return migrated;
    }

    const v1Raw = window.localStorage.getItem(LEGACY_V1_KEY);
    if (v1Raw) {
      const legacy = JSON.parse(v1Raw) as {
        stars?: number;
        completedMissions?: number;
        bestAccuracy?: number;
        masteredRoundIds?: string[];
        soundEnabled?: boolean;
      };
      const migrated: JourneyProgress = {
        ...freshJourneyProgress(),
        stars: legacy.stars ?? 0,
        completedMissions: legacy.completedMissions ?? 0,
        bestAccuracy: legacy.bestAccuracy ?? 0,
        masteredActivityIds: Array.isArray(legacy.masteredRoundIds) ? legacy.masteredRoundIds : [],
        soundEnabled: legacy.soundEnabled ?? true,
      };
      window.localStorage.setItem(KEY, JSON.stringify(migrated));
      return migrated;
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
