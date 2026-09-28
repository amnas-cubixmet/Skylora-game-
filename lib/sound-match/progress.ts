import { reinforcement, ROUNDS } from './content';
import { confusionUpdate } from './difficulty';
import { generateRound } from './questions';
import { emptyMetrics, freshProgress, type Metrics, type Progress, type SkillRecord, type State } from './types';

export const initialState: State = { status: 'LOADING', progress: freshProgress(), question: null, level: 1, wrong: null, feedback: '', correct: false, available: true, beforePause: 'PLAYING', error: null };
export type Action =
  | { type: 'LOAD'; progress: Progress; available: boolean }
  | { type: 'START'; level: number; seed: number; restart?: boolean }
  | { type: 'SELECT'; value: string; date: string; supported?: boolean }
  | { type: 'SETTING'; key: 'voice' | 'sfx' | 'autoContinue' }
  | { type: 'ACCENT'; value: Progress['settings']['accent'] }
  | { type: 'ERROR'; message: string }
  | { type: 'TUTORIAL' | 'TUTORIAL_DONE' | 'INTRO_DONE' | 'NEXT' | 'RETRY_READY' | 'HINT' | 'REPLAY' | 'PAUSE' | 'RESUME' | 'RESTART_ACTIVITY' | 'HOME' | 'STORAGE_UNAVAILABLE' };
export const addMetrics = (m: Metrics, d: Partial<Metrics>): Metrics => ({ rounds: m.rounds + (d.rounds ?? 0), first: m.first + (d.first ?? 0), attempts: m.attempts + (d.attempts ?? 0), hints: m.hints + (d.hints ?? 0), replays: m.replays + (d.replays ?? 0) });
const playable = (s: State) => ['PLAYING','HINT'].includes(s.status);
const introduced = (p: Progress, id: string) => [...p.introduced, id].slice(-52);
const emptySkill = (): SkillRecord => ({ alpha: 1, beta: 1, independentCorrect: 0, supportedCorrect: 0, incorrectAttempts: 0, hints: 0, replays: 0, lastPracticedAt: null });

export function reducer(state: State, action: Action): State {
  const p = state.progress, a = p.session, q = state.question;
  switch (action.type) {
    case 'LOAD': return { ...initialState, status: 'READY', progress: action.progress, available: action.available };
    case 'STORAGE_UNAVAILABLE': return { ...state, available: false };
    case 'ERROR': return { ...state, status: 'ERROR', error: action.message };
    case 'SETTING': return { ...state, progress: { ...p, settings: { ...p.settings, [action.key]: !p.settings[action.key] } } };
    case 'ACCENT': return { ...state, progress: { ...p, settings: { ...p.settings, accent: action.value } } };
    case 'TUTORIAL': return { ...state, status: 'TUTORIAL' };
    case 'TUTORIAL_DONE': return { ...state, status: 'READY', progress: { ...p, tutorialCompleted: true } };
    case 'HOME': return { ...state, status: 'READY', question: null, wrong: null, correct: false, feedback: '' };
    case 'START': {
      if (!Number.isInteger(action.level) || action.level < 1 || action.level > p.highestUnlockedLevel) return state;
      const question = generateRound(action.level, 0, p, action.seed);
      const session = !action.restart && a?.level === action.level ? a : { level: action.level, seed: action.seed, index: 0, question, attempts: 0, hints: 0, roundReplays: 0, stats: emptyMetrics() };
      return { ...state, status: 'ROUND_INTRO', level: action.level, question: session.question, wrong: null, correct: false, feedback: '', progress: { ...p, currentLevel: action.level, session, introduced: introduced(p, session.question.target) } };
    }
    case 'INTRO_DONE': return state.status === 'ROUND_INTRO' ? { ...state, status: a?.hints ? 'HINT' : 'PLAYING' } : state;
    case 'PAUSE': return ['ROUND_INTRO','PLAYING','HINT','ANSWER_FEEDBACK'].includes(state.status) ? { ...state, status: 'PAUSED', beforePause: state.status } : state;
    case 'RESUME': return state.status === 'PAUSED' ? { ...state, status: state.beforePause === 'ROUND_INTRO' ? 'PLAYING' : state.beforePause } : state;
    case 'RESTART_ACTIVITY': return a ? { ...state, status: 'ROUND_INTRO', question: a.question, correct: false, wrong: null, feedback: '', progress: { ...p, session: { ...a, attempts: 0, hints: 0, roundReplays: 0 } } } : { ...state, status: state.level === 6 ? 'GAME_COMPLETE' : 'LEVEL_COMPLETE' };
    case 'RETRY_READY': return state.status === 'ANSWER_FEEDBACK' && !state.correct ? { ...state, status: a?.hints ? 'HINT' : 'PLAYING' } : state;
    case 'NEXT': {
      if (state.status !== 'ANSWER_FEEDBACK' || !state.correct) return state;
      return { ...state, status: a ? 'ROUND_INTRO' : state.level === 6 ? 'GAME_COMPLETE' : 'LEVEL_COMPLETE', question: a?.question ?? null, correct: false, wrong: null, feedback: '', progress: a ? { ...p, introduced: introduced(p, a.question.target) } : p };
    }
    case 'HINT': case 'REPLAY': {
      if (!playable(state) || !a || !q) return state;
      const hint = action.type === 'HINT', delta = hint ? { hints: 1 } : { replays: 1 };
      const key = `${q.mode}:${q.target}`, previous = p.skills[key] ?? emptySkill();
      return { ...state, status: hint ? 'HINT' : state.status, feedback: hint ? 'Look for the gentle glow. Listen once more.' : state.feedback, progress: { ...p, skills: { ...p.skills, [key]: { ...previous, hints: previous.hints + Number(hint), replays: previous.replays + Number(!hint) } }, hintsUsed: p.hintsUsed + Number(hint), audioReplays: p.audioReplays + Number(!hint), byMode: { ...p.byMode, [q.mode]: addMetrics(p.byMode[q.mode] ?? emptyMetrics(), delta) }, session: { ...a, hints: a.hints + Number(hint), roundReplays: a.roundReplays + Number(!hint), stats: addMetrics(a.stats, delta) } } };
    }
    case 'SELECT': {
      if (!playable(state) || !a || !q || !q.options.includes(action.value)) return state;
      const correct = action.value === q.target, first = correct && a.attempts === 0 && a.hints === 0 && a.roundReplays === 0 && !action.supported;
      const autoHint = !correct && a.attempts === 1 && a.hints === 0;
      const delta = { rounds: Number(correct), first: Number(first), attempts: 1, hints: Number(autoHint) };
      const stats = addMetrics(a.stats, delta);
      const skillKey = `${q.mode}:${q.target}`;
      const previousSkill: SkillRecord = p.skills[skillKey] ?? emptySkill();
      const skill: SkillRecord = correct ? { ...previousSkill, alpha: previousSkill.alpha + (a.hints > 0 || action.supported ? 0.25 : a.attempts > 0 ? 0.5 : a.roundReplays > 0 ? 0.8 : 1), independentCorrect: previousSkill.independentCorrect + Number(first), supportedCorrect: previousSkill.supportedCorrect + Number(!first), hints: previousSkill.hints, replays: previousSkill.replays, lastPracticedAt: action.date } : { ...previousSkill, beta: previousSkill.beta + 1, incorrectAttempts: previousSkill.incorrectAttempts + 1, hints: previousSkill.hints + Number(autoHint), replays: previousSkill.replays, lastPracticedAt: action.date };
      let progress: Progress = { ...p, skills: { ...p.skills, [skillKey]: skill }, lastPlayedAt: action.date, totalAttempts: p.totalAttempts + 1, hintsUsed: p.hintsUsed + Number(autoHint), totalRounds: p.totalRounds + Number(correct), firstAttemptCorrect: p.firstAttemptCorrect + Number(first), byMode: { ...p.byMode, [q.mode]: addMetrics(p.byMode[q.mode] ?? emptyMetrics(), delta) }, session: { ...a, attempts: a.attempts + 1, hints: a.hints + Number(autoHint), stats } };
      if (!correct) return { ...state, status: 'ANSWER_FEEDBACK', correct: false, wrong: action.value, feedback: a.attempts === 0 ? 'Try again.' : 'Let’s listen carefully.', progress: { ...progress, ...confusionUpdate(p, q.target, action.value) } };
      progress = { ...progress, recent: [...p.recent, first].slice(-10), difficultLetters: { ...p.difficultLetters, [q.target]: Math.max(0, (p.difficultLetters[q.target] ?? 0) - Number(first)) } };
      if (a.index === ROUNDS - 1) progress = { ...progress, session: null, highestUnlockedLevel: Math.max(p.highestUnlockedLevel, Math.min(6, a.level + 1)), completedLevels: Array.from(new Set([...p.completedLevels, a.level])).sort(), history: [...p.history, { level: a.level, date: action.date, stats }].slice(-20) };
      else progress.session = { ...a, index: a.index + 1, attempts: 0, hints: 0, roundReplays: 0, stats, question: generateRound(a.level, a.index + 1, progress, a.seed) };
      return { ...state, status: 'ANSWER_FEEDBACK', correct: true, wrong: null, feedback: reinforcement(q, a.seed + a.index), progress };
    }
  }
}
