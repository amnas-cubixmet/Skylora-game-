import { LETTERS } from "../english/content";
import type {
  JourneyActivity,
  JourneyLevel,
  JourneyProgress,
  JourneyStage,
  JourneyWorld,
} from "./types";

type ActivitySeed = Omit<JourneyActivity, "world" | "levelId">;
type LevelSeed = Omit<JourneyLevel, "globalNumber" | "activities"> & { activities: ActivitySeed[] };

export const WORLD_LEVEL_COUNTS: Record<number, number> = {
  1: 26, 2: 26, 3: 28, 4: 20, 5: 18, 6: 18, 7: 16, 8: 14,
  9: 16, 10: 12, 11: 12, 12: 10, 13: 12, 14: 8, 15: 6, 16: 8,
};

export const JOURNEY_WORLDS: JourneyWorld[] = [
  { id: 1, slug: "alphabet-adventure", title: "Alphabet Adventure", shortTitle: "ABC", icon: "Aa", stage: "Letters", description: "Meet, find and match A–Z.", levelCount: 26 },
  { id: 2, slug: "letter-writing", title: "Letter Writing School", shortTitle: "Write", icon: "✎", stage: "Writing", description: "Trace, copy and remember letters.", levelCount: 26 },
  { id: 3, slug: "phonics-forest", title: "Phonics Forest", shortTitle: "Sounds", icon: "🔊", stage: "Phonics", description: "Connect letters and sounds, then blend.", levelCount: 28 },
  { id: 4, slug: "first-words", title: "First Words", shortTitle: "Words", icon: "CAT", stage: "Words", description: "Build, read and spell useful words.", levelCount: 20 },
  { id: 5, slug: "vocabulary-world", title: "Vocabulary World", shortTitle: "Vocab", icon: "●", stage: "Words", description: "Grow useful everyday English.", levelCount: 18 },
  { id: 6, slug: "spelling-lab", title: "Spelling Lab", shortTitle: "Spell", icon: "ABC", stage: "Writing", description: "Hear, segment and write words.", levelCount: 18 },
  { id: 7, slug: "sentence-city", title: "Sentence City", shortTitle: "Sentence", icon: "I am.", stage: "Sentences", description: "Build clear English sentences.", levelCount: 16 },
  { id: 8, slug: "talk-with-kichu", title: "Talk with Kichu", shortTitle: "Speak", icon: "💬", stage: "Speaking", description: "Listen, repeat and speak in situations.", levelCount: 14 },
  { id: 9, slug: "reading-road", title: "Reading Road", shortTitle: "Read", icon: "▤", stage: "Reading", description: "Read words, sentences and short texts.", levelCount: 16 },
  { id: 10, slug: "grammar-garden", title: "Grammar Garden", shortTitle: "Grammar", icon: "✓", stage: "Sentences", description: "Use grammar inside meaningful language.", levelCount: 12 },
  { id: 11, slug: "story-island", title: "Story Island", shortTitle: "Story", icon: "◫", stage: "Reading", description: "Read, predict, sequence and retell.", levelCount: 12 },
  { id: 12, slug: "poem-park", title: "Poem & Rhyme Park", shortTitle: "Rhyme", icon: "♪", stage: "Reading", description: "Build rhythm, rhyme and fluency.", levelCount: 10 },
  { id: 13, slug: "comprehension-quest", title: "Comprehension Quest", shortTitle: "Understand", icon: "?", stage: "Reading", description: "Find meaning in sentences and texts.", levelCount: 12 },
  { id: 14, slug: "paragraph-builder", title: "Paragraph Builder", shortTitle: "Paragraph", icon: "¶", stage: "Paragraphs", description: "Plan, order and create paragraphs.", levelCount: 8 },
  { id: 15, slug: "creative-writing", title: "Creative Writing Studio", shortTitle: "Create", icon: "✦", stage: "Independent", description: "Turn ideas into connected writing.", levelCount: 6 },
  { id: 16, slug: "real-life-english", title: "Real-Life English", shortTitle: "Use", icon: "◎", stage: "Independent", description: "Use English at home, school and outside.", levelCount: 8 },
];

function rotate<T>(items: T[], by: number) {
  if (!items.length) return items;
  const offset = ((by % items.length) + items.length) % items.length;
  return [...items.slice(offset), ...items.slice(0, offset)];
}

function scrambled(word: string) {
  const letters = word.toUpperCase().split("");
  return letters.length > 2 ? [...letters.slice(1), letters[0]] : [...letters].reverse();
}

function seed(
  id: string,
  world: number,
  code: string,
  title: string,
  subtitle: string,
  stage: JourneyStage,
  reviewTags: string[],
  activities: ActivitySeed[],
): LevelSeed {
  return { id, world, code, title, subtitle, stage, prerequisiteIds: [], reviewTags, activities };
}

function choice(
  id: string,
  skill: string,
  prompt: string,
  spokenPrompt: string,
  correctId: string,
  options: Array<{ id: string; label: string; visual?: string; pictureKey?: string }>,
  masteryTags: string[],
  reinforcement = "Great!",
): ActivitySeed {
  return { id, kind: "choice", skill, prompt, spokenPrompt, reinforcement, correctId, choices: options, masteryTags };
}

function builder(id: string, word: string, skill: string, tags: string[]): ActivitySeed {
  const answer = word.toUpperCase().split("");
  return {
    id,
    kind: "word-builder",
    skill,
    prompt: `Make ${word.toUpperCase()}`,
    spokenPrompt: `Build the word ${word}.`,
    reinforcement: `${word}.`,
    word: word.toUpperCase(),
    tiles: scrambled(word),
    answer,
    masteryTags: tags,
  };
}

function sentenceBuilder(id: string, sentence: string, tags: string[]): ActivitySeed {
  const answer = sentence.split(" ");
  return {
    id,
    kind: "sentence-builder",
    skill: "Sentence building",
    prompt: "Make a sentence",
    spokenPrompt: `Build the sentence. ${sentence}`,
    reinforcement: sentence,
    tiles: rotate(answer, 1),
    answer,
    masteryTags: tags,
  };
}

function read(id: string, text: string, skill: string, tags: string[]): ActivitySeed {
  return {
    id,
    kind: "read",
    skill,
    prompt: "Read with me",
    spokenPrompt: text,
    reinforcement: "Nice reading.",
    modelText: text,
    supportText: "Tap to hear",
    masteryTags: tags,
  };
}

function speak(id: string, text: string, tags: string[]): ActivitySeed {
  return {
    id,
    kind: "speak",
    skill: "Guided speaking",
    prompt: "Your turn",
    spokenPrompt: `Listen. ${text} Now you say it.`,
    reinforcement: "Nice speaking.",
    modelText: text,
    supportText: "Listen → Say",
    masteryTags: tags,
  };
}

function paragraphBuilder(id: string, sentences: string[], tags: string[]): ActivitySeed {
  return {
    id,
    kind: "paragraph-builder",
    skill: "Paragraph organisation",
    prompt: "Put in order",
    spokenPrompt: "Put the sentences in a good order.",
    reinforcement: "You built a paragraph.",
    tiles: rotate(sentences, 1),
    answer: sentences,
    masteryTags: tags,
  };
}

function letterNeighbors(index: number) {
  const indexes = [index, (index + 1) % LETTERS.length, (index + 2) % LETTERS.length, (index + 25) % LETTERS.length];
  return indexes.map((i) => LETTERS[i]);
}

const alphabetSeeds: LevelSeed[] = LETTERS.map((item, index) => {
  const group = letterNeighbors(index);
  const id = `letter-${item.lower}`;
  return seed(id, 1, `ABC ${String(index + 1).padStart(2, "0")}`, `${item.upper} ${item.lower}`, `${item.upper} is for ${item.word}`, "Letters", ["alphabet", `letter-${item.lower}`], [
    {
      id: `${id}-meet`, kind: "teach-letter", skill: "Letter knowledge", prompt: `Meet ${item.upper}`,
      spokenPrompt: `This is ${item.upper}. ${item.upper} is for ${item.word}.`, reinforcement: `${item.upper}. ${item.word}.`,
      target: item.upper, word: item.word, masteryTags: ["alphabet", `letter-${item.lower}`, "letter-name"],
    },
    choice(`${id}-find`, "Uppercase recognition", `Find ${item.upper}`, `Find the letter ${item.upper}.`, item.upper,
      rotate(group, index).slice(0, index < 3 ? 3 : 4).map((letter) => ({ id: letter.upper, label: `Letter ${letter.upper}`, visual: letter.upper })),
      ["alphabet", `letter-${item.lower}`, "uppercase"], `Yes. ${item.upper}.`),
    choice(`${id}-lower`, "Upper and lowercase", `Find little ${item.lower}`, `Find little ${item.lower}.`, item.lower,
      rotate(group, index + 1).slice(0, index < 3 ? 3 : 4).map((letter) => ({ id: letter.lower, label: `Lowercase ${letter.lower}`, visual: letter.lower })),
      ["alphabet", `letter-${item.lower}`, "lowercase"], `${item.upper} and ${item.lower}.`),
    choice(`${id}-picture`, "Letter and word connection", `${item.upper} is for…`, `${item.upper} is for ${item.word}. Find ${item.word}.`, item.upper,
      rotate(group, index + 2).slice(0, index < 3 ? 3 : 4).map((letter) => ({ id: letter.upper, label: letter.word, pictureKey: letter.upper })),
      ["alphabet", `letter-${item.lower}`, "vocabulary"], `${item.word} starts with ${item.upper}.`),
    {
      id: `${id}-trace`, kind: "trace", skill: "Letter formation", prompt: `Trace ${item.upper}`,
      spokenPrompt: `Trace over the letter ${item.upper}.`, reinforcement: `You wrote ${item.upper}.`,
      target: item.upper, word: item.word, supportText: `${item.upper} ${item.lower}`,
      masteryTags: ["handwriting", `letter-${item.lower}`, "formation"],
    },
  ]);
});

const writingSeeds: LevelSeed[] = LETTERS.map((item, index) => {
  const id = `write-${item.lower}`;
  return seed(id, 2, `WR ${String(index + 1).padStart(2, "0")}`, `Write ${item.upper} ${item.lower}`, "Trace → copy → remember", "Writing", ["handwriting", `letter-${item.lower}`], [
    {
      id: `${id}-trace-upper`, kind: "trace", skill: "Letter formation", prompt: `Trace ${item.upper}`,
      spokenPrompt: `Trace the capital letter ${item.upper}.`, reinforcement: `You wrote ${item.upper}.`,
      target: item.upper, supportText: "Follow the path", masteryTags: ["handwriting", `letter-${item.lower}`, "uppercase-writing"],
    },
    {
      id: `${id}-trace-lower`, kind: "trace", skill: "Letter formation", prompt: `Trace ${item.lower}`,
      spokenPrompt: `Trace the small letter ${item.lower}.`, reinforcement: `You wrote ${item.lower}.`,
      target: item.lower, supportText: "Follow the path", masteryTags: ["handwriting", `letter-${item.lower}`, "lowercase-writing"],
    },
    choice(`${id}-recall`, "Letter recall", "Find it", `Find ${item.upper}.`, item.upper,
      rotate(letterNeighbors(index), 1).slice(0, 3).map((letter) => ({ id: letter.upper, label: `Letter ${letter.upper}`, visual: letter.upper })),
      ["handwriting", `letter-${item.lower}`, "visual-memory"]),
  ]);
});

const phonicsData = [
  ["s","sun","sss"],["a","ant","a"],["t","tap","t"],["p","pin","p"],["i","ink","i"],["n","net","n"],
  ["m","map","m"],["d","dog","d"],["g","gap","g"],["o","pot","o"],["c","cat","k"],["k","kit","k"],
  ["ck","duck","k"],["e","hen","e"],["u","cup","u"],["r","run","r"],["h","hat","h"],["b","bat","b"],
  ["f","fish","f"],["l","leg","l"],["j","jam","j"],["v","van","v"],["w","web","w"],["x","fox","ks"],
  ["y","yes","y"],["z","zip","z"],["sh","shop","sh"],["ch","chip","ch"],
] as const;

const phonicsSeeds: LevelSeed[] = phonicsData.map(([pattern, word, sound], index) => {
  const id = index === 0 ? "phonics-satpin" : `phonics-${String(index + 1).padStart(2, "0")}-${pattern}`;
  const distractors = rotate(["s","a","t","p","i","n","m","d","g","o","c","k","e","u","r","h","b","f","l","j","v","w","x","y","z","sh","ch","th"], index)
    .filter((value) => value !== pattern).slice(0, 2);
  const options = rotate([pattern, ...distractors], index % 3).map((value) => ({ id: value, label: value.toUpperCase(), visual: value.toUpperCase() }));
  const activities: ActivitySeed[] = [
    choice(`${id}-sound`, "Letter-sound", `Find /${sound}/`, `Find the spelling for the sound ${sound}.`, pattern, options,
      ["phonics", `gpc-${pattern}`], `${pattern} says ${sound}.`),
    builder(`${id}-build`, word, "Blending and encoding", ["phonics", "blend", `gpc-${pattern}`, `word-${word}`]),
    read(`${id}-read`, word.toUpperCase(), "Word reading", ["phonics", "decoding", `word-${word}`]),
  ];
  return seed(id, 3, `PH ${String(index + 1).padStart(2, "0")}`, `Sound ${pattern.toUpperCase()}`, `${pattern} → ${word}`, "Phonics", ["phonics", `gpc-${pattern}`], activities);
});

const firstWords = ["sat","pin","map","cat","dog","sun","hat","cup","red","big","run","sit","hen","fox","jam","bed","fish","shop","thin","chip"];
const wordSeeds: LevelSeed[] = firstWords.map((word, index) => {
  const id = index === 0 ? "words-first" : `word-${String(index + 1).padStart(2, "0")}-${word}`;
  return seed(id, 4, `WD ${String(index + 1).padStart(2, "0")}`, word.toUpperCase(), "Build → read → remember", "Words", ["word-reading", `word-${word}`], [
    builder(`${id}-build`, word, "Word building", ["word-reading", "encoding", `word-${word}`]),
    read(`${id}-read`, word.toUpperCase(), "Word reading", ["word-reading", "decoding", `word-${word}`]),
    speak(`${id}-say`, word, ["spoken-vocabulary", `word-${word}`]),
  ]);
});

const vocabThemes = [
  ["School",["book","bag","pen"],["📘","🎒","✏️"]],["Family",["mum","dad","baby"],["👩","👨","👶"]],
  ["Body",["hand","eye","nose"],["✋","👁️","👃"]],["Food",["apple","rice","milk"],["🍎","🍚","🥛"]],
  ["Animals",["cat","dog","fish"],["🐱","🐶","🐟"]],["Toys",["ball","kite","doll"],["⚽","🪁","🧸"]],
  ["Home",["bed","cup","door"],["🛏️","🥤","🚪"]],["Clothes",["hat","shirt","shoe"],["🎩","👕","👟"]],
  ["Colours",["red","blue","green"],["🔴","🔵","🟢"]],["Shapes",["circle","square","star"],["●","■","★"]],
  ["Nature",["sun","tree","rain"],["☀️","🌳","🌧️"]],["Transport",["bus","car","bike"],["🚌","🚗","🚲"]],
  ["Actions",["run","sit","jump"],["🏃","🪑","⬆️"]],["Feelings",["happy","sad","calm"],["😊","😢","🙂"]],
  ["Places",["school","park","shop"],["🏫","🌳","🏪"]],["Weather",["sunny","rainy","windy"],["☀️","🌧️","💨"]],
  ["Routines",["wake","wash","eat"],["🌅","🫧","🍽️"]],["Opposites",["big","small","fast"],["🐘","🐭","⚡"]],
] as const;

const vocabSeeds: LevelSeed[] = vocabThemes.map(([theme, words, visuals], index) => {
  const id = index === 0 ? "vocab-school" : `vocab-${String(index + 1).padStart(2, "0")}-${theme.toLowerCase()}`;
  const options = words.map((word, i) => ({ id: word, label: word, visual: visuals[i] }));
  const targetIndex = index % words.length;
  const target = words[targetIndex];
  return seed(id, 5, `VC ${String(index + 1).padStart(2, "0")}`, `${theme} words`, words.join(" · "), "Words", ["vocabulary", theme.toLowerCase()], [
    choice(`${id}-find`, "Vocabulary", `Find ${target}`, `Find the ${target}.`, target, rotate(options, index % 3), ["vocabulary", theme.toLowerCase(), `vocab-${target}`], target),
    choice(`${id}-listen`, "Listening vocabulary", "Listen & tap", `Tap ${words[(targetIndex + 1) % words.length]}.`, words[(targetIndex + 1) % words.length], rotate(options, (index + 1) % 3), ["listening", "vocabulary", theme.toLowerCase()]),
    speak(`${id}-say`, `I see ${target}.`, ["speaking", "vocabulary", theme.toLowerCase()]),
  ]);
});

const spellingWords = ["cat","dog","sun","map","hat","cup","red","big","run","sit","fish","shop","chip","thin","stop","flag","rain","boat"];
const spellingSeeds: LevelSeed[] = spellingWords.map((word, index) => {
  const id = index === 0 ? "spell-cvc" : `spell-${String(index + 1).padStart(2, "0")}-${word}`;
  return seed(id, 6, `SP ${String(index + 1).padStart(2, "0")}`, `Spell ${word.toUpperCase()}`, "Hear → segment → build", "Writing", ["spelling", `word-${word}`], [
    builder(`${id}-hear`, word, "Hear and spell", ["spelling", "encoding", `word-${word}`]),
    read(`${id}-check`, word.toUpperCase(), "Read your spelling", ["spelling", "word-reading", `word-${word}`]),
  ]);
});

const sentences = [
  "I see a cat.","I see a dog.","The ball is red.","The sun is hot.","I have a book.","I have a bag.",
  "The cat can run.","The dog can sit.","She has a hat.","He has a cup.","We go to school.","We play in the park.",
  "This is my pen.","That is a big bus.","I like red apples.","The little fish can swim.",
];
const sentenceSeeds: LevelSeed[] = sentences.map((text, index) => {
  const id = index === 0 ? "sentence-i-see" : `sentence-${String(index + 1).padStart(2, "0")}`;
  return seed(id, 7, `SN ${String(index + 1).padStart(2, "0")}`, "Build a sentence", text, "Sentences", ["sentence", "word-order"], [
    sentenceBuilder(`${id}-build`, text, ["sentence", "word-order"]),
    read(`${id}-read`, text, "Sentence reading", ["sentence-reading", "fluency"]),
  ]);
});

const talkLines = [
  "My name is Kichu.","I am happy.","Can I have water, please?","Hello! How are you?","I am fine, thank you.",
  "This is my book.","I like apples.","I can run.","Where is my bag?","Please help me.","Thank you very much.",
  "May I come in?","I want the blue ball.","Goodbye. See you soon.",
];
const talkSeeds: LevelSeed[] = talkLines.map((text, index) => {
  const id = index === 0 ? "speak-hello" : `talk-${String(index + 1).padStart(2, "0")}`;
  return seed(id, 8, `TK ${String(index + 1).padStart(2, "0")}`, "Talk with Kichu", text, "Speaking", ["speaking", "oral-language"], [
    speak(`${id}-model`, text, ["speaking", "oral-language"]),
    read(`${id}-read`, text, "Listen and read", ["speaking", "sentence-reading"]),
  ]);
});

const readingTexts = [
  "Sam has a red hat. The hat is big.","A cat sits on a mat.","The dog can run to the sun.","Mia has a blue bag.",
  "I see a fish in the pond.","The little bus is red.","Asha has a book and a pen.","Ben can hop and run.",
  "The rain falls on the green tree.","We go to school on the bus.","The cat and dog play in the park.","I like milk and red apples.",
  "A small fish swims fast.","The shop has fruit and bread.","Kichu finds a kite near the tree.","We read a book before bed.",
];
const readingSeeds: LevelSeed[] = readingTexts.map((text, index) => {
  const id = index === 0 ? "read-mini" : `reading-${String(index + 1).padStart(2, "0")}`;
  return seed(id, 9, `RD ${String(index + 1).padStart(2, "0")}`, "Reading road", `${text.split(" ").length} words`, "Reading", ["reading", "fluency"], [
    read(`${id}-read`, text, "Reading fluency", ["reading", "fluency"]),
    speak(`${id}-echo`, text.split(".")[0] + ".", ["guided-oral-reading", "fluency"]),
  ]);
});

const grammarSentences = [
  ["The dog can run.","verb"],["The ball is red.","adjective"],["She has a hat.","pronoun"],["He has a book.","pronoun"],
  ["The cats are big.","plural"],["The cat is small.","is-are"],["I am happy.","be-verb"],["We are ready.","be-verb"],
  ["The book is on the desk.","preposition"],["The ball is under the chair.","preposition"],["I like cats and dogs.","conjunction"],["Do you like apples?","question"],
] as const;
const grammarSeeds: LevelSeed[] = grammarSentences.map(([text, tag], index) => {
  const id = index === 0 ? "grammar-actions" : `grammar-${String(index + 1).padStart(2, "0")}`;
  return seed(id, 10, `GR ${String(index + 1).padStart(2, "0")}`, "Use the pattern", text, "Sentences", ["grammar", tag], [
    sentenceBuilder(`${id}-build`, text, ["grammar", tag, "sentence"]),
    read(`${id}-read`, text, "Grammar in context", ["grammar", tag, "sentence-reading"]),
  ]);
});

const stories = [
  ["A rainy walk","Mia sees rain. She takes her umbrella. She walks to school.","umbrella","What did Mia take?",["umbrella","ball","fish"],["☂️","⚽","🐟"]],
  ["The lost ball","Ben plays in the park. His red ball rolls by a tree. Ben finds it.","tree","Where was the ball?",["tree","bed","bus"],["🌳","🛏️","🚌"]],
  ["Kichu helps","Kichu sees a small cat. The cat is hungry. Kichu gives it food.","food","What did Kichu give?",["food","shoe","book"],["🍎","👟","📘"]],
  ["The blue kite","Asha has a blue kite. The wind blows. The kite goes high.","kite","What goes high?",["kite","cup","pen"],["🪁","🥤","✏️"]],
  ["At school","Sam packs a book and pen. He gets on the bus. He goes to school.","school","Where does Sam go?",["school","shop","park"],["🏫","🏪","🌳"]],
  ["Bedtime book","Mia washes her hands. She reads a book. Then she goes to bed.","bed","Where does Mia go last?",["bed","bus","shop"],["🛏️","🚌","🏪"]],
  ["The little fish","A little fish swims in a pond. It sees a green leaf. It hides under it.","leaf","What does the fish hide under?",["leaf","hat","ball"],["🍃","🎩","⚽"]],
  ["A red apple","Dad has two apples. He gives one to Ana. Ana says thank you.","apple","What does Dad give?",["apple","book","kite"],["🍎","📘","🪁"]],
  ["Rainy window","Rain taps the window. Kichu looks outside. A bird sits in a tree.","bird","Who sits in the tree?",["bird","fish","dog"],["🐦","🐟","🐶"]],
  ["Park friends","A cat and dog meet in the park. They run to a ball. They play together.","ball","What do they play with?",["ball","pen","cup"],["⚽","✏️","🥤"]],
  ["Morning bus","Asha wakes up early. She eats breakfast. Then the yellow bus comes.","bus","What comes after breakfast?",["bus","fish","bed"],["🚌","🐟","🛏️"]],
  ["Helping hands","Ben drops his books. Mia helps him pick them up. Ben smiles.","books","What did Ben drop?",["books","apples","shoes"],["📚","🍎","👟"]],
] as const;
const storySeeds: LevelSeed[] = stories.map(([title, text, answer, question, options, visuals], index) => {
  const id = index === 0 ? "story-rain" : `story-${String(index + 1).padStart(2, "0")}`;
  return seed(id, 11, `ST ${String(index + 1).padStart(2, "0")}`, title, "Read → understand → answer", "Reading", ["story", "comprehension"], [
    read(`${id}-read`, text, "Story reading", ["story", "fluency"]),
    choice(`${id}-q`, "Story comprehension", question, question, answer,
      options.map((option, i) => ({ id: option, label: option, visual: visuals[i] })),
      ["story", "comprehension", "literal"], `${answer}.`),
  ]);
});

const rhymes = [
  ["Cat, hat, mat","cat","hat",["hat","dog","sun"]],["Sun, fun, run","sun","run",["run","fish","bed"]],
  ["Dog, log, frog","dog","frog",["frog","cat","pen"]],["Light, bright, night","light","night",["night","cup","red"]],
  ["Play, day, say","play","day",["day","book","fish"]],["Bee, tree, me","bee","tree",["tree","hat","dog"]],
  ["Rain, train, again","rain","train",["train","sun","cup"]],["Blue, shoe, two","blue","shoe",["shoe","cat","pen"]],
  ["Star, car, far","star","car",["car","book","fish"]],["Bed, red, head","bed","red",["red","sun","kite"]],
] as const;
const rhymeSeeds: LevelSeed[] = rhymes.map(([line, base, answer, options], index) => {
  const id = index === 0 ? "rhyme-cat" : `rhyme-${String(index + 1).padStart(2, "0")}`;
  return seed(id, 12, `RY ${String(index + 1).padStart(2, "0")}`, line, "Hear → rhyme → say", "Reading", ["rhyme", "phonological-awareness"], [
    choice(`${id}-match`, "Rhyme", `${base} + ?`, `Which word rhymes with ${base}?`, answer,
      options.map((option) => ({ id: option, label: option, visual: option.toUpperCase() })),
      ["rhyme", "phonological-awareness"], `${base}, ${answer}. They rhyme.`),
    speak(`${id}-say`, line, ["rhyme", "rhythm", "fluency"]),
  ]);
});

const comprehension = [
  ["Asha has a blue bag. She puts a book and a pen inside. Then she goes to school.","Where does Asha go?","school",["school","park","shop"],["🏫","🌳","🏪"]],
  ["Ben has a small dog. The dog sleeps on a red mat.","What sleeps on the mat?","dog",["dog","cat","fish"],["🐶","🐱","🐟"]],
  ["Mia eats an apple after school. She drinks milk too.","What does Mia drink?","milk",["milk","rain","ink"],["🥛","🌧️","●"]],
  ["The yellow bus stops near the school. Sam gets off the bus.","What colour is the bus?","yellow",["yellow","blue","red"],["🟡","🔵","🔴"]],
  ["A cat sits under the table. A ball is beside the cat.","Where is the cat?","under",["under","on","in"],["↓","↑","□"]],
  ["It is raining. Ana opens her umbrella before she walks outside.","Why does Ana use an umbrella?","rain",["rain","sun","wind"],["🌧️","☀️","💨"]],
  ["Kichu has two apples. He gives one apple to Mia.","How many apples did Kichu start with?","two",["two","one","three"],["2","1","3"]],
  ["Dad cooks rice. Mum puts cups on the table. The family eats together.","Who cooks rice?","dad",["dad","mum","baby"],["👨","👩","👶"]],
  ["The bird is in a tree. It sings in the morning.","When does the bird sing?","morning",["morning","night","lunch"],["🌅","🌙","🍽️"]],
  ["Sam reads a book, closes it, and puts it in his bag.","What happens last?","bag",["bag","read","open"],["🎒","📖","◫"]],
  ["The little fish swims fast because a big fish is near.","Why does the little fish swim fast?","big fish",["big fish","book","rain"],["🐟","📘","🌧️"]],
  ["Mia and Asha plant a seed. They give it water. A green shoot grows.","What grows?","shoot",["shoot","bus","shoe"],["🌱","🚌","👟"]],
] as const;
const comprehensionSeeds: LevelSeed[] = comprehension.map(([text, question, answer, options, visuals], index) => {
  const id = index === 0 ? "comprehension-school" : `comp-${String(index + 1).padStart(2, "0")}`;
  return seed(id, 13, `CQ ${String(index + 1).padStart(2, "0")}`, "Understand the text", question, "Reading", ["comprehension"], [
    read(`${id}-read`, text, "Reading comprehension", ["paragraph-reading", "comprehension"]),
    choice(`${id}-q`, "Comprehension", question, question, answer,
      options.map((option, i) => ({ id: option, label: option, visual: visuals[i] })),
      ["comprehension", index < 4 ? "literal" : "inference"], `${answer}.`),
  ]);
});

const paragraphs = [
  ["I have a dog.","His name is Max.","We play in the park."],["This is my school.","I read with my class.","I like story time."],
  ["It is a rainy day.","I take my umbrella.","I walk to the bus."],["I have a red ball.","My friend has a blue ball.","We play together."],
  ["A seed is small.","We give it water.","It grows into a plant."],["I wake up early.","I wash and eat breakfast.","Then I go to school."],
  ["The shop has apples.","I ask for two apples.","I say thank you."],["Kichu finds a little cat.","He gives the cat food.","The cat is happy."],
];
const paragraphSeeds: LevelSeed[] = paragraphs.map((lines, index) => {
  const id = index === 0 ? "paragraph-my-dog" : `paragraph-${String(index + 1).padStart(2, "0")}`;
  return seed(id, 14, `PB ${String(index + 1).padStart(2, "0")}`, "Build a paragraph", "Idea → order → read", "Paragraphs", ["paragraph", "sequence"], [
    paragraphBuilder(`${id}-order`, [...lines], ["paragraph", "sequence"]),
    read(`${id}-read`, lines.join(" "), "Paragraph fluency", ["paragraph", "reading"]),
  ]);
});

const creativePrompts = [
  ["The little cat runs.","The cat runs to …"],["A red kite flies.","The kite goes …"],["My funny dog jumps.","My dog can …"],
  ["I found a tiny seed.","The seed will …"],["A rainy day begins.","I take my …"],["Kichu opens a magic book.","Inside the book …"],
] as const;
const creativeSeeds: LevelSeed[] = creativePrompts.map(([sentence, model], index) => {
  const id = index === 0 ? "creative-picture" : `creative-${String(index + 1).padStart(2, "0")}`;
  return seed(id, 15, `CW ${String(index + 1).padStart(2, "0")}`, "Grow an idea", "Sentence → idea → mini story", "Independent", ["creative-writing"], [
    sentenceBuilder(`${id}-build`, sentence, ["creative-writing", "sentence"]),
    speak(`${id}-speak`, model, ["creative-writing", "oral-language"]),
  ]);
});

const realLife = [
  ["At the shop","Can I have two apples, please?","bag",["bag","book","ball"],["🛍️","📘","⚽"]],
  ["At school","May I come in, please?","book",["book","fish","shoe"],["📘","🐟","👟"]],
  ["At home","Can I have water, please?","cup",["cup","kite","bus"],["🥤","🪁","🚌"]],
  ["At the park","Can I play with the ball?","ball",["ball","pen","bed"],["⚽","✏️","🛏️"]],
  ["On the bus","Is this my stop?","bus",["bus","cat","apple"],["🚌","🐱","🍎"]],
  ["Pretend café","I would like rice, please.","rice",["rice","book","hat"],["🍚","📘","🎩"]],
  ["Finding things","Where is my bag?","bag",["bag","sun","fish"],["🎒","☀️","🐟"]],
  ["Being kind","Can I help you?","help",["help","run","sleep"],["🤝","🏃","😴"]],
] as const;
const realLifeSeeds: LevelSeed[] = realLife.map(([title, phrase, answer, options, visuals], index) => {
  const id = index === 0 ? "real-life-shop" : `real-${String(index + 1).padStart(2, "0")}`;
  return seed(id, 16, `RL ${String(index + 1).padStart(2, "0")}`, title, phrase, "Independent", ["real-life", "speaking"], [
    speak(`${id}-speak`, phrase, ["real-life", "speaking", "request"]),
    choice(`${id}-listen`, "Listening comprehension", `Find ${answer}`, `Find ${answer}.`, answer,
      options.map((option, i) => ({ id: option, label: option, visual: visuals[i] })),
      ["real-life", "listening"], answer),
  ]);
});

const groups: LevelSeed[][] = [
  alphabetSeeds, writingSeeds, phonicsSeeds, wordSeeds, vocabSeeds, spellingSeeds, sentenceSeeds, talkSeeds,
  readingSeeds, grammarSeeds, storySeeds, rhymeSeeds, comprehensionSeeds, paragraphSeeds, creativeSeeds, realLifeSeeds,
];

const firstPrerequisites: Record<number, string[]> = {
  1: [],
  2: ["letter-a"],
  3: ["letter-f"],
  4: ["phonics-06-n"],
  5: ["words-first"],
  6: ["word-10-big"],
  7: ["spell-06-cup"],
  8: ["sentence-i-see"],
  9: ["word-20-chip"],
  10: ["sentence-08"],
  11: ["reading-06"],
  12: ["rhyme-cat"],
  13: ["reading-12"],
  14: ["comprehension-school"],
  15: ["paragraph-my-dog"],
  16: ["speak-hello"],
};

function finalizeLevels() {
  let globalNumber = 0;
  const result: JourneyLevel[] = [];
  for (const worldLevels of groups) {
    worldLevels.forEach((item, index) => {
      globalNumber += 1;
      const prerequisiteIds = index > 0 ? [worldLevels[index - 1].id] : firstPrerequisites[item.world] ?? [];
      result.push({
        ...item,
        globalNumber,
        prerequisiteIds,
        activities: item.activities.map((activity) => ({ ...activity, world: item.world, levelId: item.id })),
      });
    });
  }
  return result;
}

export const ALL_LEVELS: JourneyLevel[] = finalizeLevels();
export const LETTER_LEVELS = ALL_LEVELS.filter((item) => item.world === 1);
export const WRITING_LEVELS = ALL_LEVELS.filter((item) => item.world === 2);
export const CORE_LEVELS = ALL_LEVELS.filter((item) => item.world >= 3);

export const LEVEL_BY_ID = Object.fromEntries(ALL_LEVELS.map((item) => [item.id, item])) as Record<string, JourneyLevel>;

export function levelsForWorld(worldId: number) {
  return ALL_LEVELS.filter((item) => item.world === worldId);
}

export function isLevelUnlocked(level: JourneyLevel, completedLevelIds: string[]) {
  return level.prerequisiteIds.every((id) => completedLevelIds.includes(id));
}

export function firstIncompleteLevel(
  completedLevelIds: string[],
  skillStats: JourneyProgress["skillStats"] = {},
) {
  const weakTags = Object.entries(skillStats)
    .filter(([, metric]) => metric.encounters >= 2 && metric.firstTryCorrect / metric.encounters < 0.6)
    .map(([tag]) => tag);

  const adaptive = ALL_LEVELS.find(
    (item) =>
      !completedLevelIds.includes(item.id) &&
      isLevelUnlocked(item, completedLevelIds) &&
      item.reviewTags.some((tag) => weakTags.includes(tag)),
  );
  if (adaptive) return adaptive;

  return (
    ALL_LEVELS.find((item) => !completedLevelIds.includes(item.id) && isLevelUnlocked(item, completedLevelIds)) ??
    ALL_LEVELS.find((item) => !completedLevelIds.includes(item.id)) ??
    ALL_LEVELS[0]
  );
}

export const TOTAL_JOURNEY_LEVELS = ALL_LEVELS.length;

if (TOTAL_JOURNEY_LEVELS !== 250) {
  throw new Error(`English Journey curriculum must contain exactly 250 levels; found ${TOTAL_JOURNEY_LEVELS}.`);
}
