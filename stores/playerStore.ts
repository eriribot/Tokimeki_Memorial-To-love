import { create } from 'zustand';
import type { PlayerBloodType, PlayerProfile, PlayerRegistrationInput, PlayerState, PlayerStore } from '../types';

export const TOKIMEKI_ATTRIBUTE_MAX = 999;
// Tokimeki Memorial 4 general-university reference lines: third, second, first, and top tier.
export const TOKIMEKI_UNIVERSITY_STAGE_THRESHOLDS = [160, 200, 240, 260] as const;
export const TOKIMEKI_ATTRIBUTE_STAGE_MAX = TOKIMEKI_UNIVERSITY_STAGE_THRESHOLDS.length + 1;
export const PLAYER_RESOURCE_MAX = 100;
export const PLAYER_NAME_PART_MAX_LENGTH = 8;
export const PLAYER_BLOOD_TYPES = ['A', 'B', 'AB', 'O', 'unknown'] as const satisfies readonly PlayerBloodType[];

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
  profile: null,
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

export function normalizePlayerNamePart(value: string): string {
  return value.normalize('NFKC').replace(/\s+/gu, '').trim();
}

function isValidNamePart(value: string): boolean {
  const characters = Array.from(value);
  return (
    characters.length > 0 &&
    characters.length <= PLAYER_NAME_PART_MAX_LENGTH &&
    characters.every(character => {
      const codePoint = character.codePointAt(0) ?? 0;
      return codePoint >= 32 && codePoint !== 127;
    })
  );
}

function getBirthdayDayMaximum(month: number): number {
  if (!Number.isInteger(month) || month < 1 || month > 12) return 0;
  return new Date(2000, month, 0).getDate();
}

export function createPlayerProfile(input: PlayerRegistrationInput): PlayerProfile {
  const familyName = normalizePlayerNamePart(input.familyName);
  const givenName = normalizePlayerNamePart(input.givenName);
  if (!isValidNamePart(familyName) || !isValidNamePart(givenName)) {
    throw new Error(`姓和名都必须填写，且各不超过 ${PLAYER_NAME_PART_MAX_LENGTH} 个字符。`);
  }

  const birthdayMonth = Math.trunc(input.birthdayMonth);
  const birthdayDay = Math.trunc(input.birthdayDay);
  const dayMaximum = getBirthdayDayMaximum(birthdayMonth);
  if (dayMaximum === 0 || birthdayDay < 1 || birthdayDay > dayMaximum) {
    throw new Error('生日日期无效。');
  }
  if (!PLAYER_BLOOD_TYPES.includes(input.bloodType)) {
    throw new Error('血型选项无效。');
  }

  return {
    familyName,
    givenName,
    displayName: `${familyName}${givenName}`,
    birthdayMonth,
    birthdayDay,
    bloodType: input.bloodType,
    registrationCompleted: true,
  };
}

export const usePlayerStore = create<PlayerStore>((set, get) => ({
  ...INITIAL_PLAYER_STATE,

  isTired: () => get().stamina <= 0,
  isStressed: () => get().stress >= PLAYER_RESOURCE_MAX * 0.8,

  setColor: color => set({ color }),
  completeRegistration: profile => {
    if (get().profile !== null) return false;
    set({ name: profile.displayName, profile: { ...profile } });
    return true;
  },
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
