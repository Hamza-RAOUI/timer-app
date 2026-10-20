import { Platform, type TextStyle } from 'react-native';

/**
 * Typography — Inter everywhere. Digits use tabular figures so they don't jiggle.
 * `display` (Inter Black) is the game-style face: uppercase, tight, often skewed.
 */

export const typography = {
  fontRegular: 'Inter_400Regular',
  fontMedium: 'Inter_500Medium',
  fontSemiBold: 'Inter_600SemiBold',
  fontBold: 'Inter_700Bold',
  fontExtraBold: 'Inter_800ExtraBold',
  fontBlack: 'Inter_900Black',

  size: {
    xs: 11,
    sm: 13,
    base: 15,
    md: 17,
    lg: 20,
    xl: 24,
    xxl: 32,
    hero: 72,
  },
} as const;

// On web, fall back to a system sans-serif while Inter loads (instead of the browser's serif default).
const face = (name: string) => (Platform.OS === 'web' ? `${name}, system-ui, -apple-system, "Segoe UI", Roboto, Helvetica, Arial, sans-serif` : name);

export const fonts = {
  heading: face('Inter_700Bold'),
  headingBold: face('Inter_800ExtraBold'),
  display: face('Inter_900Black'),
  body: face('Inter_400Regular'),
  medium: face('Inter_500Medium'),
  semibold: face('Inter_600SemiBold'),
  digits: face('Inter_700Bold'),
} as const;

// Apply to any <Text> showing numbers for steady-width figures.
export const tabular = { fontVariant: ['tabular-nums' as const] };

/** Slant used by game-style labels and panels (text inside counter-skews). */
export const SLANT = '-12deg';
export const UNSLANT = '12deg';

/** Crisp offset text shadow (no blur) — the "game title" look. Web uses CSS `text-shadow`. */
export const hardTextShadow = (color: string, offset = 3): TextStyle =>
  Platform.OS === 'web'
    ? ({ textShadow: `${offset}px ${offset}px 0 ${color}` } as unknown as TextStyle)
    : { textShadowColor: color, textShadowOffset: { width: offset, height: offset }, textShadowRadius: 0.01 };
