/**
 * Typography — Inter everywhere. Digits use tabular figures so they don't jiggle.
 */

export const typography = {
  fontRegular: 'Inter_400Regular',
  fontMedium: 'Inter_500Medium',
  fontSemiBold: 'Inter_600SemiBold',
  fontBold: 'Inter_700Bold',
  fontExtraBold: 'Inter_800ExtraBold',

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

export const fonts = {
  heading: 'Inter_700Bold',
  headingBold: 'Inter_800ExtraBold',
  body: 'Inter_400Regular',
  medium: 'Inter_500Medium',
  semibold: 'Inter_600SemiBold',
  digits: 'Inter_700Bold',
} as const;

// Apply to any <Text> showing numbers for steady-width figures.
export const tabular = { fontVariant: ['tabular-nums' as const] };
