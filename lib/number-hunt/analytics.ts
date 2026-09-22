import type { GameEventName } from "./types";

export function emitGameEvent(name: GameEventName, detail: Record<string, unknown> = {}): void {
  if (typeof window === "undefined") return;
  window.dispatchEvent(
    new CustomEvent("skylora:game", {
      detail: {
        game: "number-hunt",
        name,
        timestamp: Date.now(),
        ...detail,
      },
    }),
  );
}
