import { Ionicons } from '@expo/vector-icons';

export type IconName = keyof typeof Ionicons.glyphMap;

// ───────────────── Color swatches (resolved per theme in theme/colors) ─────────────────
export type SwatchKey = 'indigo' | 'sky' | 'emerald' | 'amber' | 'rose' | 'violet' | 'teal' | 'orange';
export const SWATCH_KEYS: SwatchKey[] = ['indigo', 'sky', 'emerald', 'amber', 'rose', 'violet', 'teal', 'orange'];

// ───────────────── Skills (the category pills) ─────────────────
// Each category is an RPG skill with its own level. The four built-ins can be
// renamed and new ones added on Pro; sessions store the skill `key`.
export type CategoryKey = 'study' | 'work' | 'hobby' | 'personal';

export interface Skill {
  key: string;
  label: string;
  swatch: SwatchKey;
  icon: IconName;
  builtIn: boolean;
  /** Custom skills can be retired: hidden from the picker, history kept. */
  archived?: boolean;
}

/** Back-compat name: categories *are* skills. */
export type Category = Skill;

export const CATEGORIES: Skill[] = [
  { key: 'study', label: 'Study', swatch: 'indigo', icon: 'book', builtIn: true },
  { key: 'work', label: 'Work', swatch: 'sky', icon: 'briefcase', builtIn: true },
  { key: 'hobby', label: 'Hobby', swatch: 'emerald', icon: 'color-palette', builtIn: true },
  { key: 'personal', label: 'Personal', swatch: 'amber', icon: 'heart', builtIn: true },
];

export const BUILT_IN_SKILL_KEYS = CATEGORIES.map((c) => c.key);

/** Icons offered when creating a custom skill. */
export const SKILL_ICONS: IconName[] = [
  'barbell',
  'code-slash',
  'musical-notes',
  'language',
  'leaf',
  'flask',
  'brush',
  'game-controller',
  'camera',
  'pencil',
  'globe',
  'rocket',
];

export const MAX_CUSTOM_SKILLS = 6;

export const categoryByKey = (key: string): Skill => CATEGORIES.find((c) => c.key === key) ?? CATEGORIES[0];

/** Find a skill in a resolved list; unknown keys (e.g. an archived custom skill) get a neutral stand-in. */
export const skillFrom = (skills: Skill[], key: string): Skill =>
  skills.find((s) => s.key === key) ?? { key, label: 'Archived skill', swatch: 'violet', icon: 'archive', builtIn: false, archived: true };

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

export const techniqueByKey = (key: TechniqueKey): Technique => TECHNIQUES.find((t) => t.key === key) ?? TECHNIQUES[0];

// ───────────────── Hourglass sand themes (cosmetic) ─────────────────
// Free players unlock them by level; Pro unlocks all of them.
export interface SandTheme {
  key: string;
  label: string;
  /** Sand gradient, top → bottom. */
  colors: [string, string];
  unlockLevel: number;
}

export const SAND_THEMES: SandTheme[] = [
  { key: 'classic', label: 'Indigo', colors: ['#818CF8', '#4F46E5'], unlockLevel: 1 },
  { key: 'desert', label: 'Desert', colors: ['#FCD34D', '#F59E0B'], unlockLevel: 3 },
  { key: 'rose', label: 'Rose', colors: ['#F9A8D4', '#DB2777'], unlockLevel: 5 },
  { key: 'aurora', label: 'Aurora', colors: ['#5EEAD4', '#7C3AED'], unlockLevel: 8 },
  { key: 'ember', label: 'Ember', colors: ['#FDBA74', '#DC2626'], unlockLevel: 12 },
  { key: 'tide', label: 'Tide', colors: ['#7DD3FC', '#0369A1'], unlockLevel: 16 },
  { key: 'starlight', label: 'Starlight', colors: ['#FEF3C7', '#EAB308'], unlockLevel: 20 },
  { key: 'nebula', label: 'Nebula', colors: ['#F0ABFC', '#7E22CE'], unlockLevel: 30 },
];

export const sandThemeByKey = (key: string): SandTheme => SAND_THEMES.find((s) => s.key === key) ?? SAND_THEMES[0];
