/**
 * Supabase client for the optional account + cloud sync.
 *
 * Off unless both env vars are set (see .env.example) — without them the app is
 * purely local and the Account section in Settings is hidden. Created lazily on
 * the client: the static web render has no storage to read a session from.
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { Platform } from 'react-native';
import 'react-native-url-polyfill/auto';

/** Forgive pasting mistakes in hosting dashboards: spaces, quotes, a missing `https:`.
 *  Anything still not a valid http(s) URL turns sync off instead of crashing the app. */
const cleanUrl = (raw: string | undefined): string => {
  let v = (raw ?? '').trim().replace(/^['"]|['"]$/g, '').replace(/\/+$/, '');
  if (!v) return '';
  if (!/^https?:\/\//i.test(v)) v = `https://${v.replace(/^\/+/, '')}`; // e.g. "//x.supabase.co"
  try {
    const u = new globalThis.URL(v);
    if (u.protocol === 'https:' || u.protocol === 'http:') return v;
  } catch {
    /* fall through */
  }
  console.warn('[flowglass] EXPO_PUBLIC_SUPABASE_URL is not a valid URL; cloud sync is off.');
  return '';
};

// Expo inlines EXPO_PUBLIC_* only when read literally like this.
const URL_ = cleanUrl(process.env.EXPO_PUBLIC_SUPABASE_URL);
const KEY = (process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? '').trim().replace(/^['"]|['"]$/g, '');

export const cloudConfigured = !!URL_ && !!KEY;

let client: SupabaseClient | null = null;

export const getSupabase = (): SupabaseClient | null => {
  if (!cloudConfigured) return null;
  if (Platform.OS === 'web' && typeof window === 'undefined') return null; // static render
  if (!client) {
    try {
      client = createClient(URL_, KEY, {
        auth: {
          storage: AsyncStorage,
          persistSession: true,
          autoRefreshToken: true,
          // Web: finish a magic-link sign-in when the link opens the app.
          detectSessionInUrl: Platform.OS === 'web',
        },
      });
    } catch (e) {
      console.warn('[flowglass] Supabase client could not start; cloud sync is off.', e);
      return null;
    }
  }
  return client;
};
