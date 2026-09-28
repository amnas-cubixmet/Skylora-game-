import type {
  AdaptiveDecision,
  AdaptiveSnapshot,
  ConfusionFocus,
  LearningStage,
} from "./types";

export const MASTERY_MIN_OPPORTUNITIES = 10;
export const MASTERY_ACCURACY = 0.75;
export const SUPPORT_ACCURACY = 0.5;
export const CONFUSION_TRIGGER = 3;

export function firstTryAccuracy(snapshot: Pick<AdaptiveSnapshot, "opportunities" | "firstTryCorrect">) {
  return snapshot.opportunities > 0
    ? snapshot.firstTryCorrect / snapshot.opportunities
    : 0;
}

export function topConfusion(confusions: Record<string, number>): ConfusionFocus | null {
  const entry = Object.entries(confusions)
    .filter(([, count]) => count > 0)
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))[0];

  if (!entry) return null;
  const [key, count] = entry;
  const parts = key.includes("→")
    ? key.split("→")
    : key.includes(":")
      ? key.split(":")
      : key.includes("-")
        ? key.split("-")
        : [key, ""];

  return {
    key,
    target: parts[0] ?? key,
    selected: parts[1] ?? "",
    count,
  };
}

export function confusionWeight(
  confusions: Record<string, number>,
  target: string,
  maxWeight = 6,
) {
  const total = Object.entries(confusions)
    .filter(([key]) =>
      key.startsWith(`${target}:`) ||
      key.startsWith(`${target}→`) ||
      key.startsWith(`${target}-`),
    )
    .reduce((sum, [, count]) => sum + count, 0);
  return Math.min(maxWeight, total);
}

export function adaptiveChoiceCount(
  recent: readonly boolean[] | undefined,
  base: 2 | 3 = 3,
  max: 3 | 4 = 4,
): 2 | 3 | 4 {
  const values = recent ?? [];
  const last3 = values.slice(-3);
  const last4 = values.slice(-4);

  if (last3.length === 3 && last3.filter((value) => !value).length >= 2) return 2;
  if (last4.length === 4 && last4.every(Boolean)) return max;
  return base;
}

export function learningStage(snapshot: AdaptiveSnapshot): LearningStage {
  if (snapshot.opportunities === 0) return "not-started";
  const accuracy = firstTryAccuracy(snapshot);
  if (
    snapshot.opportunities >= MASTERY_MIN_OPPORTUNITIES &&
    accuracy >= MASTERY_ACCURACY
  )
    return "consistent";
  if (snapshot.firstTryCorrect >= 3 || accuracy >= 0.6) return "developing";
  return "practising";
}

export function decideAdaptation(snapshot: AdaptiveSnapshot): AdaptiveDecision {
  const accuracy = firstTryAccuracy(snapshot);
  const focus = topConfusion(snapshot.confusions);
  const hintRate = snapshot.attempts > 0 ? snapshot.hints / snapshot.attempts : 0;
  const stage = learningStage(snapshot);

  if (focus && focus.count >= CONFUSION_TRIGGER) {
    return {
      action: "remediate",
      stage,
      choiceCount: 2,
      replayInstruction: true,
      pulseCorrectAfterAttempts: 2,
      focus,
    };
  }

  if (
    snapshot.opportunities >= 3 &&
    (accuracy < SUPPORT_ACCURACY || hintRate >= 0.34)
  ) {
    return {
      action: "support",
      stage,
      choiceCount: 2,
      replayInstruction: true,
      pulseCorrectAfterAttempts: 2,
      focus,
    };
  }

  if (
    snapshot.opportunities >= MASTERY_MIN_OPPORTUNITIES &&
    accuracy >= MASTERY_ACCURACY
  ) {
    return {
      action: "advance",
      stage,
      choiceCount: adaptiveChoiceCount(snapshot.recent, 3, 4),
      replayInstruction: false,
      pulseCorrectAfterAttempts: 3,
      focus,
    };
  }

  return {
    action: "maintain",
    stage,
    choiceCount: adaptiveChoiceCount(snapshot.recent, 3, 4),
    replayInstruction: false,
    pulseCorrectAfterAttempts: 3,
    focus,
  };
}
