export type EventName = 'game_started'|'tutorial_started'|'tutorial_completed'|'level_started'|'question_presented'|'letter_selected'|'answer_correct'|'answer_retry'|'hint_shown'|'audio_replayed'|'question_completed'|'level_completed'|'game_completed'|'game_paused'|'game_resumed'|'game_exited';
// Local integration point only. No network, identifiers, or child information.
export function emit(name:EventName, detail:Record<string,string|number|boolean>={}) {
 if(typeof window!=='undefined')window.dispatchEvent(new CustomEvent('skylora:game',{detail:{game:'english-az',version:1,name,timestamp:Date.now(),...detail}}));
}
