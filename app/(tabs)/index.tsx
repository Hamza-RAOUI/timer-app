import { AppShell } from '@/src/components/AppShell';
import { TECHNIQUES, type TechniqueKey } from '@/src/constants/focus';
import { useSettingsStore } from '@/src/stores/settingsStore';
import { useUiStore, type AppView } from '@/src/stores/uiStore';
import { useLocalSearchParams } from 'expo-router';
import React, { useEffect } from 'react';

/**
 * The whole app lives in one window: a sidebar (or drawer on phones) + the
 * active view. Optional deep-link params (from the home-screen widget) preset
 * the technique / view and can auto-start a session.
 */
export default function Home() {
  const params = useLocalSearchParams<{ technique?: string; view?: string; start?: string }>();
  const setTechnique = useSettingsStore((s) => s.setTechnique);
  const setView = useUiStore((s) => s.setView);
  const requestStart = useUiStore((s) => s.requestStart);

  useEffect(() => {
    if (params.technique && TECHNIQUES.some((t) => t.key === params.technique)) {
      setTechnique(params.technique as TechniqueKey);
    }
    const v = params.view as AppView | undefined;
    if (v === 'timer' || v === 'stats' || v === 'settings') setView(v);
    if (params.start === '1') {
      setView('timer');
      requestStart();
    }
    // Run once on mount with the initial params.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return <AppShell />;
}
