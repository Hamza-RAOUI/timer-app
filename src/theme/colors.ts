/**
 * Flowglass palettes — indigo / slate by day, deep navy-indigo by night.
 * Text tokens meet WCAG AA (≥ 4.5:1) on every surface they're used on.
 * Components read the active palette through `useTheme()` (theme/ThemeProvider).
 */
import { Platform } from 'react-native';
import type { SwatchKey } from '../constants/focus';

export type Scheme = 'light' | 'dark';

export interface SwatchColors {
  /** Bars, dots, crests. */
  fill: string;
  /** Text in the skill's color — readable on surfaces. */
  text: string;
  /** Tinted background. */
  soft: string;
  border: string;
  /** Icon/text drawn on top of `fill`. */
  onFill: string;
}

export interface Palette {
  scheme: Scheme;
  // Surfaces
  bg: string;
  bgDeep: string;
  surface: string;
  surfaceAlt: string;
  surfaceRaised: string;
  sidebar: string;
  border: string;
  borderStrong: string;
  // Accent — indigo (fill takes white text; accentText is for text on surfaces)
  accent: string;
  accentHover: string;
  accentText: string;
  accentSoft: string;
  accentSoftBorder: string;
  // Game highlights
  highlight: string;
  highlightText: string;
  highlightSoft: string;
  gold: string;
  goldText: string;
  goldSoft: string;
  text: { primary: string; secondary: string; tertiary: string; inverse: string; onAccent: string };
  // Semantic
  danger: string;
  dangerText: string;
  dangerSoft: string;
  dangerBorder: string;
  success: string;
  successText: string;
  successSoft: string;
  // Misc
  barIdle: string;
  barActive: string;
  overlay: string;
  /** Oversized background words. */
  ghost: string;
  /** Diagonal stripe texture. */
  stripe: string;
  focusRing: string;
  glow: string;
  switchTrackOff: string;
  swatch: Record<SwatchKey, SwatchColors>;
  /** Back-compat: fixed category fills. */
  category: { study: string; work: string; hobby: string; personal: string };
}

const swatch = (fill: string, lightText: string, darkText: string, onFill: string) => ({
  light: { fill, text: lightText, soft: `${fill}1A`, border: `${fill}4D`, onFill },
  dark: { fill, text: darkText, soft: `${fill}29`, border: `${fill}59`, onFill },
});

const SWATCHES = {
  indigo: swatch('#6366F1', '#4338CA', '#A5B4FC', '#FFFFFF'),
  sky: swatch('#0EA5E9', '#0369A1', '#7DD3FC', '#04263A'),
  emerald: swatch('#10B981', '#047857', '#6EE7B7', '#022C22'),
  amber: swatch('#F59E0B', '#B45309', '#FCD34D', '#3B2300'),
  rose: swatch('#F43F5E', '#BE123C', '#FDA4AF', '#FFFFFF'),
  violet: swatch('#8B5CF6', '#6D28D9', '#C4B5FD', '#FFFFFF'),
  teal: swatch('#14B8A6', '#0F766E', '#5EEAD4', '#042F2E'),
  orange: swatch('#F97316', '#C2410C', '#FDBA74', '#431407'),
};

const pick = (scheme: Scheme) =>
  Object.fromEntries(Object.entries(SWATCHES).map(([k, v]) => [k, v[scheme]])) as Record<SwatchKey, SwatchColors>;

export const lightColors: Palette = {
  scheme: 'light',
  bg: '#F4F6FB',
  bgDeep: '#E9EDF7',
  surface: '#FFFFFF',
  surfaceAlt: '#F8FAFC',
  surfaceRaised: '#FFFFFF',
  sidebar: '#FFFFFF',
  border: '#E3E7F0',
  borderStrong: '#CDD3E1',

  accent: '#4F46E5',
  accentHover: '#4338CA',
  accentText: '#4F46E5',
  accentSoft: '#EEF0FF',
  accentSoftBorder: '#C9CEF8',

  highlight: '#DB2777',
  highlightText: '#BE185D',
  highlightSoft: '#FDF2F8',
  gold: '#F59E0B',
  goldText: '#B45309',
  goldSoft: '#FEF3C7',

  text: { primary: '#0F172A', secondary: '#475569', tertiary: '#5E6A80', inverse: '#FFFFFF', onAccent: '#FFFFFF' },

  danger: '#DC2626',
  dangerText: '#B91C1C',
  dangerSoft: '#FEF2F2',
  dangerBorder: '#F3C6C6',
  success: '#10B981',
  successText: '#047857',
  successSoft: '#ECFDF5',

  barIdle: '#E6EAF3',
  barActive: '#4F46E5',
  overlay: 'rgba(15,23,42,0.45)',
  ghost: 'rgba(79,70,229,0.07)',
  stripe: 'rgba(79,70,229,0.07)',
  focusRing: '#4F46E5',
  glow: 'rgba(79,70,229,0.22)',
  switchTrackOff: '#CBD2E0',
  swatch: { ...pick('light'), indigo: { ...SWATCHES.indigo.light, fill: '#4F46E5' } },
  category: { study: '#4F46E5', work: '#0EA5E9', hobby: '#10B981', personal: '#F59E0B' },
};

export const darkColors: Palette = {
  scheme: 'dark',
  bg: '#070A18',
  bgDeep: '#04060F',
  surface: '#0E1330',
  surfaceAlt: '#121939',
  surfaceRaised: '#161E44',
  sidebar: '#0A0E22',
  border: '#1E2750',
  borderStrong: '#2C3768',

  accent: '#5850EC',
  accentHover: '#4F46E5',
  accentText: '#A5B4FC',
  accentSoft: '#1A1F4A',
  accentSoftBorder: '#343C86',

  highlight: '#F472B6',
  highlightText: '#F9A8D4',
  highlightSoft: '#2A1433',
  gold: '#FBBF24',
  goldText: '#FCD34D',
  goldSoft: '#2A2210',

  text: { primary: '#EEF1FF', secondary: '#B4BCDF', tertiary: '#9AA3CE', inverse: '#070A18', onAccent: '#FFFFFF' },

  danger: '#F87171',
  dangerText: '#FCA5A5',
  dangerSoft: '#2A1220',
  dangerBorder: '#5B2333',
  success: '#34D399',
  successText: '#6EE7B7',
  successSoft: '#0D2A22',

  barIdle: '#1C2448',
  barActive: '#818CF8',
  overlay: 'rgba(2,4,12,0.72)',
  ghost: 'rgba(165,180,252,0.06)',
  stripe: 'rgba(165,180,252,0.06)',
  focusRing: '#A5B4FC',
  glow: 'rgba(99,102,241,0.38)',
  switchTrackOff: '#2C3768',
  swatch: pick('dark'),
  category: { study: '#6366F1', work: '#0EA5E9', hobby: '#10B981', personal: '#F59E0B' },
};

/** Back-compat: static light palette for code that can't use the theme hook. */
export const colors = lightColors;

export type CategoryColorKey = keyof Palette['category'];

export type ShadowSet = Record<'sm' | 'md' | 'lg', object>;

// Web uses `boxShadow` (RN-Web deprecated shadow* props); native keeps shadow*/elevation.
const makeShadow = (rgb: string, a: [number, number, number]): ShadowSet => ({
  sm: Platform.select({
    web: { boxShadow: `0 2px 8px rgba(${rgb},${a[0]})` },
    default: { shadowColor: `rgb(${rgb})`, shadowOffset: { width: 0, height: 2 }, shadowOpacity: a[0], shadowRadius: 8, elevation: 2 },
  })!,
  md: Platform.select({
    web: { boxShadow: `0 8px 20px rgba(${rgb},${a[1]})` },
    default: { shadowColor: `rgb(${rgb})`, shadowOffset: { width: 0, height: 8 }, shadowOpacity: a[1], shadowRadius: 20, elevation: 6 },
  })!,
  lg: Platform.select({
    web: { boxShadow: `0 16px 32px rgba(${rgb},${a[2]})` },
    default: { shadowColor: `rgb(${rgb})`, shadowOffset: { width: 0, height: 16 }, shadowOpacity: a[2], shadowRadius: 32, elevation: 12 },
  })!,
});

export const lightShadow = makeShadow('30,41,59', [0.06, 0.08, 0.1]);
export const darkShadow = makeShadow('0,0,0', [0.35, 0.45, 0.55]);

/** Back-compat: light shadows. */
export const shadow = lightShadow;

// Back-compat alias (a few utility files may import `palette`).
export const palette = {
  background: colors.bg,
  surface: colors.surface,
  glassBorder: colors.border,
  textPrimary: colors.text.primary,
  textSecondary: colors.text.secondary,
  textMuted: colors.text.tertiary,
  shadow: '#1E293B',
} as const;
