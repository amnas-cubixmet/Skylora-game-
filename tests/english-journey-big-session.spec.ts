import { test, expect } from "@playwright/test";
import { JOURNEY_STORAGE_KEY } from "../lib/english-journey/storage";

test.beforeEach(async ({ page }) => {
  await page.addInitScript((key) => localStorage.removeItem(key), JOURNEY_STORAGE_KEY);
});

test("English Journey starts with integrated A lesson and handwriting", async ({ page }) => {
  await page.goto("/english-journey");
  await expect(page.getByRole("heading", { name: "Learn English. One skill at a time." })).toBeVisible();
  await page.getByRole("button", { name: "Continue learning" }).click();
  await expect(page.getByRole("heading", { name: "Meet A" })).toBeVisible();
  await page.getByRole("button", { name: "Meet letter A" }).click();
  await expect(page.getByRole("heading", { name: "Find A" })).toBeVisible();
  await page.getByRole("button", { name: "Letter A", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Find little a" })).toBeVisible();
  await page.getByRole("button", { name: "Lowercase a", exact: true }).click();
  await expect(page.getByRole("heading", { name: "A is for…" })).toBeVisible();
  await page.getByRole("button", { name: "apple", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Trace A" })).toBeVisible();
  await expect(page.getByRole("img", { name: "Trace the letter A" })).toBeVisible();
});

test("curriculum map includes the full connected English path", async ({ page }) => {
  await page.goto("/english-journey");
  for (const name of [
    "Alphabet Adventure",
    "Letter Writing School",
    "Phonics Forest",
    "First Words",
    "Talk with Kichu",
    "Reading Road",
    "Sentence City",
    "Paragraph Builder",
    "Creative Writing Studio",
    "Real-Life English",
  ]) {
    await expect(page.getByRole("button", { name: new RegExp(name) })).toBeVisible();
  }
});

test("320px gameplay stays inside viewport with touch-sized choices", async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 568 });
  await page.goto("/english-journey");
  await page.getByRole("button", { name: "Continue learning" }).click();
  await page.getByRole("button", { name: "Meet letter A" }).click();
  const dimensions = await page.evaluate(() => ({
    client: document.documentElement.clientWidth,
    scroll: document.documentElement.scrollWidth,
  }));
  expect(dimensions.scroll).toBeLessThanOrEqual(dimensions.client);
  const sizes = await page.getByRole("button", { name: /^Letter [ABC]$/ }).evaluateAll((items) =>
    items.map((item) => {
      const box = item.getBoundingClientRect();
      return { width: box.width, height: box.height };
    }),
  );
  expect(sizes.length).toBe(3);
  expect(sizes.every((item) => item.width >= 44 && item.height >= 44)).toBe(true);
});
