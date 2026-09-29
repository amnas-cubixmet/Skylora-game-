export type MathsWorld = {
  id: number;
  slug: string;
  title: string;
  shortTitle: string;
  icon: string;
  unlocked: boolean;
};

export type MathsChoice = {
  id: string;
  label: string;
  value: string;
  count?: number;
  symbol?: string;
};

export type MathsRound = {
  id: string;
  world: number;
  skill: string;
  prompt: string;
  spokenPrompt: string;
  visualType: "objects" | "number" | "compare" | "sequence" | "number-line" | "equation" | "money";
  visualValue?: number | number[] | string;
  choices: MathsChoice[];
  correctId: string;
  reinforcement: string;
};

export type MathsProgress = {
  version: 1;
  stars: number;
  completedMissions: number;
  bestAccuracy: number;
  masteredRoundIds: string[];
  soundEnabled: boolean;
};
