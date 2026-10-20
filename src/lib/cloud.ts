/**
 * Optional account + cloud sync (Supabase). Local-first: the app works the same
 * signed out; signing in backs the session log and settings up and merges them
 * across devices.
 *
 * - Sessions are immutable events → sync = "insert what the other side is
 *   missing", merged by id. Nothing is ever overwritten.
 * - Settings are one JSON document, last write wins (server clock).
 * - Pro and analytics consent stay on the device (see SYNCED_KEYS).
 * Schema + row-level security: supabase/migrations/0001_flowglass_sync.sql.
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AppState, Platform } from 'react-native';
import type { SessionEvent } from './rpg';
import { getSupabase } from './supabase';
import { useAccountStore } from '../stores/accountStore';
import { pickSynced, SYNCED_KEYS, useSettingsStore } from '../stores/settingsStore';
import { useStatsStore } from '../stores/statsStore';

const META_KEY = '@flowglass/cloud/v1';
const PAGE = 1000; // PostgREST's default max rows per request
const PUSH_CHUNK = 500;

/** Per-user sync bookkeeping, persisted so offline edits still get pushed later. */
interface Meta {
  userId: string;
  /** updated_at of the cloud settings we last pulled or pushed. */
  settingsAt: string | null;
  /** Local settings changed since then (epoch ms), or null. */
  dirtyAt: number | null;
}

let meta: Meta | null = null;
/** Session ids known to be in the cloud (this app run) + pull cursor. */
let remoteIds: Set<string> | null = null;
let cursor: string | null = null;
let applyingRemote = false;

const account = () => useAccountStore.getState();

const loadMeta = async (userId: string): Promise<Meta> => {
  if (meta?.userId === userId) return meta;
  try {
    const raw = await AsyncStorage.getItem(META_KEY);
    const saved = raw ? (JSON.parse(raw) as Meta) : null;
    if (saved?.userId === userId) return (meta = saved);
  } catch {
    /* noop */
  }
  return (meta = { userId, settingsAt: null, dirtyAt: null });
};
const saveMeta = () => {
  if (meta) AsyncStorage.setItem(META_KEY, JSON.stringify(meta)).catch(() => {});
};

const whenHydrated = () =>
  new Promise<void>((resolve) => {
    const ok = () => useStatsStore.getState().hydrated && useSettingsStore.getState().hydrated;
    if (ok()) return resolve();
    const check = () => {
      if (!ok()) return;
      u1();
      u2();
      resolve();
    };
    const u1 = useStatsStore.subscribe(check);
    const u2 = useSettingsStore.subscribe(check);
  });

const friendly = (e: unknown): string => {
  const msg = (e as { message?: string })?.message ?? String(e);
  if (/rate limit|too many/i.test(msg)) return 'Too many tries — wait a minute and try again.';
  if (/expired|invalid.*(otp|token)|token.*invalid/i.test(msg)) return 'That code is wrong or expired. Request a new one.';
  if (/fetch|network|failed to/i.test(msg)) return "Can't reach the server — you're probably offline.";
  return msg;
};

// ───────────── Sync ─────────────
let running: Promise<void> | null = null;
let again = false;
let timer: ReturnType<typeof setTimeout> | null = null;

/** Debounced sync (several changes in a row → one round trip). */
export const scheduleSync = (ms = 1500) => {
  if (account().status !== 'signedIn') return;
  if (timer) clearTimeout(timer);
  timer = setTimeout(() => {
    timer = null;
    syncNow().catch(() => {});
  }, ms);
};

export const syncNow = async (): Promise<void> => {
  if (running) {
    again = true;
    return running;
  }
  running = runSync().finally(() => {
    running = null;
    if (again) {
      again = false;
      scheduleSync(0);
    }
  });
  return running;
};

const runSync = async () => {
  const sb = getSupabase();
  const userId = account().userId;
  if (!sb || !userId) return;
  await whenHydrated();
  account().set({ sync: 'syncing', error: null });
  try {
    // 1. Pull sessions (all of them once per app run, then only new rows).
    if (!remoteIds) {
      remoteIds = new Set();
      cursor = null;
    }
    const since = cursor;
    for (let from = 0; ; from += PAGE) {
      let q = sb.from('focus_sessions').select('id,event,created_at').order('created_at').order('id').range(from, from + PAGE - 1);
      if (since) q = q.gte('created_at', since);
      const { data, error } = await q;
      if (error) throw error;
      for (const r of data) remoteIds.add(r.id as string);
      useStatsStore.getState().mergeSessions(data.map((r) => r.event));
      if (data.length) cursor = data[data.length - 1].created_at as string;
      if (data.length < PAGE) break;
    }

    // 2. Push the sessions the cloud doesn't have.
    const missing = useStatsStore.getState().sessions.filter((s) => !remoteIds!.has(s.id));
    for (let i = 0; i < missing.length; i += PUSH_CHUNK) {
      const chunk = missing.slice(i, i + PUSH_CHUNK);
      const rows = chunk.map((s: SessionEvent) => ({ user_id: userId, id: s.id, event: s, ended_at: new Date(s.endedAt).toISOString() }));
      const { error } = await sb.from('focus_sessions').upsert(rows, { onConflict: 'user_id,id', ignoreDuplicates: true });
      if (error) throw error;
      for (const s of chunk) remoteIds.add(s.id);
    }

    // 3. Settings: newest side wins.
    const m = await loadMeta(userId);
    const { data: row, error } = await sb.from('user_state').select('settings,updated_at').maybeSingle();
    if (error) throw error;
    const remoteChanged = !!row && row.updated_at !== m.settingsAt;
    const remoteNewer = remoteChanged && (m.dirtyAt == null || Date.parse(row.updated_at as string) > m.dirtyAt);
    if (row && remoteNewer) {
      applyingRemote = true;
      try {
        useSettingsStore.getState().applySynced((row.settings ?? {}) as Record<string, unknown>);
      } finally {
        applyingRemote = false;
      }
      m.settingsAt = row.updated_at as string;
      m.dirtyAt = null;
    } else if (!row || m.dirtyAt != null) {
      const { data: saved, error: e2 } = await sb
        .from('user_state')
        .upsert({ user_id: userId, settings: pickSynced(useSettingsStore.getState()) }, { onConflict: 'user_id' })
        .select('updated_at')
        .single();
      if (e2) throw e2;
      m.settingsAt = saved.updated_at as string;
      m.dirtyAt = null;
    }
    saveMeta();
    account().set({ sync: 'idle', lastSyncedAt: Date.now() });
  } catch (e) {
    account().set({ sync: 'error', error: friendly(e) });
  }
};

// ───────────── Auth ─────────────
let started = false;

/** Start listening for the auth session (client only, once). No-op when cloud sync isn't configured. */
export const initCloud = () => {
  if (started) return;
  const sb = getSupabase();
  if (!sb) return;
  started = true;
  account().set({ status: 'loading' });

  const apply = (session: { user: { id: string; email?: string } } | null) => {
    if (!session) {
      account().set({ status: 'signedOut', userId: null, email: null, sync: 'idle' });
      return;
    }
    const changed = account().userId !== session.user.id;
    account().set({ status: 'signedIn', userId: session.user.id, email: session.user.email ?? null });
    if (changed) {
      remoteIds = null;
      meta = null;
    }
    scheduleSync(changed ? 0 : 1500); // never call Supabase inside the auth callback itself
  };
  sb.auth.getSession().then(({ data }) => apply(data.session));
  sb.auth.onAuthStateChange((_event, session) => apply(session));

  // New sessions → push. Settings edits → mark dirty, push.
  useStatsStore.subscribe((s, prev) => {
    if (s.sessions !== prev.sessions && s.sessions.some((e) => !remoteIds?.has(e.id))) scheduleSync();
  });
  useSettingsStore.subscribe((s, prev) => {
    if (applyingRemote || !s.hydrated || !prev.hydrated || account().status !== 'signedIn') return;
    if (!SYNCED_KEYS.some((k) => s[k] !== prev[k])) return;
    const userId = account().userId!;
    loadMeta(userId).then((m) => {
      m.dirtyAt = Date.now();
      saveMeta();
      scheduleSync(3000);
    });
  });

  // Back in the foreground → pull what other devices logged. Native also needs
  // token refresh paused in the background.
  AppState.addEventListener('change', (state) => {
    if (Platform.OS !== 'web') {
      if (state === 'active') sb.auth.startAutoRefresh();
      else sb.auth.stopAutoRefresh();
    }
    if (state === 'active') scheduleSync(500);
  });
};

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Email a 6-digit code (and a magic link) — signs up on first use. */
export const sendCode = async (email: string): Promise<string | null> => {
  const sb = getSupabase();
  if (!sb) return 'Accounts are not set up in this build.';
  const clean = email.trim().toLowerCase();
  if (!EMAIL_RE.test(clean)) return 'Enter a valid email address.';
  const redirect = Platform.OS === 'web' && typeof window !== 'undefined' ? window.location.origin : undefined;
  const { error } = await sb.auth.signInWithOtp({ email: clean, options: { shouldCreateUser: true, emailRedirectTo: redirect } });
  return error ? friendly(error) : null;
};

export const verifyCode = async (email: string, code: string): Promise<string | null> => {
  const sb = getSupabase();
  if (!sb) return 'Accounts are not set up in this build.';
  const token = code.replace(/\s/g, '');
  if (!/^\d{6,10}$/.test(token)) return 'Enter the code from the email.';
  const { error } = await sb.auth.verifyOtp({ email: email.trim().toLowerCase(), token, type: 'email' });
  return error ? friendly(error) : null;
};

/** Sign out on this device. Local data stays; the cloud copy stays too. */
export const signOut = async () => {
  const sb = getSupabase();
  if (!sb) return;
  await sb.auth.signOut().catch(() => {});
  remoteIds = null;
  meta = null;
  AsyncStorage.removeItem(META_KEY).catch(() => {});
};

/** Erase the signed-in user's cloud copy (used by "Delete all my data"). */
export const deleteCloudData = async (): Promise<void> => {
  const sb = getSupabase();
  const userId = account().userId;
  if (!sb || !userId) return;
  await sb.from('focus_sessions').delete().eq('user_id', userId);
  await sb.from('user_state').delete().eq('user_id', userId);
  remoteIds = new Set();
  cursor = null;
  meta = { userId, settingsAt: null, dirtyAt: null };
  saveMeta();
};

/** Delete the account and everything stored with it (server-side cascade). Local data stays. */
export const deleteAccount = async (): Promise<string | null> => {
  const sb = getSupabase();
  if (!sb) return null;
  const { error } = await sb.rpc('delete_my_account');
  if (error) return friendly(error);
  await sb.auth.signOut({ scope: 'local' }).catch(() => {});
  remoteIds = null;
  meta = null;
  AsyncStorage.removeItem(META_KEY).catch(() => {});
  return null;
};
