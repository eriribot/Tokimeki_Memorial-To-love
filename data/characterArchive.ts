import { isCharacterAvailable } from './characterAvailability';
import type { GameCharacter } from '../types';

export type CharacterArchiveView = 'player' | 'characters';
export type CharacterArchiveCharacterView = 'list' | 'detail';

const ARCHIVE_ASSET_ROOT = '/artsource/ui/archive';

export interface CharacterArchiveSlot {
  slot: number;
  targetId: string | null;
  unlockedIcon: string;
  lockedIcon: string;
  cursor: string;
}

export interface ResolvedCharacterArchiveSlot extends CharacterArchiveSlot {
  unlocked: boolean;
  character: GameCharacter | null;
}

function createSlot(slot: number, targetId: string | null): CharacterArchiveSlot {
  const number = slot.toString().padStart(2, '0');
  return {
    slot,
    targetId,
    unlockedIcon: `${ARCHIVE_ASSET_ROOT}/icon_data${number}a.png`,
    lockedIcon: `${ARCHIVE_ASSET_ROOT}/icon_data${number}b.png`,
    cursor: `${ARCHIVE_ASSET_ROOT}/cursor_data${number}.png`,
  };
}

/**
 * Slots 01-11 preserve the extracted game order. Slot 12 extends the same
 * a/b/cursor asset contract for Riko without replacing Mikan's slot 10.
 */
export const CHARACTER_ARCHIVE_SLOTS: readonly CharacterArchiveSlot[] = [
  createSlot(1, 'momo'),
  createSlot(2, 'yami'),
  createSlot(3, null),
  createSlot(4, 'lala'),
  createSlot(5, 'haruna'),
  createSlot(6, null),
  createSlot(7, 'yui'),
  createSlot(8, null),
  createSlot(9, null),
  createSlot(10, null),
  createSlot(11, null),
  createSlot(12, 'riko'),
];

export function resolveCharacterArchiveSlots(
  targets: readonly GameCharacter[],
  completedMainStoryEventIds: readonly string[],
): ResolvedCharacterArchiveSlot[] {
  return CHARACTER_ARCHIVE_SLOTS.map(slot => {
    const target = slot.targetId ? targets.find(candidate => candidate.id === slot.targetId) : undefined;
    const unlocked = Boolean(
      target && slot.targetId && isCharacterAvailable(slot.targetId, completedMainStoryEventIds),
    );

    return {
      ...slot,
      unlocked,
      // A locked target is intentionally removed from the presentation layer
      // so a stale card cannot leak its identity through labels or details.
      character: unlocked ? (target ?? null) : null,
    };
  });
}

export function getFirstUnlockedCharacterArchiveSlot(slots: readonly ResolvedCharacterArchiveSlot[]): number {
  const index = slots.findIndex(slot => slot.unlocked);
  return index >= 0 ? index : 0;
}
