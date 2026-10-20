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

// Expo inlines EXPO_PUBLIC_* only when read literally like this.
const URL_ = process.env.EXPO_PUBLIC_SUPABASE_URL ?? '';
const KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? '';

export const cloudConfigured = !!URL_ && !!KEY;

let client: SupabaseClient | null = null;

export const getSupabase = (): SupabaseClient | null => {
  if (!cloudConfigured) return null;
  if (Platform.OS === 'web' && typeof window === 'undefined') return null; // static render
  if (!client) {
    client = createClient(URL_, KEY, {
      auth: {
        storage: AsyncStorage,
        persistSession: true,
        autoRefreshToken: true,
        // Web: finish a magic-link sign-in when the link opens the app.
        detectSessionInUrl: Platform.OS === 'web',
      },
    });
  }
  return client;
};
