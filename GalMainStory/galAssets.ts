import type { LalaExpression } from './storyTypes';

interface PortraitRegion {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface LayeredPortraitRig {
  id: 'lala' | 'haruna';
  displayName: string;
  canvas: { width: number; height: number };
  body: string;
  mask: string;
  facePrefix: string;
  regions: { eyes: PortraitRegion; mouth: PortraitRegion };
  nonBlinkingExpressions: ReadonlySet<LalaExpression>;
}

export const GALBOX_ASSETS = {
  messageWindow: '/artsource/galbox/msg_window.png',
  nextIndicatorFrames: [0, 1, 2, 3].map(frame => `/artsource/galbox/push_${frame}.png`),
  speakerNameplates: {
    菈菈: '/artsource/galbox/lala/wasya04_lala.png',
  } as Record<string, string>,
} as const;

export const LALA_PORTRAIT_RIG: LayeredPortraitRig = {
  id: 'lala',
  displayName: '菈菈',
  canvas: { width: 1024, height: 1024 },
  body: '/artsource/lala/004_03_03_a%20%232247.png',
  mask: '/artsource/lala/004_03_03_a.png',
  facePrefix: '/artsource/lala/004_03_03_',
  regions: {
    eyes: { x: 394, y: 237, width: 230, height: 131 },
    mouth: { x: 394, y: 365, width: 230, height: 57 },
  },
  nonBlinkingExpressions: new Set<LalaExpression>(['c', 'f']),
};

export const HARUNA_PORTRAIT_RIG: LayeredPortraitRig = {
  id: 'haruna',
  displayName: '西连寺春菜',
  canvas: { width: 1024, height: 1024 },
  body: '/artsource/haruna/005_01_01_a%20%2327501.png',
  mask: '/artsource/haruna/005_01_01_a.png',
  facePrefix: '/artsource/haruna/005_01_01_',
  regions: {
    eyes: { x: 394, y: 221, width: 230, height: 131 },
    mouth: { x: 394, y: 349, width: 230, height: 57 },
  },
  nonBlinkingExpressions: new Set<LalaExpression>(['b', 'e']),
};

export function getSpeakerNameplateAsset(speaker: string | null): string | null {
  return speaker ? (GALBOX_ASSETS.speakerNameplates[speaker] ?? null) : null;
}

export function getPortraitFaceAssets(
  rig: LayeredPortraitRig,
  expression: LalaExpression,
): { eyes: string; mouth: string } {
  const prefix = `${rig.facePrefix}${expression}`;
  return {
    eyes: `${prefix}_eye.png`,
    mouth: `${prefix}_mouth.png`,
  };
}
