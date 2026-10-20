import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import type { AmbienceKey } from '../lib/sound';
import { MAX_CUSTOM_SKILLS, type IconName, type Skill, type SwatchKey, type TechniqueKey } from '../constants/focus';

export const SETTINGS_KEY = '@flowglass/settings/v4';

export interface CustomConfig {
  workMinutes: number;
  breakMinutes: number;
  longBreakMinutes: number;
  cycles: number; // focus blocks before a long break
}

export interface CustomPreset extends CustomConfig {
  id: string;
  name: string;
}

export type ThemeMode = 'system' | 'light' | 'dark';
/** `unset` = the notice hasn't been answered yet. */
export type AnalyticsConsent = 'unset' | 'granted' | 'denied';

interface Persisted {
  hapticsEnabled: boolean;
  soundEnabled: boolean;
  keepScreenOn: boolean;
  autoStartBreak: boolean;
  dailyGoalMinutes: number;
  isPro: boolean;
  /** When Pro was unlocked (epoch ms) — weekly quests and freezes count from then. */
  proSince: number | null;
  lastTechnique: TechniqueKey;
  /** Active skill key (a built-in category or a custom skill id). */
  lastCategory: string;
  customConfig: CustomConfig;
  customPresets: CustomPreset[];
  themeMode: ThemeMode;
  /** Extra switch on top of the OS "reduce motion" setting. */
  reduceMotion: boolean;
  sandTheme: string;
  /** Pro: renamed built-in skills. */
  skillNames: Record<string, string>;
  /** Pro: user-created skills. */
  customSkills: Skill[];
  analyticsConsent: AnalyticsConsent;
  /** Focus soundscape played while a session runs (web). */
  ambience: AmbienceKey;
}

interface SettingsState extends Persisted {
  hydrated: boolean;
  hydrate: () => Promise<void>;
  toggleHaptics: () => void;
  toggleSound: () => void;
  toggleKeepScreenOn: () => void;
  toggleAutoStartBreak: () => void;
  setDailyGoal: (minutes: number) => void;
  setPro: (v: boolean) => void;
  setTechnique: (t: TechniqueKey) => void;
  setCategory: (c: string) => void;
  setCustomConfig: (patch: Partial<CustomConfig>) => void;
  addCustomPreset: (name: string) => void;
  removeCustomPreset: (id: string) => void;
  loadCustomPreset: (id: string) => void;
  setThemeMode: (m: ThemeMode) => void;
  toggleReduceMotion: () => void;
  setSandTheme: (key: string) => void;
  renameSkill: (key: string, label: string) => void;
  addCustomSkill: (label: string, swatch: SwatchKey, icon: IconName) => string | null;
  archiveCustomSkill: (key: string) => void;
  setAnalyticsConsent: (c: AnalyticsConsent) => void;
  setAmbience: (a: AmbienceKey) => void;
  /** Apply settings from the cloud copy (only the synced keys). */
  applySynced: (p: Record<string, unknown>) => void;
  /** Back to defaults (used by "Delete all my data"). */
  resetAll: () => void;
}

const DEFAULTS: Persisted = {
  hapticsEnabled: true,
  soundEnabled: true,
  keepScreenOn: false,
  autoStartBreak: false,
  dailyGoalMinutes: 120,
  isPro: false,
  proSince: null,
  lastTechnique: 'pomodoro',
  lastCategory: 'study',
  customConfig: { workMinutes: 30, breakMinutes: 5, longBreakMinutes: 15, cycles: 4 },
  customPresets: [],
  themeMode: 'system',
  reduceMotion: false,
  sandTheme: 'classic',
  skillNames: {},
  customSkills: [],
  analyticsConsent: 'unset',
  ambience: 'off',
};

const PERSISTED_KEYS = Object.keys(DEFAULTS) as (keyof Persisted)[];

/** Settings that follow the account across devices. Pro comes from the store
 *  purchase and analytics consent is per device, so neither is synced. */
const LOCAL_ONLY: (keyof Persisted)[] = ['isPro', 'proSince', 'analyticsConsent'];
export const SYNCED_KEYS = PERSISTED_KEYS.filter((k) => !LOCAL_ONLY.includes(k));

export const pickSynced = (state: Partial<Persisted>): Record<string, unknown> => {
  const out: Record<string, unknown> = {};
  for (const k of SYNCED_KEYS) if (state[k] !== undefined) out[k] = state[k];
  return out;
};

const clampMin = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, Math.round(v)));
const cleanLabel = (s: string) => s.replace(/\s+/g, ' ').trim().slice(0, 18);

export const useSettingsStore = create<SettingsState>((set, get) => {
  /** Changes made before hydration (e.g. deep-link params) — merged on top of the saved settings. */
  let pending: Partial<Persisted> = {};

  const persist = () => {
    const state = get();
    const out = {} as Record<keyof Persisted, unknown>;
    for (const k of PERSISTED_KEYS) out[k] = state[k];
    AsyncStorage.setItem(SETTINGS_KEY, JSON.stringify(out)).catch(() => {});
  };
  const patch = (p: Partial<Persisted>) => {
    set(p);
    // Never write before the saved settings are loaded — that would overwrite them with defaults.
    if (!get().hydrated) {
      pending = { ...pending, ...p };
      return;
    }
    persist();
  };

  return {
    ...DEFAULTS,
    hydrated: false,

    hydrate: async () => {
      if (get().hydrated) return; // once per app start (effects can re-run in dev)
      let saved: Partial<Persisted> = {};
      try {
        const raw = await AsyncStorage.getItem(SETTINGS_KEY);
        if (raw) saved = JSON.parse(raw) as Partial<Persisted>;
      } catch {
        /* noop — start from defaults */
      }
      const early = pending;
      pending = {};
      set({ ...DEFAULTS, ...saved, ...early, hydrated: true });
      if (Object.keys(early).length > 0) persist();
    },

    toggleHaptics: () => patch({ hapticsEnabled: !get().hapticsEnabled }),
    toggleSound: () => patch({ soundEnabled: !get().soundEnabled }),
    toggleKeepScreenOn: () => patch({ keepScreenOn: !get().keepScreenOn }),
    toggleAutoStartBreak: () => patch({ autoStartBreak: !get().autoStartBreak }),
    setDailyGoal: (m) => patch({ dailyGoalMinutes: Math.max(15, Math.min(600, Math.round(m))) }),
    setPro: (isPro) => patch({ isPro, proSince: isPro ? (get().proSince ?? Date.now()) : null }),
    setTechnique: (lastTechnique) => patch({ lastTechnique }),
    setCategory: (lastCategory) => patch({ lastCategory }),

    setCustomConfig: (p) => {
      const c = get().customConfig;
      patch({
        customConfig: {
          workMinutes: p.workMinutes !== undefined ? clampMin(p.workMinutes, 1, 180) : c.workMinutes,
          breakMinutes: p.breakMinutes !== undefined ? clampMin(p.breakMinutes, 1, 60) : c.breakMinutes,
          longBreakMinutes: p.longBreakMinutes !== undefined ? clampMin(p.longBreakMinutes, 1, 60) : c.longBreakMinutes,
          cycles: p.cycles !== undefined ? clampMin(p.cycles, 1, 12) : c.cycles,
        },
      });
    },

    addCustomPreset: (name) => {
      const preset: CustomPreset = { id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`, name: name.trim() || 'Preset', ...get().customConfig };
      patch({ customPresets: [preset, ...get().customPresets].slice(0, 12) });
    },

    removeCustomPreset: (id) => patch({ customPresets: get().customPresets.filter((p) => p.id !== id) }),

    loadCustomPreset: (id) => {
      const preset = get().customPresets.find((p) => p.id === id);
      if (preset) patch({ customConfig: { workMinutes: preset.workMinutes, breakMinutes: preset.breakMinutes, longBreakMinutes: preset.longBreakMinutes, cycles: preset.cycles } });
    },

    setThemeMode: (themeMode) => patch({ themeMode }),
    toggleReduceMotion: () => patch({ reduceMotion: !get().reduceMotion }),
    setSandTheme: (sandTheme) => patch({ sandTheme }),

    renameSkill: (key, label) => {
      const name = cleanLabel(label);
      const custom = get().customSkills;
      if (custom.some((s) => s.key === key)) {
        if (name) patch({ customSkills: custom.map((s) => (s.key === key ? { ...s, label: name } : s)) });
        return;
      }
      const skillNames = { ...get().skillNames };
      if (name) skillNames[key] = name;
      else delete skillNames[key]; // empty → back to the default name
      patch({ skillNames });
    },

    addCustomSkill: (label, swatch, icon) => {
      const name = cleanLabel(label);
      const active = get().customSkills.filter((s) => !s.archived);
      if (!name || active.length >= MAX_CUSTOM_SKILLS) return null;
      const key = `skill-${Date.now().toString(36)}`;
      patch({ customSkills: [...get().customSkills, { key, label: name, swatch, icon, builtIn: false }] });
      return key;
    },

    archiveCustomSkill: (key) => {
      patch({
        customSkills: get().customSkills.map((s) => (s.key === key ? { ...s, archived: true } : s)),
        lastCategory: get().lastCategory === key ? 'study' : get().lastCategory,
      });
    },

    setAnalyticsConsent: (analyticsConsent) => patch({ analyticsConsent }),
    setAmbience: (ambience) => patch({ ambience }),

    applySynced: (p) => {
      const clean: Partial<Persisted> = {};
      for (const k of SYNCED_KEYS) {
        // Only take values of the type we expect — the cloud copy is still user data.
        if (p[k] !== undefined && typeof p[k] === typeof DEFAULTS[k]) (clean as Record<string, unknown>)[k] = p[k];
      }
      patch(clean);
    },

    resetAll: () => patch({ ...DEFAULTS }),
  };
});
