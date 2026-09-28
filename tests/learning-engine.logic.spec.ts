import { expect, test } from "@playwright/test";
import {
  adaptiveChoiceCount,
  buildSessionPlan,
  confusionWeight,
  decideAdaptation,
  firstTryAccuracy,
  learningStage,
  topConfusion,
  type ActivityEngine,
  type LearningRound,
} from "../lib/learning";

test("shared adaptive rules support, remediate and advance transparently", () => {
  const struggling = {
    opportunities: 5,
    firstTryCorrect: 2,
    attempts: 6,
    hints: 3,
    replays: 2,
    confusions: {},
    recent: [false, true, false],
  };
  expect(firstTryAccuracy(struggling)).toBeCloseTo(0.4);
  expect(learningStage(struggling)).toBe("practising");
  expect(decideAdaptation(struggling)).toMatchObject({
    action: "support",
    choiceCount: 2,
    replayInstruction: true,
  });

  const confused = {
    opportunities: 8,
    firstTryCorrect: 5,
    attempts: 10,
    hints: 1,
    replays: 1,
    confusions: { "b→d": 3, "m→n": 1 },
  };
  expect(topConfusion(confused.confusions)).toEqual({
    key: "b→d",
    target: "b",
    selected: "d",
    count: 3,
  });
  expect(decideAdaptation(confused)).toMatchObject({
    action: "remediate",
    choiceCount: 2,
    focus: { target: "b", selected: "d", count: 3 },
  });

  const mastered = {
    opportunities: 10,
    firstTryCorrect: 8,
    attempts: 10,
    hints: 0,
    replays: 0,
    confusions: {},
    recent: [true, true, true, true],
  };
  expect(learningStage(mastered)).toBe("consistent");
  expect(decideAdaptation(mastered)).toMatchObject({
    action: "advance",
    choiceCount: 4,
    replayInstruction: false,
  });
});

test("choice sizing and confusion weighting are shared across games", () => {
  expect(adaptiveChoiceCount([false, true, false], 3, 4)).toBe(2);
  expect(adaptiveChoiceCount([true, true, true, true], 3, 4)).toBe(4);
  expect(adaptiveChoiceCount([true, false, true], 3, 4)).toBe(3);

  expect(
    confusionWeight({ "B:D": 4, "B:C": 3, "A:D": 8 }, "B"),
  ).toBe(6);
  expect(
    confusionWeight({ "b→d": 2, "b→p": 1, "d→b": 9 }, "b"),
  ).toBe(3);
});

test("session planner keeps micro-sessions short and mixes reusable engines", () => {
  const engines: ActivityEngine[] = [
    "listen-and-choose",
    "picture-to-letter",
    "letter-match",
    "blend-and-read",
    "build-word",
    "trace-path",
    "fill-blank",
    "counting-touch",
    "more-or-less",
    "number-line",
    "story-mission",
  ];
  const pool: LearningRound[] = engines.map((engine, index) => ({
    id: `round-${index}`,
    engine,
    skill: index < 3 ? "letter-sound" : "mixed-review",
    reason: index === 0 ? "remediation" : index < 5 ? "new" : "review",
    spoken: "Find it.",
    target: String(index),
    options: [
      { id: String(index) },
      { id: `x-${index}` },
    ],
    correctAnswer: String(index),
  }));

  const plan = buildSessionPlan({
    id: "reading-adventure-1",
    pool,
    seed: 42,
    length: 10,
    focusSkill: "letter-sound",
  });

  expect(plan.rounds).toHaveLength(10);
  expect(plan.estimatedMinutes).toBeGreaterThanOrEqual(3);
  expect(new Set(plan.rounds.map((round) => round.id)).size).toBe(10);
  expect(plan.rounds[0].skill).toBe("letter-sound");
  expect(new Set(plan.rounds.map((round) => round.engine)).size).toBe(10);
});
