import type { LalaExpression } from '../storyTypes';

interface PortraitRegion {
  x: number;
  y: number;
  width: number;
  height: number;
}

export type StoryPortraitCharacterId = 'lala' | 'haruna' | 'riko';

export interface LayeredPortraitRig {
  id: StoryPortraitCharacterId;
  displayName: string;
  canvas: { width: number; height: number };
  body: string;
  mask: string;
  facePrefix: string;
  regions: { eyes: PortraitRegion; mouth: PortraitRegion };
  nonBlinkingExpressions: ReadonlySet<LalaExpression>;
}

export interface StoryPortraitCharacter {
  id: StoryPortraitCharacterId;
  displayName: string;
  speakerAliases: readonly string[];
  expressions: readonly LalaExpression[];
  nameplate: string;
  rig: LayeredPortraitRig;
}

export const LALA_STORY_CHARACTER: StoryPortraitCharacter = {
  id: 'lala',
  displayName: '菈菈',
  speakerAliases: [
    '菈菈',
    '拉拉',
    'Lala',
    'ララ',
    '菈菈·萨塔琳·戴比路克',
    '菈菈·薩塔琳·戴比路克',
    '拉拉·萨塔琳·戴比路克',
  ],
  expressions: ['a', 'b', 'c', 'd', 'e', 'f'],
  nameplate: '/artsource/galbox/lala/wasya04_lala.png',
  rig: {
    id: 'lala',
    displayName: '菈菈',
    canvas: { width: 1024, height: 1024 },
    body: '/artsource/lala/004_03_03_a%20%232247.png',
    mask: '/artsource/lala/004_03_03_a.png',
    facePrefix: '/artsource/lala/004_03_03_',
    regions: {
      eyes: { x: 394, y: 237, width: 230, height: 131 },
      mouth: { x: 394, y: 365, width: 230, height: 57 },
    },
    nonBlinkingExpressions: new Set<LalaExpression>(['c', 'f']),
  },
};

export const HARUNA_STORY_CHARACTER: StoryPortraitCharacter = {
  id: 'haruna',
  displayName: '西连寺春菜',
  speakerAliases: ['西连寺春菜', '西連寺春菜', '春菜', '西连寺'],
  expressions: ['a', 'b', 'c', 'd', 'e', 'f'],
  nameplate: '/artsource/galbox/haruna/wasya05_haruna.png',
  rig: {
    id: 'haruna',
    displayName: '西连寺春菜',
    canvas: { width: 1024, height: 1024 },
    body: '/artsource/haruna/005_01_01_a%20%2327501.png',
    mask: '/artsource/haruna/005_01_01_a.png',
    facePrefix: '/artsource/haruna/005_01_01_',
    regions: {
      eyes: { x: 394, y: 221, width: 230, height: 131 },
      mouth: { x: 394, y: 349, width: 230, height: 57 },
    },
    nonBlinkingExpressions: new Set<LalaExpression>(['b', 'e']),
  },
};

export const RIKO_STORY_CHARACTER: StoryPortraitCharacter = {
  id: 'riko',
  displayName: '夕崎梨子',
  speakerAliases: ['夕崎梨子', '梨子'],
  expressions: ['a'],
  nameplate: '/artsource/galbox/riko/wasya00_riko.png',
  rig: {
    id: 'riko',
    displayName: '夕崎梨子',
    canvas: { width: 1024, height: 1024 },
    body: '/artsource/riko/riko_body.png',
    mask: '/artsource/riko/riko_mask.png',
    facePrefix: '/artsource/riko/riko_',
    regions: {
      eyes: { x: 400, y: 142, width: 230, height: 100 },
      mouth: { x: 440, y: 225, width: 170, height: 70 },
    },
    nonBlinkingExpressions: new Set<LalaExpression>(),
  },
};

export const STORY_PORTRAIT_CHARACTERS = {
  lala: LALA_STORY_CHARACTER,
  haruna: HARUNA_STORY_CHARACTER,
  riko: RIKO_STORY_CHARACTER,
} as const satisfies Record<StoryPortraitCharacterId, StoryPortraitCharacter>;

export function getStoryPortraitCharacter(id: StoryPortraitCharacterId): StoryPortraitCharacter {
  return STORY_PORTRAIT_CHARACTERS[id];
}

export function findStoryPortraitCharacterBySpeaker(speaker: string | null): StoryPortraitCharacter | null {
  if (!speaker) return null;
  return Object.values(STORY_PORTRAIT_CHARACTERS).find(character => character.speakerAliases.includes(speaker)) ?? null;
}

export function getSpeakerNameplateAsset(speaker: string | null): string | null {
  if (!speaker) return null;
  return (
    Object.values(STORY_PORTRAIT_CHARACTERS).find(character => character.displayName === speaker)?.nameplate ?? null
  );
}

export function isStoryPortraitCharacterSpeaking(
  character: StoryPortraitCharacter | null,
  speaker: string | null | undefined,
): boolean {
  return Boolean(character && speaker && character.speakerAliases.includes(speaker));
}

export function getPortraitFaceAssets(
  rig: LayeredPortraitRig,
  expression: LalaExpression,
): { eyes: string; mouth: string } {
  const prefix = `${rig.facePrefix}${expression}`;
  return {
    eyes: `${prefix}_eye.png`,
    mouth: `${prefix}_mouth.png`,
  };
}
