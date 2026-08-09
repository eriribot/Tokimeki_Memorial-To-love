import { createFaceAtlasExpressions } from './portraitFactory';
import type { StoryCharacterDefinition } from './types';

const KENICHI_SCHOOL_PORTRAIT = {
  id: 'school-uniform',
  characterId: 'kenichi',
  displayName: '猿山健一',
  canvas: { width: 1024, height: 1024 },
  body: '/artsource/kenichi/018_01_01_a%20%232509.png',
  mask: '/artsource/kenichi/018_01_01_a.png',
  regions: {
    eyes: { x: 394, y: 211, width: 230, height: 131 },
    mouth: { x: 394, y: 339, width: 230, height: 67 },
  },
  defaultExpressionId: 'neutral',
  expressions: createFaceAtlasExpressions(
    '/artsource/kenichi/018_01_01_',
    {
      neutral: 'a',
      worried: 'b',
      serious: 'c',
      anger: 'd',
      shy: 'e',
      happy: 'f',
    },
    ['worried', 'happy'],
  ),
} as const;

export const KENICHI_STORY_CHARACTER = {
  id: 'kenichi',
  displayName: '猿山健一',
  speakerAliases: ['猿山健一', '猿山'],
  nameplate: null,
  defaultPortraitId: KENICHI_SCHOOL_PORTRAIT.id,
  portraits: { [KENICHI_SCHOOL_PORTRAIT.id]: KENICHI_SCHOOL_PORTRAIT },
  loreReferences: [],
} as const satisfies StoryCharacterDefinition;
