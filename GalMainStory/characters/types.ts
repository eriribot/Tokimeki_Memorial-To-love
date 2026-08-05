import type { DisabledWorldbookLoreReference } from '../../data/storyLore';

/** Tag of the lore block that the runtime replaces with the concrete User addressing line. */
export const STORY_USER_ADDRESS_TAG = '称呼绑定';

export interface StoryUserAddressingContext {
  familyName: string;
  givenName: string;
  affection: number;
}

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
  /**
   * Builds the runtime replacement for the entry's `<称呼绑定>` block from the
   * registered player name and current affection. When absent, the entry's
   * static block content is injected unchanged.
   */
  buildUserAddressBinding?: (context: StoryUserAddressingContext) => string;
}
