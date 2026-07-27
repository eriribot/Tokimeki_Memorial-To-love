import { createFaceAtlasExpressions } from './portraitFactory';
import type { StoryCharacterDefinition } from './types';

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
    eyes: { x: 394, y: 221, width: 230, height: 131 },
    mouth: { x: 394, y: 349, width: 230, height: 57 },
  },
  defaultExpressionId: 'shy',
  expressions: createFaceAtlasExpressions(
    '/artsource/haruna/haruna_changer_room/haruna_changer_room_',
    {
      shy: 'shy',
      anger: 'anger',
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
      requiredContentMarker: '身份映射:User承接原作男主剧情职能',
      kind: 'character',
    },
  ],
} as const satisfies StoryCharacterDefinition;
