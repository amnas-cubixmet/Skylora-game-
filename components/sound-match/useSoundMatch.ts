'use client';
import { useCallback, useEffect, useReducer, useRef, useState } from 'react';
import { SoundAudioController, roundAudio, type AudioPart } from '../../lib/sound-match/audio';
import { emit } from '../../lib/sound-match/analytics';
import { initialState, reducer, type Action } from '../../lib/sound-match/progress';
import { localProgressStore, type ProgressStore } from '../../lib/sound-match/storage';
export function useSoundMatch(store: ProgressStore = localProgressStore) {
  const [state, dispatch] = useReducer(reducer, initialState);
  const [listening, setListening] = useState(false), [audioUnavailable, setAudioUnavailable] = useState(false);
  const controller = useRef<SoundAudioController | null>(null), stateRef = useRef(state), locked = useRef(false), announced = useRef(''), playToken = useRef(0);
  useEffect(() => { stateRef.current = state; locked.current = !['PLAYING','HINT'].includes(state.status); }, [state]);
  const stop = useCallback(() => { playToken.current++; controller.current?.stop(); setListening(false); }, []);
  const speak = useCallback(async (parts: AudioPart[]) => {
    const token = ++playToken.current, enabled = stateRef.current.progress.settings.voice;
    setListening(enabled);
    const ok = await controller.current?.play(parts, enabled, stateRef.current.progress.settings.accent);
    if (token === playToken.current) { setListening(false); setAudioUnavailable(enabled && !ok); if (ok) emit('audio_played'); }
    return !!ok;
  }, []);
  useEffect(() => {
    const audioController = new SoundAudioController();
    controller.current = audioController;
    dispatch({ type: 'LOAD', ...store.load() }); emit('game_started');
    return () => { audioController.dispose(); if (controller.current === audioController) controller.current = null; };
  }, [store]);
  useEffect(() => { if (state.status !== 'LOADING' && !store.save(state.progress) && state.available) dispatch({ type: 'STORAGE_UNAVAILABLE' }); }, [state.progress, state.status, state.available, store]);
  const act = useCallback((action: Action) => {
    if (['START','HOME','PAUSE','RESUME','NEXT','RESTART_ACTIVITY','TUTORIAL','ACCENT'].includes(action.type) || (action.type==='SETTING'&&action.key==='voice')) stop();
    if (action.type === 'RESTART_ACTIVITY') announced.current = '';
    dispatch(action);
  }, [stop]);
  useEffect(() => {
    if (state.status !== 'ROUND_INTRO') return;
    // Critical illustrations are inline SVG: no image fetch can delay the round.
    const timer = setTimeout(() => dispatch({ type: 'INTRO_DONE' }), 180);
    return () => clearTimeout(timer);
  }, [state.status, state.question?.id]);
  useEffect(() => {
    if (!['PLAYING','HINT'].includes(state.status) || !state.question || announced.current === state.question.id) return;
    announced.current = state.question.id;
    emit('round_presented', { level: state.level, mode: state.question.mode, target: state.question.target });
    void speak(roundAudio(state.question));
  }, [state.status, state.question, state.level, speak]);
  useEffect(() => {
    if (state.status !== 'ANSWER_FEEDBACK' || !state.question) return;
    let alive = true;
    let timer: ReturnType<typeof setTimeout>;
    const minimum = new Promise<void>(resolve => { timer = setTimeout(resolve, state.correct ? 1250 : 650); });
    const parts: AudioPart[] = [{ text: state.feedback }];
    if (!state.correct && (state.progress.session?.attempts ?? 0) >= 2) parts.push(...roundAudio(state.question));
    void Promise.all([minimum, speak(parts)]).then(() => {
      if (!alive) return;
      if (state.correct) controller.current?.chime(state.progress.settings.sfx);
      if (!state.correct || state.progress.settings.autoContinue) dispatch({ type: state.correct ? 'NEXT' : 'RETRY_READY' });
    });
    return () => { alive = false; clearTimeout(timer); stop(); };
  }, [state.status, state.correct, state.feedback, state.question, state.progress.session?.attempts, state.progress.settings.autoContinue, state.progress.settings.sfx, speak, stop]);
  useEffect(() => {
    const hidden = () => { if (document.hidden) { stop(); dispatch({ type: 'PAUSE' }); } };
    document.addEventListener('visibilitychange', hidden);
    const key = (event: KeyboardEvent) => {
      if (event.altKey || event.ctrlKey || event.metaKey || event.repeat || document.querySelector('[role="dialog"]')) return;
      const s = stateRef.current;
      if (event.key === 'Escape' && ['ROUND_INTRO','PLAYING','HINT','ANSWER_FEEDBACK'].includes(s.status)) { event.preventDefault(); stop(); dispatch({ type: 'PAUSE' }); emit('game_paused'); }
      if (event.key.toLowerCase() === 'r' && ['PLAYING','HINT'].includes(s.status) && s.question) { event.preventDefault(); dispatch({ type: 'REPLAY' }); emit('audio_replayed'); void speak(roundAudio(s.question)); }
    };
    document.addEventListener('keydown',key);
    return () => { document.removeEventListener('visibilitychange',hidden); document.removeEventListener('keydown',key); };
  }, [speak,stop]);
  function start(level: number, restart = false) {
    announced.current = ''; locked.current = true;
    act({ type: 'START', level, restart, seed: Math.floor(Math.random() * 0x7fffffff) }); emit('level_started',{level});
  }
  function select(value: string) {
    const s = stateRef.current, q = s.question, a = s.progress.session;
    if (locked.current || !q || !a || !q.options.includes(value)) return;
    locked.current = true; stop();
    dispatch({ type: 'SELECT', value, date: new Date().toISOString(), supported: !s.progress.settings.voice || audioUnavailable });
    const correct = value === q.target;
    emit('answer_selected', { target: q.target, selected: value, mode: q.mode });
    emit(correct ? 'answer_correct' : 'answer_retry', { target: q.target, mode: q.mode });
    if (!correct) { emit('confusion_detected',{target:q.target,selected:value}); if (a.attempts === 1 && !a.hints) emit('hint_shown',{automatic:true}); }
    if (correct && a.index === 9) { emit('level_completed',{level:a.level}); emit('session_completed',{level:a.level}); if (a.level === 6) emit('game_completed'); }
  }
  function replay() { const q = stateRef.current.question; if (!q) return; act({ type: 'REPLAY' }); emit('audio_replayed'); void speak(roundAudio(q)); }
  function hint() { const q = stateRef.current.question; if (!q) return; act({ type: 'HINT' }); emit('hint_requested'); emit('hint_shown',{automatic:false}); void speak(roundAudio(q)); }
  return { state, act, start, select, replay, hint, speak, stop, listening, audioUnavailable };
}
