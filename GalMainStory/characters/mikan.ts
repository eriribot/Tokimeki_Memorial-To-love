import { createFaceAtlasExpressions } from './portraitFactory';
import type { StoryCharacterDefinition } from './types';

const MIKAN_DEFAULT_PORTRAIT = {
  id: 'arrival-default',
  characterId: 'mikan',
  displayName: '结城美柑',
  canvas: { width: 1024, height: 1024 },
  body: '/artsource/mikan/010_01_01_a%20%2327473.png',
  mask: '/artsource/mikan/010_01_01_a.png',
  regions: {
    eyes: { x: 394, y: 270, width: 230, height: 131 },
    mouth: { x: 394, y: 398, width: 230, height: 57 },
  },
  defaultExpressionId: 'neutral',
  expressions: createFaceAtlasExpressions(
    '/artsource/mikan/010_01_01_',
    {
      neutral: 'c',
      worried: 'a',
      happy: 'b',
      serious: 'f',
      panic: 'e',
      shy: 'd',
    },
    ['worried', 'panic'],
  ),
} as const;

export const MIKAN_STORY_CHARACTER = {
  id: 'mikan',
  displayName: '结城美柑',
  speakerAliases: ['结城美柑', '結城美柑', '美柑'],
  nameplate: '/artsource/galbox/mikan/wasya10_mikan.png',
  defaultPortraitId: MIKAN_DEFAULT_PORTRAIT.id,
  portraits: { [MIKAN_DEFAULT_PORTRAIT.id]: MIKAN_DEFAULT_PORTRAIT },
  loreReferences: [
    {
      worldbookName: '出包王女',
      entryUid: 7,
      entryName: '结城美柑',
      rootTag: 'Mikan Yuuki',
      requiredContentMarker: '姓名:结城美柑',
      kind: 'character',
    },
  ],
} as const satisfies StoryCharacterDefinition;
