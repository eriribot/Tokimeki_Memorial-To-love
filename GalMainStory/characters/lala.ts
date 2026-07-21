import { createFaceAtlasExpressions } from './portraitFactory';
import type { StoryCharacterDefinition } from './types';

const LALA_DEFAULT_PORTRAIT = {
  id: 'arrival-default',
  characterId: 'lala',
  displayName: '菈菈',
  canvas: { width: 1024, height: 1024 },
  body: '/artsource/lala/004_03_03_a%20%232247.png',
  mask: '/artsource/lala/004_03_03_a.png',
  regions: {
    eyes: { x: 394, y: 237, width: 230, height: 131 },
    mouth: { x: 394, y: 365, width: 230, height: 57 },
  },
  defaultExpressionId: 'neutral',
  expressions: createFaceAtlasExpressions(
    '/artsource/lala/004_03_03_',
    {
      neutral: 'a',
      worried: 'b',
      happy: 'c',
      serious: 'd',
      panic: 'e',
      shy: 'f',
    },
    ['happy', 'shy'],
  ),
} as const;

const LALA_WASHROOM_PORTRAIT = {
  id: 'washroom-swimsuit',
  characterId: 'lala',
  displayName: '菈菈',
  canvas: { width: 1024, height: 1024 },
  body: '/artsource/lala/lala_washroom/lalawashroom.png',
  mask: '/artsource/lala/lala_washroom/004_01_08_a.png',
  regions: {
    eyes: { x: 394, y: 217, width: 230, height: 131, feather: 10 },
    mouth: { x: 394, y: 346, width: 230, height: 57, feather: 6 },
  },
  defaultExpressionId: 'neutral',
  expressions: createFaceAtlasExpressions(
    '/artsource/lala/lala_washroom/004_01_08_',
    {
      neutral: 'a',
      worried: 'e',
      happy: 'b',
      serious: 'd',
      panic: 'c',
      shy: 'f',
    },
    ['happy'],
  ),
} as const;

export const LALA_STORY_CHARACTER = {
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
  nameplate: '/artsource/galbox/lala/wasya04_lala.png',
  defaultPortraitId: LALA_DEFAULT_PORTRAIT.id,
  portraits: {
    [LALA_DEFAULT_PORTRAIT.id]: LALA_DEFAULT_PORTRAIT,
    [LALA_WASHROOM_PORTRAIT.id]: LALA_WASHROOM_PORTRAIT,
  },
  loreReferences: [
    {
      worldbookName: '出包王女',
      entryUid: 1,
      entryName: '菈菈.萨塔琳.戴比路克',
      rootTag: 'Lala Satalin Deviluke',
      requiredContentMarker: '姓名:菈菈·萨塔琳·戴比路克',
      kind: 'character',
    },
  ],
} as const satisfies StoryCharacterDefinition;
