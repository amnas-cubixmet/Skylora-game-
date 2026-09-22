export type GameStatus =
  | "LOADING"
  | "READY"
  | "PLAYING"
  | "CORRECT"
  | "TRY_AGAIN"
  | "HINT"
  | "LEVEL_COMPLETE"
  | "GAME_COMPLETE"
  | "PAUSED"
  | "ERROR";

export type LevelConfig = {
  level: number;
  min: number;
  max: number;
  choices: number;
  rounds: number;
  challenge?: boolean;
};

export type Question = {
  id: string;
  target: number;
  options: number[];
};

export type ConfusedPairs = Record<string, number>;

export type ActiveLevelProgress = {
  level: number;
  completedRounds: number;
  stars: number;
  firstTryCorrect: number;
  attempts: number;
  hintsUsed: number;
  responseTimeMs: number;
  previousTarget: number | null;
};

export type LevelRecord = {
  stars: number;
  questions: number;
  accuracy: number;
  attempts: number;
  hintsUsed: number;
  averageResponseMs: number;
};

export type SavedProgress = {
  version: 1;
  currentLevel: number;
  highestUnlockedLevel: number;
  stars: number;
  totalQuestions: number;
  correctAnswers: number;
  attempts: number;
  hintsUsed: number;
  totalResponseTimeMs: number;
  confusedPairs: ConfusedPairs;
  levelRecords: Record<string, LevelRecord>;
  activeLevel: ActiveLevelProgress | null;
};

export type LevelSessionStats = {
  stars: number;
  firstTryCorrect: number;
  attempts: number;
  hintsUsed: number;
  responseTimeMs: number;
};

export type GameEventName =
  | "game_started"
  | "level_started"
  | "question_shown"
  | "answer_selected"
  | "answer_correct"
  | "answer_retry"
  | "hint_used"
  | "question_completed"
  | "level_completed"
  | "game_exited";
