export const LESSON_KEY = 'skylora:english-az:lessons:v1';
export const LESSONS = [
 ['A','Apple|🍎','Ant|🐜','Alligator|🐊','Astronaut|🧑‍🚀','Ambulance|🚑'],
 ['B','Ball|⚽','Bear|🐻','Banana|🍌','Butterfly|🦋','Bus|🚌'],
 ['C','Cat|🐈','Car|🚗','Cake|🎂','Cow|🐄','Carrot|🥕'],
 ['D','Dog|🐕','Duck|🦆','Drum|🥁','Dolphin|🐬','Door|🚪'],
 ['E','Elephant|🐘','Egg|🥚','Elf|🧝','Envelope|✉️','Elbow|💪'],
 ['F','Fish|🐟','Frog|🐸','Flower|🌼','Fox|🦊','Fire|🔥'],
 ['G','Goat|🐐','Grapes|🍇','Gorilla|🦍','Gift|🎁','Guitar|🎸'],
 ['H','Hat|🎩','Horse|🐎','House|🏠','Heart|❤️','Helicopter|🚁'],
 ['I','Igloo|🧊','Insect|🐞','Ink|🖋️','Iguana|🦎','Inch|📏'],
 ['J','Jam|🫙','Juice|🧃','Jellyfish|🪼','Jeans|👖','Jacket|🧥'],
 ['K','Kite|🪁','Key|🔑','Kangaroo|🦘','Koala|🐨','King|🤴'],
 ['L','Lion|🦁','Leaf|🍃','Lemon|🍋','Lamp|💡','Ladder|🪜'],
 ['M','Moon|🌙','Monkey|🐒','Mouse|🐁','Mango|🥭','Milk|🥛'],
 ['N','Nest|🪺','Nose|👃','Net|🥅','Nut|🥜','Notebook|📓'],
 ['O','Octopus|🐙','Orange|🍊','Otter|🦦','Ox|🐂','Ostrich|🪶'],
 ['P','Pig|🐖','Pen|🖊️','Pear|🍐','Penguin|🐧','Pizza|🍕'],
 ['Q','Queen|👑','Quilt|🛏️','Quail|🐦','Question|❓','Quarter|🪙'],
 ['R','Rabbit|🐇','Rainbow|🌈','Robot|🤖','Rocket|🚀','Rose|🌹'],
 ['S','Sun|☀️','Snake|🐍','Star|⭐','Sock|🧦','Sandwich|🥪'],
 ['T','Tiger|🐅','Tree|🌳','Train|🚂','Turtle|🐢','Tomato|🍅'],
 ['U','Umbrella|☂️','Up|⬆️','Under|⬇️','Uncle|👨','Umpire|🧑‍⚖️'],
 ['V','Van|🚐','Vest|🦺','Violin|🎻','Volcano|🌋','Vegetables|🥦'],
 ['W','Whale|🐋','Watch|⌚','Watermelon|🍉','Web|🕸️','Window|🪟'],
 ['X','Box|📦','Fox|🦊','Six|6️⃣','Wax|🕯️','Mix|🥣'],
 ['Y','Yak|🐂','Yam|🍠','Yo-yo|🪀','Yogurt|🥣','Yellow|🟡'],
 ['Z','Zebra|🦓','Zip|🤐','Zoo|🦒','Zero|0️⃣','Zigzag|〰️'],
].map(([letter,...words])=>({letter,words:words.map(item=>{const [word,picture]=item.split('|');const points=Array.from(picture).map(c=>c.codePointAt(0)!.toString(16));const code=(points.includes('200d')?points:points.filter(p=>p!=='fe0f')).join('-');return {word,picture,pictureSrc:`/images/words/${code}.svg`};})}));
export type LessonProgress = {version:1; explored:Record<string,string[]>};
export const freshLessons=():LessonProgress=>({version:1,explored:{}});
export function parseLessons(raw:string|null):LessonProgress {
 try {
  const value=JSON.parse(raw??'null');
  if(value?.version!==1||!value.explored||typeof value.explored!=='object')return freshLessons();
  return {version:1,explored:Object.fromEntries(LESSONS.map(l=>[l.letter,l.words.map(w=>w.word).filter(w=>Array.isArray(value.explored[l.letter])&&value.explored[l.letter].includes(w))]))};
 }catch{return freshLessons();}
}
export function lessonComplete(progress:LessonProgress,letter:string){return LESSONS.find(l=>l.letter===letter)?.words.every(w=>progress.explored[letter]?.includes(w.word))??false;}
export const allLessonsComplete=(progress:LessonProgress)=>LESSONS.every(l=>lessonComplete(progress,l.letter));
