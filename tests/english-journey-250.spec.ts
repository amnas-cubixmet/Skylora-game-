import { test, expect } from "@playwright/test";
import {
  ALL_LEVELS,
  JOURNEY_WORLDS,
  LEVEL_BY_ID,
  TOTAL_JOURNEY_LEVELS,
  WORLD_LEVEL_COUNTS,
  isLevelUnlocked,
  levelsForWorld,
} from "../lib/english-journey/content";
import { JOURNEY_STORAGE_KEY } from "../lib/english-journey/storage";

test("English Journey curriculum contains exactly 250 unique scaffolded levels", () => {
  expect(TOTAL_JOURNEY_LEVELS).toBe(250);
  expect(ALL_LEVELS).toHaveLength(250);
  expect(new Set(ALL_LEVELS.map((level) => level.id)).size).toBe(250);
  expect(ALL_LEVELS.map((level) => level.globalNumber)).toEqual(
    Array.from({ length: 250 }, (_, index) => index + 1),
  );

  for (const world of JOURNEY_WORLDS) {
    expect(levelsForWorld(world.id)).toHaveLength(WORLD_LEVEL_COUNTS[world.id]);
    expect(world.levelCount).toBe(WORLD_LEVEL_COUNTS[world.id]);
  }
});

test("every prerequisite points to a real level and unlocks after completion", () => {
  for (const level of ALL_LEVELS) {
    for (const prerequisiteId of level.prerequisiteIds) {
      expect(LEVEL_BY_ID[prerequisiteId]).toBeTruthy();
      expect(prerequisiteId).not.toBe(level.id);
    }
    expect(isLevelUnlocked(level, level.prerequisiteIds)).toBe(true);
  }
});

test("journey home exposes the 250-level progress target", async ({ page }) => {
  await page.addInitScript((key) => localStorage.removeItem(key), JOURNEY_STORAGE_KEY);
  await page.goto("/english-journey");
  await expect(page.getByText("0/250 levels")).toBeVisible();
  await expect(page.getByText(/250 connected levels/i)).toBeVisible();
});

test("legacy v2 writing completion migrates to the new writing level id", async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.removeItem("skylora.english-journey.v3");
    localStorage.setItem("skylora.english-journey.v2", JSON.stringify({
      version: 2,
      stars: 3,
      completedMissions: 1,
      bestAccuracy: 100,
      masteredActivityIds: [],
      completedLevelIds: ["letter-a", "writing:letter-a"],
      skillStats: {},
      soundEnabled: true,
      lastLevelId: "letter-a",
    }));
  });
  await page.goto("/english-journey");
  await expect(page.getByText("2/250 levels")).toBeVisible();
  const migrated = await page.evaluate(() => JSON.parse(localStorage.getItem("skylora.english-journey.v3") ?? "{}"));
  expect(migrated.completedLevelIds).toContain("write-a");
});
