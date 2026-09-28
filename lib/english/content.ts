export const LETTERS = [
  ['A','apple','æ'], ['B','ball','b'], ['C','cat','k'], ['D','dog','d'],
  ['E','egg','ɛ'], ['F','fish','f'], ['G','goat','g'], ['H','hat','h'],
  ['I','insect','ɪ'], ['J','jam','dʒ'], ['K','kite','k'], ['L','leaf','l'],
  ['M','moon','m'], ['N','nest','n'], ['O','octopus','ɒ'], ['P','pear','p'],
  ['Q','queen','kw'], ['R','rainbow','r'], ['S','sun','s'], ['T','tree','t'],
  ['U','umbrella','ʌ'], ['V','van','v'], ['W','whale','w'], ['X','box','ks'],
  ['Y','yo-yo','j'], ['Z','zebra','z'],
].map(([upper, word, sound]) => ({ upper, lower: upper.toLowerCase(), word, sound }));
export const letter = (value: string) => LETTERS.find(l => l.upper === value.toUpperCase()) ?? LETTERS[0];
export const CONFUSIONS = [['b','d'],['p','q'],['m','n'],['u','v']];
export type Mode = 'recognition' | 'matching' | 'listening' | 'phonics' | 'picture' | 'confusion';
export const LEVELS: { title: string; description: string; range: number; choices: number; mode: Mode | 'mixed'; area: string }[] = [
  { title: 'First little letters', description: 'Meet A, B and C', range: 3, choices: 3, mode: 'recognition', area: 'Meadow' },
  { title: 'Into the garden', description: 'Explore A through F', range: 6, choices: 3, mode: 'recognition', area: 'Meadow' },
  { title: 'Treetop treasures', description: 'Find A through J', range: 10, choices: 4, mode: 'recognition', area: 'Forest' },
  { title: 'Alphabet explorer', description: 'Discover all 26 letters', range: 26, choices: 4, mode: 'recognition', area: 'Forest' },
  { title: 'Little letter friends', description: 'Match big and small letters', range: 26, choices: 4, mode: 'matching', area: 'Lagoon' },
  { title: 'Listening lagoon', description: 'Listen, then find the letter', range: 26, choices: 4, mode: 'listening', area: 'Lagoon' },
  { title: 'Sound safari', description: 'Hear sounds inside words', range: 26, choices: 4, mode: 'phonics', area: 'Skylands' },
  { title: 'Picture picnic', description: 'Find each letter’s picture', range: 26, choices: 4, mode: 'picture', area: 'Skylands' },
  { title: 'Look-alike valley', description: 'Discover b/d, p/q, m/n and u/v', range: 26, choices: 4, mode: 'confusion', area: 'Star castle' },
  { title: 'Alphabet detective', description: 'Your big little adventure', range: 26, choices: 6, mode: 'mixed', area: 'Star castle' },
];
export const BADGES = [
  { id: 'first', title: 'First Letter Finder', level: 1 },
  { id: 'explorer', title: 'Alphabet Explorer', level: 4 },
  { id: 'sound', title: 'Sound Detective', level: 7 },
  { id: 'star', title: 'A–Z Star', level: 10 },
];
