import { create } from 'zustand';

export type AccountStatus = 'off' | 'loading' | 'signedOut' | 'signedIn';
export type SyncStatus = 'idle' | 'syncing' | 'error';

/** Account + sync state for the UI. Driven by src/lib/cloud.ts; not persisted
 *  (the Supabase client keeps the session itself). */
interface AccountState {
  status: AccountStatus;
  email: string | null;
  userId: string | null;
  sync: SyncStatus;
  lastSyncedAt: number | null;
  error: string | null;
  set: (p: Partial<Omit<AccountState, 'set'>>) => void;
}

export const useAccountStore = create<AccountState>((set) => ({
  status: 'off',
  email: null,
  userId: null,
  sync: 'idle',
  lastSyncedAt: null,
  error: null,
  set: (p) => set(p),
}));
