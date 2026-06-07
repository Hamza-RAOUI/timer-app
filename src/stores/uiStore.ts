import { create } from 'zustand';

export type AppView = 'timer' | 'stats' | 'settings';

interface UiState {
  view: AppView;
  drawerOpen: boolean;
  /** Set when a deep link / widget asks to auto-start a session. */
  pendingStart: boolean;

  setView: (v: AppView) => void;
  openDrawer: () => void;
  closeDrawer: () => void;
  toggleDrawer: () => void;
  requestStart: () => void;
  consumeStart: () => boolean;
}

export const useUiStore = create<UiState>((set, get) => ({
  view: 'timer',
  drawerOpen: false,
  pendingStart: false,

  setView: (view) => set({ view, drawerOpen: false }),
  openDrawer: () => set({ drawerOpen: true }),
  closeDrawer: () => set({ drawerOpen: false }),
  toggleDrawer: () => set({ drawerOpen: !get().drawerOpen }),
  requestStart: () => set({ pendingStart: true }),
  consumeStart: () => {
    const v = get().pendingStart;
    if (v) set({ pendingStart: false });
    return v;
  },
}));
