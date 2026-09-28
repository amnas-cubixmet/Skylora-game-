import { LETTERS } from "../english/content";
import { random, shuffle } from "../english/questions";
import {
  CONTENT_VERSION,
  WORDS,
  TEACHING_SEQUENCE,
  type Game,
} from "./catalogue";
import { STROKES } from "./strokes";
import type { Activity, Option, Session } from "./types";
const pictureWord = (letter: string) =>
  LETTERS.find((l) => l.upper === letter)!;
const phonics = WORDS.map((w) => ({
  ...w,
  sounds:
    w.word === "cat"
      ? "/k/ · /æ/ · /t/"
      : w.word === "dog"
        ? "/d/ · /ɒ/ · /g/"
        : w.word === "sun"
          ? "/s/ · /ʌ/ · /n/"
          : w.word === "hat"
            ? "/h/ · /æ/ · /t/"
            : w.word === "van"
              ? "/v/ · /æ/ · /n/"
              : "/dʒ/ · /æ/ · /m/",
}));
export function activityFor(game: Game, s: Session): Activity {
  const rng = random(s.seed + s.index * 7919),
    take = <T>(values: T[]) => shuffle(values, rng),
    i = s.index,
    n = 1 + ((s.seed + i * 3) % (s.choices === 2 ? 5 : 8)),
    w =
      phonics[
        (s.seed + (game.id === "W08" ? Math.floor(i / 2) : i)) % phonics.length
      ];
  let mode = game.id;
  if (mode === "R12")
    mode = [
      "R01",
      "R03",
      "R07",
      "R10",
      "R11",
      "comprehension",
      "R08",
      "comprehension",
    ][i];
  if (mode === "M12")
    mode = ["M01", "M02", "M05", "M06", "M07", "M08", "M09", "M10"][i];
  const a: Activity = {
    id: `${game.id}:${s.seed}:${i}`,
    skill: `${game.world}:${game.skill}`,
    contentVersion: CONTENT_VERSION,
    reason:
      game.id === "R12" || game.id === "M12"
        ? "transfer"
        : s.focus && i % 3 === 2
          ? "remediation"
          : i < 2
            ? "new"
            : "review",
    mechanic: "choice",
    instruction: "Listen and find the match.",
    spoken: "Listen and find the match.",
    options: [],
    answer: "",
    hint: "Listen once more. Take your time.",
    reinforcement: "You found it!",
    item: "",
  };
  const choices = (target: Option, others: Option[]) => {
    a.answer = target.id;
    a.options = take([
      target,
      ...take(others.filter((o) => o.id !== target.id)).slice(0, s.choices - 1),
    ]);
  };
  const letters = (target: string, pool: string[]) =>
    choices(
      { id: target, label: target },
      pool.filter((l) => l !== target).map((l) => ({ id: l, label: l })),
    );
  const numbers = (target: number, quantities = false) =>
    choices(
      {
        id: String(target),
        label: quantities ? `${target} objects` : String(target),
        ...(quantities ? { quantity: target } : {}),
      },
      Array.from({ length: 10 }, (_, j) => j + 1)
        .filter((x) => x !== target)
        .map((x) => ({
          id: String(x),
          label: quantities ? `${x} objects` : String(x),
          ...(quantities ? { quantity: x } : {}),
        })),
    );
  const wordChoices = (pictures = false) =>
    choices(
      {
        id: w.word,
        label: w.word,
        ...(pictures ? { picture: w.picture } : {}),
      },
      phonics
        .filter((x) => x.word !== w.word)
        .map((x) => ({
          id: x.word,
          label: x.word,
          ...(pictures ? { picture: x.picture } : {}),
        })),
    );
  const order = (target: string[], prompt: string, spoken: string) => {
    a.mechanic = "order";
    a.tokens = take(target);
    a.answer = target.join("|");
    a.instruction = prompt;
    a.spoken = spoken;
  };
  const trace = (key: string, guide: Activity["guide"] = "full") => {
    a.mechanic = "trace";
    a.trace = key;
    a.guide = guide;
    a.answer = "traced";
    a.instruction = `Follow ${key.length === 1 ? "the letter " + key : "the " + key} from each numbered dot.`;
    a.spoken = a.instruction;
    a.prompt = key.length === 1 ? key : undefined;
  };
  if (["R01", "R02", "R03", "R04"].includes(mode)) {
    const pool = TEACHING_SEQUENCE.slice(0, s.choices === 2 ? 9 : 20),
      target =
        s.focus && pool.includes(s.focus) && i % 3 === 2
          ? s.focus
          : pool[(s.seed + i) % pool.length],
      item = pictureWord(target);
    a.item = target;
    a.hint = `${item.word} starts with ${target}.`;
    a.reinforcement = `${target} is for ${item.word}.`;
    if (mode === "R02") {
      a.instruction = "Find the hidden letter.";
      a.spoken = `Find the letter ${target}.`;
      a.prompt = target;
      letters(target, pool);
    }
    if (mode === "R01" || mode === "R04") {
      a.instruction =
        mode === "R01" ? "Listen. Find the letter." : "Find the first sound.";
      a.spoken = `Listen to ${item.word}. Which letter spells the first sound?`;
      if (mode === "R04") {
        a.picture = target;
        a.prompt = item.word;
      }
      letters(
        target,
        pool.filter((l) => pictureWord(l).sound !== item.sound || l === target),
      );
    }
    if (mode === "R03") {
      a.instruction = "Find the sound’s picture.";
      a.spoken = `Listen to ${item.word}. Find the picture that starts with the same sound.`;
      choices(
        { id: target, label: item.word, picture: target },
        pool
          .filter((l) => pictureWord(l).sound !== item.sound)
          .map((l) => ({ id: l, label: pictureWord(l).word, picture: l })),
      );
    }
  } else if (mode === "R05") {
    const pairs = [
        ["b", "d"],
        ["p", "q"],
        ["m", "n"],
        ["u", "v"],
      ],
      pair =
        (s.focus && i % 3 === 2
          ? pairs.find((pair) => pair.includes(s.focus!))
          : undefined) ?? pairs[(s.seed + i) % pairs.length],
      target =
        s.focus && pair.includes(s.focus) && i % 3 === 2
          ? s.focus
          : pair[i % 2];
    a.instruction = "Look closely. Find the same letter.";
    a.prompt = target;
    a.spoken = `Find lowercase ${target}. Compare its shape with the letter above.`;
    letters(target, pair);
    a.hint = `Look at the model ${target}, then compare each shape.`;
    a.item = target;
  } else if (["R06", "R07", "R08", "R09", "R10", "W08", "W09"].includes(mode)) {
    a.item = w.word;
    a.reinforcement = `${w.word.split("").join(", ")} spells ${w.word}.`;
    a.hint = `The word is ${w.word}. ${w.word.split("").join(", ")}.`;
    if (mode === "R06") {
      a.instruction = "Join the sounds.";
      a.prompt = w.sounds;
      a.spoken = `Listen to ${w.word}. Say ${w.word} slowly, then find its picture.`;
      wordChoices(true);
    }
    if (mode === "R09") {
      a.instruction = "Read the word. Find its picture.";
      a.prompt = w.word;
      a.spoken = "Read the word and find its picture.";
      wordChoices(true);
    }
    if (mode === "R10") {
      a.instruction = "Listen. Find the word.";
      a.spoken = `Find the word ${w.word}.`;
      wordChoices();
    }
    if (mode === "R08") {
      a.instruction = "Find the missing letter.";
      a.prompt = w.word[0] + " _ " + w.word[2];
      a.spoken = `${w.word}. Which letter is missing?`;
      letters(w.word[1], ["a", "e", "i", "o", "u"]);
    }
    if (mode === "R07" || mode === "W09" || (mode === "W08" && i % 2 === 0)) {
      order(
        w.word.split(""),
        "Build the word.",
        `Build the word ${w.word}. Tap each letter in order.`,
      );
      if (mode !== "W09") a.picture = w.picture;
    }
    if (mode === "W08" && i % 2 === 1) {
      trace(w.word.toUpperCase(), i < 4 ? "full" : "dotted");
      a.prompt = w.word.toUpperCase();
      a.spoken = `${w.word}. Practise the letter ${a.trace}.`;
    }
  } else if (mode === "R11") {
    const sentence = ["I", "see", "a", w.word];
    order(
      sentence,
      "Build a sentence.",
      `Put these words in order: I see a ${w.word}.`,
    );
    a.picture = w.picture;
    a.item = w.word;
    a.hint = `Start with I. Then see, a, ${w.word}.`;
    a.reinforcement = `I see a ${w.word}.`;
  } else if (mode === "comprehension") {
    const stories = [
      ["A cat is on a mat.", "What is on the mat?", "cat", "C"],
      ["A dog runs in the sun.", "Who runs in the sun?", "dog", "D"],
      ["A red van stops.", "What stops?", "van", "V"],
    ];
    const [story, question, answer, picture] = stories[i % stories.length];
    a.prompt = story;
    a.instruction = question;
    a.spoken = `${story} ${question}`;
    a.item = answer;
    choices(
      { id: answer, label: answer, picture },
      phonics
        .filter((x) => x.word !== answer)
        .map((x) => ({ id: x.word, label: x.word, picture: x.picture })),
    );
    a.hint = `Read or listen again: ${story}`;
    a.reinforcement = story;
  } else if (mode.startsWith("W")) {
    const key = "ALTIHMCB"[(s.seed + i) % 8];
    a.item = key;
    if (mode === "W01")
      trace(
        ["vertical", "horizontal", "curve", "circle", "wave", "zigzag"][i % 6],
      );
    if (mode === "W02") trace(["circle", "square", "triangle", "curve"][i % 4]);
    if (mode === "W03") trace(key);
    if (mode === "W04") {
      trace(key, i < 2 ? "full" : i < 4 ? "dotted" : i < 6 ? "faint" : "none");
      if (i >= 6) {
        a.mechanic = "copy";
        a.answer = "reviewed";
        a.instruction = "Now make the letter independently.";
        a.spoken = `Try writing ${key} on your own. Compare when you are ready.`;
      }
    }
    if (mode === "W05") {
      a.mechanic = "start";
      a.trace = key;
      a.prompt = key;
      a.instruction = "Where does the first stroke begin?";
      a.spoken = `Look at ${key}. Tap where the first stroke begins.`;
      a.answer = "start";
      a.options = take([
        { id: "start", label: "First point" },
        { id: "other", label: "Second point" },
      ]);
      a.hint = "Look for the glowing start point.";
    }
    if (mode === "W06") {
      a.mechanic = "copy";
      a.trace = key;
      a.prompt = key;
      a.guide = "none";
      a.instruction = "Look, then make your own letter.";
      a.spoken = `Look at ${key}. Draw your own ${key}. You can compare it with the model.`;
      a.answer = "reviewed";
      a.hint = `Look at the ${STROKES[key].length} strokes in ${key}.`;
    }
    if (mode === "W07") {
      trace(key);
      a.instruction = "Complete the missing final stroke.";
      a.spoken = `Finish the letter ${key}. Follow the final stroke.`;
    }
    if (mode === "W10") {
      const name = s.name || "SAM";
      a.item = "preferred-name";
      a.prompt = name;
      a.hint = "Look at your name model. Start with its first letter.";
      if (i === 0 || i === 4) {
        a.instruction = "Find your name.";
        a.spoken = `Find ${name}.`;
        choices(
          { id: name, label: name },
          ["SAM", "MIA", "LEO", "AVA"]
            .filter((v) => v !== name)
            .map((v) => ({ id: v, label: v })),
        );
      } else if (i === 1 || i === 5)
        order(
          name.replaceAll(" ", "").split(""),
          "Build your name.",
          `Build ${name}. Tap the letters in order.`,
        );
      else {
        const letters = name.replaceAll(" ", "");
        trace(letters, i < 4 ? "full" : "none");
        a.prompt = name;
        a.spoken = `Practise every letter of ${name}, one at a time.`;
        if (i === 3 || i === 7) {
          a.mechanic = "copy";
          a.answer = "reviewed";
          a.instruction = "Write every letter of your name.";
        }
      }
    }
    a.reinforcement = "You practised your writing. Every careful mark counts.";
  } else {
    const target = ["M01", "M02", "M03", "M04", "M05"].includes(mode)
        ? n
        : 1 + ((s.seed + i * 3) % 5),
      other = target + 1 + (i % 2),
      more = i % 2 === 0;
    a.item = String(target);
    if (mode === "M01") {
      a.instruction = `Which group has ${target}?`;
      a.spoken = a.instruction;
      numbers(target, true);
    }
    if (mode === "M02") {
      a.instruction = "Count the objects. Find their number.";
      a.spoken = a.instruction;
      a.quantity = target;
      numbers(target);
    }
    if (mode === "M03") {
      a.instruction = "Listen. Find the number.";
      a.spoken = `Find ${target}.`;
      numbers(target);
    }
    if (mode === "M04") {
      a.mechanic = "build";
      a.instruction = `Build a group of ${target}.`;
      a.spoken = a.instruction;
      a.answer = String(target);
      a.limit = 10;
    }
    if (mode === "M05") {
      a.instruction = more ? "Which group has more?" : "Which group has fewer?";
      a.spoken = a.instruction;
      choices(
        {
          id: String(more ? other : target),
          label: `${more ? other : target} objects`,
          quantity: more ? other : target,
        },
        [
          {
            id: String(more ? target : other),
            label: `${more ? target : other} objects`,
            quantity: more ? target : other,
          },
        ],
      );
    }
    if (mode === "M06") {
      a.mechanic = "line";
      a.start = target;
      a.initial = target;
      a.steps = 1 + (i % 3);
      a.answer = String(target + a.steps);
      a.limit = 10;
      a.instruction = `Start at ${target}. Jump ${a.steps} spaces forward.`;
      a.spoken = a.instruction;
    }
    if (mode === "M07") {
      a.instruction = "Find the missing number.";
      a.spoken = a.instruction;
      a.prompt = `${target} → ? → ${target + 2}`;
      numbers(target + 1);
    }
    if (mode === "M08") {
      a.mechanic = "build";
      a.start = target;
      a.quantity = target;
      a.limit = 5;
      a.answer = String(5 - target);
      a.instruction = `You have ${target}. Add enough to make 5.`;
      a.spoken = a.instruction;
    }
    if (mode === "M09") {
      a.mechanic = "build";
      a.start = target;
      a.steps = 1 + (i % 3);
      a.limit = 10;
      a.instruction = `${target} apples. ${a.steps} more arrive. Build the whole group.`;
      a.spoken = a.instruction;
      a.answer = String(target + a.steps);
      a.prompt = `${target} + ${a.steps}`;
    }
    if (mode === "M10") {
      a.mechanic = "build";
      a.start = target + 2;
      a.initial = target + 2;
      a.steps = 2;
      a.limit = 10;
      a.instruction = `There are ${target + 2} balloons. Take away 2.`;
      a.spoken = a.instruction;
      a.answer = String(target);
      a.prompt = `${target + 2} − 2`;
    }
    if (mode === "M11") {
      a.mechanic = "build";
      const price = [2, 3, 5, 4, 6, 7, 8, 5][i];
      a.instruction = `An apple costs ₹${price}. Pay with ₹1 coins.`;
      a.spoken = `An apple costs ${price} rupees. Put ${price} one rupee coins in the tray.`;
      a.limit = 10;
      a.answer = String(price);
      a.prompt = "Your purse: ₹10";
      a.picture = "A";
    }
    a.hint =
      a.mechanic === "line"
        ? `Count ${a.steps} small jumps from ${a.start}.`
        : a.mechanic === "build"
          ? `Count carefully. The matching amount is ${a.answer}.`
          : `Count one object at a time. Look for ${a.answer}.`;
    a.reinforcement =
      a.mechanic === "line" ? `You reached ${a.answer}.` : `Yes. ${a.answer}.`;
  }
  if (!a.answer) throw new Error(`Missing activity for ${game.id}`);
  return a;
}
