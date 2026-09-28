export type Mode = 'sound-to-letter' | 'sound-to-picture' | 'picture-to-letter' | 'beginning-sound' | 'similar-sound' | 'letter-to-picture';
export type Status = 'LOADING' | 'READY' | 'TUTORIAL' | 'ROUND_INTRO' | 'PLAYING' | 'ANSWER_FEEDBACK' | 'HINT' | 'PAUSED' | 'LEVEL_COMPLETE' | 'GAME_COMPLETE' | 'ERROR';
export type SoundItem = {
  id: string; letter: string; lowercase: string; grapheme: string; phoneme: string;
  primaryWord: string; alternateWords: string[]; image: string;
  position: 'initial' | 'final' | 'cluster'; note: string;
  letterAudio?: string; phonemeAudio?: string; wordAudio?: string;
};
export type Round = { id: string; mode: Mode; target: string; options: string[]; difficulty: number };
export type Metrics = { rounds: number; first: number; attempts: number; hints: number; replays: number };
export type Session = { level: number; seed: number; index: number; question: Round; attempts: number; hints: number; stats: Metrics };
export type Progress = {
  version: 1; tutorialCompleted: boolean; highestUnlockedLevel: number; currentLevel: number;
  completedLevels: number[]; settings: { voice: boolean; sfx: boolean; autoContinue: boolean };
  totalRounds: number; firstAttemptCorrect: number; totalAttempts: number; hintsUsed: number; audioReplays: number;
  difficultLetters: Record<string, number>; confusionPairs: Record<string, number>; introduced: string[];
  byMode: Partial<Record<Mode, Metrics>>; recent: boolean[];
  history: { level: number; date: string; stats: Metrics }[]; lastPlayedAt: string | null; session: Session | null;
};
export type State = {
  status: Status; progress: Progress; question: Round | null; level: number; wrong: string | null;
  feedback: string; correct: boolean; available: boolean; beforePause: Status; error: string | null;
};
export const emptyMetrics = (): Metrics => ({ rounds: 0, first: 0, attempts: 0, hints: 0, replays: 0 });
export const freshProgress = (): Progress => ({
  version: 1, tutorialCompleted: false, highestUnlockedLevel: 1, currentLevel: 1, completedLevels: [],
  settings: { voice: true, sfx: true, autoContinue: true }, totalRounds: 0, firstAttemptCorrect: 0,
  totalAttempts: 0, hintsUsed: 0, audioReplays: 0, difficultLetters: {}, confusionPairs: {},
  introduced: [], byMode: {}, recent: [], history: [], lastPlayedAt: null, session: null,
});
