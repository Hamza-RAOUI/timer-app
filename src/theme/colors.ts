/**
 * Cadence — Light theme (indigo / slate)
 * Clean, calm, all-ages. White surfaces, soft indigo accent, slate text.
 */

export const colors = {
  // Surfaces
  bg: '#F4F6FB', // cool off-white app background
  surface: '#FFFFFF', // cards
  surfaceAlt: '#F8FAFC',
  sidebar: '#FFFFFF',
  border: '#E7EAF2',
  borderStrong: '#D6DBE7',

  // Accent — indigo
  accent: '#4F46E5',
  accentHover: '#4338CA',
  accentSoft: '#EEF0FF',
  accentSoftBorder: '#C9CEF8',

  // Text — slate
  text: {
    primary: '#0F172A',
    secondary: '#52607A',
    tertiary: '#94A3B8',
    inverse: '#FFFFFF',
  },

  // Fixed categories
  category: {
    study: '#4F46E5', // indigo
    work: '#0EA5E9', // sky
    hobby: '#10B981', // emerald
    personal: '#F59E0B', // amber
  },

  // Semantic
  danger: '#EF4444',
  success: '#10B981',

  // Chart
  barActive: '#4F46E5',
  barIdle: '#E8ECF4',
} as const;

export type CategoryColorKey = keyof typeof colors.category;

// Soft shadow presets (light theme cards).
export const shadow = {
  sm: {
    shadowColor: '#1E293B',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  md: {
    shadowColor: '#1E293B',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.08,
    shadowRadius: 20,
    elevation: 6,
  },
  lg: {
    shadowColor: '#1E293B',
    shadowOffset: { width: 0, height: 16 },
    shadowOpacity: 0.1,
    shadowRadius: 32,
    elevation: 12,
  },
} as const;

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
