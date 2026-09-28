import { test, expect, type Page } from "@playwright/test";
import { GAMES, type Game } from "../lib/world/catalogue";
import { fresh, type Activity } from "../lib/world/types";
import { newSession } from "../lib/world/progress";
import { activityFor } from "../lib/world/activities";
import { WORLD_KEY } from "../lib/world/storage";
import { STROKES, sampleStroke } from "../lib/world/strokes";
async function open(page: Page, game: Game) {
  const p = fresh();
  p.settings.voice = false;
  p.settings.name = "ANNA";
  p.tutorials = GAMES.map((g) => g.slug);
  p.session = newSession(game, p, 31);
  p.session.built = activityFor(game, p.session).initial ?? 0;
  await page.goto("/");
  await page.evaluate(
    ({ key, p }) => localStorage.setItem(key, JSON.stringify(p)),
    { key: WORLD_KEY, p },
  );
  await page.goto(`/${game.slug}`);
  await page.getByRole("button", { name: "Continue adventure" }).click();
  await expect(page.getByTestId("world-round")).toBeVisible();
  return p.session;
}
async function solve(page: Page, q: Activity) {
  const before = await page.getByTestId("world-round").getAttribute("data-round");
  if (q.mechanic === "choice") {
    await page.locator(`[data-choice="${q.answer}"]`).click();
  }
  if (q.mechanic === "order") {
    const used = new Set<number>();
    for (const token of q.answer.split("|")) {
      const index = q.tokens!.findIndex((t, i) => t === token && !used.has(i));
      used.add(index);
      await page
        .getByRole("button", {
          name: `${token}, tile ${index + 1}`,
          exact: true,
        })
        .click();
    }
    await page
      .getByRole("button", { name: /Check my (word|sentence)/ })
      .click();
  }
  if (q.mechanic === "build" || q.mechanic === "line") {
    let count = q.initial ?? 0;
    const target = Number(q.answer);
    while (count < target) {
      await page
        .getByRole("button", {
          name: q.mechanic === "line" ? "Jump one →" : "+ Add one",
          exact: true,
        })
        .click();
      count++;
    }
    while (count > target) {
      await page
        .getByRole("button", {
          name: q.mechanic === "line" ? "← Back one" : "− Remove one",
          exact: true,
        })
        .click();
      count--;
    }
    await page
      .getByRole("button", {
        name: q.mechanic === "line" ? "Check my landing" : "Check my group",
      })
      .click();
  }
  if (q.mechanic === "start") {
    const index = q.options.findIndex((o) => o.id === "start");
    await page
      .getByRole("button", { name: new RegExp(`^Point ${index + 1},`) })
      .click();
  }
  if (q.mechanic === "copy") {
    const letters = STROKES[q.trace!] ? [q.trace!] : q.trace!.split("");
    for (const _letter of letters) {
      await page
        .getByRole("button", { name: "Practise on paper instead" })
        .click();
      await page
        .getByRole("button", { name: "I practised and compared my letter" })
        .click();
    }
  }
  if (q.mechanic === "trace") {
    const letters = STROKES[q.trace!] ? [q.trace!] : q.trace!.split("");
    for (const letter of letters) {
      const strokes = q.id.startsWith("W07")
        ? STROKES[letter].slice(-1)
        : STROKES[letter];
      for (const stroke of strokes) {
        await page.locator(".world-tracing svg").scrollIntoViewIfNeeded();
        const area = await page.locator(".world-tracing svg").boundingBox();
        if (!area) throw new Error("Missing trace area");
        const pts = sampleStroke(stroke, 6);
        await page.mouse.move(
          area.x + (pts[0][0] / 100) * area.width,
          area.y + (pts[0][1] / 100) * area.height,
        );
        await page.mouse.down();
        for (const point of pts)
          await page.mouse.move(
            area.x + (point[0] / 100) * area.width,
            area.y + (point[1] / 100) * area.height,
          );
        await page.mouse.up();
      }
    }
  }
  await page.waitForFunction(
    ({ before }) => {
      const round = document.querySelector('[data-testid="world-round"]');
      return !round || round.getAttribute("data-round") !== before;
    },
    { before },
    { timeout: 4_000 },
  );
}
for (const game of GAMES)
  test(`${game.id} ${game.title} is playable with a working first activity`, async ({
    page,
  }) => {
    const errors: string[] = [];
    page.on("pageerror", (e) => errors.push(e.message));
    const session = await open(page, game);
    await solve(page, activityFor(game, session));
    expect(errors).toEqual([]);
  });
test("a full mixed maths session completes and earns a persisted badge", async ({
  page,
}) => {
  const game = GAMES.find((g) => g.id === "M12")!,
    session = await open(page, game);
  for (let index = 0; index < 8; index++) {
    await solve(page, activityFor(game, { ...session, index }));
  }
  await expect(
    page.getByRole("heading", { name: "Adventure complete!" }),
  ).toBeVisible();
  await page.goto("/rewards");
  await expect(
    page.getByRole("heading", { name: "Maths Adventurer", exact: true }),
  ).toBeVisible();
});
test("first visit tutorial, retries, hints, pause and a solved-round reload are stable", async ({
  page,
}) => {
  await page.goto("/sound-hunter");
  await page.getByRole("button", { name: "Play →", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "Here’s how we play." }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Let’s try it →" }).click();
  await page.getByRole("button", { name: "Pause game" }).click();
  await expect(page.getByRole("dialog")).toBeVisible();
  await page.getByRole("button", { name: "Resume", exact: true }).click();
  await page.getByRole("button", { name: "Show a hint", exact: true }).click();
  await page.getByRole("button", { name: "Show a hint", exact: true }).click();
  const id = await page
    .locator(".world-choice.hint-glow")
    .getAttribute("data-choice");
  await page.locator(`[data-choice="${id}"]`).click();
  await page.reload();
  await page.getByRole("button", { name: "Continue adventure" }).click();
  await expect(page.getByTestId("world-round")).toHaveAttribute(
    "data-round",
    /:1$/,
  );
});
for (const width of [320, 360, 375, 390, 414])
  test(`home, worlds, tracing and active games fit ${width}px`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height: 800 });
    for (const route of [
      "/",
      "/worlds/reading",
      "/worlds/writing",
      "/worlds/maths",
      "/learning-progress",
      "/learning-settings",
    ]) {
      await page.goto(route);
      expect(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth,
        ),
      ).toBe(true);
    }
    await open(page, GAMES.find((g) => g.id === "W01")!);
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
    await expect(
      page.getByRole("button", {
        name: "Follow next path section with keyboard",
      }),
    ).toBeVisible();
  });
test("older theme, reduced motion and keyboard controls work", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/learning-settings");
  await page.getByRole("radio", { name: /Older learner/ }).check();
  await page.goto("/");
  await expect(page.locator(".learning-world")).toHaveAttribute(
    "data-theme",
    "older",
  );
  await expect(page.locator(".world-guide").first()).toBeHidden();
  await open(page, GAMES.find((g) => g.id === "M04")!);
  await page.getByRole("button", { name: "+ Add one", exact: true }).focus();
  await page.keyboard.press("Enter");
  await expect(page.locator(".world-build-count")).toHaveText("1");
});
