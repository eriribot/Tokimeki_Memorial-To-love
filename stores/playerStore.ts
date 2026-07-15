import { create } from 'zustand';
import type { PlayerState, PlayerStore } from '../types';

export const INITIAL_PLAYER_STATE: PlayerState = {
  name: '主角',
  color: '#3b82f6',
  avatar: '/artsource/chibis/player.png',
  intelligence: 30,
  athletics: 30,
  art: 30,
  charm: 30,
  stamina: 100,
  stress: 0,
  money: 500,
};

export const usePlayerStore = create<PlayerStore>((set, get) => ({
  ...INITIAL_PLAYER_STATE,

  isTired: () => get().stamina <= 0,
  isStressed: () => get().stress >= 80,

  setColor: color => set({ color }),
  resetPlayer: () => set(INITIAL_PLAYER_STATE),

  study: () =>
    set(state => ({
      intelligence: Math.min(100, state.intelligence + 4),
      stamina: Math.max(0, state.stamina - 12),
      stress: Math.min(100, state.stress + 8),
    })),
  exercise: () =>
    set(state => ({
      athletics: Math.min(100, state.athletics + 4),
      stamina: Math.max(0, state.stamina - 15),
      stress: Math.min(100, state.stress + 6),
    })),
  practiceArt: () =>
    set(state => ({
      art: Math.min(100, state.art + 4),
      stamina: Math.max(0, state.stamina - 10),
      stress: Math.min(100, state.stress + 5),
    })),
  rest: () =>
    set(state => ({
      stamina: Math.min(100, state.stamina + 25),
      stress: Math.max(0, state.stress - 12),
    })),
  socialize: () =>
    set(state => ({
      charm: Math.min(100, state.charm + 2),
      stamina: Math.max(0, state.stamina - 6),
      stress: Math.max(0, state.stress - 4),
    })),
  buySnack: () =>
    set(state => {
      if (state.money < 50) return {};
      return {
        money: state.money - 50,
        stamina: Math.min(100, state.stamina + 15),
        stress: Math.max(0, state.stress - 5),
      };
    }),
}));
