/**
 * Vercel Web Analytics (web only). Cookieless and anonymous: page views plus
 * exactly four custom events, never any personal data or free text.
 * Native builds send nothing.
 */
import { inject, pageview, track } from '@vercel/analytics';
import { Platform } from 'react-native';
import { FEATURES } from '../constants/appConfig';
import { SETTINGS_KEY, useSettingsStore, type AnalyticsConsent } from '../stores/settingsStore';

export type AnalyticsEvent = 'session_completed' | 'level_up' | 'quest_completed' | 'pro_interest_clicked';
type Props = Record<string, string | number | boolean>;

const isBrowser = () => Platform.OS === 'web' && typeof window !== 'undefined' && typeof document !== 'undefined';

/** Consent as stored — read straight from localStorage until the settings store has hydrated. */
const currentConsent = (): AnalyticsConsent => {
  const s = useSettingsStore.getState();
  if (s.hydrated) return s.analyticsConsent;
  try {
    const raw = window.localStorage.getItem(SETTINGS_KEY);
    return (raw && (JSON.parse(raw) as { analyticsConsent?: AnalyticsConsent }).analyticsConsent) || 'unset';
  } catch {
    return 'unset';
  }
};

export const analyticsAllowed = (): boolean => {
  const c = currentConsent();
  if (c === 'denied') return false;
  if (c === 'granted') return true;
  return !FEATURES.analyticsOptIn;
};

let injected = false;

/** Load the analytics script if consent allows. Safe to call repeatedly (e.g. after the visitor opts in). */
export const initAnalytics = () => {
  if (!isBrowser() || injected || !analyticsAllowed()) return;
  injected = true;
  // beforeSend re-checks consent for every page view/event, so opting out takes effect immediately.
  inject({ beforeSend: (event) => (analyticsAllowed() ? event : null) });
};

export const trackEvent = (name: AnalyticsEvent, props?: Props) => {
  if (!isBrowser() || !analyticsAllowed()) return;
  try {
    track(name, props);
    // Hobby plans don't record custom events — optionally count them as virtual pages.
    if (FEATURES.analyticsEventsAsPageviews) pageview({ route: `/e/${name}`, path: `/e/${name}` });
  } catch {
    /* analytics must never break the app */
  }
};
