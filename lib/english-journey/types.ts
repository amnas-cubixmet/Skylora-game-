export type JourneyStage =
  | "Letters"
  | "Writing"
  | "Phonics"
  | "Words"
  | "Speaking"
  | "Reading"
  | "Sentences"
  | "Paragraphs"
  | "Independent";

export type JourneyActivityKind =
  | "teach-letter"
  | "choice"
  | "word-builder"
  | "sentence-builder"
  | "trace"
  | "speak"
  | "read"
  | "paragraph-builder";

export type JourneyChoice = {
  id: string;
  label: string;
  visual?: string;
  pictureKey?: string;
};

export type JourneyActivity = {
  id: string;
  world: number;
  levelId: string;
  kind: JourneyActivityKind;
  skill: string;
  prompt: string;
  spokenPrompt: string;
  reinforcement: string;
  target?: string;
  word?: string;
  visual?: string;
  choices?: JourneyChoice[];
  correctId?: string;
  tiles?: string[];
  answer?: string[];
  modelText?: string;
  supportText?: string;
  masteryTags: string[];
};

export type JourneyLevel = {
  id: string;
  world: number;
  code: string;
  title: string;
  subtitle: string;
  stage: JourneyStage;
  globalNumber: number;
  prerequisiteIds: string[];
  reviewTags: string[];
  activities: JourneyActivity[];
};

export type JourneyWorld = {
  id: number;
  slug: string;
  title: string;
  shortTitle: string;
  icon: string;
  stage: JourneyStage;
  description: string;
  levelCount: number;
};

export type SkillMetric = {
  encounters: number;
  firstTryCorrect: number;
  attempts: number;
  hints: number;
};

export type JourneyProgress = {
  version: 3;
  stars: number;
  completedMissions: number;
  bestAccuracy: number;
  masteredActivityIds: string[];
  completedLevelIds: string[];
  skillStats: Record<string, SkillMetric>;
  soundEnabled: boolean;
  lastLevelId: string | null;
};
