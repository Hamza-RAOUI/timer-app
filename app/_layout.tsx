import { initPurchases } from '@/src/lib/purchases';
import { useSettingsStore } from '@/src/stores/settingsStore';
import { useStatsStore } from '@/src/stores/statsStore';
import { colors } from '@/src/theme/colors';
import { pushStatsToWidget, subscribeWidgetToStats } from '@/src/widget/widgetBridge';
import { inject } from '@vercel/analytics';
import {
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
    Inter_800ExtraBold,
    useFonts,
} from '@expo-google-fonts/inter';
import { DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { Platform } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import 'react-native-reanimated';
import { SafeAreaProvider } from 'react-native-safe-area-context';

export { ErrorBoundary } from 'expo-router';

export const unstable_settings = {
  initialRouteName: '(tabs)',
};

SplashScreen.preventAutoHideAsync().catch(() => {});

inject();

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
    Inter_800ExtraBold,
  });

  const hydrateStats = useStatsStore((s) => s.hydrate);
  const hydrateSettings = useSettingsStore((s) => s.hydrate);

  useEffect(() => {
    if (fontError) throw fontError;
  }, [fontError]);

  useEffect(() => {
    hydrateStats();
    hydrateSettings();
    initPurchases();
    const unsub = subscribeWidgetToStats();
    pushStatsToWidget();
    return unsub;
  }, [hydrateStats, hydrateSettings]);

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

  

  const navTheme = {
    ...DefaultTheme,
    colors: {
      ...DefaultTheme.colors,
      background: colors.bg,
      card: colors.surface,
      text: colors.text.primary,
      border: colors.border,
      primary: colors.accent,
    },
  };

  return (
    <GestureHandlerRootView style={{ flex: 1, backgroundColor: colors.bg }}>
      <SafeAreaProvider>
        <ThemeProvider value={navTheme}>
          <StatusBar style="dark" />
          <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.bg } }}>
            <Stack.Screen name="(tabs)" />
          </Stack>
        </ThemeProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
