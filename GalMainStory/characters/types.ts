import type { DisabledWorldbookLoreReference } from '../../data/storyLore';

export interface PortraitRegion {
  x: number;
  y: number;
  width: number;
  height: number;
  /** Softens opaque atlas edges against the body, measured in source-canvas pixels. */
  feather?: number;
}

export interface LayeredPortraitExpression {
  id: string;
  eyes: string;
  mouth: string;
  blinking: boolean;
}

export interface LayeredPortraitRig {
  id: string;
  characterId: string;
  displayName: string;
  canvas: { width: number; height: number };
  body: string;
  mask: string;
  regions: { eyes: PortraitRegion; mouth: PortraitRegion };
  defaultExpressionId: string;
  expressions: Readonly<Record<string, LayeredPortraitExpression>>;
}

export interface StoryCharacterDefinition {
  id: string;
  displayName: string;
  speakerAliases: readonly string[];
  nameplate: string | null;
  defaultPortraitId: string;
  portraits: Readonly<Record<string, LayeredPortraitRig>>;
  loreReferences: readonly DisabledWorldbookLoreReference[];
}
