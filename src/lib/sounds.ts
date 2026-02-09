/**
 * Procedural sound effects using Web Audio API.
 * No external assets or API keys required.
 * Gracefully no-ops in environments without AudioContext (tests).
 */

import { useSettingsStore, type SoundCategory } from '@/store/settingsStore';

let audioCtx: AudioContext | null = null;

function getCtx(): AudioContext | null {
  if (typeof AudioContext === 'undefined') return null;
  if (!audioCtx) {
    audioCtx = new AudioContext();
  }
  if (audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
  return audioCtx;
}

/** Master volume (0-1). */
let masterVolume = 0.5;

export function setSoundVolume(v: number) {
  masterVolume = Math.max(0, Math.min(1, v));
}

export function getSoundVolume(): number {
  return masterVolume;
}

function isSoundEnabled(category: SoundCategory): boolean {
  try {
    return useSettingsStore.getState().soundToggles[category] ?? true;
  } catch {
    return true;
  }
}

// ── Helpers ──

function makeGain(ctx: AudioContext, volume: number): GainNode {
  const g = ctx.createGain();
  g.gain.value = volume * masterVolume;
  return g;
}

function makeOsc(
  ctx: AudioContext,
  type: OscillatorType,
  freq: number,
  start: number,
  end: number,
  dest: AudioNode,
) {
  const o = ctx.createOscillator();
  o.type = type;
  o.frequency.value = freq;
  o.connect(dest);
  o.start(start);
  o.stop(end);
  return o;
}

// ── Sound Effects ──

/** Short whoosh for drawing a card. */
export function playDrawSound() {
  if (!isSoundEnabled('draw')) return;
  const ctx = getCtx();
  if (!ctx) return;
  const now = ctx.currentTime;

  const dur = 0.15;
  const bufferSize = ctx.sampleRate * dur;
  const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < bufferSize; i++) {
    data[i] = (Math.random() * 2 - 1) * (1 - i / bufferSize);
  }

  const src = ctx.createBufferSource();
  src.buffer = buffer;

  const filter = ctx.createBiquadFilter();
  filter.type = 'bandpass';
  filter.frequency.value = 2000;
  filter.Q.value = 1.5;

  const g = makeGain(ctx, 0.25);
  g.gain.setValueAtTime(0.25 * masterVolume, now);
  g.gain.exponentialRampToValueAtTime(0.001, now + dur);

  src.connect(filter).connect(g).connect(ctx.destination);
  src.start(now);
  src.stop(now + dur);
}

/** Soft thud + slide for swapping a card. */
export function playSwapSound() {
  if (!isSoundEnabled('swap')) return;
  const ctx = getCtx();
  if (!ctx) return;
  const now = ctx.currentTime;

  const g1 = makeGain(ctx, 0.3);
  g1.gain.setValueAtTime(0.3 * masterVolume, now);
  g1.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
  const o1 = makeOsc(ctx, 'sine', 150, now, now + 0.15, g1);
  o1.frequency.exponentialRampToValueAtTime(80, now + 0.15);
  g1.connect(ctx.destination);

  const g2 = makeGain(ctx, 0.15);
  g2.gain.setValueAtTime(0.15 * masterVolume, now);
  g2.gain.exponentialRampToValueAtTime(0.001, now + 0.08);
  makeOsc(ctx, 'triangle', 800, now, now + 0.08, g2);
  g2.connect(ctx.destination);
}

/** Light snap for discarding. */
export function playDiscardSound() {
  if (!isSoundEnabled('discard')) return;
  const ctx = getCtx();
  if (!ctx) return;
  const now = ctx.currentTime;

  const g = makeGain(ctx, 0.2);
  g.gain.setValueAtTime(0.2 * masterVolume, now);
  g.gain.exponentialRampToValueAtTime(0.001, now + 0.12);

  const o = makeOsc(ctx, 'triangle', 600, now, now + 0.12, g);
  o.frequency.exponentialRampToValueAtTime(300, now + 0.12);
  g.connect(ctx.destination);
}

/** Dramatic rising tone for calling KABOO. */
export function playKabooSound() {
  if (!isSoundEnabled('kaboo')) return;
  const ctx = getCtx();
  if (!ctx) return;
  const now = ctx.currentTime;

  const g1 = makeGain(ctx, 0.3);
  g1.gain.setValueAtTime(0.01, now);
  g1.gain.linearRampToValueAtTime(0.3 * masterVolume, now + 0.2);
  g1.gain.setValueAtTime(0.3 * masterVolume, now + 0.5);
  g1.gain.exponentialRampToValueAtTime(0.001, now + 0.9);

  const o1 = makeOsc(ctx, 'sawtooth', 220, now, now + 0.9, g1);
  o1.frequency.exponentialRampToValueAtTime(880, now + 0.5);
  o1.frequency.setValueAtTime(880, now + 0.5);
  g1.connect(ctx.destination);

  const g2 = makeGain(ctx, 0.15);
  g2.gain.setValueAtTime(0.01, now + 0.1);
  g2.gain.linearRampToValueAtTime(0.15 * masterVolume, now + 0.35);
  g2.gain.exponentialRampToValueAtTime(0.001, now + 0.9);
  makeOsc(ctx, 'sine', 1320, now + 0.1, now + 0.9, g2);
  g2.connect(ctx.destination);

  const g3 = makeGain(ctx, 0.2);
  g3.gain.setValueAtTime(0.2 * masterVolume, now + 0.5);
  g3.gain.exponentialRampToValueAtTime(0.001, now + 0.9);
  makeOsc(ctx, 'sine', 1760, now + 0.5, now + 0.9, g3);
  g3.connect(ctx.destination);
}

/** Bright chime for successful tap. */
export function playTapSuccessSound() {
  if (!isSoundEnabled('tap')) return;
  const ctx = getCtx();
  if (!ctx) return;
  const now = ctx.currentTime;

  const notes = [523, 659, 784]; // C5, E5, G5 arpeggio
  notes.forEach((freq, i) => {
    const t = now + i * 0.08;
    const g = makeGain(ctx, 0.2);
    g.gain.setValueAtTime(0.2 * masterVolume, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + 0.25);
    makeOsc(ctx, 'sine', freq, t, t + 0.25, g);
    g.connect(ctx.destination);
  });
}

/** Descending buzz for tap penalty. */
export function playTapPenaltySound() {
  if (!isSoundEnabled('tap')) return;
  const ctx = getCtx();
  if (!ctx) return;
  const now = ctx.currentTime;

  const g1 = makeGain(ctx, 0.25);
  g1.gain.setValueAtTime(0.25 * masterVolume, now);
  g1.gain.exponentialRampToValueAtTime(0.001, now + 0.4);

  const o1 = makeOsc(ctx, 'square', 300, now, now + 0.4, g1);
  o1.frequency.exponentialRampToValueAtTime(80, now + 0.4);
  g1.connect(ctx.destination);

  const g2 = makeGain(ctx, 0.15);
  g2.gain.setValueAtTime(0.15 * masterVolume, now + 0.15);
  g2.gain.exponentialRampToValueAtTime(0.001, now + 0.45);

  const o2 = makeOsc(ctx, 'square', 200, now + 0.15, now + 0.45, g2);
  o2.frequency.exponentialRampToValueAtTime(60, now + 0.45);
  g2.connect(ctx.destination);
}

/** Soft peek reveal sound. */
export function playPeekSound() {
  if (!isSoundEnabled('peek')) return;
  const ctx = getCtx();
  if (!ctx) return;
  const now = ctx.currentTime;

  const g = makeGain(ctx, 0.15);
  g.gain.setValueAtTime(0.15 * masterVolume, now);
  g.gain.exponentialRampToValueAtTime(0.001, now + 0.2);

  makeOsc(ctx, 'sine', 1047, now, now + 0.2, g);
  g.connect(ctx.destination);
}

/** Effect activation shimmer. */
export function playEffectSound() {
  if (!isSoundEnabled('effect')) return;
  const ctx = getCtx();
  if (!ctx) return;
  const now = ctx.currentTime;

  const g = makeGain(ctx, 0.18);
  g.gain.setValueAtTime(0.01, now);
  g.gain.linearRampToValueAtTime(0.18 * masterVolume, now + 0.1);
  g.gain.exponentialRampToValueAtTime(0.001, now + 0.35);

  const o = makeOsc(ctx, 'sine', 660, now, now + 0.35, g);
  o.frequency.exponentialRampToValueAtTime(1320, now + 0.15);
  o.frequency.exponentialRampToValueAtTime(880, now + 0.35);
  g.connect(ctx.destination);
}
