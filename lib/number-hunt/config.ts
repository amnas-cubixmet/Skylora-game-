import type { LevelConfig, SavedProgress } from "./types";

export const ROUNDS_PER_LEVEL = 10;

export const LEVELS: LevelConfig[] = [
  { level: 1, min: 1, max: 3, choices: 2, rounds: ROUNDS_PER_LEVEL },
  { level: 2, min: 1, max: 5, choices: 3, rounds: ROUNDS_PER_LEVEL },
  { level: 3, min: 1, max: 5, choices: 4, rounds: ROUNDS_PER_LEVEL },
  { level: 4, min: 1, max: 10, choices: 4, rounds: ROUNDS_PER_LEVEL },
  { level: 5, min: 1, max: 10, choices: 6, rounds: ROUNDS_PER_LEVEL },
  { level: 6, min: 1, max: 20, choices: 6, rounds: ROUNDS_PER_LEVEL },
  { level: 7, min: 1, max: 20, choices: 8, rounds: ROUNDS_PER_LEVEL },
  { level: 8, min: 1, max: 50, choices: 8, rounds: ROUNDS_PER_LEVEL },
  { level: 9, min: 1, max: 100, choices: 8, rounds: ROUNDS_PER_LEVEL },
  { level: 10, min: 1, max: 100, choices: 8, rounds: ROUNDS_PER_LEVEL, challenge: true },
];

export const CHALLENGE_PAIRS: Array<[number, number]> = [
  [6, 9],
  [1, 7],
  [12, 21],
  [17, 71],
  [13, 31],
  [14, 41],
  [16, 61],
  [19, 91],
  [23, 32],
  [24, 42],
];

export const DEFAULT_PROGRESS: SavedProgress = {
  version: 1,
  currentLevel: 1,
  highestUnlockedLevel: 1,
  stars: 0,
  totalQuestions: 0,
  correctAnswers: 0,
  attempts: 0,
  hintsUsed: 0,
  totalResponseTimeMs: 0,
  confusedPairs: {},
  levelRecords: {},
  activeLevel: null,
};

export function getLevelConfig(level: number): LevelConfig {
  const config = LEVELS.find((item) => item.level === level);
  if (!config) throw new Error(`Unknown level: ${level}`);
  return config;
}
