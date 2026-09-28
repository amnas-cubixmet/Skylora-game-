import { MODES, SOUNDS, sound } from './content';
import { emptyMetrics, freshProgress, type Metrics, type Mode, type Progress, type Round, type Session, type SkillRecord } from './types';
export const STORAGE_KEY = 'skylora:sound-match:progress:v2';
const LEGACY_STORAGE_KEY = 'skylora:sound-match:progress:v1';
const object = (v: unknown): Record<string, unknown> => v !== null && typeof v === 'object' && !Array.isArray(v) ? v as Record<string, unknown> : {};
const count = (v: unknown, max = 1000000) => typeof v === 'number' && Number.isFinite(v) ? Math.max(0, Math.min(max, Math.floor(v))) : 0;
const validId = (v: unknown): v is string => typeof v === 'string' && SOUNDS.some(s => s.id === v);
const date = (v: unknown) => typeof v === 'string' && v.length < 40 && !isNaN(Date.parse(v)) ? v : null;
function metrics(value: unknown): Metrics {
  const v = object(value), rounds = count(v.rounds);
  return { ...emptyMetrics(), rounds, first: Math.min(rounds, count(v.first)), attempts: Math.max(rounds, count(v.attempts)), hints: count(v.hints), replays: count(v.replays) };
}
function counts(value: unknown, pair = false) {
  return Object.fromEntries(Object.entries(object(value)).filter(([k]) => pair ? /^[A-Z]:[A-Z]$/.test(k) : validId(k)).map(([k,v]) => [k,count(v,1000)]));
}
export function parseProgress(raw: string | null): Progress {
  const defaults = freshProgress();
  try {
    const p = object(JSON.parse(raw ?? 'null'));
    if (p.version !== 1 && p.version !== 2) return defaults;
    const highest = Math.max(1,count(p.highestUnlockedLevel,6)), settings = object(p.settings);
    const total = count(p.totalRounds);
    const progress: Progress = { ...defaults, tutorialCompleted: p.tutorialCompleted === true,
      highestUnlockedLevel: highest, currentLevel: Math.max(1,Math.min(highest,count(p.currentLevel,6))),
      completedLevels: Array.isArray(p.completedLevels) ? Array.from(new Set(p.completedLevels.filter((v): v is number => typeof v === 'number' && Number.isInteger(v) && v >= 1 && v <= highest))) : [],
      settings: { voice: settings.voice !== false, sfx: settings.sfx !== false, autoContinue: settings.autoContinue !== false, accent: ['en-IN','en-GB','en-US'].includes(String(settings.accent)) ? settings.accent as Progress['settings']['accent'] : defaults.settings.accent },
      totalRounds: total, firstAttemptCorrect: Math.min(total,count(p.firstAttemptCorrect)), totalAttempts: Math.max(total,count(p.totalAttempts)), hintsUsed: count(p.hintsUsed), audioReplays: count(p.audioReplays),
      difficultLetters: counts(p.difficultLetters), confusionPairs: counts(p.confusionPairs,true),
      introduced: Array.isArray(p.introduced) ? p.introduced.filter(validId).slice(-52) : [],
      recent: Array.isArray(p.recent) ? p.recent.filter((v):v is boolean => typeof v === 'boolean').slice(-10) : [],
      byMode: Object.fromEntries(Object.entries(object(p.byMode)).filter(([k]) => MODES.includes(k as Mode)).map(([k,v]) => [k,metrics(v)])),
      skills: Object.fromEntries(Object.entries(object(p.skills)).flatMap(([key,value]) => {
        const [mode,id] = key.split(':');
        if (!MODES.includes(mode as Mode) || !validId(id)) return [];
        const v = object(value), alpha = typeof v.alpha === 'number' && Number.isFinite(v.alpha) ? Math.max(1,Math.min(1000000,v.alpha)) : 1, beta = typeof v.beta === 'number' && Number.isFinite(v.beta) ? Math.max(1,Math.min(1000000,v.beta)) : 1;
        return [[key,{ alpha,beta,independentCorrect:count(v.independentCorrect),supportedCorrect:count(v.supportedCorrect),incorrectAttempts:count(v.incorrectAttempts),hints:count(v.hints),replays:count(v.replays),lastPracticedAt:date(v.lastPracticedAt) } satisfies SkillRecord]];
      })),
      history: Array.isArray(p.history) ? p.history.slice(-20).flatMap(v => { const h = object(v), d = date(h.date), level = count(h.level,6); return d && level >= 1 ? [{ level, date: d, stats: metrics(h.stats) }] : []; }) : [],
      lastPlayedAt: date(p.lastPlayedAt),
    };
    const a = object(p.session), q = object(a.question);
    const level = count(a.level,6), index = count(a.index,9);
    const mode = q.mode as Mode, target = validId(q.target) ? q.target : null;
    const validOptions = !!target && Array.isArray(q.options) && q.options.length >= 2 && q.options.length <= 4 && q.options.every(validId) && new Set(q.options).size === q.options.length && q.options.includes(target) && q.options.filter(id => sound(id).phoneme === sound(target).phoneme).length === 1;
    if (level === a.level && level >= 1 && level <= highest && index === a.index && Number.isInteger(a.seed) && Number(a.seed) >= 0 && Number(a.seed) <= 0x7fffffff && MODES.includes(mode) && validId(q.target) && validOptions && typeof q.id === 'string' && q.id === `${a.seed}:${level}:${index}`) {
      const options = q.options as string[];
      const question: Round = { id: q.id, mode, target: q.target as string, options, difficulty: options.length };
      const session: Session = { level, seed: Number(a.seed), index, question, attempts: count(a.attempts), hints: count(a.hints), roundReplays: count(a.roundReplays), stats: metrics(a.stats) };
      progress.session = session;
    }
    return progress;
  } catch { return defaults; }
}
// Replaceable repository boundary; UI and learning logic never call localStorage.
export interface ProgressStore { load(): { progress: Progress; available: boolean }; save(p: Progress): boolean }
export const localProgressStore: ProgressStore = {
  load() { try { return { progress: parseProgress(localStorage.getItem(STORAGE_KEY) ?? localStorage.getItem(LEGACY_STORAGE_KEY)), available: true }; } catch { return { progress: freshProgress(), available: false }; } },
  save(p) { try { localStorage.setItem(STORAGE_KEY,JSON.stringify(p)); localStorage.removeItem(LEGACY_STORAGE_KEY); return true; } catch { return false; } },
};
