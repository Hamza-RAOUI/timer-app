import { RPG_CONFIG, type RpgConfig } from './config';
import { levelFromXp, titleForLevel, type LevelInfo, type TitleInfo } from './levels';
import { dailyQuestFor, questStatus, type QuestStatus } from './quests';
import { computeStreak, type StreakInfo } from './streak';
import { addDays, dayKey, weekStartKey } from './time';
import type { DayKey, SessionEvent } from './types';
import { awardSessions, countsAsCompleted, type SessionXp } from './xp';

export interface ProgressOptions {
  /** Epoch ms used as "now" — pass the same value for before/after snapshots. */
  now: number;
  /** IANA zone; defaults to the device's local time. */
  timeZone?: string;
  isPro: boolean;
  /** When Pro was unlocked (epoch ms). Weekly quests and freezes count from then on. */
  proSince?: number | null;
  config?: RpgConfig;
}

export interface SkillProgress {
  skill: string;
  xp: number;
  level: LevelInfo;
  completedSessions: number;
  minutes: number;
}

export interface Progress {
  totalXp: number;
  sessionXp: number;
  questXp: number;
  level: LevelInfo;
  title: TitleInfo;
  skills: Record<string, SkillProgress>;
  streak: StreakInfo;
  awards: Map<string, SessionXp>;
  completedSessions: number;
  totalMinutes: number;
  today: {
    key: DayKey;
    minutes: number;
    completedSessions: number;
    sessionXp: number;
    capReached: boolean;
    quest: QuestStatus;
  };
  week: {
    key: DayKey;
    quests: QuestStatus[];
  };
}

/** Skill progress for a skill with no sessions yet. */
export const emptySkill = (skill: string, cfg: RpgConfig = RPG_CONFIG): SkillProgress => ({
  skill,
  xp: 0,
  level: levelFromXp(0, cfg),
  completedSessions: 0,
  minutes: 0,
});

const pushTo = <K, V>(map: Map<K, V[]>, key: K, value: V) => {
  const list = map.get(key);
  if (list) list.push(value);
  else map.set(key, [value]);
};

/** Derive the whole RPG state from the session log. Pure: same log + options → same result. */
export const computeProgress = (log: readonly SessionEvent[], opts: ProgressOptions): Progress => {
  const cfg = opts.config ?? RPG_CONFIG;
  const tz = opts.timeZone;
  const today = dayKey(opts.now, tz);
  const thisWeek = weekStartKey(today, cfg.weekStartsOn);
  const proFromDay = opts.isPro ? (opts.proSince != null ? dayKey(opts.proSince, tz) : null) : null;

  const awards = awardSessions(log, cfg, tz);

  // Bucket sessions by local day / week of their end.
  const byDay = new Map<DayKey, SessionEvent[]>();
  const byWeek = new Map<DayKey, SessionEvent[]>();
  const completedDays = new Set<DayKey>();
  const skills: Record<string, SkillProgress> = {};
  let sessionXp = 0;
  let completedSessions = 0;
  let totalMinutes = 0;

  for (const e of log) {
    const day = dayKey(e.endedAt, tz);
    const week = weekStartKey(day, cfg.weekStartsOn);
    pushTo(byDay, day, e);
    pushTo(byWeek, week, e);

    const done = countsAsCompleted(e, cfg);
    if (done) {
      completedDays.add(day);
      completedSessions += 1;
    }
    const xp = awards.get(e.id)?.awarded ?? 0;
    sessionXp += xp;
    totalMinutes += Math.max(0, e.focusedMinutes);

    const sk = (skills[e.skill] ??= { ...emptySkill(e.skill, cfg) });
    sk.xp += xp;
    sk.minutes += Math.max(0, e.focusedMinutes);
    if (done) sk.completedSessions += 1;
  }
  for (const sk of Object.values(skills)) sk.level = levelFromXp(sk.xp, cfg);

  const streak = computeStreak(completedDays, today, {
    freezeEnabled: opts.isPro,
    freezeFrom: proFromDay,
    freezesPerWeek: cfg.streak.freezesPerWeek,
    weekStartsOn: cfg.weekStartsOn,
  });

  // Quest rewards for every period that has sessions (past ones included — derived, not stored).
  let questXp = 0;
  for (const [day, sessions] of byDay) {
    const q = questStatus(dailyQuestFor(day, cfg), 'daily', sessions, { timeZone: tz, cfg, periodStart: day, periodDays: 1 });
    if (q.done) questXp += q.reward;
  }
  const weeklyFrom = proFromDay ? weekStartKey(proFromDay, cfg.weekStartsOn) : null;
  const weekCtx = (week: DayKey) => ({ timeZone: tz, cfg, streakByDay: streak.byDay, periodStart: week, periodDays: 7 });
  if (opts.isPro) {
    for (const [week, sessions] of byWeek) {
      if (weeklyFrom && week < weeklyFrom) continue;
      for (const def of cfg.quests.weekly) {
        if (questStatus(def, 'weekly', sessions, weekCtx(week)).done) questXp += cfg.quests.weeklyReward;
      }
    }
  }

  const totalXp = sessionXp + questXp;
  const level = levelFromXp(totalXp, cfg);
  const todaySessions = byDay.get(today) ?? [];
  const todaySessionXp = todaySessions.reduce((sum, e) => sum + (awards.get(e.id)?.awarded ?? 0), 0);

  return {
    totalXp,
    sessionXp,
    questXp,
    level,
    title: titleForLevel(level.level, cfg),
    skills,
    streak,
    awards,
    completedSessions,
    totalMinutes,
    today: {
      key: today,
      minutes: todaySessions.reduce((sum, e) => sum + Math.max(0, e.focusedMinutes), 0),
      completedSessions: todaySessions.filter((e) => countsAsCompleted(e, cfg)).length,
      sessionXp: todaySessionXp,
      capReached: todaySessionXp >= cfg.xp.dailyCap,
      quest: questStatus(dailyQuestFor(today, cfg), 'daily', todaySessions, { timeZone: tz, cfg, periodStart: today, periodDays: 1 }),
    },
    week: {
      key: thisWeek,
      quests: cfg.quests.weekly.map((def) => questStatus(def, 'weekly', byWeek.get(thisWeek) ?? [], weekCtx(thisWeek), !opts.isPro)),
    },
  };
};

export interface Reward {
  session: SessionEvent;
  completed: boolean;
  xp: SessionXp | null;
  /** Total XP gained by this session, quests included. */
  gained: number;
  questsCompleted: QuestStatus[];
  levelBefore: LevelInfo;
  levelAfter: LevelInfo;
  leveledUp: boolean;
  /** Set when the level-up also unlocked a new title. */
  newTitle: string | null;
  skillBefore: LevelInfo;
  skillAfter: LevelInfo;
  skillLeveledUp: boolean;
  streakBefore: number;
  streakAfter: number;
  capReached: boolean;
}

/** What one logged session changed — drives the XP animation, toasts and the level-up modal. */
export const buildReward = (before: Progress, after: Progress, session: SessionEvent, cfg: RpgConfig = RPG_CONFIG): Reward => {
  const questsCompleted: QuestStatus[] = [];
  if (after.today.quest.done && !(before.today.key === after.today.key && before.today.quest.done)) {
    questsCompleted.push(after.today.quest);
  }
  after.week.quests.forEach((q, i) => {
    const prev = before.week.key === after.week.key ? before.week.quests[i] : undefined;
    if (!q.locked && q.done && !prev?.done) questsCompleted.push(q);
  });

  const skillBefore = (before.skills[session.skill] ?? emptySkill(session.skill, cfg)).level;
  const skillAfter = (after.skills[session.skill] ?? emptySkill(session.skill, cfg)).level;
  const leveledUp = after.level.level > before.level.level;
  const titleBefore = titleForLevel(before.level.level, cfg).title;

  return {
    session,
    completed: countsAsCompleted(session, cfg),
    xp: after.awards.get(session.id) ?? null,
    gained: after.totalXp - before.totalXp,
    questsCompleted,
    levelBefore: before.level,
    levelAfter: after.level,
    leveledUp,
    newTitle: leveledUp && after.title.title !== titleBefore ? after.title.title : null,
    skillBefore,
    skillAfter,
    skillLeveledUp: skillAfter.level > skillBefore.level,
    streakBefore: before.streak.current,
    streakAfter: after.streak.current,
    capReached: after.today.capReached,
  };
};

/** Earliest day still visible on the free tier (inclusive). */
export const freeHistoryStart = (now: number, cfg: RpgConfig = RPG_CONFIG, timeZone?: string): DayKey =>
  addDays(dayKey(now, timeZone), -(cfg.freeStatsDays - 1));
