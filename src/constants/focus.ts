import { Ionicons } from '@expo/vector-icons';
import { colors } from '../theme/colors';

type IconName = keyof typeof Ionicons.glyphMap;

// ───────────────── Fixed categories ─────────────────
export type CategoryKey = 'study' | 'work' | 'hobby' | 'personal';

export interface Category {
  key: CategoryKey;
  label: string;
  color: string;
  icon: IconName;
}

export const CATEGORIES: Category[] = [
  { key: 'study', label: 'Study', color: colors.category.study, icon: 'book-outline' },
  { key: 'work', label: 'Work', color: colors.category.work, icon: 'briefcase-outline' },
  { key: 'hobby', label: 'Hobby', color: colors.category.hobby, icon: 'color-palette-outline' },
  { key: 'personal', label: 'Personal', color: colors.category.personal, icon: 'heart-outline' },
];

export const categoryByKey = (key: CategoryKey): Category =>
  CATEGORIES.find((c) => c.key === key) ?? CATEGORIES[0];

// ───────────────── Techniques ─────────────────
export type TechniqueKind = 'countdown' | 'flow' | 'stopwatch';
export type TechniqueKey = 'pomodoro' | 'fiftytwo' | 'custom' | 'flowtime' | 'stopwatch';

export interface Technique {
  key: TechniqueKey;
  label: string;
  sub: string;
  kind: TechniqueKind;
  /** countdown techniques */
  focusMin?: number;
  breakMin?: number;
  longBreakMin?: number;
  cycles?: number;
  adjustable?: boolean; // custom only — user can change focus length
}

export const TECHNIQUES: Technique[] = [
  { key: 'pomodoro', label: 'Pomodoro', sub: '25 · 5 min', kind: 'countdown', focusMin: 25, breakMin: 5, longBreakMin: 15, cycles: 4 },
  { key: 'fiftytwo', label: '52 / 17', sub: '52 · 17 min', kind: 'countdown', focusMin: 52, breakMin: 17, longBreakMin: 17, cycles: 4 },
  { key: 'custom', label: 'Custom', sub: 'Your own length', kind: 'countdown', focusMin: 30, breakMin: 5, longBreakMin: 15, cycles: 4, adjustable: true },
  { key: 'flowtime', label: 'Flowtime', sub: 'Count up · break = ⅕', kind: 'flow' },
  { key: 'stopwatch', label: 'Stopwatch', sub: 'Open-ended', kind: 'stopwatch' },
];

export const techniqueByKey = (key: TechniqueKey): Technique =>
  TECHNIQUES.find((t) => t.key === key) ?? TECHNIQUES[0];
