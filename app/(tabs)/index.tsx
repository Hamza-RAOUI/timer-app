import { AppShell } from '@/src/components/AppShell';
import { TECHNIQUES, type TechniqueKey } from '@/src/constants/focus';
import { useSettingsStore } from '@/src/stores/settingsStore';
import { useUiStore, type AppView } from '@/src/stores/uiStore';
import { useLocalSearchParams } from 'expo-router';
import Head from 'expo-router/head';
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

  return (
    <>
      <Head>
        <title>Flowglass — Free Focus Timer | Pomodoro Web App</title>
        <meta name="description" content="Free cross-platform Pomodoro and focus timer. No login, no download. Start focusing in seconds on any device." />
        <meta name="robots" content="index, follow" />
        <link rel="canonical" href="https://www.flowglass.app/" />
        <meta property="og:title" content="Flowglass — Free Focus Timer" />
        <meta property="og:description" content="Free Pomodoro timer for students, developers, and deep workers. Web, iOS and Android." />
        <meta property="og:url" content="https://www.flowglass.app/" />
        <meta property="og:type" content="website" />
        <meta name="twitter:card" content="summary_large_image" />
      </Head>
      <AppShell />
    </>
  );
}
