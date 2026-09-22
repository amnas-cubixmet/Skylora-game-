import { expect, test, type Page } from "@playwright/test";

const STORAGE_KEY = "skylora:number-hunt:progress:v1";

async function startLevelOne(page: Page) {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "Number Hunt" })).toBeVisible();
  const soundButton = page.getByRole("button", { name: "Turn sound off" });
  if (await soundButton.isVisible()) await soundButton.click();
  await page.getByRole("button", { name: "Start Level 1" }).click();
  await expect(page.locator(".play-footer").getByText("Question 1 of 10", { exact: true })).toBeVisible();
}

async function answerCurrentCorrectly(page: Page, questionNumber: number) {
  const target = (await page.locator(".target-number").innerText()).trim();
  await page.getByRole("button", { name: new RegExp(`^Number ${target}(?:, hint)?$`) }).click();
  if (questionNumber < 10) {
    await expect(
      page.locator(".play-footer").getByText(`Question ${questionNumber + 1} of 10`, { exact: true }),
    ).toBeVisible({ timeout: 4_000 });
  }
}

test("completes the full Level 1 flow and unlocks Level 2", async ({ page }) => {
  await startLevelOne(page);

  for (let question = 1; question <= 10; question += 1) {
    await answerCurrentCorrectly(page, question);
  }

  await expect(page.getByRole("heading", { name: "Level Complete!" })).toBeVisible({ timeout: 4_000 });
  await expect(page.getByText("10", { exact: true }).first()).toBeVisible();
  await page.getByRole("button", { name: "Home" }).click();
  await expect(page.getByRole("button", { name: "Level 2", exact: true })).toBeEnabled();

  const saved = await page.evaluate((key) => JSON.parse(window.localStorage.getItem(key) ?? "{}"), STORAGE_KEY);
  expect(saved.highestUnlockedLevel).toBeGreaterThanOrEqual(2);
  expect(saved.totalQuestions).toBe(10);
});

test("persists an active session across refresh", async ({ page }) => {
  await startLevelOne(page);
  await answerCurrentCorrectly(page, 1);
  await answerCurrentCorrectly(page, 2);

  await page.reload();
  await expect(page.getByRole("button", { name: /Resume Level 1 • Question 3/ })).toBeVisible();
});

test("shows hints gently and ignores a rapid duplicate correct tap", async ({ page }) => {
  await startLevelOne(page);

  const target = (await page.locator(".target-number").innerText()).trim();
  const cards = page.locator(".number-card");
  const count = await cards.count();
  let wrong: string | null = null;
  for (let index = 0; index < count; index += 1) {
    const value = (await cards.nth(index).locator(".number-value").innerText()).trim();
    if (value !== target) {
      wrong = value;
      break;
    }
  }
  expect(wrong).not.toBeNull();

  const wrongButton = page.getByRole("button", { name: `Number ${wrong}` });
  await wrongButton.click();
  await page.waitForTimeout(280);
  await wrongButton.click();
  await expect(page.getByText("Look here")).toBeVisible();

  const correct = page.getByRole("button", { name: new RegExp(`^Number ${target}, hint$`) });
  await correct.evaluate((element: HTMLButtonElement) => {
    element.click();
    element.click();
  });

  await expect(page.locator(".play-footer").getByText("Question 2 of 10", { exact: true })).toBeVisible({ timeout: 4_000 });
  const saved = await page.evaluate((key) => JSON.parse(window.localStorage.getItem(key) ?? "{}"), STORAGE_KEY);
  expect(saved.totalQuestions).toBe(1);
  expect(saved.stars).toBe(1);
});

test("Level 10 renders eight choices and 320px layout has no horizontal overflow", async ({ page }) => {
  await page.addInitScript(
    ({ key, value }) => window.localStorage.setItem(key, JSON.stringify(value)),
    {
      key: STORAGE_KEY,
      value: {
        version: 1,
        currentLevel: 10,
        highestUnlockedLevel: 10,
        stars: 0,
        totalQuestions: 0,
        correctAnswers: 0,
        attempts: 0,
        hintsUsed: 0,
        totalResponseTimeMs: 0,
        confusedPairs: { "6:9": 4, "12:21": 3 },
        levelRecords: {},
        activeLevel: null,
      },
    },
  );

  await page.setViewportSize({ width: 320, height: 700 });
  await page.goto("/");
  await page.getByRole("button", { name: "Turn sound off" }).click();
  await page.getByRole("button", { name: "Level 10", exact: true }).click();

  await expect(page.locator(".number-card")).toHaveCount(8);
  await expect(page.locator(".target-number")).toBeVisible();

  const dimensions = await page.evaluate(() => ({
    scrollWidth: document.documentElement.scrollWidth,
    clientWidth: document.documentElement.clientWidth,
  }));
  expect(dimensions.scrollWidth).toBeLessThanOrEqual(dimensions.clientWidth);

  const boxes = await page.locator(".number-card").evaluateAll((elements) =>
    elements.map((element) => element.getBoundingClientRect().height),
  );
  expect(Math.min(...boxes)).toBeGreaterThanOrEqual(70);
});


test("stays responsive at 375px, 390px, and tablet widths", async ({ page }) => {
  const viewports = [
    { width: 375, height: 812 },
    { width: 390, height: 844 },
    { width: 768, height: 1024 },
  ];

  for (const viewport of viewports) {
    await page.setViewportSize(viewport);
    await page.goto("/");
    await page.evaluate(() => window.localStorage.clear());
    await page.reload();

    await page.getByRole("button", { name: "Turn sound off" }).click();
    await page.getByRole("button", { name: "Start Level 1" }).click();
    await expect(page.locator(".target-number")).toBeVisible();
    await expect(page.locator(".number-card")).toHaveCount(2);

    const dimensions = await page.evaluate(() => ({
      scrollWidth: document.documentElement.scrollWidth,
      clientWidth: document.documentElement.clientWidth,
    }));
    expect(dimensions.scrollWidth).toBeLessThanOrEqual(dimensions.clientWidth);

    const cardHeights = await page.locator(".number-card").evaluateAll((elements) =>
      elements.map((element) => element.getBoundingClientRect().height),
    );
    expect(Math.min(...cardHeights)).toBeGreaterThanOrEqual(70);
  }
});

test("restart asks for confirmation and safely resets active level progress", async ({ page }) => {
  await startLevelOne(page);
  await answerCurrentCorrectly(page, 1);

  await page.getByRole("button", { name: "Pause game" }).click();
  await expect(page.getByRole("heading", { name: "Game paused" })).toBeVisible();
  await page.getByRole("button", { name: "Restart Level" }).click();
  await expect(page.getByRole("heading", { name: "Start this level again?" })).toBeVisible();
  await page.getByRole("button", { name: "Yes, restart" }).click();

  await expect(page.locator(".play-footer").getByText("Question 1 of 10", { exact: true })).toBeVisible();
  const saved = await page.evaluate((key) => JSON.parse(window.localStorage.getItem(key) ?? "{}"), STORAGE_KEY);
  expect(saved.totalQuestions).toBe(0);
  expect(saved.stars).toBe(0);
  expect(saved.activeLevel.completedRounds).toBe(0);
});

test("remains playable when localStorage is unavailable", async ({ page }) => {
  const pageErrors: string[] = [];
  page.on("pageerror", (error) => pageErrors.push(error.message));

  await page.addInitScript(() => {
    const blocked = () => {
      throw new DOMException("Storage blocked for test", "SecurityError");
    };
    Object.defineProperty(Storage.prototype, "getItem", { configurable: true, value: blocked });
    Object.defineProperty(Storage.prototype, "setItem", { configurable: true, value: blocked });
  });

  await page.goto("/");
  await expect(page.getByText(/blocking local storage/i)).toBeVisible();
  await page.getByRole("button", { name: "Turn sound off" }).click();
  await page.getByRole("button", { name: "Start Level 1" }).click();
  await expect(page.locator(".target-number")).toBeVisible();
  expect(pageErrors).toEqual([]);
});

test("remains playable when speech synthesis is unavailable", async ({ page }) => {
  const pageErrors: string[] = [];
  page.on("pageerror", (error) => pageErrors.push(error.message));

  await page.addInitScript(() => {
    Object.defineProperty(window, "speechSynthesis", {
      configurable: true,
      value: undefined,
    });
    Object.defineProperty(window, "SpeechSynthesisUtterance", {
      configurable: true,
      value: undefined,
    });
  });

  await page.goto("/");
  await page.getByRole("button", { name: "Start Level 1" }).click();
  await expect(page.locator(".target-number")).toBeVisible();
  await page.getByRole("button", { name: "Repeat the number instruction" }).click();

  const target = (await page.locator(".target-number").innerText()).trim();
  await page.getByRole("button", { name: `Number ${target}` }).click();
  await expect(page.locator(".play-footer").getByText("Question 2 of 10", { exact: true })).toBeVisible({
    timeout: 4_000,
  });
  expect(pageErrors).toEqual([]);
});
