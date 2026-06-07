import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import type { CategoryKey } from '../constants/focus';

const STORAGE_KEY = '@cadence/stats/v1';

export type RangeKey = 'D' | 'W' | 'M' | 'Y';

export interface Session {
  id: string;
  ts: number; // completion time
  minutes: number;
  category: CategoryKey;
  technique: string;
}

interface StatsState {
  sessions: Session[];
  hydrated: boolean;

  hydrate: () => Promise<void>;
  completeSession: (minutes: number, category: CategoryKey, technique: string) => void;
  reset: () => void;

  totalMinutes: () => number;
  todayMinutes: () => number;
  streak: () => number;
  minutesInRange: (range: RangeKey) => number;
  countInRange: (range: RangeKey) => number;
  minutesByCategory: (range: RangeKey) => Record<CategoryKey, number>;
  series: (range: RangeKey) => { label: string; minutes: number; highlight: boolean }[];
}

const startOfDay = (d: Date) => {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
};

const dayKey = (ts: number) => startOfDay(new Date(ts)).getTime();

const rangeStart = (range: RangeKey): number => {
  const now = new Date();
  if (range === 'D') return startOfDay(now).getTime();
  if (range === 'W') {
    const d = startOfDay(now);
    d.setDate(d.getDate() - 6);
    return d.getTime();
  }
  if (range === 'M') {
    const d = startOfDay(now);
    d.setDate(d.getDate() - 29);
    return d.getTime();
  }
  const d = startOfDay(now);
  d.setMonth(d.getMonth() - 11, 1);
  return d.getTime();
};

const emptyByCategory = (): Record<CategoryKey, number> => ({ study: 0, work: 0, hobby: 0, personal: 0 });

const WEEKDAY = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
const MONTH = ['J', 'F', 'M', 'A', 'M', 'J', 'J', 'A', 'S', 'O', 'N', 'D'];

export const useStatsStore = create<StatsState>((set, get) => {
  const persist = () => AsyncStorage.setItem(STORAGE_KEY, JSON.stringify({ sessions: get().sessions })).catch(() => {});

  const inRange = (range: RangeKey) => {
    const from = rangeStart(range);
    return get().sessions.filter((s) => s.ts >= from);
  };

  return {
    sessions: [],
    hydrated: false,

    hydrate: async () => {
      try {
        const raw = await AsyncStorage.getItem(STORAGE_KEY);
        if (raw) {
          const data = JSON.parse(raw) as { sessions?: Session[] };
          set({ sessions: data.sessions ?? [], hydrated: true });
          return;
        }
      } catch {
        /* noop */
      }
      set({ hydrated: true });
    },

    completeSession: (minutes, category, technique) => {
      if (minutes <= 0) return;
      const s: Session = {
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        ts: Date.now(),
        minutes: Math.round(minutes),
        category,
        technique,
      };
      set({ sessions: [...get().sessions, s].slice(-2000) });
      persist();
    },

    reset: () => {
      set({ sessions: [] });
      persist();
    },

    totalMinutes: () => get().sessions.reduce((sum, s) => sum + s.minutes, 0),

    todayMinutes: () => {
      const from = startOfDay(new Date()).getTime();
      return get().sessions.filter((s) => s.ts >= from).reduce((sum, s) => sum + s.minutes, 0);
    },

    streak: () => {
      const days = new Set(get().sessions.map((s) => dayKey(s.ts)));
      if (days.size === 0) return 0;
      let streak = 0;
      const cursor = startOfDay(new Date());
      // allow today to be empty without breaking yesterday's streak
      if (!days.has(cursor.getTime())) cursor.setDate(cursor.getDate() - 1);
      while (days.has(cursor.getTime())) {
        streak += 1;
        cursor.setDate(cursor.getDate() - 1);
      }
      return streak;
    },

    minutesInRange: (range) => inRange(range).reduce((sum, s) => sum + s.minutes, 0),
    countInRange: (range) => inRange(range).length,

    minutesByCategory: (range) => {
      const acc = emptyByCategory();
      for (const s of inRange(range)) acc[s.category] += s.minutes;
      return acc;
    },

    series: (range) => {
      const sessions = get().sessions;
      const now = new Date();

      if (range === 'D') {
        // Four parts of today
        const buckets = [
          { label: 'Morning', from: 5, to: 12 },
          { label: 'Noon', from: 12, to: 17 },
          { label: 'Eve', from: 17, to: 22 },
          { label: 'Night', from: 22, to: 29 }, // wraps past midnight
        ];
        const from = startOfDay(now).getTime();
        const today = sessions.filter((s) => s.ts >= from);
        const hourNow = now.getHours();
        return buckets.map((b) => {
          const mins = today
            .filter((s) => {
              const h = new Date(s.ts).getHours();
              const hh = h < 5 ? h + 24 : h;
              return hh >= b.from && hh < b.to;
            })
            .reduce((sum, s) => sum + s.minutes, 0);
          const nh = hourNow < 5 ? hourNow + 24 : hourNow;
          return { label: b.label, minutes: mins, highlight: nh >= b.from && nh < b.to };
        });
      }

      if (range === 'W') {
        const out: { label: string; minutes: number; highlight: boolean }[] = [];
        for (let i = 6; i >= 0; i--) {
          const d = startOfDay(now);
          d.setDate(d.getDate() - i);
          const next = d.getTime() + 86400000;
          const mins = sessions.filter((s) => s.ts >= d.getTime() && s.ts < next).reduce((sum, s) => sum + s.minutes, 0);
          out.push({ label: WEEKDAY[d.getDay()], minutes: mins, highlight: i === 0 });
        }
        return out;
      }

      if (range === 'M') {
        const out: { label: string; minutes: number; highlight: boolean }[] = [];
        for (let i = 4; i >= 0; i--) {
          const end = startOfDay(now);
          end.setDate(end.getDate() - i * 7);
          const start = end.getTime() - 6 * 86400000;
          const next = end.getTime() + 86400000;
          const mins = sessions.filter((s) => s.ts >= start && s.ts < next).reduce((sum, s) => sum + s.minutes, 0);
          out.push({ label: i === 0 ? 'Now' : `${i}w`, minutes: mins, highlight: i === 0 });
        }
        return out;
      }

      // Y — 12 months
      const out: { label: string; minutes: number; highlight: boolean }[] = [];
      for (let i = 11; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const next = new Date(now.getFullYear(), now.getMonth() - i + 1, 1).getTime();
        const mins = sessions.filter((s) => s.ts >= d.getTime() && s.ts < next).reduce((sum, s) => sum + s.minutes, 0);
        out.push({ label: MONTH[d.getMonth()], minutes: mins, highlight: i === 0 });
      }
      return out;
    },
  };
});
