import { dispatchLearningEvent } from "../learning/analytics";

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
  const detail: Record<string, string | number | boolean> = {};
  if (skill) detail.skill = skill;
  if (reason) detail.reason = reason;
  dispatchLearningEvent({
    channel: "skylora:learning",
    game,
    version: 1,
    name,
    detail,
    timeField: "time",
  });
}
