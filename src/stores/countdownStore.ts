import { create } from 'zustand';
import { useUiStore } from './uiStore';

type IntervalHandle = ReturnType<typeof setInterval> | null;

interface CountdownState {
  /** Block length (timer ms — equals wall-clock ms unless the dev speed-up is on). */
  durationMs: number;
  remainingMs: number;
  isRunning: boolean;
  /** Wall-clock time the countdown will hit zero. */
  endAt: number | null;
  /** Wall-clock time this block was first started (null until started; cleared by reset). */
  startedAt: number | null;
  /** Timer ms per wall-clock ms, captured at start (dev-only speed-up). */
  speed: number;
  interval: IntervalHandle;

  setDuration: (durationMs: number) => void;
  start: () => void;
  pause: () => void;
  reset: () => void;
  /** Timer ms focused so far in this block. */
  elapsedMs: () => number;
}

const clampDuration = (ms: number) => Math.max(1000, Math.floor(ms));

export const useCountdownStore = create<CountdownState>((set, get) => {
  const clear = () => {
    const { interval } = get();
    if (interval) {
      clearInterval(interval);
    }
  };

  const tick = () => {
    const { endAt, isRunning, speed } = get();
    if (!isRunning || endAt == null) return;

    const nextRemaining = Math.max(0, (endAt - Date.now()) * speed);
    set({ remainingMs: nextRemaining });

    if (nextRemaining <= 0) {
      clear();
      set({ isRunning: false, interval: null, endAt: null, remainingMs: 0 });
    }
  };

  return {
    durationMs: 25 * 60 * 1000,
    remainingMs: 25 * 60 * 1000,
    isRunning: false,
    endAt: null,
    startedAt: null,
    speed: 1,
    interval: null,

    setDuration: (durationMs: number) => {
      const ms = clampDuration(durationMs);
      const { isRunning } = get();
      set(isRunning ? { durationMs: ms } : { durationMs: ms, remainingMs: ms, startedAt: null });
    },

    start: () => {
      const { isRunning, remainingMs, startedAt } = get();
      if (isRunning) return;

      clear();
      const speed = Math.max(1, useUiStore.getState().devSpeed);
      const now = Date.now();
      const endAt = now + Math.max(0, remainingMs) / speed;
      const interval = setInterval(tick, 200);
      set({ isRunning: true, endAt, speed, interval, startedAt: startedAt ?? now });
      tick();
    },

    pause: () => {
      const { isRunning, endAt, speed } = get();
      if (!isRunning) return;

      const remainingMs = endAt == null ? get().remainingMs : Math.max(0, (endAt - Date.now()) * speed);
      clear();
      set({ isRunning: false, interval: null, endAt: null, remainingMs });
    },

    reset: () => {
      clear();
      const { durationMs } = get();
      set({ isRunning: false, interval: null, endAt: null, remainingMs: durationMs, startedAt: null });
    },

    elapsedMs: () => {
      const { durationMs, remainingMs, isRunning, endAt, speed } = get();
      const remaining = isRunning && endAt != null ? Math.max(0, (endAt - Date.now()) * speed) : remainingMs;
      return Math.max(0, durationMs - remaining);
    },
  };
});
