import { allLessonsComplete, LESSON_KEY, parseLessons } from '../english/lessons';
import { REQUIRE_ALPHABET_BOOK } from './content';
export function soundMatchUnlocked(): boolean {
  if (!REQUIRE_ALPHABET_BOOK) return true;
  try { return allLessonsComplete(parseLessons(localStorage.getItem(LESSON_KEY))); } catch { return false; }
}
