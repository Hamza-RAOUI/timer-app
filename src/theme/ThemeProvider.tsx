import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { Platform, StyleSheet, useColorScheme } from 'react-native';
import { useSettingsStore } from '../stores/settingsStore';
import { darkColors, darkShadow, lightColors, lightShadow, type Palette, type Scheme, type ShadowSet } from './colors';

export interface Theme {
  scheme: Scheme;
  isDark: boolean;
  colors: Palette;
  shadow: ShadowSet;
}

const LIGHT: Theme = { scheme: 'light', isDark: false, colors: lightColors, shadow: lightShadow };
const DARK: Theme = { scheme: 'dark', isDark: true, colors: darkColors, shadow: darkShadow };

const ThemeContext = createContext<Theme>(LIGHT);

/** Resolve the scheme from the saved preference and the OS setting. */
export const useResolvedScheme = (): Scheme => {
  const mode = useSettingsStore((s) => s.themeMode);
  const system = useColorScheme();
  return mode === 'system' ? (system === 'dark' ? 'dark' : 'light') : mode;
};

/**
 * Provides the active palette. On web the first client render matches the
 * static (light) HTML so hydration lines up, then switches to the real scheme;
 * +html.tsx keeps dark-mode visitors from seeing a light flash meanwhile.
 */
export const ThemeProvider: React.FC<{ children: React.ReactNode; forceScheme?: Scheme }> = ({ children, forceScheme }) => {
  const resolved = useResolvedScheme();
  const settingsReady = useSettingsStore((s) => s.hydrated);
  const [mounted, setMounted] = useState(Platform.OS !== 'web');
  useEffect(() => setMounted(true), []);

  const scheme: Scheme = forceScheme ?? (mounted ? resolved : 'light');
  const theme = scheme === 'dark' ? DARK : LIGHT;

  useEffect(() => {
    if (Platform.OS !== 'web' || typeof document === 'undefined' || forceScheme) return;
    const root = document.documentElement;
    root.dataset.theme = scheme;
    root.style.colorScheme = scheme;
    document.body.style.backgroundColor = theme.colors.bg;
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', theme.isDark ? theme.colors.bg : theme.colors.accent);
    if (mounted && settingsReady) root.dataset.ready = '1';
  }, [scheme, theme, mounted, settingsReady, forceScheme]);

  return <ThemeContext.Provider value={theme}>{children}</ThemeContext.Provider>;
};

export const useTheme = (): Theme => useContext(ThemeContext);

/**
 * Themed `StyleSheet.create`: the factory runs once per scheme and is cached,
 * so components get stable style objects (and on web, stable CSS classes).
 *
 *   const useStyles = makeStyles((t) => ({ card: { backgroundColor: t.colors.surface } }));
 *   const styles = useStyles();
 */
export function makeStyles<T extends StyleSheet.NamedStyles<T> | StyleSheet.NamedStyles<any>>(
  factory: (t: Theme) => T & StyleSheet.NamedStyles<any>
): () => T {
  const cache: Partial<Record<Scheme, T>> = {};
  return function useStyles() {
    const t = useTheme();
    return useMemo(() => (cache[t.scheme] ??= StyleSheet.create(factory(t))), [t]);
  };
}
