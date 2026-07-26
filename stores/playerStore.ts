import { create } from 'zustand';
import type { PlayerState, PlayerStore } from '../types';

export const TOKIMEKI_ATTRIBUTE_MAX = 999;
// Tokimeki Memorial 4 general-university reference lines: third, second, first, and top tier.
export const TOKIMEKI_UNIVERSITY_STAGE_THRESHOLDS = [160, 200, 240, 260] as const;
export const TOKIMEKI_ATTRIBUTE_STAGE_MAX = TOKIMEKI_UNIVERSITY_STAGE_THRESHOLDS.length + 1;
export const PLAYER_RESOURCE_MAX = 100;

export interface TokimekiRadarAttributes {
  humanities: number;
  science: number;
  art: number;
  athletics: number;
  appearance: number;
  perseverance: number;
}

export function clampPlayerAttribute(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.min(TOKIMEKI_ATTRIBUTE_MAX, Math.max(0, Math.round(value)));
}

export function clampPlayerResource(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.min(PLAYER_RESOURCE_MAX, Math.max(0, Math.round(value)));
}

export function resolveTokimekiAttributeStage(value: number): number {
  const normalized = clampPlayerAttribute(value);
  return TOKIMEKI_UNIVERSITY_STAGE_THRESHOLDS.reduce(
    (stage, threshold) => stage + (normalized >= threshold ? 1 : 0),
    1,
  );
}

export function resolveTokimekiRadarAttributes(
  player: Pick<PlayerState, 'intelligence' | 'athletics' | 'art' | 'charm'>,
): TokimekiRadarAttributes {
  const intelligence = clampPlayerAttribute(player.intelligence);
  const athletics = clampPlayerAttribute(player.athletics);
  return {
    humanities: intelligence,
    science: intelligence,
    art: clampPlayerAttribute(player.art),
    athletics,
    appearance: clampPlayerAttribute(player.charm),
    perseverance: athletics,
  };
}

export const INITIAL_PLAYER_STATE: PlayerState = {
  name: '主角',
  color: '#3b82f6',
  avatar: '/artsource/chibis/player.png',
  intelligence: 30,
  athletics: 30,
  art: 30,
  charm: 30,
  stamina: PLAYER_RESOURCE_MAX,
  stress: 0,
  money: 500,
};

export const usePlayerStore = create<PlayerStore>((set, get) => ({
  ...INITIAL_PLAYER_STATE,

  isTired: () => get().stamina <= 0,
  isStressed: () => get().stress >= PLAYER_RESOURCE_MAX * 0.8,

  setColor: color => set({ color }),
  resetPlayer: () => set(INITIAL_PLAYER_STATE),

  study: () =>
    set(state => ({
      intelligence: clampPlayerAttribute(state.intelligence + 4),
      stamina: clampPlayerResource(state.stamina - 12),
      stress: clampPlayerResource(state.stress + 8),
    })),
  exercise: () =>
    set(state => ({
      athletics: clampPlayerAttribute(state.athletics + 4),
      stamina: clampPlayerResource(state.stamina - 15),
      stress: clampPlayerResource(state.stress + 6),
    })),
  practiceArt: () =>
    set(state => ({
      art: clampPlayerAttribute(state.art + 4),
      stamina: clampPlayerResource(state.stamina - 10),
      stress: clampPlayerResource(state.stress + 5),
    })),
  rest: () =>
    set(state => ({
      stamina: clampPlayerResource(state.stamina + 25),
      stress: clampPlayerResource(state.stress - 12),
    })),
  socialize: () =>
    set(state => ({
      charm: clampPlayerAttribute(state.charm + 2),
      stamina: clampPlayerResource(state.stamina - 6),
      stress: clampPlayerResource(state.stress - 4),
    })),
  buySnack: () =>
    set(state => {
      if (state.money < 50) return {};
      return {
        money: state.money - 50,
        stamina: clampPlayerResource(state.stamina + 15),
        stress: clampPlayerResource(state.stress - 5),
      };
    }),
}));
