import { dispatchLearningEvent } from "../learning/analytics";

export type Event = 'game_started'|'game_exited'|'tutorial_started'|'tutorial_completed'|'tutorial_skipped'|'level_started'|'level_completed'|'round_presented'|'audio_played'|'audio_replayed'|'answer_selected'|'answer_correct'|'answer_retry'|'hint_requested'|'hint_shown'|'confusion_detected'|'session_completed'|'game_completed'|'game_paused'|'game_resumed';

// Local event bus only: no network transport, profile IDs, names or microphone.
export function emit(name: Event, detail: Record<string, string | number | boolean> = {}) {
  dispatchLearningEvent({channel:'skylora:game',game:'sound-match',version:1,name,detail});
}
