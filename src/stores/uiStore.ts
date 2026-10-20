import { create } from 'zustand';
import { dayKey } from '../lib/rpg';

export type AppView = 'timer' | 'character' | 'stats' | 'settings';
export const APP_VIEWS: AppView[] = ['timer', 'character', 'stats', 'settings'];

/** Where a Pro prompt was opened from (sent with `pro_interest_clicked`). */
export type ProSource = 'character' | 'stats' | 'settings' | 'skills' | 'themes' | 'quests' | 'streak' | 'sidebar' | 'sounds';

interface UiState {
  view: AppView;
  drawerOpen: boolean;
  /** Wide (web/tablet) sidebar collapsed. */
  sidebarCollapsed: boolean;
  /** Set when a deep link / widget asks to auto-start a session. */
  pendingStart: boolean;
  /** Pro sheet (purchase on native, "Founding Pro" fake door on web). */
  proSheet: ProSource | null;
  /** Local calendar day — ticks over at midnight so daily quests/streaks refresh. */
  today: string;
  /** Dev-only time multiplier for testing timers (1 in production). */
  devSpeed: number;

  setView: (v: AppView) => void;
  openDrawer: () => void;
  closeDrawer: () => void;
  toggleDrawer: () => void;
  toggleSidebar: () => void;
  requestStart: () => void;
  consumeStart: () => boolean;
  openPro: (source: ProSource) => void;
  closePro: () => void;
  refreshToday: () => void;
  setDevSpeed: (n: number) => void;
}

export const useUiStore = create<UiState>((set, get) => ({
  view: 'timer',
  drawerOpen: false,
  sidebarCollapsed: false,
  pendingStart: false,
  proSheet: null,
  today: dayKey(Date.now()),
  devSpeed: 1,

  setView: (view) => set({ view, drawerOpen: false }),
  openDrawer: () => set({ drawerOpen: true }),
  closeDrawer: () => set({ drawerOpen: false }),
  toggleDrawer: () => set({ drawerOpen: !get().drawerOpen }),
  toggleSidebar: () => set({ sidebarCollapsed: !get().sidebarCollapsed }),
  requestStart: () => set({ pendingStart: true }),
  consumeStart: () => {
    const v = get().pendingStart;
    if (v) set({ pendingStart: false });
    return v;
  },
  openPro: (proSheet) => set({ proSheet, drawerOpen: false }),
  closePro: () => set({ proSheet: null }),
  refreshToday: () => {
    const today = dayKey(Date.now());
    if (today !== get().today) set({ today });
  },
  setDevSpeed: (devSpeed) => set({ devSpeed: __DEV__ ? Math.max(1, devSpeed) : 1 }),
}));
