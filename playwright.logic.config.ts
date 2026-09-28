import { defineConfig } from "@playwright/test";
export default defineConfig({
  testDir: "./tests",
  testMatch: ["**/*.logic.spec.ts"],
  workers: 1,
  reporter: "line",
});
