import { create } from 'zustand'

export const usePlayerStore = create((set, get) => ({
  // State
  name: '主角',
  color: '#3b82f6',
  avatar: '/artsource/chibis/player.png',

  // 养成属性（心跳回忆式）
  intelligence: 30, // 学力
  athletics: 30,    // 运动
  art: 30,          // 艺术
  charm: 30,        // 魅力
  stamina: 100,     // 体力
  stress: 0,        // 压力
  money: 500,       // 零用钱

  // Getters
  isTired: () => get().stamina <= 0,
  isStressed: () => get().stress >= 80,

  // Actions
  setColor: (color) => set({ color }),

  study: () =>
    set((state) => ({
      intelligence: Math.min(100, state.intelligence + 4),
      stamina: Math.max(0, state.stamina - 12),
      stress: Math.min(100, state.stress + 8),
    })),
  exercise: () =>
    set((state) => ({
      athletics: Math.min(100, state.athletics + 4),
      stamina: Math.max(0, state.stamina - 15),
      stress: Math.min(100, state.stress + 6),
    })),
  practiceArt: () =>
    set((state) => ({
      art: Math.min(100, state.art + 4),
      stamina: Math.max(0, state.stamina - 10),
      stress: Math.min(100, state.stress + 5),
    })),
  rest: () =>
    set((state) => ({
      stamina: Math.min(100, state.stamina + 25),
      stress: Math.max(0, state.stress - 12),
    })),
  socialize: () =>
    set((state) => ({
      charm: Math.min(100, state.charm + 2),
      stamina: Math.max(0, state.stamina - 6),
      stress: Math.max(0, state.stress - 4),
    })),
  buySnack: () =>
    set((state) => {
      if (state.money < 50) return state
      return {
        money: state.money - 50,
        stamina: Math.min(100, state.stamina + 15),
        stress: Math.max(0, state.stress - 5),
      }
    }),
}))
