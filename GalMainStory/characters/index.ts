import { HARUNA_STORY_CHARACTER } from './haruna';
import { LALA_STORY_CHARACTER } from './lala';
import { MIKAN_STORY_CHARACTER } from './mikan';
import { RIKO_STORY_CHARACTER } from './riko';
import type { LayeredPortraitRig, StoryCharacterDefinition } from './types';

export { HARUNA_STORY_CHARACTER } from './haruna';
export { LALA_STORY_CHARACTER } from './lala';
export { MIKAN_STORY_CHARACTER } from './mikan';
export { RIKO_STORY_CHARACTER } from './riko';
export type { LayeredPortraitExpression, LayeredPortraitRig, PortraitRegion, StoryCharacterDefinition } from './types';

export const STORY_CHARACTERS = {
  lala: LALA_STORY_CHARACTER,
  haruna: HARUNA_STORY_CHARACTER,
  mikan: MIKAN_STORY_CHARACTER,
  riko: RIKO_STORY_CHARACTER,
} as const satisfies Record<string, StoryCharacterDefinition>;

export type StoryCharacterId = keyof typeof STORY_CHARACTERS;

export function isStoryCharacterId(value: string): value is StoryCharacterId {
  return Object.hasOwn(STORY_CHARACTERS, value);
}

export function getStoryCharacter(id: StoryCharacterId): StoryCharacterDefinition {
  return STORY_CHARACTERS[id];
}

export function findStoryCharacterBySpeaker(speaker: string | null): StoryCharacterDefinition | null {
  if (!speaker) return null;
  const characters: readonly StoryCharacterDefinition[] = Object.values(STORY_CHARACTERS);
  return characters.find(character => character.speakerAliases.includes(speaker)) ?? null;
}

export function getStoryPortraitRig(characterId: StoryCharacterId, portraitId?: string | null): LayeredPortraitRig {
  const character = getStoryCharacter(characterId);
  const resolvedPortraitId = portraitId ?? character.defaultPortraitId;
  const rig = character.portraits[resolvedPortraitId];
  if (!rig) throw new Error(`角色“${character.displayName}”没有登记立绘“${resolvedPortraitId}”。`);
  return rig;
}

export function getSpeakerNameplateAsset(speaker: string | null): string | null {
  return findStoryCharacterBySpeaker(speaker)?.nameplate ?? null;
}

export function isStoryCharacterSpeaking(
  character: StoryCharacterDefinition | null,
  speaker: string | null | undefined,
): boolean {
  return Boolean(character && speaker && character.speakerAliases.includes(speaker));
}
