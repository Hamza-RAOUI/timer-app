import assert from 'node:assert/strict';
import { describe, test } from 'node:test';
import { RPG_CONFIG } from '../config';
import { awardSessions, countsAsCompleted, rawSessionXp } from '../xp';
import { HOUR, MIN, openEnded, pomodoro, session } from './helpers';

const T = '2026-03-10T15:00:00Z';

describe('rawSessionXp — countdown sessions', () => {
  test('completed session: 1 XP per minute + 10 bonus', () => {
    const xp = rawSessionXp(pomodoro(T));
    assert.deepEqual(xp, { minutesXp: 25, bonus: 10, raw: 35, reason: 'completed' });
  });

  test('52/17 completed → 62 XP', () => {
    const xp = rawSessionXp(session(T, { technique: 'fiftytwo', plannedMinutes: 52, focusedMinutes: 52 }));
    assert.equal(xp.raw, 62);
  });

  test('stopped early at ≥ 50%: per-minute XP, no bonus', () => {
    const xp = rawSessionXp(session(T, { focusedMinutes: 13, completed: false }));
    assert.deepEqual(xp, { minutesXp: 13, bonus: 0, raw: 13, reason: 'partial' });
  });

  test('exactly 50% counts as partial (fractional minutes are floored)', () => {
    const xp = rawSessionXp(session(T, { focusedMinutes: 12.5, completed: false }));
    assert.equal(xp.reason, 'partial');
    assert.equal(xp.raw, 12);
  });

  test('stopped before 50%: 0 XP', () => {
    const xp = rawSessionXp(session(T, { focusedMinutes: 12.4, completed: false }));
    assert.deepEqual(xp, { minutesXp: 0, bonus: 0, raw: 0, reason: 'under-half' });
  });

  test('under 5 focused minutes: 0 XP even when completed', () => {
    const xp = rawSessionXp(session(T, { technique: 'custom', plannedMinutes: 4, focusedMinutes: 4 }));
    assert.deepEqual(xp, { minutesXp: 0, bonus: 0, raw: 0, reason: 'too-short' });
  });

  test('under 5 minutes beats the 50% rule', () => {
    const xp = rawSessionXp(session(T, { technique: 'custom', plannedMinutes: 6, focusedMinutes: 4.9, completed: false }));
    assert.equal(xp.reason, 'too-short');
    assert.equal(xp.raw, 0);
  });

  test('exactly 5 minutes completed earns minutes + bonus', () => {
    const xp = rawSessionXp(session(T, { technique: 'custom', plannedMinutes: 5, focusedMinutes: 5 }));
    assert.equal(xp.raw, 15);
  });
});

describe('rawSessionXp — open-ended (Flowtime / Stopwatch)', () => {
  test('≥ 10 minutes counts as completed', () => {
    const e = openEnded(T, 10, { technique: 'flowtime' });
    assert.equal(countsAsCompleted(e), true);
    assert.deepEqual(rawSessionXp(e), { minutesXp: 10, bonus: 10, raw: 20, reason: 'completed' });
  });

  test('45.6 minutes → 45 + 10', () => {
    assert.equal(rawSessionXp(openEnded(T, 45.6)).raw, 55);
  });

  test('5–9 minutes: per-minute XP, no bonus, not completed', () => {
    const e = openEnded(T, 9.99);
    assert.equal(countsAsCompleted(e), false);
    assert.deepEqual(rawSessionXp(e), { minutesXp: 9, bonus: 0, raw: 9, reason: 'partial' });
  });

  test('the stored completed flag is ignored — minutes decide', () => {
    const e = openEnded(T, 7, { completed: true });
    assert.equal(countsAsCompleted(e), false);
    assert.equal(rawSessionXp(e).bonus, 0);
  });

  test('under 5 minutes: 0 XP', () => {
    assert.equal(rawSessionXp(openEnded(T, 4.5)).raw, 0);
  });
});

describe('awardSessions — daily cap', () => {
  const day = Date.parse('2026-03-10T08:00:00Z');

  test(`caps session XP at ${RPG_CONFIG.xp.dailyCap} per day; the crossing session keeps what fits`, () => {
    // 12 × 52/17 = 12 × 62 = 744 raw.
    const log = Array.from({ length: 12 }, (_, i) =>
      session(day + i * HOUR, { technique: 'fiftytwo', plannedMinutes: 52, focusedMinutes: 52 })
    );
    const awards = awardSessions(log, RPG_CONFIG, 'UTC');
    const total = [...awards.values()].reduce((s, a) => s + a.awarded, 0);
    assert.equal(total, 600);

    const ordered = log.map((e) => awards.get(e.id)!);
    assert.equal(ordered[8].awarded, 62); // 9 × 62 = 558
    assert.equal(ordered[9].awarded, 42); // 600 − 558
    assert.equal(ordered[9].capped, true);
    assert.equal(ordered[10].awarded, 0);
    assert.equal(ordered[11].awarded, 0);
    assert.equal(ordered[8].capped, false);
  });

  test('cap is applied in chronological order regardless of log order', () => {
    const log = Array.from({ length: 12 }, (_, i) =>
      session(day + i * HOUR, { technique: 'fiftytwo', plannedMinutes: 52, focusedMinutes: 52 })
    ).reverse();
    const awards = awardSessions(log, RPG_CONFIG, 'UTC');
    const earliest = log[log.length - 1];
    const latest = log[0];
    assert.equal(awards.get(earliest.id)!.awarded, 62);
    assert.equal(awards.get(latest.id)!.awarded, 0);
  });

  test('cap resets on the next local day', () => {
    const today = Array.from({ length: 12 }, (_, i) =>
      session(day + i * MIN * 53, { technique: 'fiftytwo', plannedMinutes: 52, focusedMinutes: 52 })
    );
    const tomorrow = pomodoro(day + 26 * HOUR);
    const awards = awardSessions([...today, tomorrow], RPG_CONFIG, 'UTC');
    assert.equal(awards.get(tomorrow.id)!.awarded, 35);
  });

  test('"day" is the local day in the user timezone, not UTC', () => {
    // 23:30 and 00:30 in New York are different local days even though both are the same UTC day.
    const lateNight = Date.parse('2026-03-10T03:30:00Z'); // 23:30 Mar 9 in New York (EDT, UTC−4)
    const big = (t: number) => openEnded(t, 590); // 600 XP each → hits the cap alone
    const a = big(lateNight);
    const b = big(lateNight + HOUR); // 00:30 Mar 10 local
    const nyc = awardSessions([a, b], RPG_CONFIG, 'America/New_York');
    assert.equal(nyc.get(a.id)!.awarded, 600);
    assert.equal(nyc.get(b.id)!.awarded, 600);

    const utc = awardSessions([a, b], RPG_CONFIG, 'UTC'); // same UTC day → shared cap
    assert.equal(utc.get(b.id)!.awarded, 0);
  });
});
