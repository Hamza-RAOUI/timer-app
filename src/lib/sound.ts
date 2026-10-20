/**
 * Sound (web only for now — native builds no-op; they'd need expo-audio).
 *
 * - Cues: a soft chime when a block ends, a short sting on level-up, a ding for
 *   quests. Synthesized with Web Audio (pure tones, nothing to license). Gated by
 *   Settings → Sounds.
 * - Ambience: real recordings served from /audio/<key>.mp3 (public/audio), looped
 *   while a focus block runs. Pixabay Content License — sources in public/audio/CREDITS.md;
 *   `node scripts/prepare-audio.mjs <folder>` turns the downloads into those files.
 *   Tracks whose file is missing are simply not offered.
 */
import { useEffect, useState } from 'react';
import { Platform } from 'react-native';

export type AmbienceKey = 'off' | 'brown' | 'rain' | 'waves' | 'night' | 'cafe' | 'fire' | 'lofi1' | 'lofi2';

export const AMBIENCES: { key: Exclude<AmbienceKey, 'off'>; label: string; icon: string; pro: boolean }[] = [
  { key: 'brown', label: 'Brown noise', icon: 'radio', pro: false },
  { key: 'rain', label: 'Rain', icon: 'rainy', pro: false },
  { key: 'waves', label: 'Waves', icon: 'water', pro: true },
  { key: 'night', label: 'Night', icon: 'moon', pro: true },
  { key: 'cafe', label: 'Café', icon: 'cafe', pro: true },
  { key: 'fire', label: 'Fireplace', icon: 'flame', pro: true },
  { key: 'lofi1', label: 'Lo-fi I', icon: 'musical-notes', pro: true },
  { key: 'lofi2', label: 'Lo-fi II', icon: 'musical-note', pro: true },
];

const isWeb = () => Platform.OS === 'web' && typeof window !== 'undefined';
const srcFor = (key: AmbienceKey) => `/audio/${key}.mp3`;

// ───────────── Cues (Web Audio) ─────────────
let ctx: AudioContext | null = null;
const audio = (): AudioContext | null => {
  if (!isWeb()) return null;
  const Ctor = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!Ctor) return null;
  if (!ctx) ctx = new Ctor();
  if (ctx.state === 'suspended') ctx.resume().catch(() => {});
  return ctx;
};

const tone = (c: AudioContext, freq: number, at: number, dur: number, gain: number, type: OscillatorType = 'sine') => {
  const o = c.createOscillator();
  const g = c.createGain();
  o.type = type;
  o.frequency.value = freq;
  g.gain.setValueAtTime(0, at);
  g.gain.linearRampToValueAtTime(gain, at + 0.012);
  g.gain.exponentialRampToValueAtTime(0.0001, at + dur);
  o.connect(g).connect(c.destination);
  o.start(at);
  o.stop(at + dur + 0.05);
};

/** Two soft bell notes — a block finished. */
export const playChime = () => {
  const c = audio();
  if (!c) return;
  const t = c.currentTime + 0.02;
  for (const [f, d, at] of [
    [880, 1.6, 0],
    [1318.5, 1.4, 0.18],
  ] as const) {
    tone(c, f, t + at, d, 0.16);
    tone(c, f * 2.01, t + at, d * 0.5, 0.04); // shimmer partial
  }
};

/** Quick rising arpeggio — level up. */
export const playLevelUp = () => {
  const c = audio();
  if (!c) return;
  const t = c.currentTime + 0.02;
  [523.25, 659.25, 783.99, 1046.5].forEach((f, i) => tone(c, f, t + i * 0.09, 0.5, 0.12, 'triangle'));
  tone(c, 1568, t + 0.36, 1.2, 0.06);
};

/** Single bright ding — quest complete. */
export const playDing = () => {
  const c = audio();
  if (!c) return;
  tone(c, 1174.7, c.currentTime + 0.02, 0.7, 0.1, 'triangle');
};

// ───────────── Ambience (recordings) ─────────────
export const ambienceSupported = isWeb;

let available: Set<AmbienceKey> | null = null;
let probing: Promise<Set<AmbienceKey>> | null = null;

/** Which tracks are actually deployed (HEAD each file once). */
const probe = (): Promise<Set<AmbienceKey>> => {
  if (available) return Promise.resolve(available);
  if (!probing) {
    probing = Promise.all(
      AMBIENCES.map((a) =>
        fetch(srcFor(a.key), { method: 'HEAD' })
          .then((r): AmbienceKey | null => (r.ok && (r.headers.get('content-type') ?? '').includes('audio') ? a.key : null))
          .catch((): AmbienceKey | null => null)
      )
    ).then((keys) => {
      const found = new Set<AmbienceKey>();
      for (const k of keys) if (k) found.add(k);
      available = found;
      return found;
    });
  }
  return probing;
};

/** Ambience options that have a file behind them (empty until probed / on native). */
export const useAvailableAmbiences = () => {
  const [keys, setKeys] = useState<Set<AmbienceKey>>(available ?? new Set());
  useEffect(() => {
    if (!isWeb()) return;
    let live = true;
    probe().then((s) => live && setKeys(new Set(s)));
    return () => {
      live = false;
    };
  }, []);
  return AMBIENCES.filter((a) => keys.has(a.key));
};

const VOLUME = 0.55;
let current: { key: AmbienceKey; el: HTMLAudioElement } | null = null;

/** Timer-based (not rAF) so it still completes in a background tab. */
const fade = (el: HTMLAudioElement, to: number, ms: number, done?: () => void) => {
  const from = el.volume;
  const t0 = Date.now();
  const id = setInterval(() => {
    const p = Math.min(1, (Date.now() - t0) / ms);
    el.volume = Math.max(0, Math.min(1, from + (to - from) * p));
    if (p >= 1) {
      clearInterval(id);
      done?.();
    }
  }, 40);
};

/** Start (or switch) ambience with a short cross-fade; 'off' fades out. */
export const setAmbience = (key: AmbienceKey) => {
  if (!isWeb() || current?.key === key) return;
  if (current) {
    const old = current.el;
    fade(old, 0, 700, () => old.pause());
    current = null;
  }
  if (key === 'off') return;
  const el = new Audio(srcFor(key));
  el.loop = true;
  el.volume = 0;
  el.play()
    .then(() => fade(el, VOLUME, 1200))
    .catch(() => {
      /* autoplay blocked or file missing — stay silent */
    });
  current = { key, el };
};

// ───────────── Session hold vs. picker preview ─────────────
let held = false;
let previewTimer: ReturnType<typeof setTimeout> | null = null;

/** A running session wants `key` (or 'off'). Lets an in-progress preview finish. */
export const holdAmbience = (key: AmbienceKey) => {
  held = key !== 'off';
  if (!held && previewTimer) return;
  if (previewTimer) {
    clearTimeout(previewTimer);
    previewTimer = null;
  }
  setAmbience(key);
};

/** Picker feedback: play `key` for a few seconds unless a session is holding ambience. */
export const previewAmbience = (key: AmbienceKey) => {
  setAmbience(key);
  if (held || key === 'off') return;
  if (previewTimer) clearTimeout(previewTimer);
  previewTimer = setTimeout(() => {
    previewTimer = null;
    if (!held) setAmbience('off');
  }, 4000);
};
