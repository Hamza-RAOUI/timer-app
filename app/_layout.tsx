import { initAnalytics } from '@/src/lib/analytics';
import { initCloud } from '@/src/lib/cloud';
import { initPurchases } from '@/src/lib/purchases';
import { useSettingsStore } from '@/src/stores/settingsStore';
import { useStatsStore } from '@/src/stores/statsStore';
import { useUiStore } from '@/src/stores/uiStore';
import { ThemeProvider, useTheme } from '@/src/theme/ThemeProvider';
import { pushStatsToWidget, subscribeWidgetToStats } from '@/src/widget/widgetBridge';
import {
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
    Inter_800ExtraBold,
    Inter_900Black,
    useFonts,
} from '@expo-google-fonts/inter';
import { DarkTheme, DefaultTheme, ThemeProvider as NavThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useMemo } from 'react';
import { AppState, Platform, View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import 'react-native-reanimated';
import { SafeAreaProvider } from 'react-native-safe-area-context';

export { ErrorBoundary } from 'expo-router';

export const unstable_settings = {
  initialRouteName: '(tabs)',
};

SplashScreen.preventAutoHideAsync().catch(() => {});

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
    Inter_800ExtraBold,
    Inter_900Black,
  });

  const hydrateStats = useStatsStore((s) => s.hydrate);
  const hydrateSettings = useSettingsStore((s) => s.hydrate);

  useEffect(() => {
    if (fontError) throw fontError;
  }, [fontError]);

  useEffect(() => {
    hydrateStats();
    hydrateSettings().then(() => initAnalytics()); // web only; respects the saved privacy choice
    initPurchases();
    initCloud(); // optional account sync; no-op unless Supabase is configured
    const unsub = subscribeWidgetToStats();
    pushStatsToWidget();
    return unsub;
  }, [hydrateStats, hydrateSettings]);

  // Roll daily quests / streaks over at local midnight (and when the app returns to the foreground).
  useEffect(() => {
    const refresh = () => useUiStore.getState().refreshToday();
    const id = setInterval(refresh, 30_000);
    const sub = AppState.addEventListener('change', (s) => s === 'active' && refresh());
    return () => {
      clearInterval(id);
      sub.remove();
    };
  }, []);

  useEffect(() => {
    if (fontsLoaded) SplashScreen.hideAsync().catch(() => {});
  }, [fontsLoaded]);

  // Register the PWA service worker (web only) for offline use + installability.
  useEffect(() => {
    if (Platform.OS === 'web' && typeof navigator !== 'undefined' && 'serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').catch(() => {});
    }
  }, []);

  // On web, render immediately so static export captures real HTML (SEO) and the
  // page never flashes blank — fonts swap in when ready. Native waits to avoid FOUT.
  if (!fontsLoaded && Platform.OS !== 'web') return null;

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <ThemeProvider>
          <ThemedStack />
        </ThemeProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

function ThemedStack() {
  const t = useTheme();
  const navTheme = useMemo(() => {
    const base = t.isDark ? DarkTheme : DefaultTheme;
    return {
      ...base,
      colors: { ...base.colors, background: t.colors.bg, card: t.colors.surface, text: t.colors.text.primary, border: t.colors.border, primary: t.colors.accent },
    };
  }, [t]);

  return (
    <NavThemeProvider value={navTheme}>
      <StatusBar style={t.isDark ? 'light' : 'dark'} />
      <View style={{ flex: 1, backgroundColor: t.colors.bg }}>
        <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: t.colors.bg } }}>
          <Stack.Screen name="(tabs)" />
        </Stack>
      </View>
    </NavThemeProvider>
  );
}
