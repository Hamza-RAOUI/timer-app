import { create } from 'zustand';

type IntervalHandle = ReturnType<typeof setInterval> | null;

interface StopwatchState {
  elapsedMs: number;
  isRunning: boolean;
  startedAt: number | null;
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
    const { isRunning, startedAt } = get();
    if (!isRunning || startedAt == null) return;
    set({ elapsedMs: Math.max(0, Date.now() - startedAt) });
  };

  return {
    elapsedMs: 0,
    isRunning: false,
    startedAt: null,
    interval: null,
    laps: [],

    start: () => {
      const { isRunning, elapsedMs } = get();
      if (isRunning) return;

      clear();
      const startedAt = Date.now() - elapsedMs;
      const interval = setInterval(tick, 50);
      set({ isRunning: true, startedAt, interval });
      tick();
    },

    pause: () => {
      const { isRunning } = get();
      if (!isRunning) return;
      tick();
      clear();
      set({ isRunning: false, interval: null, startedAt: null });
    },

    reset: () => {
      clear();
      set({ elapsedMs: 0, isRunning: false, interval: null, startedAt: null, laps: [] });
    },

    lap: () => {
      const { elapsedMs, laps } = get();
      if (elapsedMs <= 0) return;
      set({ laps: [elapsedMs, ...laps].slice(0, 30) });
    },
  };
});
