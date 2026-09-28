import { speakEnglish, stopAudio, canSpeak } from '../english/audio';
import { instruction, sound } from './content';
import type { Round } from './types';
export type AudioPart = { text: string; src?: string };
// Add only real, reviewed assets. Missing files are never requested speculatively.
export const AUDIO_CLIPS: Partial<Record<string, string>> = {};
export function roundAudio(q: Round): AudioPart[] {
  const s = sound(q.target), phoneme = s.phonemeAudio ?? AUDIO_CLIPS[`phoneme-${s.id.toLowerCase()}`];
  if (phoneme && ['sound-to-letter','sound-to-picture','similar-sound','beginning-sound'].includes(q.mode)) {
    return [{ text: 'Listen carefully.' }, { src: phoneme, text: `Listen to the ${s.position === 'final' ? 'last sounds' : 'first sound'} in ${s.primaryWord}.` }, { text: q.mode === 'sound-to-picture' ? 'Which picture has that sound?' : 'Which letter spells that sound?' }];
  }
  return [{ text: instruction(q), src: AUDIO_CLIPS[`instruction-${q.id}`] }];
}
type Dependencies = { speak: typeof speakEnglish; cancel: typeof stopAudio; available: typeof canSpeak; media: () => HTMLAudioElement };
const defaults: Dependencies = { speak: speakEnglish, cancel: stopAudio, available: canSpeak, media: () => new Audio() };
export class SoundAudioController {
  private generation = 0;
  private abortPart: (() => void) | null = null;
  private media: HTMLAudioElement | null = null;
  private context: AudioContext | null = null;
  private tone: OscillatorNode | null = null;
  constructor(private deps: Dependencies = defaults) {}
  stop() {
    this.generation++;
    this.abortPart?.(); this.abortPart = null;
    if (this.media) { this.media.pause(); this.media.removeAttribute('src'); this.media = null; }
    this.deps.cancel();
    try { this.tone?.stop(); } catch { /* An already-ended tone is harmless. */ }
    this.tone = null;
  }
  private bounded(run: (finish: (ok: boolean) => void) => void): Promise<boolean> {
    return new Promise(resolve => {
      let done = false;
      const finish = (ok: boolean) => { if (done) return; done = true; clearTimeout(timer); this.abortPart = null; resolve(ok); };
      const timer = setTimeout(() => { this.media?.pause(); this.deps.cancel(); finish(false); }, 12000);
      this.abortPart = () => finish(false);
      try { run(finish); } catch { finish(false); }
    });
  }
  async play(parts: AudioPart[], enabled: boolean): Promise<boolean> {
    this.stop(); const token = this.generation;
    if (!enabled) return false;
    let success = true;
    for (const part of parts) {
      if (token !== this.generation) return false;
      let ok = false;
      if (part.src) {
        ok = await this.bounded(finish => {
          const media = this.deps.media(); this.media = media; media.preload = 'auto'; media.src = part.src!;
          media.onended = () => finish(true); media.onerror = () => finish(false);
          void media.play().catch(() => finish(false));
        });
        if (token !== this.generation) return false;
        if (this.media) { this.media.pause(); this.media.onended = null; this.media.onerror = null; this.media = null; }
      }
      if (token !== this.generation) return false;
      if (!ok && this.deps.available()) ok = await this.bounded(finish => { void this.deps.speak(part.text, true).then(finish, () => finish(false)); });
      success = success && ok;
    }
    return token === this.generation && success;
  }
  chime(enabled: boolean) {
    if (!enabled || typeof window === 'undefined' || !window.AudioContext) return;
    try {
      this.context ??= new AudioContext();
      const context = this.context, tone = context.createOscillator(), gain = context.createGain();
      this.tone = tone;
      void context.resume().catch(() => {});
      tone.frequency.setValueAtTime(660, context.currentTime);
      tone.frequency.linearRampToValueAtTime(880, context.currentTime + 0.12);
      gain.gain.setValueAtTime(0.035, context.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, context.currentTime + 0.18);
      tone.connect(gain); gain.connect(context.destination); tone.start(); tone.stop(context.currentTime + 0.2);
      tone.onended = () => { tone.disconnect(); gain.disconnect(); if (this.tone === tone) this.tone = null; };
    } catch { /* Optional SFX must never block learning. */ }
  }
  dispose() { this.stop(); void this.context?.close().catch(() => {}); this.context = null; }
}
