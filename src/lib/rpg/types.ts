/** One focus session as stored in the log — the single source of truth. */
export interface SessionEvent {
  id: string;
  /** Epoch ms when the focus block first started. */
  startedAt: number;
  /** Epoch ms when it ended (finished, stopped early, or logged). */
  endedAt: number;
  /** Minutes actually focused (paused time excluded). May be fractional. */
  focusedMinutes: number;
  /** Planned length for countdowns; `null` for open-ended timers (Flowtime / Stopwatch). */
  plannedMinutes: number | null;
  /** Technique key, e.g. 'pomodoro' | 'fiftytwo' | 'custom' | 'flowtime' | 'stopwatch'. */
  technique: string;
  /** Skill (category) key, e.g. 'study' — or a custom skill id. */
  skill: string;
  /** Countdown ran to zero. For open-ended timers this is informational: rules re-derive it from minutes. */
  completed: boolean;
}

/** Calendar day in the user's timezone, `YYYY-MM-DD`. */
export type DayKey = string;
