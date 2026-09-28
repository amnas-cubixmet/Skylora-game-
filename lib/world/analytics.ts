// Local, bounded-schema event bus. Never pass a learner name, drawing, or raw answer.
export function worldEvent(
  name:
    | "game_started"
    | "round_presented"
    | "answer_correct"
    | "answer_retry"
    | "hint_requested"
    | "audio_replayed"
    | "session_completed"
    | "game_exited",
  game: string,
  skill?: string,
  reason?: string,
) {
  if (typeof window !== "undefined")
    window.dispatchEvent(
      new CustomEvent("skylora:learning", {
        detail: { version: 1, name, game, skill, reason, time: Date.now() },
      }),
    );
}
