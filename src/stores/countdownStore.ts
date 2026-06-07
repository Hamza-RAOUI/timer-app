import { create } from 'zustand';

type IntervalHandle = ReturnType<typeof setInterval> | null;

interface CountdownState {
  durationMs: number;
  remainingMs: number;
  isRunning: boolean;
  endAt: number | null;
  interval: IntervalHandle;

  setDuration: (durationMs: number) => void;
  start: () => void;
  pause: () => void;
  reset: () => void;
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
    const { endAt, isRunning } = get();
    if (!isRunning || endAt == null) return;

    const nextRemaining = Math.max(0, endAt - Date.now());
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
    interval: null,

    setDuration: (durationMs: number) => {
      const ms = clampDuration(durationMs);
      const { isRunning } = get();
      set({ durationMs: ms, remainingMs: isRunning ? get().remainingMs : ms });
    },

    start: () => {
      const { isRunning, remainingMs } = get();
      if (isRunning) return;

      clear();
      const endAt = Date.now() + Math.max(0, remainingMs);
      const interval = setInterval(tick, 200);
      set({ isRunning: true, endAt, interval });
      tick();
    },

    pause: () => {
      const { isRunning, endAt } = get();
      if (!isRunning) return;

      const remainingMs = endAt == null ? get().remainingMs : Math.max(0, endAt - Date.now());
      clear();
      set({ isRunning: false, interval: null, endAt: null, remainingMs });
    },

    reset: () => {
      clear();
      const { durationMs } = get();
      set({ isRunning: false, interval: null, endAt: null, remainingMs: durationMs });
    },
  };
});
