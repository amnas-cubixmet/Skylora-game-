import { PAIRS, SOUNDS } from './content';
import type { Progress } from './types';
export function introducedPool(level: number, index: number, p: Progress): string[] {
  if (level === 1 && !p.completedLevels.includes(1)) return 'AMSBFTCLP'.slice(0, index < 3 ? 3 : index < 6 ? 6 : 9).split('');
  if (level === 2) return 'AMSBFTCLP'.split('');
  if (level === 3) return 'ABCDEFGHIJ'.split('');
  if (level === 4) return 'ABCDEFGHIJKLMNOPRSTUVWYZ'.split('');
  if (level === 5) return PAIRS.flat();
  return SOUNDS.filter(s => level >= 3 || !['Q','X'].includes(s.id)).map(s => s.id);
}
export function choiceCount(level: number, index: number, p: Progress): number {
  if (level === 5) return 2;
  if (level === 2) return 3;
  if (level === 1) return index >= 3 && p.recent.slice(-3).length === 3 && p.recent.slice(-3).every(Boolean) ? 3 : 2;
  if (p.recent.slice(-3).filter(v => !v).length >= 2) return 2;
  return level >= 3 && index >= 5 && p.recent.slice(-4).length === 4 && p.recent.slice(-4).every(Boolean) ? 4 : 3;
}
export function confusionUpdate(p: Progress, target: string, selected: string) {
  const key = `${target}:${selected}`;
  return { difficultLetters: { ...p.difficultLetters, [target]: Math.min(1000, (p.difficultLetters[target] ?? 0) + 1) }, confusionPairs: { ...p.confusionPairs, [key]: Math.min(1000, (p.confusionPairs[key] ?? 0) + 1) } };
}
