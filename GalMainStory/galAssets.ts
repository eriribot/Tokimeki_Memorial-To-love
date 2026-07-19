import { HARUNA_STORY_CHARACTER, LALA_STORY_CHARACTER, RIKO_STORY_CHARACTER } from './characters';

export {
  getPortraitFaceAssets,
  getSpeakerNameplateAsset,
  HARUNA_STORY_CHARACTER,
  LALA_STORY_CHARACTER,
  RIKO_STORY_CHARACTER,
  type LayeredPortraitRig,
} from './characters';

export const LALA_PORTRAIT_RIG = LALA_STORY_CHARACTER.rig;
export const HARUNA_PORTRAIT_RIG = HARUNA_STORY_CHARACTER.rig;
export const RIKO_PORTRAIT_RIG = RIKO_STORY_CHARACTER.rig;

export const GALBOX_ASSETS = {
  messageWindow: '/artsource/galbox/msg_window.png',
  nextIndicatorFrames: [0, 1, 2, 3].map(frame => `/artsource/galbox/push_${frame}.png`),
  speakerNameplates: {
    [LALA_STORY_CHARACTER.displayName]: LALA_STORY_CHARACTER.nameplate,
    [HARUNA_STORY_CHARACTER.displayName]: HARUNA_STORY_CHARACTER.nameplate,
    [RIKO_STORY_CHARACTER.displayName]: RIKO_STORY_CHARACTER.nameplate,
  } as Record<string, string>,
} as const;
