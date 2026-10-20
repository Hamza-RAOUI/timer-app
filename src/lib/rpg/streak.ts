import { dayNumber, keyFromDayNumber, weekStartKey } from './time';
import type { DayKey } from './types';

export interface StreakOptions {
  /** Pro: auto-apply streak freezes to missed days. */
  freezeEnabled: boolean;
  /** Freezes only cover days on/after this day (e.g. the day Pro was unlocked). */
  freezeFrom?: DayKey | null;
  freezesPerWeek: number;
  weekStartsOn: number;
}

export interface StreakInfo {
  /** Days in a row with ≥ 1 completed session. Today counts once it's done; until then yesterday's run is still alive. */
  current: number;
  best: number;
  todayDone: boolean;
  /** A streak is running but today has nothing yet. */
  atRisk: boolean;
  /** Missed days that a freeze covered. */
  frozenDays: DayKey[];
  /** Pro and this week's freeze hasn't been used. */
  freezeAvailable: boolean;
  /** Streak length at the end of each day from the first completed day to today. */
  byDay: Map<DayKey, number>;
}

/**
 * Walk forward day by day from the first completed day to today.
 *
 * A run of missed (past) days is bridged only if *every* day in the run can be
 * covered by a freeze from its own week's budget; otherwise the streak resets
 * and no freeze is spent — freezes are never wasted on a streak they can't save.
 */
export const computeStreak = (completedDays: ReadonlySet<DayKey>, today: DayKey, opts: StreakOptions): StreakInfo => {
  const todayN = dayNumber(today);
  const doneN = new Set<number>();
  for (const k of completedDays) {
    const n = dayNumber(k);
    if (n <= todayN) doneN.add(n);
  }

  const usedByWeek = new Map<DayKey, number>();
  const weekOf = (n: number) => weekStartKey(keyFromDayNumber(n), opts.weekStartsOn);
  const freezeFromN = opts.freezeFrom ? dayNumber(opts.freezeFrom) : -Infinity;
  const byDay = new Map<DayKey, number>();
  const frozenDays: DayKey[] = [];

  if (doneN.size === 0) {
    return {
      current: 0,
      best: 0,
      todayDone: false,
      atRisk: false,
      frozenDays,
      freezeAvailable: opts.freezeEnabled && opts.freezesPerWeek > 0,
      byDay,
    };
  }

  let streak = 0;
  let best = 0;
  let n = Math.min(...doneN);

  while (n <= todayN) {
    if (doneN.has(n)) {
      streak += 1;
      byDay.set(keyFromDayNumber(n), streak);
      best = Math.max(best, streak);
      n += 1;
      continue;
    }
    if (n === todayN) {
      // Today isn't over — the streak carries until midnight.
      byDay.set(keyFromDayNumber(n), streak);
      n += 1;
      continue;
    }

    // A run of missed past days: [n, end).
    let end = n;
    while (end < todayN && !doneN.has(end)) end += 1;

    let bridged = false;
    if (streak > 0 && opts.freezeEnabled && opts.freezesPerWeek > 0) {
      const need = new Map<DayKey, number>();
      let ok = true;
      for (let d = n; d < end; d++) {
        if (d < freezeFromN) {
          ok = false;
          break;
        }
        const w = weekOf(d);
        need.set(w, (need.get(w) ?? 0) + 1);
      }
      if (ok) {
        for (const [w, count] of need) {
          if ((usedByWeek.get(w) ?? 0) + count > opts.freezesPerWeek) {
            ok = false;
            break;
          }
        }
      }
      if (ok) {
        for (const [w, count] of need) usedByWeek.set(w, (usedByWeek.get(w) ?? 0) + count);
        for (let d = n; d < end; d++) {
          frozenDays.push(keyFromDayNumber(d));
          byDay.set(keyFromDayNumber(d), streak);
        }
        bridged = true;
      }
    }

    if (!bridged) {
      streak = 0;
      for (let d = n; d < end; d++) byDay.set(keyFromDayNumber(d), 0);
    }
    n = end;
  }

  const todayDone = doneN.has(todayN);
  const usedThisWeek = usedByWeek.get(weekOf(todayN)) ?? 0;
  return {
    current: streak,
    best,
    todayDone,
    atRisk: !todayDone && streak > 0,
    frozenDays,
    freezeAvailable: opts.freezeEnabled && usedThisWeek < opts.freezesPerWeek,
    byDay,
  };
};
