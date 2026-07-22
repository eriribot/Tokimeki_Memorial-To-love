import type { StorySceneId } from '../storyTypes';

export interface StorySceneDefinition {
  id: StorySceneId;
  asset: string;
  alt: string;
}

export const STORY_SCENES = {
  space: {
    id: 'space',
    asset: '/artsource/backgrounds/bg100_c.png',
    alt: '地球轨道夜空',
  },
  school: {
    id: 'school',
    asset: '/artsource/backgrounds/bg001_a.png',
    alt: '彩南高校教室',
  },
  schoolGate: {
    id: 'schoolGate',
    asset: '/artsource/backgrounds/bg004_a.png',
    alt: '彩南高校校门入口',
  },
  home: {
    id: 'home',
    asset: '/artsource/backgrounds/bg051_a.png',
    alt: '家中走廊',
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
  bedroom: {
    id: 'bedroom',
    asset: '/artsource/backgrounds/bg010_b.png',
    alt: '夜间卧室',
  },
  rooftop: {
    id: 'rooftop',
    asset: '/artsource/backgrounds/bg019_a.png',
    alt: '屋顶平台',
  },
  park: {
    id: 'park',
    asset: '/artsource/backgrounds/bg008_b.png',
    alt: '夜间公园',
  },
  nightStreet: {
    id: 'nightStreet',
    asset: '/artsource/backgrounds/bg009_b.png',
    alt: '夜间河堤路',
  },
  schoolRoad: {
    id: 'schoolRoad',
    asset: '/artsource/backgrounds/bg006_a.png',
    alt: '清晨上学路',
  },
  changingRoom: {
    id: 'changingRoom',
    asset: '/artsource/backgrounds/bg020_a.png',
    alt: '彩南高校更衣室',
  },
  riverbank: {
    id: 'riverbank',
    asset: '/artsource/backgrounds/bg009_b.png',
    alt: '夜晚河堤',
  },
} as const satisfies Record<StorySceneId, StorySceneDefinition>;

export const STORY_SCENE_ASSETS = {
  space: STORY_SCENES.space.asset,
  school: STORY_SCENES.school.asset,
  schoolGate: STORY_SCENES.schoolGate.asset,
  home: STORY_SCENES.home.asset,
  night: STORY_SCENES.night.asset,
  washroomDoor: STORY_SCENES.washroomDoor.asset,
  washroom: STORY_SCENES.washroom.asset,
  bedroom: STORY_SCENES.bedroom.asset,
  rooftop: STORY_SCENES.rooftop.asset,
  park: STORY_SCENES.park.asset,
  nightStreet: STORY_SCENES.nightStreet.asset,
  schoolRoad: STORY_SCENES.schoolRoad.asset,
  changingRoom: STORY_SCENES.changingRoom.asset,
  riverbank: STORY_SCENES.riverbank.asset,
} as const satisfies Record<StorySceneId, string>;

export function getStoryScene(id: StorySceneId): StorySceneDefinition {
  return STORY_SCENES[id];
}
