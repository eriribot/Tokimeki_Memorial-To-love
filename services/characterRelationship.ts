import type { CharacterRelationshipDelta, CharacterStats, GameCharacter } from '../types';

function clampRelationship(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.min(100, Math.max(0, Math.round(value)));
}

/**
 * Friendship and romance are authoritative. Older saves may only carry a
 * non-zero affection value, so both axes adopt it as a neutral baseline once.
 */
export function normalizeCharacterRelationshipStats(stats: CharacterStats): CharacterStats {
  const hasLegacyAffectionOnly = stats.friendship === 0 && stats.romance === 0 && stats.affection > 0;
  const friendship = clampRelationship(hasLegacyAffectionOnly ? stats.affection : stats.friendship);
  const romance = clampRelationship(hasLegacyAffectionOnly ? stats.affection : stats.romance);

  return {
    friendship,
    romance,
    affection: Math.round((friendship + romance) / 2),
  };
}

export function normalizeCharacterRelationship(target: GameCharacter): GameCharacter {
  return { ...target, ...normalizeCharacterRelationshipStats(target) };
}

export function applyRelationshipDeltaToCharacter(
  target: GameCharacter,
  delta: CharacterRelationshipDelta,
): GameCharacter {
  const baseline = normalizeCharacterRelationshipStats(target);
  const friendship = clampRelationship(baseline.friendship + (delta.friendship ?? 0));
  const romance = clampRelationship(baseline.romance + (delta.romance ?? 0));

  return {
    ...target,
    friendship,
    romance,
    affection: Math.round((friendship + romance) / 2),
  };
}
