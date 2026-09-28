import { confusionWeight } from '../learning/adaptive';
import { seededRandom, shuffleSeeded } from '../learning/random';
import { CONFUSIONS, LETTERS, LEVELS, letter, type Mode } from './content';
import type { Progress, Question } from './types';
export const random = seededRandom;
export const shuffle = shuffleSeeded;
export function generateQuestion(level: number, round: number, progress: Progress, seed: number): Question {
  const config = LEVELS[level - 1] ?? LEVELS[0];
  const rng = random(seed + round * 7919 + level * 101);
  const modes: Mode[] = ['recognition', 'matching', 'listening', 'phonics', 'picture', 'confusion'];
  const mode = config.mode === 'mixed' ? modes[round % modes.length] : config.mode;
  let pool = LETTERS.slice(0, config.range).map(l => l.upper);
  if (mode === 'confusion') pool = CONFUSIONS.flat().map(l => l.toUpperCase());
  // A seeded sweep covers new letters; every third round may revisit a difficult one.
  const sweep = shuffle(pool, random(seed + level));
  let target = sweep[round % sweep.length];
  if (round % 3 === 2 && (config.range > 3 || round >= 3)) {
    const weighted = pool.flatMap(l => {
      const count = confusionWeight(progress.confusions, l);
      return Array.from({ length: count }, () => l);
    });
    if (weighted.length) target = weighted[Math.floor(rng() * weighted.length)];
  }
  const pair = CONFUSIONS.find(p => p.includes(target.toLowerCase()))?.map(x => x.toUpperCase()).find(x => x !== target);
  let distractors = shuffle(pool.filter(x => x !== target), rng);
  // C and K have the same initial phoneme. Never present both for a sound-only question.
  if (mode === 'phonics') distractors = distractors.filter(x => letter(x).sound !== letter(target).sound);
  if (mode === 'confusion' && pair) distractors = [pair, ...distractors.filter(x => x !== pair)];
  return { id: `${seed}-${level}-${round}`, target, mode, options: shuffle([target, ...distractors.slice(0, config.choices - 1)], rng) };
}
export function instruction(q: Question): string {
  const item = letter(q.target);
  switch (q.mode) {
    case 'matching': return `Find lowercase ${item.upper}.`;
    case 'phonics': return q.target === 'X' ? 'Listen to box. Which letter makes the last sound, in box?' : q.target === 'Q' ? 'Listen to queen. Which letter works with U at the start of queen?' : `Listen to ${item.word}. Which letter makes the first sound in ${item.word}?`;
    case 'picture': return `Find the picture for ${item.upper}. ${item.upper} is for ${item.word}.`;
    default: return `Find the letter ${item.upper}.`;
  }
}
export function successFeedback(q: Question, index: number): string {
  const l = letter(q.target);
  const opening = ['Wonderful!', 'You found it!', 'Great finding!', 'Lovely work!'][index % 4];
  return `${opening} ${l.upper}${q.mode === 'matching' ? ` and ${l.lower} are letter friends.` : q.target === 'X' ? ' makes the last sound in box.' : q.target === 'Q' ? ' works with U in queen.' : ` is for ${l.word}.`}`;
}
