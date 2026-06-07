import { NativeModules, Platform } from 'react-native';
import { useStatsStore } from '@/src/stores/statsStore';

interface TempoWidgetModule {
  setStats(focusMs: number, sessions: number, streak: number): Promise<boolean>;
}

const native = (NativeModules as { TempoWidget?: TempoWidgetModule }).TempoWidget;

const noop = async () => false;

export const TempoWidget: TempoWidgetModule = native ?? { setStats: noop };

let lastSig = '';

/**
 * Push current stats into the native home-screen widget.
 *
 * Safe to call frequently — we no-op if nothing changed since last push and
 * if the native module isn't installed (e.g. running in Expo Go or web).
 */
export const pushStatsToWidget = async () => {
  if (!native || (Platform.OS !== 'android' && Platform.OS !== 'ios')) return;
  const state = useStatsStore.getState();
  const focusMs = state.todayMinutes() * 60_000;
  const sessions = state.countInRange('D');
  const streak = state.streak();
  const sig = `${focusMs}|${sessions}|${streak}`;
  if (sig === lastSig) return;
  lastSig = sig;
  try {
    await native.setStats(focusMs, sessions, streak);
  } catch {
    /* swallow — widget is non-critical */
  }
};

/** Wire the stats store to push to the widget on every change. */
export const subscribeWidgetToStats = () => {
  return useStatsStore.subscribe(() => {
    pushStatsToWidget();
  });
};
