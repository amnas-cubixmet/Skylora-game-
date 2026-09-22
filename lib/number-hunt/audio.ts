import { numberToWords } from "./number-words";

let audioContext: AudioContext | null = null;

function getAudioContext(): AudioContext | null {
  if (typeof window === "undefined" || !("AudioContext" in window)) return null;
  if (!audioContext) audioContext = new AudioContext();
  return audioContext;
}

export function cancelAudio(): void {
  if (typeof window !== "undefined" && "speechSynthesis" in window) {
    window.speechSynthesis.cancel();
  }
}

export function canSpeak(): boolean {
  return typeof window !== "undefined" && "speechSynthesis" in window && "SpeechSynthesisUtterance" in window;
}

export function speak(text: string, enabled: boolean, rate = 0.88): void {
  if (!enabled || !canSpeak()) return;
  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.rate = rate;
  utterance.pitch = 1.05;
  utterance.volume = 0.95;
  const voices = window.speechSynthesis.getVoices();
  utterance.voice =
    voices.find((voice) => /^en/i.test(voice.lang) && /Samantha|Ava|Zira|Victoria|Female/i.test(voice.name)) ??
    voices.find((voice) => /^en/i.test(voice.lang)) ??
    null;
  window.speechSynthesis.speak(utterance);
}

export function speakTarget(target: number, enabled: boolean): void {
  speak(`Find number ${numberToWords(target)}.`, enabled);
}

export function speakRetry(enabled: boolean): void {
  speak("Try again.", enabled, 0.9);
}

export function speakSuccess(target: number, enabled: boolean): void {
  if (!enabled) return;
  playSuccessTone(enabled);
  if (typeof window !== "undefined") {
    window.setTimeout(() => speak(`Great! That is ${numberToWords(target)}.`, enabled), 220);
  }
}

export function playSuccessTone(enabled: boolean): void {
  if (!enabled) return;
  const context = getAudioContext();
  if (!context) return;
  if (context.state === "suspended") void context.resume();

  const oscillator = context.createOscillator();
  const gain = context.createGain();
  oscillator.type = "sine";
  oscillator.frequency.setValueAtTime(523.25, context.currentTime);
  oscillator.frequency.linearRampToValueAtTime(659.25, context.currentTime + 0.14);
  gain.gain.setValueAtTime(0.0001, context.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.08, context.currentTime + 0.025);
  gain.gain.exponentialRampToValueAtTime(0.0001, context.currentTime + 0.18);
  oscillator.connect(gain);
  gain.connect(context.destination);
  oscillator.start();
  oscillator.stop(context.currentTime + 0.2);
}
