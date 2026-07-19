import type { StoryBackgroundId } from '../storyTypes';

export interface StorySceneDefinition {
  id: StoryBackgroundId;
  asset: string;
  alt: string;
}

export const STORY_SCENES = {
  school: {
    id: 'school',
    asset: '/artsource/backgrounds/classroom.jpg',
    alt: '彩南高校',
  },
  night: {
    id: 'night',
    asset: '/artsource/backgrounds/park_background.png',
    alt: '夜晚场景',
  },
  washroomDoor: {
    id: 'washroomDoor',
    asset: '/artsource/backgrounds/washroom_door.png',
    alt: '浴室门前',
  },
  washroom: {
    id: 'washroom',
    asset: '/artsource/backgrounds/washroom.png',
    alt: '浴室内部',
  },
} as const satisfies Record<StoryBackgroundId, StorySceneDefinition>;

export const STORY_SCENE_ASSETS = {
  school: STORY_SCENES.school.asset,
  night: STORY_SCENES.night.asset,
  washroomDoor: STORY_SCENES.washroomDoor.asset,
  washroom: STORY_SCENES.washroom.asset,
} as const satisfies Record<StoryBackgroundId, string>;

export function getStoryScene(id: StoryBackgroundId): StorySceneDefinition {
  return STORY_SCENES[id];
}
