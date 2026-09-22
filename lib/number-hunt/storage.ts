import { DEFAULT_PROGRESS } from "./config";
import type { SavedProgress } from "./types";

const STORAGE_KEY = "skylora:number-hunt:progress:v1";

function clampLevel(value: unknown): number {
  const parsed = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(parsed)) return 1;
  return Math.min(10, Math.max(1, Math.round(parsed)));
}

export function loadProgress(): { progress: SavedProgress; available: boolean } {
  if (typeof window === "undefined") return { progress: DEFAULT_PROGRESS, available: false };
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return { progress: { ...DEFAULT_PROGRESS }, available: true };
    const parsed = JSON.parse(raw) as Partial<SavedProgress>;
    const progress: SavedProgress = {
      ...DEFAULT_PROGRESS,
      ...parsed,
      version: 1,
      currentLevel: clampLevel(parsed.currentLevel),
      highestUnlockedLevel: clampLevel(parsed.highestUnlockedLevel),
      confusedPairs: parsed.confusedPairs ?? {},
      levelRecords: parsed.levelRecords ?? {},
      activeLevel: parsed.activeLevel ?? null,
    };
    return { progress, available: true };
  } catch {
    return { progress: { ...DEFAULT_PROGRESS }, available: false };
  }
}

export function saveProgress(progress: SavedProgress): boolean {
  if (typeof window === "undefined") return false;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
    return true;
  } catch {
    return false;
  }
}
