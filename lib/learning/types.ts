export type ActivityEngine =
  | "listen-and-choose"
  | "picture-to-letter"
  | "letter-match"
  | "blend-and-read"
  | "build-word"
  | "trace-path"
  | "fill-blank"
  | "counting-touch"
  | "more-or-less"
  | "number-line"
  | "story-mission";

export type PracticeReason = "new" | "review" | "remediation" | "transfer";

export type LearningOption = {
  id: string;
  label?: string;
  image?: string;
  audio?: string;
  quantity?: number;
};

export type LearningMedia = {
  promptAudio?: string;
  targetAudio?: string;
  image?: string;
};

export type LearningRound = {
  id: string;
  engine: ActivityEngine;
  skill: string;
  reason: PracticeReason;
  spoken: string;
  prompt?: string;
  target: string;
  options: LearningOption[];
  correctAnswer: string;
  media?: LearningMedia;
  locale?: string;
  difficulty?: 1 | 2 | 3 | 4;
};

export type LearningSessionPlan = {
  id: string;
  rounds: LearningRound[];
  estimatedMinutes: number;
};

export type AdaptiveSnapshot = {
  opportunities: number;
  firstTryCorrect: number;
  attempts: number;
  hints: number;
  replays: number;
  responseTimeMs?: number;
  confusions: Record<string, number>;
  recent?: boolean[];
};

export type LearningStage = "not-started" | "practising" | "developing" | "consistent";
export type AdaptiveAction = "support" | "maintain" | "advance" | "remediate";

export type ConfusionFocus = {
  key: string;
  target: string;
  selected: string;
  count: number;
};

export type AdaptiveDecision = {
  action: AdaptiveAction;
  stage: LearningStage;
  choiceCount: 2 | 3 | 4;
  replayInstruction: boolean;
  pulseCorrectAfterAttempts: number;
  focus: ConfusionFocus | null;
};

export type LearningEventValue = string | number | boolean;
export type LearningEventDetail = Record<string, LearningEventValue>;
