import { LETTERS } from '../english/content';
import type { Mode, Round, SoundItem } from './types';

// Controlled short vowels, hard C/G, consonant Y; never feed IPA to a TTS voice.
// W uses watch, not whale, avoiding the /w/ versus /hw/ accent distinction.
const alternatives = ['ant','bear','car','duck','elephant','frog','gift','hen','ink','jet','king','lion','mouse','nose','ox','pig','quilt','rabbit','sock','tiger','up','vet','web','six','yes','zoo'];
export const SOUNDS: SoundItem[] = LETTERS.map((l, i) => ({
  id: l.upper, letter: l.upper, lowercase: l.lower, grapheme: l.upper === 'Q' ? 'Qu' : l.upper,
  phoneme: l.sound, primaryWord: l.upper === 'W' ? 'watch' : l.word,
  alternateWords: [alternatives[i]], image: `inline:skylora/${l.upper}`,
  position: l.upper === 'X' ? 'final' : l.upper === 'Q' ? 'cluster' : 'initial',
  note: l.upper === 'C' ? 'C spells /k/ in cat; C can spell other sounds.' : l.upper === 'G' ? 'Hard G as in goat, not soft G.' : l.upper === 'Q' ? 'Q works with U: qu spells the /k/ /w/ sequence in queen.' : l.upper === 'X' ? 'X spells /k/ /s/ at the end of box, not the beginning of X-ray.' : l.upper === 'O' ? 'Short O in octopus varies naturally by accent.' : 'One controlled example, not every sound this letter can spell.',
}));
export const sound = (id: string): SoundItem => {
  const item = SOUNDS.find(s => s.id === id);
  if (!item) throw new Error(`Unknown sound item: ${id}`);
  return item;
};
export const MODES: Mode[] = ['sound-to-letter','sound-to-picture','picture-to-letter','beginning-sound','letter-to-picture','similar-sound'];
export const PAIRS = [['B','P'],['D','T'],['F','V'],['S','Z'],['M','N']];
export const LEVELS = [
  { title: 'Listen & Find the Letter', short: 'First sounds', area: 'Whisper Meadow', mode: 'sound-to-letter', description: 'Hear a sound. Find its letter.', badge: 'First Sound' },
  { title: 'Listen & Find the Picture', short: 'Picture picnic', area: 'Picture Grove', mode: 'sound-to-picture', description: 'Listen for a picture friend.', badge: 'Picture Matcher' },
  { title: 'Picture to Letter', short: 'Letter friends', area: 'Letter Lagoon', mode: 'picture-to-letter', description: 'Help a picture find its letter.', badge: 'Sound Explorer' },
  { title: 'Beginning Sound Match', short: 'Hidden sounds', area: 'Echo Woods', mode: 'beginning-sound', description: 'Discover sounds inside words.', badge: 'Great Listener' },
  { title: 'Similar Sound Challenge', short: 'Listening twins', area: 'Listening Bridge', mode: 'similar-sound', description: 'Listen closely to sound neighbours.', badge: 'Careful Listener' },
  { title: 'Sound Detective', short: 'Sound detective', area: 'Sound Garden', mode: 'mixed', description: 'Find the hidden sounds!', badge: 'Sound Detective' },
] as const;
export const ROUNDS = 10;
// Independent practice is intentional. Set this to true to require the A–Z book.
export const REQUIRE_ALPHABET_BOOK = false;
export const pictureChoices = (mode: Mode) => mode === 'sound-to-picture' || mode === 'letter-to-picture';
export function instruction(q: Round): string {
  const s = sound(q.target);
  if (q.mode === 'letter-to-picture') return s.id === 'X' ? 'Find the picture with X at the end of its name.' : s.id === 'Q' ? 'Find the picture whose name starts with Q and U.' : `Find the picture whose name starts with ${s.letter}.`;
  if (q.mode === 'picture-to-letter') return s.id === 'X' ? 'Box. Which letter is at the end of box?' : s.id === 'Q' ? 'Queen. Which letters work together at the start of queen?' : `${s.primaryWord}. What letter does ${s.primaryWord} start with?`;
  if (s.id === 'X') return q.mode === 'sound-to-picture' ? 'Listen to box. Find the picture with the same last sounds in its name.' : 'Listen to box. Which letter spells the last sounds in box?';
  if (s.id === 'Q') return q.mode === 'sound-to-picture' ? 'Listen to queen. Find the picture with the same first sounds in its name.' : 'Listen to queen. Which letters spell the first sounds in queen?';
  if (q.mode === 'sound-to-picture') return `Listen to ${s.primaryWord}. Find the picture that starts with the same sound.`;
  return `Listen to ${s.primaryWord}. Which letter makes the first sound in ${s.primaryWord}?`;
}
export function reinforcement(q: Round, index: number): string {
  const s = sound(q.target), cheer = ['Great listening!', 'You found it!', 'Wonderful!', 'Nice work!', 'That’s right!'][index % 5];
  return `${cheer} ${s.id === 'X' ? 'X spells the last sounds in box.' : s.id === 'Q' ? 'Q and U work together in queen.' : `${s.letter} is for ${s.primaryWord}.`}`;
}
