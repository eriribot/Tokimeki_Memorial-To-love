import { createFaceAtlasExpressions } from './portraitFactory';
import type { StoryCharacterDefinition, StoryUserAddressingContext } from './types';

// Affection thresholds for how Haruna addresses User: family name, given name, then plain given name.
const HARUNA_ADDRESS_TIER_FAMILIAR = 40;
const HARUNA_ADDRESS_TIER_INTIMATE = 80;

function buildHarunaUserAddressBinding({ familyName, givenName, affection }: StoryUserAddressingContext): string {
  if (affection >= HARUNA_ADDRESS_TIER_INTIMATE) {
    return `-User:直呼名字“${givenName}”，不加“同学”。User姓“${familyName}”、名“${givenName}”，关系已足够亲密；不要再改回姓氏称呼或全名。`;
  }
  if (affection >= HARUNA_ADDRESS_TIER_FAMILIAR) {
    return `-User:统一称呼为“${givenName}同学”。User姓“${familyName}”、名“${givenName}”，关系已经熟悉，改用名字加“同学”；不要改回姓氏称呼、全名或“你”。`;
  }
  return `-User:统一称呼为“${familyName}同学”。User姓“${familyName}”、名“${givenName}”；不要改称全名、单喊名字或“你”。`;
}

const HARUNA_SCHOOL_PORTRAIT = {
  id: 'school-uniform',
  characterId: 'haruna',
  displayName: '西连寺春菜',
  canvas: { width: 1024, height: 1024 },
  body: '/artsource/haruna/005_01_01_a%20%2327501.png',
  mask: '/artsource/haruna/005_01_01_a.png',
  regions: {
    eyes: { x: 394, y: 221, width: 230, height: 131 },
    mouth: { x: 394, y: 349, width: 230, height: 57 },
  },
  defaultExpressionId: 'neutral',
  expressions: createFaceAtlasExpressions(
    '/artsource/haruna/005_01_01_',
    {
      neutral: 'a',
      worried: 'b',
      happy: 'c',
      serious: 'd',
      panic: 'e',
      shy: 'f',
    },
    ['worried', 'panic'],
  ),
} as const;

const HARUNA_CHANGER_ROOM_PORTRAIT = {
  id: 'changer-room',
  characterId: 'haruna',
  displayName: '西连寺春菜',
  canvas: { width: 1024, height: 1024 },
  body: '/artsource/haruna/haruna_changer_room/haruna_changer_room.png',
  mask: '/artsource/haruna/haruna_changer_room/haruna_changer_room_mask.png',
  regions: {
    eyes: { x: 394, y: 232, width: 230, height: 131 },
    mouth: { x: 394, y: 360, width: 230, height: 57 },
  },
  defaultExpressionId: 'shy',
  expressions: createFaceAtlasExpressions(
    '/artsource/haruna/haruna_changer_room/005_03_05_',
    {
      shy: 'b',
      anger: 'c',
    },
    ['shy'],
  ),
} as const;

export const HARUNA_STORY_CHARACTER = {
  id: 'haruna',
  displayName: '西连寺春菜',
  speakerAliases: ['西连寺春菜', '西連寺春菜', '春菜', '西连寺'],
  nameplate: '/artsource/galbox/haruna/wasya05_haruna.png',
  defaultPortraitId: HARUNA_SCHOOL_PORTRAIT.id,
  portraits: {
    [HARUNA_SCHOOL_PORTRAIT.id]: HARUNA_SCHOOL_PORTRAIT,
    [HARUNA_CHANGER_ROOM_PORTRAIT.id]: HARUNA_CHANGER_ROOM_PORTRAIT,
  },
  loreReferences: [
    {
      worldbookName: '出包王女',
      entryOrder: 101,
      entryName: '西连寺春菜',
      rootTag: 'Haruna Sairenji',
      kind: 'character',
    },
  ],
  buildUserAddressBinding: buildHarunaUserAddressBinding,
} as const satisfies StoryCharacterDefinition;
