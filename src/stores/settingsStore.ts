import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import type { CategoryKey, TechniqueKey } from '../constants/focus';

const STORAGE_KEY = '@flowglass/settings/v4';

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

interface Persisted {
  hapticsEnabled: boolean;
  soundEnabled: boolean;
  keepScreenOn: boolean;
  autoStartBreak: boolean;
  dailyGoalMinutes: number;
  isPro: boolean;
  lastTechnique: TechniqueKey;
  lastCategory: CategoryKey;
  customConfig: CustomConfig;
  customPresets: CustomPreset[];
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
  setCategory: (c: CategoryKey) => void;
  setCustomConfig: (patch: Partial<CustomConfig>) => void;
  addCustomPreset: (name: string) => void;
  removeCustomPreset: (id: string) => void;
  loadCustomPreset: (id: string) => void;
}

const DEFAULTS: Persisted = {
  hapticsEnabled: true,
  soundEnabled: true,
  keepScreenOn: false,
  autoStartBreak: false,
  dailyGoalMinutes: 120,
  isPro: false,
  lastTechnique: 'pomodoro',
  lastCategory: 'study',
  customConfig: { workMinutes: 30, breakMinutes: 5, longBreakMinutes: 15, cycles: 4 },
  customPresets: [],
};

const clampMin = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, Math.round(v)));

export const useSettingsStore = create<SettingsState>((set, get) => {
  const persist = () => {
    const { hapticsEnabled, soundEnabled, keepScreenOn, autoStartBreak, dailyGoalMinutes, isPro, lastTechnique, lastCategory, customConfig, customPresets } = get();
    AsyncStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ hapticsEnabled, soundEnabled, keepScreenOn, autoStartBreak, dailyGoalMinutes, isPro, lastTechnique, lastCategory, customConfig, customPresets } satisfies Persisted)
    ).catch(() => {});
  };
  const patch = (p: Partial<Persisted>) => {
    set(p);
    persist();
  };

  return {
    ...DEFAULTS,
    hydrated: false,

    hydrate: async () => {
      try {
        const raw = await AsyncStorage.getItem(STORAGE_KEY);
        if (raw) {
          set({ ...DEFAULTS, ...(JSON.parse(raw) as Partial<Persisted>), hydrated: true });
          return;
        }
      } catch {
        /* noop */
      }
      set({ hydrated: true });
    },

    toggleHaptics: () => patch({ hapticsEnabled: !get().hapticsEnabled }),
    toggleSound: () => patch({ soundEnabled: !get().soundEnabled }),
    toggleKeepScreenOn: () => patch({ keepScreenOn: !get().keepScreenOn }),
    toggleAutoStartBreak: () => patch({ autoStartBreak: !get().autoStartBreak }),
    setDailyGoal: (m) => patch({ dailyGoalMinutes: Math.max(15, Math.min(600, Math.round(m))) }),
    setPro: (isPro) => patch({ isPro }),
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
  };
});
