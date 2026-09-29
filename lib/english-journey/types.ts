export type JourneyWorld = {
  id: number;
  slug: string;
  title: string;
  shortTitle: string;
  icon: string;
  unlocked: boolean;
};

export type JourneyChoice = {
  id: string;
  label: string;
  visual: string;
  tone?: "red" | "blue" | "yellow" | "green" | "purple";
};

export type JourneyRound = {
  id: string;
  world: number;
  skill: string;
  prompt: string;
  spokenPrompt: string;
  choices: JourneyChoice[];
  correctId: string;
  reinforcement: string;
};

export type JourneyProgress = {
  version: 1;
  stars: number;
  completedMissions: number;
  bestAccuracy: number;
  masteredRoundIds: string[];
  soundEnabled: boolean;
};
