import { createFaceAtlasExpressions } from './portraitFactory';
import type { StoryCharacterDefinition } from './types';

const RIKO_SCHOOL_PORTRAIT = {
  id: 'school-uniform',
  characterId: 'riko',
  displayName: '夕崎梨子',
  canvas: { width: 1024, height: 1024 },
  body: '/artsource/riko/riko_body.png',
  mask: '/artsource/riko/riko_mask.png',
  regions: {
    eyes: { x: 400, y: 142, width: 230, height: 100 },
    mouth: { x: 440, y: 225, width: 170, height: 70 },
  },
  defaultExpressionId: 'neutral',
  expressions: createFaceAtlasExpressions('/artsource/riko/riko_', { neutral: 'a' }),
} as const;

export const RIKO_STORY_CHARACTER = {
  id: 'riko',
  displayName: '夕崎梨子',
  speakerAliases: ['夕崎梨子', '梨子'],
  nameplate: '/artsource/galbox/riko/wasya00_riko.png',
  defaultPortraitId: RIKO_SCHOOL_PORTRAIT.id,
  portraits: { [RIKO_SCHOOL_PORTRAIT.id]: RIKO_SCHOOL_PORTRAIT },
  loreReferences: [],
} as const satisfies StoryCharacterDefinition;
