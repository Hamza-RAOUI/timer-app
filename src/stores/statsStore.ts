import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { techniqueByKey, type TechniqueKey } from '../constants/focus';
import { countsAsCompleted, type SessionEvent } from '../lib/rpg';

/**
 * The session log — the single source of truth. Every focus session (finished
 * or stopped early) is stored as an event; XP, levels, streaks and quests are
 * derived from it by the pure functions in `src/lib/rpg`.
 */
export const SESSIONS_KEY = '@flowglass/sessions/v2';
export const LEGACY_STATS_KEY = '@cadence/stats/v1';
/** ~1.7 MB of JSON — stays well under AsyncStorage's per-key limits on Android. */
const MAX_EVENTS = 10_000;

export type RangeKey = 'D' | 'W' | 'M' | 'Y';
export type NewSession = Omit<SessionEvent, 'id'>;

/** v1 shape: only finished blocks, rounded minutes, completion time only. */
interface LegacySession {
  id: string;
  ts: number;
  minutes: number;
  category: string;
  technique: string;
}

interface StatsState {
  sessions: SessionEvent[];
  hydrated: boolean;

  hydrate: () => Promise<void>;
  /** Append a session to the log. Returns null for empty sessions (< ~1 s). */
  logSession: (input: NewSession) => SessionEvent | null;
  /** Add events from another device (cloud sync); ids already here are skipped. Returns how many were new. */
  mergeSessions: (events: unknown[]) => number;
  reset: () => void;

  todayMinutes: () => number;
  minutesInRange: (range: RangeKey) => number;
  /** Completed sessions in range. */
  countInRange: (range: RangeKey) => number;
  minutesBySkill: (range: RangeKey) => Record<string, number>;
  series: (range: RangeKey) => { label: string; minutes: number; highlight: boolean }[];
}

const startOfDay = (d: Date) => {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
};

export const rangeStart = (range: RangeKey): number => {
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

const WEEKDAY = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
const MONTH = ['J', 'F', 'M', 'A', 'M', 'J', 'J', 'A', 'S', 'O', 'N', 'D'];

const newId = () => `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
const round2 = (n: number) => Math.round(n * 100) / 100;

/** Map a v1 record to the event shape. v1 only ever stored finished sessions. */
export const migrateLegacySession = (s: LegacySession): SessionEvent => {
  const t = techniqueByKey(s.technique as TechniqueKey);
  const known = t.key === s.technique;
  const planned = known && t.kind === 'countdown' ? (t.adjustable ? s.minutes : (t.focusMin ?? s.minutes)) : known ? null : s.minutes;
  return {
    id: s.id,
    startedAt: s.ts - s.minutes * 60_000,
    endedAt: s.ts,
    focusedMinutes: s.minutes,
    plannedMinutes: planned,
    technique: s.technique,
    skill: s.category,
    completed: true,
  };
};

export const isEvent = (x: unknown): x is SessionEvent => {
  const e = x as SessionEvent;
  return !!e && typeof e.id === 'string' && typeof e.endedAt === 'number' && typeof e.focusedMinutes === 'number' && typeof e.skill === 'string';
};

const sumMinutes = (list: SessionEvent[]) => list.reduce((sum, s) => sum + Math.max(0, s.focusedMinutes), 0);

export const useStatsStore = create<StatsState>((set, get) => {
  const persist = () => AsyncStorage.setItem(SESSIONS_KEY, JSON.stringify({ version: 2, sessions: get().sessions })).catch(() => {});

  const inRange = (range: RangeKey) => {
    const from = rangeStart(range);
    return get().sessions.filter((s) => s.endedAt >= from);
  };

  return {
    sessions: [],
    hydrated: false,

    hydrate: async () => {
      if (get().hydrated) return; // once per app start (effects can re-run in dev)
      let saved: SessionEvent[] = [];
      let migrated = false;
      try {
        const raw = await AsyncStorage.getItem(SESSIONS_KEY);
        if (raw) {
          const data = JSON.parse(raw) as { sessions?: unknown[] };
          saved = (data.sessions ?? []).filter(isEvent);
        } else {
          // First run on v2: migrate the v1 log (kept in place as a backup).
          const legacy = await AsyncStorage.getItem(LEGACY_STATS_KEY);
          if (legacy) {
            const data = JSON.parse(legacy) as { sessions?: LegacySession[] };
            saved = (data.sessions ?? []).filter((s) => s && typeof s.ts === 'number').map(migrateLegacySession);
            migrated = true;
          }
        }
      } catch {
        /* noop — start with an empty log */
      }
      // Keep anything logged before hydration finished; never store an id twice.
      const seen = new Set<string>();
      const merged = [...saved, ...get().sessions].filter((s) => !seen.has(s.id) && !!seen.add(s.id));
      const changed = migrated || merged.length !== saved.length;
      set({ sessions: merged.slice(-MAX_EVENTS), hydrated: true });
      if (changed) persist();
    },

    logSession: (input) => {
      if (!(input.focusedMinutes > 0.01)) return null;
      const event: SessionEvent = {
        ...input,
        id: newId(),
        focusedMinutes: round2(input.focusedMinutes),
        plannedMinutes: input.plannedMinutes == null ? null : round2(input.plannedMinutes),
      };
      set({ sessions: [...get().sessions, event].slice(-MAX_EVENTS) });
      // Before hydration the log is incomplete — hydrate() merges and saves.
      if (get().hydrated) persist();
      return event;
    },

    mergeSessions: (events) => {
      const have = new Set(get().sessions.map((s) => s.id));
      const fresh = events.filter(isEvent).filter((e) => !have.has(e.id) && !!have.add(e.id));
      if (fresh.length === 0) return 0;
      const sessions = [...get().sessions, ...fresh].sort((a, b) => a.endedAt - b.endedAt).slice(-MAX_EVENTS);
      set({ sessions });
      if (get().hydrated) persist();
      return fresh.length;
    },

    reset: () => {
      set({ sessions: [] });
      persist();
    },

    todayMinutes: () => {
      const from = startOfDay(new Date()).getTime();
      return sumMinutes(get().sessions.filter((s) => s.endedAt >= from));
    },

    minutesInRange: (range) => sumMinutes(inRange(range)),
    countInRange: (range) => inRange(range).filter((s) => countsAsCompleted(s)).length,

    minutesBySkill: (range) => {
      const acc: Record<string, number> = {};
      for (const s of inRange(range)) acc[s.skill] = (acc[s.skill] ?? 0) + Math.max(0, s.focusedMinutes);
      return acc;
    },

    series: (range) => {
      const sessions = get().sessions;
      const now = new Date();
      const minutesBetween = (from: number, to: number) => sumMinutes(sessions.filter((s) => s.endedAt >= from && s.endedAt < to));

      if (range === 'D') {
        // Four parts of today
        const buckets = [
          { label: 'Morning', from: 5, to: 12 },
          { label: 'Noon', from: 12, to: 17 },
          { label: 'Eve', from: 17, to: 22 },
          { label: 'Night', from: 22, to: 29 }, // wraps past midnight
        ];
        const from = startOfDay(now).getTime();
        const today = sessions.filter((s) => s.endedAt >= from);
        const nh = now.getHours() < 5 ? now.getHours() + 24 : now.getHours();
        return buckets.map((b) => {
          const mins = sumMinutes(
            today.filter((s) => {
              const h = new Date(s.endedAt).getHours();
              const hh = h < 5 ? h + 24 : h;
              return hh >= b.from && hh < b.to;
            })
          );
          return { label: b.label, minutes: mins, highlight: nh >= b.from && nh < b.to };
        });
      }

      if (range === 'W') {
        const out: { label: string; minutes: number; highlight: boolean }[] = [];
        for (let i = 6; i >= 0; i--) {
          const d = startOfDay(now);
          d.setDate(d.getDate() - i);
          const next = new Date(d);
          next.setDate(next.getDate() + 1);
          out.push({ label: WEEKDAY[d.getDay()], minutes: minutesBetween(d.getTime(), next.getTime()), highlight: i === 0 });
        }
        return out;
      }

      if (range === 'M') {
        const out: { label: string; minutes: number; highlight: boolean }[] = [];
        for (let i = 4; i >= 0; i--) {
          const end = startOfDay(now);
          end.setDate(end.getDate() - i * 7 + 1);
          const start = new Date(end);
          start.setDate(start.getDate() - 7);
          out.push({ label: i === 0 ? 'Now' : `${i}w`, minutes: minutesBetween(start.getTime(), end.getTime()), highlight: i === 0 });
        }
        return out;
      }

      // Y — 12 months
      const out: { label: string; minutes: number; highlight: boolean }[] = [];
      for (let i = 11; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const next = new Date(now.getFullYear(), now.getMonth() - i + 1, 1).getTime();
        out.push({ label: MONTH[d.getMonth()], minutes: minutesBetween(d.getTime(), next), highlight: i === 0 });
      }
      return out;
    },
  };
});
