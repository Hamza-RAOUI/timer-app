import type { DayKey } from './types';

/**
 * Calendar helpers. Days are bucketed in the user's timezone: the device's
 * local time by default, or an explicit IANA zone (used by tests).
 * Day arithmetic happens on calendar dates, so DST shifts can't skip or
 * double-count a day.
 */

const MS_PER_DAY = 86_400_000;
const formatters = new Map<string, Intl.DateTimeFormat>();

const formatterFor = (timeZone: string) => {
  let f = formatters.get(timeZone);
  if (!f) {
    f = new Intl.DateTimeFormat('en-US', {
      timeZone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      hourCycle: 'h23',
    });
    formatters.set(timeZone, f);
  }
  return f;
};

interface LocalParts {
  y: number;
  m: number; // 1–12
  d: number;
  hour: number; // 0–23
}

export const localParts = (ts: number, timeZone?: string): LocalParts => {
  if (!timeZone) {
    const dt = new Date(ts);
    return { y: dt.getFullYear(), m: dt.getMonth() + 1, d: dt.getDate(), hour: dt.getHours() };
  }
  const out: LocalParts = { y: 0, m: 0, d: 0, hour: 0 };
  for (const p of formatterFor(timeZone).formatToParts(ts)) {
    if (p.type === 'year') out.y = Number(p.value);
    else if (p.type === 'month') out.m = Number(p.value);
    else if (p.type === 'day') out.d = Number(p.value);
    else if (p.type === 'hour') out.hour = Number(p.value) % 24;
  }
  return out;
};

const pad = (n: number) => String(n).padStart(2, '0');

export const dayKey = (ts: number, timeZone?: string): DayKey => {
  const { y, m, d } = localParts(ts, timeZone);
  return `${y}-${pad(m)}-${pad(d)}`;
};

export const hourOf = (ts: number, timeZone?: string): number => localParts(ts, timeZone).hour;

/** Days since 1970-01-01 for a calendar date (timezone-free). */
export const dayNumber = (key: DayKey): number => {
  const [y, m, d] = key.split('-').map(Number);
  return Math.round(Date.UTC(y, m - 1, d) / MS_PER_DAY);
};

export const keyFromDayNumber = (n: number): DayKey => {
  const dt = new Date(n * MS_PER_DAY);
  return `${dt.getUTCFullYear()}-${pad(dt.getUTCMonth() + 1)}-${pad(dt.getUTCDate())}`;
};

export const addDays = (key: DayKey, n: number): DayKey => keyFromDayNumber(dayNumber(key) + n);

/** 0 = Sunday … 6 = Saturday. 1970-01-01 was a Thursday. */
export const weekday = (key: DayKey): number => (((dayNumber(key) + 4) % 7) + 7) % 7;

/** First day of the week containing `key`. */
export const weekStartKey = (key: DayKey, weekStartsOn = 1): DayKey => {
  const offset = (weekday(key) - weekStartsOn + 7) % 7;
  return addDays(key, -offset);
};
