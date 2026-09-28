import type { Mode } from './content';
export type Status = 'LOADING' | 'READY' | 'TUTORIAL' | 'PLAYING' | 'ANSWER_FEEDBACK' | 'HINT' | 'PAUSED' | 'LEVEL_COMPLETE' | 'GAME_COMPLETE' | 'ERROR';
export type Metrics = { completed: number; firstTry: number; attempts: number; hints: number; replays: number };
export type Question = { id: string; target: string; options: string[]; mode: Mode };
export type Session = { level: number; round: number; seed: number; attempted: number; hinted: boolean; hints: number; stats: Metrics; question?: Question };
export type Progress = {
  version: 1; tutorial: boolean; highest: number; sound: boolean; stars: number;
  levels: Record<string, Metrics>; letters: Record<string, Metrics>;
  confusions: Record<string, number>; caseConfusions: Record<string, number>; phonicsConfusions: Record<string, number>;
  metrics: Metrics; active: Session | null; lastPlayed: string | null;
};
export type GameState = { status: Status; progress: Progress; question: Question | null; wrong: string | null; feedback: string; available: boolean; error: string | null; level: number; result: Metrics | null };
export const emptyMetrics = (): Metrics => ({ completed: 0, firstTry: 0, attempts: 0, hints: 0, replays: 0 });
export const freshProgress = (): Progress => ({ version: 1, tutorial: false, highest: 1, sound: true, stars: 0, levels: {}, letters: {}, confusions: {}, caseConfusions: {}, phonicsConfusions: {}, metrics: emptyMetrics(), active: null, lastPlayed: null });
