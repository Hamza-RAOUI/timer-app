import assert from 'node:assert/strict';
import { describe, test } from 'node:test';
import { computeProgress } from '../progress';
import { computeStreak, type StreakOptions } from '../streak';
import { dayKey } from '../time';
import { MIN, pomodoro, session } from './helpers';

const free: StreakOptions = { freezeEnabled: false, freezesPerWeek: 1, weekStartsOn: 1 };
const pro: StreakOptions = { ...free, freezeEnabled: true };
const days = (...keys: string[]) => new Set(keys);

// 2026-03-02 is a Monday.
describe('computeStreak — basics', () => {
  test('no sessions → 0', () => {
    const s = computeStreak(days(), '2026-03-05', free);
    assert.equal(s.current, 0);
    assert.equal(s.best, 0);
    assert.equal(s.atRisk, false);
  });

  test('consecutive days ending today', () => {
    const s = computeStreak(days('2026-03-03', '2026-03-04', '2026-03-05'), '2026-03-05', free);
    assert.equal(s.current, 3);
    assert.equal(s.todayDone, true);
    assert.equal(s.atRisk, false);
  });

  test('today not done yet: yesterday’s streak is still alive (at risk)', () => {
    const s = computeStreak(days('2026-03-03', '2026-03-04'), '2026-03-05', free);
    assert.equal(s.current, 2);
    assert.equal(s.todayDone, false);
    assert.equal(s.atRisk, true);
  });

  test('a missed day resets it; best remembers the longer run', () => {
    const s = computeStreak(days('2026-03-01', '2026-03-02', '2026-03-03', '2026-03-05'), '2026-03-05', free);
    assert.equal(s.current, 1);
    assert.equal(s.best, 3);
  });

  test('missing yesterday and nothing today → 0', () => {
    const s = computeStreak(days('2026-03-02', '2026-03-03'), '2026-03-05', free);
    assert.equal(s.current, 0);
    assert.equal(s.atRisk, false);
  });
});

describe('streak — midnight and timezones', () => {
  test('sessions two minutes apart across local midnight count as two days', () => {
    // 23:59 and 00:01 in Berlin (UTC+1 in March).
    const a = pomodoro('2026-03-04T22:59:00Z');
    const b = pomodoro('2026-03-04T23:01:00Z');
    const p = computeProgress([a, b], { now: b.endedAt + MIN, isPro: false, timeZone: 'Europe/Berlin' });
    assert.equal(dayKey(a.endedAt, 'Europe/Berlin'), '2026-03-04');
    assert.equal(dayKey(b.endedAt, 'Europe/Berlin'), '2026-03-05');
    assert.equal(p.streak.current, 2);
  });

  test('the same instants give a different streak in another timezone', () => {
    const a = pomodoro('2026-03-02T16:00:00Z'); // Tokyo: Mar 3 01:00 · LA: Mar 2 08:00
    const b = pomodoro('2026-03-03T14:30:00Z'); // Tokyo: Mar 3 23:30 · LA: Mar 3 06:30
    const now = b.endedAt + MIN;
    const tokyo = computeProgress([a, b], { now, isPro: false, timeZone: 'Asia/Tokyo' });
    const la = computeProgress([a, b], { now, isPro: false, timeZone: 'America/Los_Angeles' });
    assert.equal(tokyo.streak.current, 1); // both on Mar 3 local
    assert.equal(la.streak.current, 2); // Mar 2 + Mar 3 local
  });

  test('DST change does not break or double-count days', () => {
    // US spring forward: 2026-03-08 (a 23-hour day in New York).
    const log = ['2026-03-07T17:00:00Z', '2026-03-08T16:00:00Z', '2026-03-09T16:00:00Z'].map((t) => pomodoro(t));
    const p = computeProgress(log, { now: Date.parse('2026-03-09T20:00:00Z'), isPro: false, timeZone: 'America/New_York' });
    assert.equal(p.streak.current, 3);
  });

  test('only completed sessions keep a streak', () => {
    const done = pomodoro('2026-03-04T12:00:00Z');
    const partial = session('2026-03-05T12:00:00Z', { focusedMinutes: 20, completed: false });
    const p = computeProgress([done, partial], { now: Date.parse('2026-03-05T13:00:00Z'), isPro: false, timeZone: 'UTC' });
    assert.equal(p.streak.current, 1);
    assert.equal(p.streak.todayDone, false);
  });
});

describe('streak freeze (Pro)', () => {
  test('one missed day is bridged; the frozen day does not add to the count', () => {
    // Mon, Tue, (Wed missed), Thu, Fri = today
    const done = days('2026-03-02', '2026-03-03', '2026-03-05', '2026-03-06');
    assert.equal(computeStreak(done, '2026-03-06', free).current, 2);
    const s = computeStreak(done, '2026-03-06', pro);
    assert.equal(s.current, 4);
    assert.deepEqual(s.frozenDays, ['2026-03-04']);
    assert.equal(s.freezeAvailable, false); // used this week
  });

  test('only one freeze per week: a second missed day that week breaks the streak', () => {
    const done = days('2026-03-02', '2026-03-04', '2026-03-06'); // missed Tue + Thu
    const s = computeStreak(done, '2026-03-06', pro);
    assert.equal(s.current, 1);
    assert.deepEqual(s.frozenDays, ['2026-03-03']);
  });

  test('two missed days in a row in the same week: no freeze is wasted', () => {
    const done = days('2026-03-02', '2026-03-05'); // missed Tue + Wed
    const s = computeStreak(done, '2026-03-05', pro);
    assert.equal(s.current, 1);
    assert.deepEqual(s.frozenDays, []);
    assert.equal(s.freezeAvailable, true);
  });

  test('missed Sunday + Monday sit in different weeks → both bridged', () => {
    const done = days('2026-03-06', '2026-03-07', '2026-03-10'); // Fri, Sat, (Sun, Mon missed), Tue
    const s = computeStreak(done, '2026-03-10', pro);
    assert.equal(s.current, 3);
    assert.deepEqual(s.frozenDays, ['2026-03-08', '2026-03-09']);
  });

  test('yesterday missed, today pending: the freeze keeps the streak alive', () => {
    const s = computeStreak(days('2026-03-02', '2026-03-03'), '2026-03-05', pro);
    assert.equal(s.current, 2);
    assert.equal(s.atRisk, true);
    assert.deepEqual(s.frozenDays, ['2026-03-04']);
  });

  test('freezes only cover days after Pro was unlocked', () => {
    const done = days('2026-03-02', '2026-03-03', '2026-03-05');
    const s = computeStreak(done, '2026-03-05', { ...pro, freezeFrom: '2026-03-05' });
    assert.equal(s.current, 1);
  });

  test('wired through computeProgress: freeze needs isPro', () => {
    const log = ['2026-03-02T12:00:00Z', '2026-03-03T12:00:00Z', '2026-03-05T12:00:00Z'].map((t) => pomodoro(t));
    const now = Date.parse('2026-03-05T13:00:00Z');
    assert.equal(computeProgress(log, { now, isPro: false, timeZone: 'UTC' }).streak.current, 1);
    assert.equal(computeProgress(log, { now, isPro: true, timeZone: 'UTC' }).streak.current, 3);
  });
});
