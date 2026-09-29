import { LETTERS } from "../english/content";
import type { JourneyActivity, JourneyLevel, JourneyWorld } from "./types";

type ActivitySeed = Omit<JourneyActivity, "world" | "levelId">;

export const JOURNEY_WORLDS: JourneyWorld[] = [
  { id: 1, slug: "alphabet-adventure", title: "Alphabet Adventure", shortTitle: "ABC", icon: "Aa", stage: "Letters", description: "Meet, find and match A–Z." },
  { id: 2, slug: "letter-writing", title: "Letter Writing School", shortTitle: "Write", icon: "✎", stage: "Writing", description: "Trace, copy and remember letters." },
  { id: 3, slug: "phonics-forest", title: "Phonics Forest", shortTitle: "Sounds", icon: "🔊", stage: "Phonics", description: "Connect letters and sounds, then blend." },
  { id: 4, slug: "first-words", title: "First Words", shortTitle: "Words", icon: "CAT", stage: "Words", description: "Build, read and spell useful words." },
  { id: 5, slug: "vocabulary-world", title: "Vocabulary World", shortTitle: "Vocab", icon: "●", stage: "Words", description: "Grow useful everyday English." },
  { id: 6, slug: "spelling-lab", title: "Spelling Lab", shortTitle: "Spell", icon: "ABC", stage: "Writing", description: "Hear, segment and write words." },
  { id: 7, slug: "sentence-city", title: "Sentence City", shortTitle: "Sentence", icon: "I am.", stage: "Sentences", description: "Build clear English sentences." },
  { id: 8, slug: "talk-with-kichu", title: "Talk with Kichu", shortTitle: "Speak", icon: "💬", stage: "Speaking", description: "Listen, repeat and speak in situations." },
  { id: 9, slug: "reading-road", title: "Reading Road", shortTitle: "Read", icon: "▤", stage: "Reading", description: "Read words, sentences and short texts." },
  { id: 10, slug: "grammar-garden", title: "Grammar Garden", shortTitle: "Grammar", icon: "✓", stage: "Sentences", description: "Use grammar inside meaningful language." },
  { id: 11, slug: "story-island", title: "Story Island", shortTitle: "Story", icon: "◫", stage: "Reading", description: "Read, predict, sequence and retell." },
  { id: 12, slug: "poem-park", title: "Poem & Rhyme Park", shortTitle: "Rhyme", icon: "♪", stage: "Reading", description: "Build rhythm, rhyme and fluency." },
  { id: 13, slug: "comprehension-quest", title: "Comprehension Quest", shortTitle: "Understand", icon: "?", stage: "Reading", description: "Find meaning in sentences and texts." },
  { id: 14, slug: "paragraph-builder", title: "Paragraph Builder", shortTitle: "Paragraph", icon: "¶", stage: "Paragraphs", description: "Plan, order and create paragraphs." },
  { id: 15, slug: "creative-writing", title: "Creative Writing Studio", shortTitle: "Create", icon: "✦", stage: "Independent", description: "Turn ideas into connected writing." },
  { id: 16, slug: "real-life-english", title: "Real-Life English", shortTitle: "Use", icon: "◎", stage: "Independent", description: "Use English at home, school and outside." },
];

function neighbors(index: number, count = 3) {
  const indexes = new Set<number>([index]);
  let step = 1;
  while (indexes.size < count) {
    indexes.add((index + step) % LETTERS.length);
    if (indexes.size < count) indexes.add((index - step + LETTERS.length) % LETTERS.length);
    step += 1;
  }
  return [...indexes].map((i) => LETTERS[i]);
}

function rotate<T>(items: T[], by: number) {
  if (!items.length) return items;
  const offset = by % items.length;
  return [...items.slice(offset), ...items.slice(0, offset)];
}

function makeLetterLevel(index: number): JourneyLevel {
  const item = LETTERS[index];
  const group = neighbors(index, index < 3 ? 3 : 4);
  const upperChoices = rotate(group, index % group.length).map((letter) => ({
    id: letter.upper,
    label: `Letter ${letter.upper}`,
    visual: letter.upper,
  }));
  const lowerChoices = rotate(group, (index + 1) % group.length).map((letter) => ({
    id: letter.lower,
    label: `Lowercase ${letter.lower}`,
    visual: letter.lower,
  }));
  const pictureChoices = rotate(group, (index + 2) % group.length).map((letter) => ({
    id: letter.upper,
    label: letter.word,
    pictureKey: letter.upper,
  }));
  const id = `letter-${item.lower}`;
  return {
    id,
    world: 1,
    code: `ABC ${String(index + 1).padStart(2, "0")}`,
    title: `${item.upper} ${item.lower}`,
    subtitle: `${item.upper} is for ${item.word}`,
    stage: "Letters",
    activities: [
      {
        id: `${id}-meet`, world: 1, levelId: id, kind: "teach-letter", skill: "Letter knowledge",
        prompt: `Meet ${item.upper}`, spokenPrompt: `This is ${item.upper}. ${item.upper} is for ${item.word}.`,
        reinforcement: `${item.upper}. ${item.word}.`, target: item.upper, word: item.word,
        masteryTags: ["alphabet", `letter-${item.lower}`, "letter-name"],
      },
      {
        id: `${id}-find`, world: 1, levelId: id, kind: "choice", skill: "Uppercase recognition",
        prompt: `Find ${item.upper}`, spokenPrompt: `Find the letter ${item.upper}.`,
        reinforcement: `Yes. ${item.upper}.`, target: item.upper, choices: upperChoices, correctId: item.upper,
        masteryTags: ["alphabet", `letter-${item.lower}`, "uppercase"],
      },
      {
        id: `${id}-lower`, world: 1, levelId: id, kind: "choice", skill: "Upper and lowercase",
        prompt: `Find little ${item.lower}`, spokenPrompt: `Find little ${item.lower}.`,
        reinforcement: `${item.upper} and ${item.lower}.`, target: item.lower, choices: lowerChoices, correctId: item.lower,
        masteryTags: ["alphabet", `letter-${item.lower}`, "lowercase"],
      },
      {
        id: `${id}-picture`, world: 1, levelId: id, kind: "choice", skill: "Letter and word connection",
        prompt: `${item.upper} is for…`, spokenPrompt: `${item.upper} is for ${item.word}. Find ${item.word}.`,
        reinforcement: `${item.word} starts with ${item.upper}.`, target: item.upper, word: item.word,
        choices: pictureChoices, correctId: item.upper,
        masteryTags: ["alphabet", `letter-${item.lower}`, "vocabulary"],
      },
      {
        id: `${id}-trace`, world: 2, levelId: id, kind: "trace", skill: "Letter formation",
        prompt: `Trace ${item.upper}`, spokenPrompt: `Trace over the letter ${item.upper}.`,
        reinforcement: `You wrote ${item.upper}.`, target: item.upper, word: item.word,
        supportText: `${item.upper} ${item.lower}`,
        masteryTags: ["handwriting", `letter-${item.lower}`, "formation"],
      },
    ],
  };
}

export const LETTER_LEVELS: JourneyLevel[] = LETTERS.map((_, index) => makeLetterLevel(index));

const level = (
  id: string,
  world: number,
  code: string,
  title: string,
  subtitle: string,
  stage: JourneyLevel["stage"],
  activities: ActivitySeed[],
): JourneyLevel => ({ id, world, code, title, subtitle, stage, activities: activities.map((a) => ({ ...a, levelId: id, world })) });

export const CORE_LEVELS: JourneyLevel[] = [
  level("phonics-satpin", 3, "PH 01", "First sound team", "s · a · t · p · i · n", "Phonics", [
    { id:"ph-s",kind:"choice",skill:"Letter-sound",prompt:"Find /s/",spokenPrompt:"Find the letter for sss.",reinforcement:"S says sss.",target:"S",correctId:"S",choices:[{id:"S",label:"S",visual:"S"},{id:"M",label:"M",visual:"M"},{id:"F",label:"F",visual:"F"}],masteryTags:["phonics","s"] },
    { id:"ph-m",kind:"choice",skill:"Beginning sound",prompt:"Moon starts…",spokenPrompt:"Moon starts with which letter?",reinforcement:"Moon starts with M.",target:"M",correctId:"M",choices:[{id:"M",label:"M",visual:"M"},{id:"N",label:"N",visual:"N"},{id:"W",label:"W",visual:"W"}],masteryTags:["phonics","beginning-sound"] },
    { id:"ph-cat",kind:"word-builder",skill:"Blending and encoding",prompt:"Make CAT",spokenPrompt:"Build the word cat. C, A, T.",reinforcement:"C, A, T. Cat!",word:"CAT",tiles:["T","C","A"],answer:["C","A","T"],masteryTags:["phonics","cvc","blend"] },
    { id:"ph-map",kind:"word-builder",skill:"Blending and encoding",prompt:"Make MAP",spokenPrompt:"Build the word map. M, A, P.",reinforcement:"M, A, P. Map!",word:"MAP",tiles:["P","A","M"],answer:["M","A","P"],masteryTags:["phonics","cvc","blend"] },
  ]),
  level("words-first", 4, "WD 01", "Build first words", "cat · sun · map · hat", "Words", [
    { id:"wd-cat",kind:"word-builder",skill:"Word building",prompt:"Build CAT",spokenPrompt:"Build cat.",reinforcement:"Cat.",word:"CAT",tiles:["A","T","C"],answer:["C","A","T"],masteryTags:["word-reading","cat"] },
    { id:"wd-sun",kind:"word-builder",skill:"Word building",prompt:"Build SUN",spokenPrompt:"Build sun.",reinforcement:"Sun.",word:"SUN",tiles:["N","S","U"],answer:["S","U","N"],masteryTags:["word-reading","sun"] },
    { id:"wd-hat",kind:"word-builder",skill:"Spelling",prompt:"Spell HAT",spokenPrompt:"Spell hat.",reinforcement:"H, A, T. Hat.",word:"HAT",tiles:["A","H","T"],answer:["H","A","T"],masteryTags:["spelling","hat"] },
    { id:"wd-map",kind:"read",skill:"Word reading",prompt:"Read it",spokenPrompt:"Read this word. Map.",reinforcement:"Map.",modelText:"MAP",supportText:"Tap the word to hear it.",masteryTags:["word-reading","map"] },
  ]),
  level("vocab-school", 5, "VC 01", "School words", "bag · book · pen · desk", "Words", [
    { id:"vc-book",kind:"choice",skill:"Vocabulary",prompt:"Find book",spokenPrompt:"Find the book.",reinforcement:"Book.",correctId:"book",choices:[{id:"book",label:"Book",visual:"📘"},{id:"bag",label:"Bag",visual:"🎒"},{id:"pen",label:"Pen",visual:"✏️"}],masteryTags:["vocabulary","school"] },
    { id:"vc-bag",kind:"choice",skill:"Vocabulary",prompt:"Find bag",spokenPrompt:"Find the bag.",reinforcement:"Bag.",correctId:"bag",choices:[{id:"desk",label:"Desk",visual:"▰"},{id:"bag",label:"Bag",visual:"🎒"},{id:"book",label:"Book",visual:"📘"}],masteryTags:["vocabulary","school"] },
    { id:"vc-action",kind:"speak",skill:"Spoken vocabulary",prompt:"Say it",spokenPrompt:"Listen. I have a book. Now you say it.",reinforcement:"Great speaking.",modelText:"I have a book.",supportText:"Listen → Say",masteryTags:["speaking","school"] },
  ]),
  level("spell-cvc", 6, "SP 01", "Hear and spell", "Simple three-sound words", "Writing", [
    { id:"sp-dog",kind:"word-builder",skill:"Spelling",prompt:"Spell DOG",spokenPrompt:"Spell dog. D, O, G.",reinforcement:"Dog.",word:"DOG",tiles:["G","D","O"],answer:["D","O","G"],masteryTags:["spelling","cvc"] },
    { id:"sp-cup",kind:"word-builder",skill:"Spelling",prompt:"Spell CUP",spokenPrompt:"Spell cup. C, U, P.",reinforcement:"Cup.",word:"CUP",tiles:["U","P","C"],answer:["C","U","P"],masteryTags:["spelling","cvc"] },
    { id:"sp-red",kind:"word-builder",skill:"Spelling",prompt:"Spell RED",spokenPrompt:"Spell red. R, E, D.",reinforcement:"Red.",word:"RED",tiles:["D","R","E"],answer:["R","E","D"],masteryTags:["spelling","cvc"] },
  ]),
  level("sentence-i-see", 7, "SN 01", "Build a sentence", "I see a cat.", "Sentences", [
    { id:"sn-cat",kind:"sentence-builder",skill:"Sentence formation",prompt:"Make a sentence",spokenPrompt:"Build the sentence. I see a cat.",reinforcement:"I see a cat.",tiles:["cat.","see","I","a"],answer:["I","see","a","cat."],masteryTags:["sentence","word-order"] },
    { id:"sn-dog",kind:"sentence-builder",skill:"Sentence formation",prompt:"Make a sentence",spokenPrompt:"Build the sentence. I see a dog.",reinforcement:"I see a dog.",tiles:["a","dog.","I","see"],answer:["I","see","a","dog."],masteryTags:["sentence","word-order"] },
    { id:"sn-read",kind:"read",skill:"Sentence reading",prompt:"Read with me",spokenPrompt:"Read with me. I see a red ball.",reinforcement:"I see a red ball.",modelText:"I see a red ball.",supportText:"Tap to hear it again.",masteryTags:["sentence-reading"] },
  ]),
  level("speak-hello", 8, "TK 01", "Hello, Kichu!", "Listen → repeat → answer", "Speaking", [
    { id:"tk-name",kind:"speak",skill:"Guided speaking",prompt:"Your turn",spokenPrompt:"Listen. My name is Kichu. Now say, My name is, and your name.",reinforcement:"Nice speaking.",modelText:"My name is …",supportText:"Listen → Say",masteryTags:["speaking","introduction"] },
    { id:"tk-feeling",kind:"speak",skill:"Guided speaking",prompt:"How are you?",spokenPrompt:"How are you? Say, I am happy.",reinforcement:"Great. I am happy.",modelText:"I am happy.",supportText:"Listen → Say",masteryTags:["speaking","feelings"] },
    { id:"tk-water",kind:"speak",skill:"Practical speaking",prompt:"Ask politely",spokenPrompt:"Say, Can I have water, please?",reinforcement:"Lovely polite English.",modelText:"Can I have water, please?",supportText:"Listen → Say",masteryTags:["speaking","request"] },
  ]),
  level("read-mini", 9, "RD 01", "Read a mini text", "Short connected reading", "Reading", [
    { id:"rd-1",kind:"read",skill:"Reading fluency",prompt:"Read with me",spokenPrompt:"Sam has a red hat. The hat is big.",reinforcement:"Nice reading.",modelText:"Sam has a red hat.\nThe hat is big.",supportText:"Tap the text to hear it.",masteryTags:["reading","fluency"] },
    { id:"rd-q",kind:"choice",skill:"Reading comprehension",prompt:"What is red?",spokenPrompt:"What is red?",reinforcement:"The hat is red.",correctId:"hat",choices:[{id:"hat",label:"Hat",visual:"🎩"},{id:"sun",label:"Sun",visual:"☀️"},{id:"book",label:"Book",visual:"📘"}],masteryTags:["comprehension","literal"] },
  ]),
  level("grammar-actions", 10, "GR 01", "Who does what?", "Use nouns and action words", "Sentences", [
    { id:"gr-run",kind:"sentence-builder",skill:"Grammar in context",prompt:"Build it",spokenPrompt:"Build the sentence. The dog can run.",reinforcement:"The dog can run.",tiles:["run.","dog","can","The"],answer:["The","dog","can","run."],masteryTags:["grammar","verb"] },
    { id:"gr-is",kind:"sentence-builder",skill:"Grammar in context",prompt:"Build it",spokenPrompt:"Build the sentence. The ball is red.",reinforcement:"The ball is red.",tiles:["red.","is","ball","The"],answer:["The","ball","is","red."],masteryTags:["grammar","adjective"] },
  ]),
  level("story-rain", 11, "ST 01", "A rainy walk", "Read → understand → sequence", "Reading", [
    { id:"st-read",kind:"read",skill:"Story reading",prompt:"Story time",spokenPrompt:"Mia sees rain. She takes her umbrella. She walks to school.",reinforcement:"Story read.",modelText:"Mia sees rain.\nShe takes her umbrella.\nShe walks to school.",masteryTags:["story","sequence"] },
    { id:"st-q",kind:"choice",skill:"Story comprehension",prompt:"What did Mia take?",spokenPrompt:"What did Mia take?",reinforcement:"Mia took her umbrella.",correctId:"umbrella",choices:[{id:"umbrella",label:"Umbrella",visual:"☂️"},{id:"ball",label:"Ball",visual:"⚽"},{id:"fish",label:"Fish",visual:"🐟"}],masteryTags:["story","comprehension"] },
  ]),
  level("rhyme-cat", 12, "RY 01", "Cat, hat, mat", "Hear and complete a rhyme", "Reading", [
    { id:"ry-hat",kind:"choice",skill:"Rhyme",prompt:"Cat + ?",spokenPrompt:"Which word rhymes with cat?",reinforcement:"Cat, hat. They rhyme.",correctId:"hat",choices:[{id:"hat",label:"Hat",visual:"🎩"},{id:"dog",label:"Dog",visual:"🐶"},{id:"sun",label:"Sun",visual:"☀️"}],masteryTags:["rhyme"] },
    { id:"ry-say",kind:"speak",skill:"Rhythm and fluency",prompt:"Say the rhyme",spokenPrompt:"Cat, hat, mat. Say it with me.",reinforcement:"Great rhythm.",modelText:"Cat, hat, mat!",supportText:"Listen → Say",masteryTags:["rhyme","speaking"] },
  ]),
  level("comprehension-school", 13, "CQ 01", "Understand a paragraph", "Who · what · where", "Reading", [
    { id:"cq-read",kind:"read",skill:"Paragraph reading",prompt:"Read",spokenPrompt:"Asha has a blue bag. She puts a book and a pen inside. Then she goes to school.",reinforcement:"Good reading.",modelText:"Asha has a blue bag.\nShe puts a book and a pen inside.\nThen she goes to school.",masteryTags:["paragraph-reading"] },
    { id:"cq-where",kind:"choice",skill:"Comprehension",prompt:"Where does Asha go?",spokenPrompt:"Where does Asha go?",reinforcement:"Asha goes to school.",correctId:"school",choices:[{id:"school",label:"School",visual:"🏫"},{id:"park",label:"Park",visual:"🌳"},{id:"shop",label:"Shop",visual:"🏪"}],masteryTags:["comprehension","where"] },
  ]),
  level("paragraph-my-dog", 14, "PB 01", "Build a paragraph", "Idea → sentences → order", "Paragraphs", [
    { id:"pb-order",kind:"paragraph-builder",skill:"Paragraph organisation",prompt:"Put in order",spokenPrompt:"Put the sentences in a good order.",reinforcement:"You built a paragraph.",tiles:["We play in the park.","I have a dog.","His name is Max."],answer:["I have a dog.","His name is Max.","We play in the park."],masteryTags:["paragraph","sequence"] },
    { id:"pb-read",kind:"read",skill:"Paragraph fluency",prompt:"Read your paragraph",spokenPrompt:"I have a dog. His name is Max. We play in the park.",reinforcement:"That is a complete little paragraph.",modelText:"I have a dog.\nHis name is Max.\nWe play in the park.",masteryTags:["paragraph","reading"] },
  ]),
  level("creative-picture", 15, "CW 01", "Grow an idea", "Word → sentence → mini story", "Independent", [
    { id:"cw-sentence",kind:"sentence-builder",skill:"Creative sentence",prompt:"Make a sentence",spokenPrompt:"Make the sentence. The little cat runs.",reinforcement:"The little cat runs.",tiles:["runs.","little","The","cat"],answer:["The","little","cat","runs."],masteryTags:["creative-writing","sentence"] },
    { id:"cw-speak",kind:"speak",skill:"Oral composition",prompt:"Add one idea",spokenPrompt:"Tell one more thing about the cat.",reinforcement:"Great idea.",modelText:"The cat runs to …",supportText:"Finish it your way",masteryTags:["creative-writing","oral-language"] },
  ]),
  level("real-life-shop", 16, "RL 01", "At the shop", "Useful everyday English", "Independent", [
    { id:"rl-apples",kind:"speak",skill:"Practical English",prompt:"Ask for apples",spokenPrompt:"Say, Can I have two apples, please?",reinforcement:"Great real-life English.",modelText:"Can I have two apples, please?",supportText:"Listen → Say",masteryTags:["real-life","request"] },
    { id:"rl-bag",kind:"choice",skill:"Listening comprehension",prompt:"Find the bag",spokenPrompt:"Please put the apples in the bag. Find the bag.",reinforcement:"Bag.",correctId:"bag",choices:[{id:"bag",label:"Bag",visual:"🛍️"},{id:"book",label:"Book",visual:"📘"},{id:"ball",label:"Ball",visual:"⚽"}],masteryTags:["real-life","listening"] },
  ]),
];

export const ALL_LEVELS: JourneyLevel[] = [...LETTER_LEVELS, ...CORE_LEVELS];

export const LEVEL_BY_ID = Object.fromEntries(ALL_LEVELS.map((item) => [item.id, item])) as Record<string, JourneyLevel>;

export function levelsForWorld(worldId: number) {
  if (worldId === 2) return LETTER_LEVELS;
  return ALL_LEVELS.filter((item) => item.world === worldId);
}

export function firstIncompleteLevel(completedLevelIds: string[]) {
  return ALL_LEVELS.find((item) => !completedLevelIds.includes(item.id)) ?? ALL_LEVELS[0];
}
