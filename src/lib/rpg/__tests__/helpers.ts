import type { SessionEvent } from '../types';

let seq = 0;

/** Build a session ending at `endedAt` (defaults: completed 25-min Pomodoro in Study). */
export const session = (endedAt: number | string, over: Partial<SessionEvent> = {}): SessionEvent => {
  const end = typeof endedAt === 'string' ? Date.parse(endedAt) : endedAt;
  const focusedMinutes = over.focusedMinutes ?? 25;
  seq += 1;
  return {
    id: over.id ?? `s${String(seq).padStart(5, '0')}`,
    startedAt: end - focusedMinutes * 60_000,
    endedAt: end,
    focusedMinutes,
    plannedMinutes: 25,
    technique: 'pomodoro',
    skill: 'study',
    completed: true,
    ...over,
  };
};

/** A completed 25-minute Pomodoro. */
export const pomodoro = (endedAt: number | string, over: Partial<SessionEvent> = {}) => session(endedAt, over);

/** An open-ended session (Flowtime / Stopwatch). */
export const openEnded = (endedAt: number | string, minutes: number, over: Partial<SessionEvent> = {}) =>
  session(endedAt, { technique: 'stopwatch', plannedMinutes: null, focusedMinutes: minutes, completed: true, ...over });

export const MIN = 60_000;
export const HOUR = 60 * MIN;
export const DAY = 24 * HOUR;
