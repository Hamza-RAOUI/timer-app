/**
 * Theme System — Central Export
 */

export * from './colors';
export * from './radius';
export * from './shadows';
export * from './spacing';
export * from './typography';

import { colors } from './colors';
import { radius } from './radius';
import { shadows } from './shadows';
import { spacing } from './spacing';
import { typography } from './typography';

export const theme = {
  colors,
  spacing,
  radius,
  shadows,
  typography,
} as const;
