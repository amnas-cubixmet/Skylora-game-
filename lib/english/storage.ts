import { LETTERS } from './content';
import { freshProgress, emptyMetrics, type Progress, type Metrics, type Session } from './types';
export const STORAGE_KEY = 'skylora:english-az:progress:v1';
const object = (value: unknown): Record<string, unknown> => value !== null && typeof value === 'object' && !Array.isArray(value) ? value as Record<string, unknown> : {};
const count = (v: unknown, max = 1_000_000) => typeof v === 'number' && Number.isFinite(v) ? Math.min(max, Math.max(0, Math.floor(v))) : 0;
function metrics(v: unknown): Metrics { const o = object(v); return { completed: count(o.completed), firstTry: Math.min(count(o.firstTry), count(o.completed)), attempts: count(o.attempts), hints: count(o.hints), replays: count(o.replays) }; }
function counts(v: unknown) { return Object.fromEntries(Object.entries(object(v)).filter(([k]) => /^[A-Z]:[A-Z]$/.test(k)).map(([k,n]) => [k,count(n)])); }
export function parseProgress(raw: string | null): Progress {
  const defaults = freshProgress();
  if (!raw) return defaults;
  try {
    const o = object(JSON.parse(raw)); if (o.version !== 1) return defaults;
    const highest = Math.max(1,count(o.highest,10));
    const a = object(o.active);
    let active: Session | null = null;
    if (typeof a.level === 'number' && a.level >= 1 && a.level <= highest && Number.isInteger(a.level) && typeof a.seed === 'number' && Number.isFinite(a.seed) && typeof a.round === 'number' && a.round >= 0 && a.round < 10 && Number.isInteger(a.round)) {
      active = { level: a.level, seed: count(a.seed, 0xffffffff), round: a.round, attempted: count(a.attempted), hinted: a.hinted === true, hints: count(a.hints), stats: metrics(a.stats) };
      const q = object(a.question);
      if (typeof q.id === 'string' && typeof q.target === 'string' && LETTERS.some(l=>l.upper === q.target) && Array.isArray(q.options) && q.options.length >= 3 && q.options.length <= 6 && q.options.every(x=>LETTERS.some(l=>l.upper === x)) && new Set(q.options).size === q.options.length && q.options.includes(q.target) && ['recognition','matching','listening','phonics','picture','confusion'].includes(String(q.mode))) active.question = q as unknown as NonNullable<Session['question']>;
    }
    return { ...defaults, tutorial: o.tutorial === true, highest, sound: o.sound !== false, stars: count(o.stars), active,
      metrics: metrics(o.metrics), lastPlayed: typeof o.lastPlayed === 'string' && !isNaN(Date.parse(o.lastPlayed)) ? o.lastPlayed : null,
      levels: Object.fromEntries(Object.entries(object(o.levels)).filter(([k]) => /^(10|[1-9])$/.test(k)).map(([k,v]) => [k,metrics(v)])),
      letters: Object.fromEntries(Object.entries(object(o.letters)).filter(([k]) => /^[A-Z]$/.test(k)).map(([k,v]) => [k,metrics(v)])),
      confusions: counts(o.confusions), caseConfusions: counts(o.caseConfusions), phonicsConfusions: counts(o.phonicsConfusions),
    };
  } catch { return defaults; }
}
export function loadProgress(): { progress: Progress; available: boolean } {
  try { return { progress: parseProgress(localStorage.getItem(STORAGE_KEY)), available: true }; }
  catch { return { progress: freshProgress(), available: false }; }
}
export function saveProgress(progress: Progress): boolean {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(progress)); return true; } catch { return false; }
}
export { emptyMetrics };
