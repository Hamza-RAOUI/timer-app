import { useEffect, useRef } from 'react';

/** Keyboard shortcuts → the active timer (web). */
export type TimerCommand = 'toggle' | 'reset' | 'skip';

const listeners = new Set<(c: TimerCommand) => void>();

export const sendTimerCommand = (c: TimerCommand) => listeners.forEach((l) => l(c));

/** Subscribe the mounted timer to shortcut commands; the latest handler always wins. */
export const useTimerCommands = (handler: (c: TimerCommand) => void) => {
  const ref = useRef(handler);
  ref.current = handler;
  useEffect(() => {
    const l = (c: TimerCommand) => ref.current(c);
    listeners.add(l);
    return () => {
      listeners.delete(l);
    };
  }, []);
};
