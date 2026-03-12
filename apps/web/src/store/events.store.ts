import { create } from 'zustand';

interface EventsState {
  depositVersion: number;
  notifyDeposit: () => void;
}

export const useEventsStore = create<EventsState>()((set) => ({
  depositVersion: 0,
  notifyDeposit: () => set((s) => ({ depositVersion: s.depositVersion + 1 })),
}));
