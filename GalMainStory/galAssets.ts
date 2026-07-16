import type { LalaExpression } from './storyTypes';

export const GALBOX_ASSETS = {
  messageWindow: '/artsource/galbox/msg_window.png',
  nextIndicatorFrames: [0, 1, 2, 3].map(frame => `/artsource/galbox/push_${frame}.png`),
  speakerNameplates: {
    菈菈: '/artsource/galbox/lala/wasya04_lala.png',
  } as Record<string, string>,
} as const;

export const LALA_PORTRAIT_ASSETS = {
  body: '/artsource/lala/004_03_03_a%20%232247.png',
  mask: '/artsource/lala/004_03_03_a.png',
  nonBlinkingExpressions: new Set<LalaExpression>(['c', 'f']),
} as const;

export function getSpeakerNameplateAsset(speaker: string | null): string | null {
  return speaker ? (GALBOX_ASSETS.speakerNameplates[speaker] ?? null) : null;
}

export function getLalaFaceAssets(expression: LalaExpression): { eyes: string; mouth: string } {
  const prefix = `/artsource/lala/004_03_03_${expression}`;
  return {
    eyes: `${prefix}_eye.png`,
    mouth: `${prefix}_mouth.png`,
  };
}
