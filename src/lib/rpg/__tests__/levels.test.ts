import assert from 'node:assert/strict';
import { describe, test } from 'node:test';
import { levelFromXp, titleForLevel, xpForLevel, xpToNext } from '../levels';
import { computeProgress } from '../progress';
import { HOUR, pomodoro } from './helpers';

describe('level curve', () => {
  test('XP from L to L+1 = 60 + 40 × L', () => {
    assert.equal(xpToNext(1), 100);
    assert.equal(xpToNext(2), 140);
    assert.equal(xpToNext(10), 460);
  });

  test('cumulative XP to reach a level', () => {
    assert.equal(xpForLevel(1), 0);
    assert.equal(xpForLevel(2), 100);
    assert.equal(xpForLevel(3), 240);
    assert.equal(xpForLevel(5), 640);
    assert.equal(xpForLevel(10), 2340);
  });

  test('level boundaries', () => {
    assert.deepEqual(levelFromXp(0), { level: 1, totalXp: 0, xpIntoLevel: 0, xpForNext: 100, progress: 0 });
    assert.equal(levelFromXp(99).level, 1);
    assert.equal(levelFromXp(100).level, 2);
    assert.equal(levelFromXp(100).xpIntoLevel, 0);
    assert.equal(levelFromXp(239).level, 2);
    assert.equal(levelFromXp(239).xpIntoLevel, 139);
    assert.equal(levelFromXp(240).level, 3);
    assert.equal(levelFromXp(2340).level, 10);
  });

  test('progress is a 0…1 fraction of the current level', () => {
    assert.equal(levelFromXp(50).progress, 0.5);
    assert.equal(levelFromXp(170).progress, 0.5); // 70 / 140 into L2
  });

  test('negative or fractional XP is clamped and floored', () => {
    assert.equal(levelFromXp(-20).level, 1);
    assert.equal(levelFromXp(99.9).level, 1);
  });

  test('L1→2 takes about 3 Pomodoros', () => {
    const t0 = Date.parse('2026-03-10T08:00:00Z');
    const opts = { now: t0 + 6 * HOUR, isPro: false, timeZone: 'UTC' };
    // Pick a day whose daily quest doesn't top up the XP, so only session XP counts.
    const two = computeProgress([pomodoro(t0), pomodoro(t0 + HOUR)], opts);
    const three = computeProgress([pomodoro(t0), pomodoro(t0 + HOUR), pomodoro(t0 + 2 * HOUR)], opts);
    assert.equal(two.sessionXp, 70);
    assert.equal(three.sessionXp, 105);
    assert.equal(three.level.level, 2);
  });
});

describe('titles', () => {
  const cases: [number, string][] = [
    [1, 'Grain'],
    [4, 'Grain'],
    [5, 'Sandkeeper'],
    [9, 'Sandkeeper'],
    [10, 'Flowwalker'],
    [19, 'Flowwalker'],
    [20, 'Timebender'],
    [29, 'Timebender'],
    [30, 'Hourmaster'],
    [99, 'Hourmaster'],
  ];
  for (const [level, title] of cases) {
    test(`L${level} → ${title}`, () => assert.equal(titleForLevel(level).title, title));
  }

  test('next title is reported until the last one', () => {
    assert.deepEqual(titleForLevel(1).next, { level: 5, title: 'Sandkeeper' });
    assert.deepEqual(titleForLevel(12).next, { level: 20, title: 'Timebender' });
    assert.equal(titleForLevel(30).next, null);
  });
});
