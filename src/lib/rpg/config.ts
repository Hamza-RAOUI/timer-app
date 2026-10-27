/**
 * Every tunable number of the RPG layer lives here.
 *
 * XP, levels, streaks and quests are all *derived* from the session log by pure
 * functions, so editing a value here re-scores the whole history on the next
 * render — no data migration needed.
 */

export type QuestKind =
  | 'sessions' // complete N sessions
  | 'minutes' // focus N minutes (any session, finished or not)
  | 'technique' // complete N sessions with a given technique
  | 'skills' // complete sessions in N different skills
  | 'before' // complete N sessions that end before `hour` (local time)
  | 'streak'; // reach an N-day streak during the period

export interface QuestDef {
  id: string;
  kind: QuestKind;
  target: number;
  label: string;
  technique?: string;
  hour?: number;
}

export interface TitleDef {
  level: number;
  title: string;
}

export interface RpgConfig {
  xp: {
    /** XP per whole focused minute. */
    perMinute: number;
    /** Bonus for a completed session. */
    completionBonus: number;
    /** Sessions under this many focused minutes earn nothing. */
    minMinutes: number;
    /** Stopped early but at least this share of the planned length → per-minute XP, no bonus. */
    partialThreshold: number;
    /** Flowtime / Stopwatch have no fixed length: they count as completed at this many minutes. */
    openEndedCompleteMinutes: number;
    /** Max *session* XP per local day (stops "left the timer running" farming). Quest rewards are on top. */
    dailyCap: number;
  };
  levels: {
    /** XP to go from level L to L+1 = base + perLevel × L  (L1→2 = 100 XP ≈ 3 Pomodoros). */
    base: number;
    perLevel: number;
  };
  /** Player titles, unlocked at the given level. Must be sorted ascending. */
  titles: TitleDef[];
  quests: {
    dailyReward: number;
    weeklyReward: number;
    /** Free: one of these per day, rotating. */
    dailyPool: QuestDef[];
    /** Pro: all of these every week. */
    weekly: QuestDef[];
  };
  streak: {
    /** Pro streak freezes per calendar week, auto-applied to a missed day. */
    freezesPerWeek: number;
  };
  /** 0 = Sunday, 1 = Monday. */
  weekStartsOn: number;
  /** Free tier keeps this many days of statistics history visible. */
  freeStatsDays: number;
  evolution: {
    /** Skill level at which each of the 5 creature stages starts (stage 1 = index 0). */
    stageLevels: [number, number, number, number, number];
    /** Stage 5 (the Flowkeeper) also needs every family's best skill at this level. */
    flowkeeperFamilyLevel: number;
  };
}

export const RPG_CONFIG: RpgConfig = {
  xp: {
    perMinute: 1,
    completionBonus: 10,
    minMinutes: 5,
    partialThreshold: 0.5,
    openEndedCompleteMinutes: 10,
    dailyCap: 600,
  },
  levels: {
    base: 60,
    perLevel: 40,
  },
  titles: [
    { level: 1, title: 'Grain' },
    { level: 5, title: 'Sandkeeper' },
    { level: 10, title: 'Flowwalker' },
    { level: 20, title: 'Timebender' },
    { level: 30, title: 'Hourmaster' },
  ],
  quests: {
    dailyReward: 25,
    weeklyReward: 100,
    dailyPool: [
      { id: 'd-sessions-2', kind: 'sessions', target: 2, label: 'Complete 2 sessions' },
      { id: 'd-minutes-60', kind: 'minutes', target: 60, label: 'Focus 60 minutes' },
      { id: 'd-fiftytwo-1', kind: 'technique', technique: 'fiftytwo', target: 1, label: 'Finish a 52/17 session' },
      { id: 'd-skills-2', kind: 'skills', target: 2, label: 'Focus in 2 different skills' },
      { id: 'd-early-1', kind: 'before', hour: 12, target: 1, label: 'Complete a session before noon' },
      { id: 'd-sessions-3', kind: 'sessions', target: 3, label: 'Complete 3 sessions' },
    ],
    weekly: [
      { id: 'w-minutes-300', kind: 'minutes', target: 300, label: 'Focus 5 hours' },
      { id: 'w-skills-3', kind: 'skills', target: 3, label: 'Use 3 different skills' },
      { id: 'w-streak-7', kind: 'streak', target: 7, label: 'Reach a 7-day streak' },
    ],
  },
  streak: {
    freezesPerWeek: 1,
  },
  weekStartsOn: 1,
  freeStatsDays: 7,
  evolution: {
    // Skill XP to reach them ≈ 0 / 240 / 900 / 2340 / 5040 (a Pomodoro ≈ 35 XP).
    stageLevels: [1, 3, 6, 10, 15],
    flowkeeperFamilyLevel: 10,
  },
};
