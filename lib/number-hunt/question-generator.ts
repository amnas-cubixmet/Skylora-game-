import { CHALLENGE_PAIRS } from "./config";
import type { ConfusedPairs, LevelConfig, Question } from "./types";

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function shuffle<T>(items: T[]): T[] {
  const copy = [...items];
  for (let index = copy.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    [copy[index], copy[swapIndex]] = [copy[swapIndex], copy[index]];
  }
  return copy;
}

export function pairKey(a: number, b: number): string {
  return a < b ? `${a}:${b}` : `${b}:${a}`;
}

function pairFromKey(key: string): [number, number] | null {
  const [a, b] = key.split(":").map(Number);
  return Number.isFinite(a) && Number.isFinite(b) ? [a, b] : null;
}

function topAdaptiveDistractors(target: number, confusedPairs: ConfusedPairs, config: LevelConfig): number[] {
  return Object.entries(confusedPairs)
    .sort((a, b) => b[1] - a[1])
    .map(([key]) => pairFromKey(key))
    .filter((pair): pair is [number, number] => pair !== null && pair.includes(target))
    .map(([a, b]) => (a === target ? b : a))
    .filter((number) => number >= config.min && number <= config.max);
}

function chooseTarget(config: LevelConfig, previousTarget: number | null): number {
  if (config.challenge && Math.random() < 0.75) {
    const availablePairs = CHALLENGE_PAIRS.filter(([a, b]) => a >= config.min && b <= config.max);
    if (availablePairs.length > 0) {
      const pair = availablePairs[randomInt(0, availablePairs.length - 1)];
      const preferred = pair[randomInt(0, 1)];
      if (preferred !== previousTarget) return preferred;
      return pair[preferred === pair[0] ? 1 : 0];
    }
  }

  let target = randomInt(config.min, config.max);
  if (config.max > config.min) {
    let guard = 0;
    while (target === previousTarget && guard < 12) {
      target = randomInt(config.min, config.max);
      guard += 1;
    }
  }
  return target;
}

function challengeDistractors(target: number, config: LevelConfig): number[] {
  const matches = CHALLENGE_PAIRS
    .filter(([a, b]) => a === target || b === target)
    .flatMap(([a, b]) => [a === target ? b : a]);

  if (target >= 10 && target < 100) {
    const reversed = Number(String(target).split("").reverse().join(""));
    if (reversed !== target) matches.push(reversed);
  }

  return matches.filter((number) => number >= config.min && number <= config.max && number !== target);
}

export function generateQuestion(
  config: LevelConfig,
  previousTarget: number | null,
  confusedPairs: ConfusedPairs,
): Question {
  const target = chooseTarget(config, previousTarget);
  const options = new Set<number>([target]);

  for (const number of topAdaptiveDistractors(target, confusedPairs, config)) {
    if (options.size >= config.choices) break;
    options.add(number);
  }

  if (config.challenge) {
    for (const number of challengeDistractors(target, config)) {
      if (options.size >= config.choices) break;
      options.add(number);
    }
  }

  let guard = 0;
  while (options.size < config.choices && guard < 500) {
    options.add(randomInt(config.min, config.max));
    guard += 1;
  }

  if (options.size < config.choices) {
    for (let number = config.min; number <= config.max && options.size < config.choices; number += 1) {
      options.add(number);
    }
  }

  return {
    id: `${config.level}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    target,
    options: shuffle(Array.from(options)),
  };
}
