import type { LocationId, PeriodKey } from '../types';

export interface LocationSceneBackgroundDefinition {
  phaseOne: string;
  phaseTwo?: string;
  visualNote?: string;
}

/**
 * Local encounter backgrounds. Paths are drawn from the bundled To LOVE-Ru
 * background set. The two documented fallbacks stay explicit instead of
 * pretending that the source archive contains a school cafeteria or music room.
 */
export const LOCATION_SCENE_BACKGROUNDS: Readonly<Record<LocationId, LocationSceneBackgroundDefinition>> = {
  gate: {
    phaseOne: '/artsource/backgrounds/bg004_a.png',
    phaseTwo: '/artsource/backgrounds/bg004_b.png',
    visualNote: '彩南高校升降口',
  },
  classroom: {
    phaseOne: '/artsource/backgrounds/bg001_a.png',
    phaseTwo: '/artsource/backgrounds/bg001_b.png',
  },
  library: { phaseOne: '/artsource/backgrounds/bg023_a.png' },
  cafeteria: {
    phaseOne: '/artsource/backgrounds/bg037_a.png',
    visualNote: '家庭餐厅（食堂临时背景）',
  },
  gym: {
    phaseOne: '/artsource/backgrounds/bg020_a.png',
    visualNote: '体育器材区',
  },
  musicRoom: {
    phaseOne: '/artsource/backgrounds/bg002_a.png',
    visualNote: '彩南高校走廊（临时背景）',
  },
  rooftop: { phaseOne: '/artsource/backgrounds/bg019_a.png' },
  courtyard: {
    phaseOne: '/artsource/backgrounds/bg003_a.png',
    phaseTwo: '/artsource/backgrounds/bg003_b.png',
  },
  station: {
    phaseOne: '/artsource/backgrounds/bg024_a.png',
    phaseTwo: '/artsource/backgrounds/bg024_b.png',
  },
  shoppingStreet: { phaseOne: '/artsource/backgrounds/bg025_a.png' },
  park: {
    phaseOne: '/artsource/backgrounds/bg008_a.png',
    phaseTwo: '/artsource/backgrounds/bg008_d.png',
  },
  riverbank: { phaseOne: '/artsource/backgrounds/bg009_a.png' },
  residentialArea: {
    phaseOne: '/artsource/backgrounds/bg006_a.png',
    phaseTwo: '/artsource/backgrounds/bg006_b.png',
  },
};

export function getLocationSceneBackground(
  locationId: LocationId,
  periodKey: PeriodKey,
): LocationSceneBackgroundDefinition & { asset: string } {
  const definition = LOCATION_SCENE_BACKGROUNDS[locationId];
  return {
    ...definition,
    asset: periodKey === 'afterSchool' && definition.phaseTwo ? definition.phaseTwo : definition.phaseOne,
  };
}
