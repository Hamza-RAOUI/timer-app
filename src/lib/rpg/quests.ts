import { RPG_CONFIG, type QuestDef, type RpgConfig } from './config';
import { addDays, dayNumber, hourOf } from './time';
import type { DayKey, SessionEvent } from './types';
import { countsAsCompleted } from './xp';

export type QuestScope = 'daily' | 'weekly';

export interface QuestStatus {
  def: QuestDef;
  scope: QuestScope;
  /** Day (daily) or first day of the week (weekly). */
  periodKey: DayKey;
  progress: number;
  target: number;
  done: boolean;
  reward: number;
  /** Weekly quests are Pro: visible but locked on the free tier. */
  locked: boolean;
}

/** Today's quest rotates through the pool, one per calendar day. */
export const dailyQuestFor = (day: DayKey, cfg: RpgConfig = RPG_CONFIG): QuestDef => {
  const pool = cfg.quests.dailyPool;
  const i = ((dayNumber(day) % pool.length) + pool.length) % pool.length;
  return pool[i];
};

export interface QuestContext {
  timeZone?: string;
  cfg?: RpgConfig;
  /** Streak length at the end of each day (needed for streak quests). */
  streakByDay?: ReadonlyMap<DayKey, number>;
  /** First day of the period, and how many days it spans. */
  periodStart: DayKey;
  periodDays: number;
}

/** How far along a quest is, given the sessions that ended inside its period. */
export const questProgress = (def: QuestDef, sessions: readonly SessionEvent[], ctx: QuestContext): number => {
  const cfg = ctx.cfg ?? RPG_CONFIG;
  const completed = sessions.filter((s) => countsAsCompleted(s, cfg));

  switch (def.kind) {
    case 'sessions':
      return completed.length;
    case 'minutes':
      return Math.floor(sessions.reduce((sum, s) => sum + Math.max(0, s.focusedMinutes), 0) + 1e-9);
    case 'technique':
      return completed.filter((s) => s.technique === def.technique).length;
    case 'skills':
      return new Set(completed.map((s) => s.skill)).size;
    case 'before':
      return completed.filter((s) => hourOf(s.endedAt, ctx.timeZone) < (def.hour ?? 12)).length;
    case 'streak': {
      let best = 0;
      for (let i = 0; i < ctx.periodDays; i++) {
        best = Math.max(best, ctx.streakByDay?.get(addDays(ctx.periodStart, i)) ?? 0);
      }
      return best;
    }
    default:
      return 0;
  }
};

export const questStatus = (
  def: QuestDef,
  scope: QuestScope,
  sessions: readonly SessionEvent[],
  ctx: QuestContext,
  locked = false
): QuestStatus => {
  const cfg = ctx.cfg ?? RPG_CONFIG;
  const progress = questProgress(def, sessions, ctx);
  return {
    def,
    scope,
    periodKey: ctx.periodStart,
    progress: Math.min(progress, def.target),
    target: def.target,
    done: progress >= def.target,
    reward: scope === 'daily' ? cfg.quests.dailyReward : cfg.quests.weeklyReward,
    locked,
  };
};
