import { test, expect } from "@playwright/test";
import { GAMES, SKILLS, WORLDS } from "../lib/world/catalogue";
import { activityFor } from "../lib/world/activities";
import { fresh } from "../lib/world/types";
import { newSession, reducer, initial, stage } from "../lib/world/progress";
import { parseWorld } from "../lib/world/storage";
import { STROKES, sampleStroke, follow } from "../lib/world/strokes";
test("34 games have unique routes, valid skill nodes and all worlds have their required collection", () => {
  expect(GAMES).toHaveLength(34);
  expect(new Set(GAMES.map((g) => g.slug)).size).toBe(34);
  for (const [world, size] of [
    ["reading", 12],
    ["writing", 10],
    ["maths", 12],
  ] as const) {
    expect(GAMES.filter((g) => g.world === world)).toHaveLength(size);
    for (const g of GAMES.filter((g) => g.world === world))
      expect(SKILLS[world].some((s) => s.id === g.skill)).toBe(true);
  }
  expect(WORLDS).toHaveLength(3);
});
test("curated generator validates every game across seeds, tiers and eight-round sessions", () => {
  for (const game of GAMES)
    for (let seed = 0; seed < 4; seed++)
      for (const choices of [2, 3, 4])
        for (let index = 0; index < 8; index++) {
          const session = {
              ...newSession(game, fresh(), seed),
              choices,
              index,
              name: "ANNA",
            },
            q = activityFor(game, session);
          expect(q.answer.length).toBeGreaterThan(0);
          expect(q.instruction.length).toBeGreaterThan(5);
          expect(q.contentVersion).toBeTruthy();
          expect(q.skill).toBe(`${game.world}:${game.skill}`);
          if (q.mechanic === "choice") {
            expect(q.options.length).toBeGreaterThanOrEqual(2);
            expect(q.options.length).toBeLessThanOrEqual(4);
            expect(q.options.filter((o) => o.id === q.answer)).toHaveLength(1);
            expect(new Set(q.options.map((o) => o.id)).size).toBe(
              q.options.length,
            );
          }
          if (q.mechanic === "order")
            expect(q.tokens?.slice().sort()).toEqual(
              q.answer.split("|").sort(),
            );
          if (["trace", "copy", "start"].includes(q.mechanic)) {
            for (const key of STROKES[q.trace!]
              ? [q.trace!]
              : q.trace!.split(""))
              expect(STROKES[key]?.length).toBeGreaterThan(0);
          }
          if (["build", "line"].includes(q.mechanic)) {
            expect(Number(q.answer)).toBeGreaterThanOrEqual(0);
            expect(Number(q.answer)).toBeLessThanOrEqual(q.limit ?? 10);
          }
        }
});
test("all games complete, duplicate taps do not score and solved saves resume at the next stable activity", () => {
  for (const game of GAMES) {
    let s = reducer(initial, { type: "LOAD", progress: fresh() });
    s = reducer(s, { type: "START", game, seed: 29 });
    expect(s.status).toBe("TUTORIAL");
    s = reducer(s, { type: "TUTORIAL_DONE" });
    for (let i = 0; i < 8; i++) {
      const answer = {
        type: "ANSWER" as const,
        value: s.activity!.answer,
        date: "2026-09-28T10:00:00Z",
        elapsed: 6000,
      };
      s = reducer(s, answer);
      expect(reducer(s, answer)).toEqual(s);
      if (i === 0) {
        const restored = reducer(
          reducer(initial, {
            type: "LOAD",
            progress: parseWorld(JSON.stringify(s.progress)),
          }),
          { type: "START", game, seed: 30 },
        );
        expect(restored.progress.session?.index).toBe(1);
      }
      s = reducer(s, { type: "NEXT" });
    }
    expect(s.status).toBe("GAME_COMPLETE");
    expect(s.progress.games[game.slug].sessions).toBe(1);
    expect(s.progress.games[game.slug].discoveries).toBe(8);
  }
});
test("support, confusion, muted fallback and self-reviewed writing stay separate from independent success", () => {
  const game = GAMES[0];
  let s = reducer(initial, { type: "LOAD", progress: fresh() });
  s = reducer(s, { type: "START", game, seed: 20 });
  s = reducer(s, { type: "TUTORIAL_DONE" });
  const q = s.activity!;
  s = reducer(s, {
    type: "ANSWER",
    value: "wrong",
    date: "2026-09-28",
    elapsed: 6000,
  });
  s = reducer(s, { type: "RETRY" });
  s = reducer(s, { type: "HINT" });
  s = reducer(s, { type: "REPLAY" });
  s = reducer(s, {
    type: "ANSWER",
    value: q.answer,
    date: "2026-09-28",
    elapsed: 6000,
  });
  const skill = s.progress.skills[q.skill];
  expect(skill.independent).toBe(0);
  expect(skill.supported).toBe(1);
  expect(skill.hints).toBe(1);
  expect(skill.replays).toBe(1);
  expect(skill.retries).toBe(1);
  expect(stage({ ...skill, independent: 8, supported: 0, retries: 0 })).toBe(
    "Consistent",
  );
  expect(stage(skill)).toBe("Practising");
});
test("corrupt storage is bounded and names are constrained to local English letter practice", () => {
  for (const raw of ["broken", "null", "[]", '{"version":9}'])
    expect(parseWorld(raw)).toEqual(fresh());
  const p = parseWorld(
    JSON.stringify({
      ...fresh(),
      settings: { name: "<ANNA>123", theme: "unknown", voice: false },
      session: { game: "fake", index: 0 },
    }),
  );
  expect(p.settings.name).toBe("ANNA");
  expect(p.settings.theme).toBe("young");
  expect(p.settings.voice).toBe(false);
  expect(p.session).toBeNull();
});
test("tracing requires sequential path coverage and cannot be completed by tapping the end", () => {
  for (const paths of Object.values(STROKES))
    for (const stroke of paths) {
      const pts = sampleStroke(stroke);
      expect(follow(pts, 0, pts.at(-1)!)).toBeLessThan(pts.length);
      let index = 0;
      for (const p of pts) index = follow(pts, index, p);
      expect(index).toBe(pts.length);
    }
});
