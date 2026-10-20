import assert from 'node:assert/strict';
import { describe, test } from 'node:test';
import { RPG_CONFIG, type QuestDef } from '../config';
import { buildReward, computeProgress } from '../progress';
import { dailyQuestFor, questProgress } from '../quests';
import { addDays } from '../time';
import { HOUR, MIN, openEnded, pomodoro, session } from './helpers';

/** First day on/after `from` whose rotating daily quest has the given id. */
const dayWithQuest = (id: string, from = '2026-03-02') => {
  for (let i = 0; i < 30; i++) {
    const d = addDays(from, i);
    if (dailyQuestFor(d).id === id) return d;
  }
  throw new Error(`no day with quest ${id}`);
};
const at = (day: string, hhmm: string) => Date.parse(`${day}T${hhmm}:00Z`);
const ctx = (day: string) => ({ timeZone: 'UTC', periodStart: day, periodDays: 1 });
const def = (id: string): QuestDef => RPG_CONFIG.quests.dailyPool.find((q) => q.id === id)!;

describe('daily quest rotation', () => {
  test('deterministic and cycles through the whole pool', () => {
    const pool = RPG_CONFIG.quests.dailyPool;
    const seen = new Set<string>();
    for (let i = 0; i < pool.length; i++) seen.add(dailyQuestFor(addDays('2026-03-02', i)).id);
    assert.equal(seen.size, pool.length);
    assert.equal(dailyQuestFor('2026-03-02').id, dailyQuestFor('2026-03-02').id);
    assert.equal(dailyQuestFor('2026-03-02').id, dailyQuestFor(addDays('2026-03-02', pool.length)).id);
  });

  test('consecutive days get different quests', () => {
    assert.notEqual(dailyQuestFor('2026-03-02').id, dailyQuestFor('2026-03-03').id);
  });
});

describe('quest progress', () => {
  const day = '2026-03-04';

  test('sessions: only completed ones count', () => {
    const log = [pomodoro(at(day, '09:00')), session(at(day, '10:00'), { focusedMinutes: 20, completed: false })];
    assert.equal(questProgress(def('d-sessions-2'), log, ctx(day)), 1);
  });

  test('minutes: all focused minutes count, finished or not', () => {
    const log = [pomodoro(at(day, '09:00')), session(at(day, '10:00'), { focusedMinutes: 20.7, completed: false })];
    assert.equal(questProgress(def('d-minutes-60'), log, ctx(day)), 45);
  });

  test('technique: needs a completed 52/17 session', () => {
    const fifty = (over = {}) => session(at(day, '11:00'), { technique: 'fiftytwo', plannedMinutes: 52, focusedMinutes: 52, ...over });
    assert.equal(questProgress(def('d-fiftytwo-1'), [pomodoro(at(day, '09:00'))], ctx(day)), 0);
    assert.equal(questProgress(def('d-fiftytwo-1'), [fifty({ focusedMinutes: 40, completed: false })], ctx(day)), 0);
    assert.equal(questProgress(def('d-fiftytwo-1'), [fifty()], ctx(day)), 1);
  });

  test('skills: distinct skills among completed sessions', () => {
    const log = [pomodoro(at(day, '09:00')), pomodoro(at(day, '10:00')), openEnded(at(day, '11:00'), 12, { skill: 'work' })];
    assert.equal(questProgress(def('d-skills-2'), log, ctx(day)), 2);
  });

  test('before noon uses the local hour', () => {
    const s = pomodoro('2026-03-04T10:30:00Z'); // 10:30 UTC = 19:30 Tokyo
    assert.equal(questProgress(def('d-early-1'), [s], ctx(day)), 1);
    assert.equal(questProgress(def('d-early-1'), [s], { ...ctx(day), timeZone: 'Asia/Tokyo' }), 0);
  });
});

describe('quest rewards in progress', () => {
  test('completing today’s quest adds 25 XP and shows as done', () => {
    const day = dayWithQuest('d-sessions-2');
    const log = [pomodoro(at(day, '09:00')), pomodoro(at(day, '10:00'))];
    const p = computeProgress(log, { now: at(day, '12:00'), isPro: false, timeZone: 'UTC' });
    assert.equal(p.today.quest.def.id, 'd-sessions-2');
    assert.equal(p.today.quest.done, true);
    assert.equal(p.sessionXp, 70);
    assert.equal(p.questXp, 25);
    assert.equal(p.totalXp, 95);
  });

  test('past days’ quests are derived from the log too', () => {
    const day = dayWithQuest('d-sessions-2');
    const log = [pomodoro(at(day, '09:00')), pomodoro(at(day, '10:00'))];
    const later = computeProgress(log, { now: at(addDays(day, 3), '12:00'), isPro: false, timeZone: 'UTC' });
    assert.equal(later.questXp, 25);
    assert.equal(later.today.quest.done, false);
  });

  test('weekly quests are locked and worth nothing on the free tier', () => {
    const day = '2026-03-02';
    const log = Array.from({ length: 13 }, (_, i) => pomodoro(at(day, '06:00') + i * 26 * MIN)); // 325 min
    const p = computeProgress(log, { now: at(day, '20:00'), isPro: false, timeZone: 'UTC' });
    assert.equal(p.week.quests.every((q) => q.locked), true);
    assert.equal(p.week.quests[0].done, true); // progress still shown
    const daily = p.today.quest.done ? 25 : 0;
    assert.equal(p.questXp, daily);
  });

  test('Pro: completed weekly quests add 100 XP each', () => {
    const day = '2026-03-02';
    const log = Array.from({ length: 13 }, (_, i) => pomodoro(at(day, '06:00') + i * 26 * MIN));
    const p = computeProgress(log, { now: at(day, '20:00'), isPro: true, timeZone: 'UTC' });
    const minutesQuest = p.week.quests.find((q) => q.def.id === 'w-minutes-300')!;
    assert.equal(minutesQuest.done, true);
    assert.equal(minutesQuest.locked, false);
    const daily = p.today.quest.done ? 25 : 0;
    assert.equal(p.questXp, 100 + daily);
  });

  test('Pro: weekly quests before the unlock week do not count', () => {
    const day = '2026-03-02';
    const log = Array.from({ length: 13 }, (_, i) => pomodoro(at(day, '06:00') + i * 26 * MIN));
    const p = computeProgress(log, { now: at('2026-03-10', '20:00'), isPro: true, proSince: at('2026-03-09', '09:00'), timeZone: 'UTC' });
    const pastDaily = computeProgress(log, { now: at('2026-03-10', '20:00'), isPro: false, timeZone: 'UTC' }).questXp;
    assert.equal(p.questXp, pastDaily);
  });

  test('weekly 7-day streak quest reads the streak', () => {
    const log = Array.from({ length: 7 }, (_, i) => pomodoro(at(addDays('2026-03-02', i), '09:00')));
    const p = computeProgress(log, { now: at('2026-03-08', '10:00'), isPro: true, timeZone: 'UTC' });
    const q = p.week.quests.find((x) => x.def.id === 'w-streak-7')!;
    assert.equal(q.progress, 7);
    assert.equal(q.done, true);
  });
});

describe('buildReward', () => {
  test('reports XP, quest completion and level-up for the session that caused them', () => {
    const day = dayWithQuest('d-sessions-2');
    const first = pomodoro(at(day, '09:00'));
    const second = pomodoro(at(day, '09:30'), { skill: 'study' });
    const third = pomodoro(at(day, '10:00'), { skill: 'study' });
    const opts = { now: at(day, '10:01'), isPro: false, timeZone: 'UTC' };

    const r2 = buildReward(computeProgress([first], opts), computeProgress([first, second], opts), second);
    assert.equal(r2.xp?.awarded, 35);
    assert.equal(r2.gained, 35 + 25);
    assert.deepEqual(r2.questsCompleted.map((q) => q.def.id), ['d-sessions-2']);
    assert.equal(r2.leveledUp, false); // 95 XP

    const r3 = buildReward(computeProgress([first, second], opts), computeProgress([first, second, third], opts), third);
    assert.equal(r3.questsCompleted.length, 0); // already done
    assert.equal(r3.leveledUp, true); // 130 XP → L2
    assert.equal(r3.levelAfter.level, 2);
    assert.equal(r3.newTitle, null); // still Grain until L5
    assert.equal(r3.skillLeveledUp, true); // study: 105 skill XP → L2
  });

  test('a new title is announced when crossing L5', () => {
    const t0 = at('2026-03-02', '06:00');
    // 11 completed 52/17 sessions (62 XP each) over three days → crosses 640 XP.
    const log = Array.from({ length: 11 }, (_, i) =>
      session(t0 + i * HOUR + Math.floor(i / 5) * 24 * HOUR, { technique: 'fiftytwo', plannedMinutes: 52, focusedMinutes: 52 })
    );
    const opts = { now: log[log.length - 1].endedAt + MIN, isPro: false, timeZone: 'UTC' };
    let prev = computeProgress([], opts);
    let titled: string | null = null;
    for (let i = 0; i < log.length; i++) {
      const next = computeProgress(log.slice(0, i + 1), opts);
      const r = buildReward(prev, next, log[i]);
      if (r.newTitle) titled = r.newTitle;
      prev = next;
    }
    assert.ok(prev.level.level >= 5, `expected ≥ L5, got L${prev.level.level} with ${prev.totalXp} XP`);
    assert.equal(titled, 'Sandkeeper');
  });

  test('a 0-XP session still yields a reward with the reason', () => {
    const s = session(at('2026-03-04', '09:00'), { focusedMinutes: 3, completed: false });
    const opts = { now: at('2026-03-04', '09:01'), isPro: false, timeZone: 'UTC' };
    const r = buildReward(computeProgress([], opts), computeProgress([s], opts), s);
    assert.equal(r.gained, 0);
    assert.equal(r.xp?.reason, 'too-short');
    assert.equal(r.completed, false);
  });
});
