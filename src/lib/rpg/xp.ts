import { RPG_CONFIG, type RpgConfig } from './config';
import { dayKey } from './time';
import type { SessionEvent } from './types';

export type XpReason =
  | 'completed' // per-minute XP + completion bonus
  | 'partial' // stopped early but past the threshold: per-minute XP, no bonus
  | 'under-half' // stopped before the threshold: nothing
  | 'too-short'; // under the minimum minutes: nothing

export interface SessionXp {
  sessionId: string;
  /** Whole focused minutes that earned XP. */
  minutesXp: number;
  bonus: number;
  /** minutesXp + bonus, before the daily cap. */
  raw: number;
  /** What actually counted after the daily cap. */
  awarded: number;
  /** The daily cap cut (some of) this session's XP. */
  capped: boolean;
  reason: XpReason;
}

/** Flowtime / Stopwatch: no planned length. */
export const isOpenEnded = (e: SessionEvent): boolean => e.plannedMinutes == null || e.plannedMinutes <= 0;

/** Whether the session counts as completed under the current rules (streaks, quests, bonus). */
export const countsAsCompleted = (e: SessionEvent, cfg: RpgConfig = RPG_CONFIG): boolean =>
  isOpenEnded(e) ? e.focusedMinutes >= cfg.xp.openEndedCompleteMinutes : e.completed;

/** XP for one session before the daily cap. */
export const rawSessionXp = (
  e: SessionEvent,
  cfg: RpgConfig = RPG_CONFIG
): Pick<SessionXp, 'minutesXp' | 'bonus' | 'raw' | 'reason'> => {
  const minutes = Math.max(0, Math.floor(e.focusedMinutes + 1e-9));
  const none = (reason: XpReason) => ({ minutesXp: 0, bonus: 0, raw: 0, reason });

  if (minutes < cfg.xp.minMinutes) return none('too-short');

  const perMinute = minutes * cfg.xp.perMinute;
  if (countsAsCompleted(e, cfg)) {
    return { minutesXp: perMinute, bonus: cfg.xp.completionBonus, raw: perMinute + cfg.xp.completionBonus, reason: 'completed' };
  }

  // Stopped early: open-ended timers measure against their completion length.
  const target = isOpenEnded(e) ? cfg.xp.openEndedCompleteMinutes : (e.plannedMinutes as number);
  if (e.focusedMinutes + 1e-9 >= target * cfg.xp.partialThreshold) {
    return { minutesXp: perMinute, bonus: 0, raw: perMinute, reason: 'partial' };
  }
  return none('under-half');
};

/** Chronological order, with the id as a stable tie-breaker. */
export const sortByEnd = (log: readonly SessionEvent[]): SessionEvent[] =>
  [...log].sort((a, b) => a.endedAt - b.endedAt || (a.id < b.id ? -1 : a.id > b.id ? 1 : 0));

/**
 * Score every session, applying the daily cap per local day of `endedAt`.
 * Sessions are processed in chronological order, so the one that crosses the
 * cap keeps the part that fits and later ones that day get nothing.
 */
export const awardSessions = (
  log: readonly SessionEvent[],
  cfg: RpgConfig = RPG_CONFIG,
  timeZone?: string
): Map<string, SessionXp> => {
  const out = new Map<string, SessionXp>();
  const usedByDay = new Map<string, number>();

  for (const e of sortByEnd(log)) {
    const base = rawSessionXp(e, cfg);
    const day = dayKey(e.endedAt, timeZone);
    const used = usedByDay.get(day) ?? 0;
    const room = Math.max(0, cfg.xp.dailyCap - used);
    const awarded = Math.min(base.raw, room);
    usedByDay.set(day, used + awarded);
    out.set(e.id, { sessionId: e.id, ...base, awarded, capped: awarded < base.raw });
  }
  return out;
};
