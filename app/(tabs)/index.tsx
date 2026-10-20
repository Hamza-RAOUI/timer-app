import { AppShell } from '@/src/components/AppShell';
import { TECHNIQUES, type TechniqueKey } from '@/src/constants/focus';
import { useSettingsStore } from '@/src/stores/settingsStore';
import { APP_VIEWS, useUiStore, type AppView } from '@/src/stores/uiStore';
import { useLocalSearchParams } from 'expo-router';
import Head from 'expo-router/head';
import React, { useEffect } from 'react';

/**
 * The whole app lives in one window: a sidebar (or drawer on phones) + the
 * active view. Optional deep-link params (from the home-screen widget) preset
 * the technique / view and can auto-start a session.
 */
export default function Home() {
  const params = useLocalSearchParams<{ technique?: string; view?: string; start?: string; devspeed?: string }>();
  const setTechnique = useSettingsStore((s) => s.setTechnique);
  const setView = useUiStore((s) => s.setView);
  const requestStart = useUiStore((s) => s.requestStart);

  useEffect(() => {
    if (params.technique && TECHNIQUES.some((t) => t.key === params.technique)) {
      setTechnique(params.technique as TechniqueKey);
    }
    const v = params.view as AppView | undefined;
    if (v && APP_VIEWS.includes(v)) setView(v);
    if (params.start === '1') {
      setView('timer');
      requestStart();
    }
    // Dev only: ?devspeed=60 runs timers 60× faster for testing the XP flow.
    if (__DEV__ && params.devspeed) useUiStore.getState().setDevSpeed(Number(params.devspeed) || 1);
    // Run once on mount with the initial params.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <>
      <Head>
        <title>Flowglass — Free Focus Timer with XP & Levels | Pomodoro Web App</title>
        <meta
          name="description"
          content="A free Pomodoro and focus timer that turns focus into XP: level up, grow your skills, keep a streak and finish daily quests. No login, no download."
        />
        <meta name="robots" content="index, follow" />
        <link rel="canonical" href="https://www.flowglass.app/" />
        <meta property="og:title" content="Flowglass — Free Focus Timer with XP & Levels" />
        <meta property="og:description" content="Free Pomodoro timer with an RPG twist: XP, levels, skills, streaks and quests. No login, no download." />
        <meta property="og:url" content="https://www.flowglass.app/" />
        <meta property="og:type" content="website" />
        <meta name="twitter:card" content="summary_large_image" />
      </Head>
      <AppShell />
    </>
  );
}
