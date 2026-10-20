import { create } from 'zustand';
import { useUiStore } from './uiStore';

type IntervalHandle = ReturnType<typeof setInterval> | null;

interface StopwatchState {
  /** Timer ms (equals wall-clock ms unless the dev speed-up is on). */
  elapsedMs: number;
  isRunning: boolean;
  /** Wall-clock anchor: elapsed = (now − anchor) × speed while running. */
  anchor: number | null;
  /** Wall-clock time of the first start since the last reset. */
  firstStartedAt: number | null;
  speed: number;
  interval: IntervalHandle;
  laps: number[];

  start: () => void;
  pause: () => void;
  reset: () => void;
  lap: () => void;
}

export const useStopwatchStore = create<StopwatchState>((set, get) => {
  const clear = () => {
    const { interval } = get();
    if (interval) {
      clearInterval(interval);
    }
  };

  const tick = () => {
    const { isRunning, anchor, speed } = get();
    if (!isRunning || anchor == null) return;
    set({ elapsedMs: Math.max(0, (Date.now() - anchor) * speed) });
  };

  return {
    elapsedMs: 0,
    isRunning: false,
    anchor: null,
    firstStartedAt: null,
    speed: 1,
    interval: null,
    laps: [],

    start: () => {
      const { isRunning, elapsedMs, firstStartedAt } = get();
      if (isRunning) return;

      clear();
      const speed = Math.max(1, useUiStore.getState().devSpeed);
      const now = Date.now();
      const anchor = now - elapsedMs / speed;
      const interval = setInterval(tick, 50);
      set({ isRunning: true, anchor, speed, interval, firstStartedAt: firstStartedAt ?? now });
      tick();
    },

    pause: () => {
      const { isRunning } = get();
      if (!isRunning) return;
      tick();
      clear();
      set({ isRunning: false, interval: null, anchor: null });
    },

    reset: () => {
      clear();
      set({ elapsedMs: 0, isRunning: false, interval: null, anchor: null, firstStartedAt: null, laps: [] });
    },

    lap: () => {
      const { elapsedMs, laps } = get();
      if (elapsedMs <= 0) return;
      set({ laps: [elapsedMs, ...laps].slice(0, 30) });
    },
  };
});
