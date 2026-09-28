import { seededRandom as random, shuffleSeeded as shuffle } from '../learning/random';
import { LEVELS, MODES, PAIRS, sound } from './content';
import { choiceCount, introducedPool } from './difficulty';
import type { Mode, Progress, Round } from './types';

export function generateRound(level: number, index: number, p: Progress, seed: number): Round {
  if (!Number.isInteger(level) || level < 1 || level > 6 || index < 0 || index >= 10) throw new Error('Invalid sound session');
  const rng = random(seed + level * 719 + index * 7919);
  // A seeded mode sweep makes every detective session include all six mechanics.
  const mode: Mode = level === 6 ? shuffle(MODES, random(seed))[index % MODES.length] : LEVELS[level - 1].mode as Mode;
  let pool = introducedPool(level, index, p);
  if (mode === 'similar-sound') pool = PAIRS.flat();
  // Recent introduced entries preserve recent-round targets without child identifiers.
  const recent = p.introduced.slice(-2);
  const unseen = pool.filter(id => !recent.includes(id));
  let target = shuffle(unseen.length ? unseen : pool, rng)[0];
  if (mode === 'similar-sound') {
    const pair = PAIRS[Math.floor(index / 2) % PAIRS.length];
    target = pair[(index + (seed % 2)) % 2];
  }
  // Occasional revisits, never a wall of repeated questions.
  if (index % 3 === 2) {
    const weighted = pool.filter(id => !recent.includes(id)).flatMap(id => Array<string>(Math.min(4, p.difficultLetters[id] ?? 0)).fill(id));
    if (weighted.length) target = weighted[Math.floor(rng() * weighted.length)];
  }
  let distractors = shuffle(pool.filter(id => id !== target && sound(id).phoneme !== sound(target).phoneme), rng);
  if (mode === 'similar-sound') {
    const partner = PAIRS.find(pair => pair.includes(target))!.find(id => id !== target)!;
    distractors = [partner, ...distractors.filter(id => id !== partner)];
  } else if (level === 1) {
    const partner = PAIRS.find(pair => pair.includes(target))?.find(id => id !== target);
    distractors = distractors.filter(id => id !== partner);
  }
  const count = mode === 'similar-sound' ? 2 : choiceCount(level, index, p);
  return { id: `${seed}:${level}:${index}`, mode, target, options: shuffle([target, ...distractors.slice(0, count - 1)], rng), difficulty: count };
}
