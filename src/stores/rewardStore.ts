import { create } from 'zustand';
import type { FamilyKey, Reward, Stage } from '../lib/rpg';

export interface Toast {
  id: string;
  kind: 'skill' | 'quest' | 'info';
  title: string;
  body?: string;
  /** Skill swatch key (skill toasts). */
  swatch?: string;
  icon?: string;
}

/** A creature that just reached a new stage — drives the evolution reveal. */
export interface EvolutionReveal {
  id: string;
  skillLabel: string;
  family: FamilyKey;
  from: Stage;
  to: Stage;
  fromName: string;
  toName: string;
  quip: string;
}

interface RewardState {
  /** Latest session reward — drives the XP panel on the timer. */
  current: Reward | null;
  /** Bumps on every new reward so the panel replays its animation. */
  seq: number;
  /** Wall-clock time the XP panel should start animating (after the hourglass flip). */
  revealAt: number;
  /** A player level-up waiting for the celebration modal. */
  levelUp: Reward | null;
  toasts: Toast[];
  evolution: EvolutionReveal | null;

  present: (r: Reward, delayMs: number) => void;
  clearCurrent: () => void;
  showLevelUp: (r: Reward) => void;
  dismissLevelUp: () => void;
  showEvolution: (e: EvolutionReveal) => void;
  dismissEvolution: () => void;
  pushToast: (t: Omit<Toast, 'id'>) => void;
  dropToast: (id: string) => void;
  clearAll: () => void;
}

export const useRewardStore = create<RewardState>((set, get) => ({
  current: null,
  seq: 0,
  revealAt: 0,
  levelUp: null,
  toasts: [],
  evolution: null,

  present: (current, delayMs) => set({ current, seq: get().seq + 1, revealAt: Date.now() + delayMs }),
  clearCurrent: () => set({ current: null }),
  showLevelUp: (levelUp) => set({ levelUp }),
  dismissLevelUp: () => set({ levelUp: null }),
  showEvolution: (evolution) => set({ evolution }),
  dismissEvolution: () => set({ evolution: null }),
  pushToast: (t) => {
    const toast: Toast = { ...t, id: `${Date.now()}-${Math.random().toString(36).slice(2, 6)}` };
    set({ toasts: [...get().toasts, toast].slice(-3) });
  },
  dropToast: (id) => set({ toasts: get().toasts.filter((t) => t.id !== id) }),
  clearAll: () => set({ current: null, levelUp: null, toasts: [], evolution: null }),
}));
