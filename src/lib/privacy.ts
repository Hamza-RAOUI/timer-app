/**
 * Data rights, local-first: everything Flowglass knows about you lives on this
 * device (plus your own cloud copy if you signed in), so export and deletion
 * happen right here — no request needed.
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform, Share } from 'react-native';
import { APP_VERSION } from '../constants/appConfig';
import { deleteCloudData } from './cloud';
import { useRewardStore } from '../stores/rewardStore';
import { SETTINGS_KEY, useSettingsStore } from '../stores/settingsStore';
import { LEGACY_STATS_KEY, SESSIONS_KEY, useStatsStore } from '../stores/statsStore';
import { useCountdownStore } from '../stores/countdownStore';
import { useStopwatchStore } from '../stores/stopwatchStore';

/** Every storage key the app writes. */
export const STORAGE_KEYS = [SESSIONS_KEY, LEGACY_STATS_KEY, SETTINGS_KEY];

export const buildExport = (): string => {
  const settings = useSettingsStore.getState();
  const { hydrated: _h, ...persisted } = Object.fromEntries(Object.entries(settings).filter(([, v]) => typeof v !== 'function')) as Record<string, unknown>;
  return JSON.stringify(
    {
      app: 'Flowglass',
      version: APP_VERSION,
      exportedAt: new Date().toISOString(),
      sessions: useStatsStore.getState().sessions,
      settings: persisted,
    },
    null,
    2
  );
};

/** Web: download a JSON file. Native: open the share sheet. */
export const exportData = async (): Promise<void> => {
  const json = buildExport();
  if (Platform.OS === 'web' && typeof document !== 'undefined') {
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `flowglass-data-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    return;
  }
  await Share.share({ title: 'Flowglass data', message: json });
};

/** Permanently erase every session, XP, level and setting on this device — and
 *  the cloud copy when signed in (otherwise the next sync would bring it back). */
export const deleteAllData = async (): Promise<void> => {
  await deleteCloudData().catch(() => {});
  useCountdownStore.getState().reset();
  useStopwatchStore.getState().reset();
  await AsyncStorage.multiRemove(STORAGE_KEYS).catch(() => {});
  useStatsStore.getState().reset();
  useSettingsStore.getState().resetAll();
  useRewardStore.getState().clearAll();
};
