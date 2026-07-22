import { EPISODE_02_EVENT_ID } from '../GalMainStory/episodes/episode02';
import type { CharacterAvailabilityRule } from '../types';

export const DEFAULT_CHARACTER_AVAILABILITY: Readonly<Record<string, CharacterAvailabilityRule>> = {
  riko: { kind: 'always' },
  haruna: { kind: 'always' },
  sakura: { kind: 'after-event', eventId: EPISODE_02_EVENT_ID },
  haruka: { kind: 'locked' },
  miyuki: { kind: 'locked' },
  rin: { kind: 'locked' },
};

export function isCharacterAvailable(characterId: string, completedEventIds: readonly string[]): boolean {
  const rule = DEFAULT_CHARACTER_AVAILABILITY[characterId];
  if (!rule || rule.kind === 'always') return true;
  if (rule.kind === 'locked') return false;
  return completedEventIds.includes(rule.eventId);
}
