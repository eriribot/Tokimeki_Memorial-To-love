import { isCharacterAvailable } from '../data/characterAvailability';
import type { CharacterPresenceContext, GameCharacter, LocationId, PeriodKey } from '../types';

export const MAX_CHARACTERS_PER_LOCATION = 4;

const SCHOOL_HOURS_LOCATION_IDS = [
  'classroom',
  'library',
  'cafeteria',
  'gym',
  'musicRoom',
  'rooftop',
  'courtyard',
] as const satisfies readonly LocationId[];

const AFTER_SCHOOL_LOCATION_IDS = [
  'gate',
  'classroom',
  'library',
  'cafeteria',
  'gym',
  'musicRoom',
  'rooftop',
  'courtyard',
  'station',
  'shoppingStreet',
  'park',
  'riverbank',
  'residentialArea',
] as const satisfies readonly LocationId[];

function compareCharacterIds(left: GameCharacter, right: GameCharacter): number {
  if (left.id === right.id) return 0;
  return left.id < right.id ? -1 : 1;
}

function hashText(value: string): number {
  let hash = 0;
  for (let index = 0; index < value.length; index += 1) {
    hash = (hash * 31 + value.charCodeAt(index)) >>> 0;
  }
  return hash;
}

function rotateLocations(locations: readonly LocationId[], offset: number): LocationId[] {
  if (locations.length === 0) return [];
  const start = offset % locations.length;
  return [...locations.slice(start), ...locations.slice(0, start)];
}

function uniqueLocations(locations: readonly LocationId[]): LocationId[] {
  return [...new Set(locations)];
}

function getAllowedLocations(periodKey: PeriodKey): readonly LocationId[] {
  if (periodKey === 'morning') return SCHOOL_HOURS_LOCATION_IDS;
  if (periodKey === 'afterSchool') return AFTER_SCHOOL_LOCATION_IDS;
  return [];
}

function getLocationCandidates(target: GameCharacter, periodKey: PeriodKey): LocationId[] {
  const allowedLocations = getAllowedLocations(periodKey);
  if (allowedLocations.length === 0) return [];

  const allowed = new Set<LocationId>(allowedLocations);
  const validFavorites = target.favoriteLocations.filter(locationId => allowed.has(locationId));
  const orderedFavorites =
    periodKey === 'afterSchool'
      ? [
          ...validFavorites.filter(locationId => locationId !== 'classroom'),
          ...validFavorites.filter(locationId => locationId === 'classroom'),
        ]
      : validFavorites;
  const fallbackLocations = rotateLocations(allowedLocations, hashText(`${target.id}:${periodKey}`));

  return uniqueLocations([...orderedFavorites, ...fallbackLocations]);
}

export function getTargetLocationForPeriod(target: GameCharacter, periodKey: PeriodKey): LocationId | null {
  return getLocationCandidates(target, periodKey)[0] ?? null;
}

export function getTargetLocationForContext(
  target: GameCharacter,
  context: CharacterPresenceContext,
): LocationId | null {
  if (!isCharacterAvailable(target.id, context.completedMainStoryEventIds)) return null;
  return getTargetLocationForPeriod(target, context.periodKey);
}

export function allocateCharacterLocations(
  targets: readonly GameCharacter[],
  context: CharacterPresenceContext,
): ReadonlyMap<string, LocationId | null> {
  const assignments = new Map<string, LocationId | null>(targets.map(target => [target.id, null]));
  const occupancy = new Map<LocationId, number>();

  const availableTargets = targets
    .filter(target => isCharacterAvailable(target.id, context.completedMainStoryEventIds))
    .slice()
    .sort(compareCharacterIds);

  for (const target of availableTargets) {
    const locationId = getLocationCandidates(target, context.periodKey).find(
      candidate => (occupancy.get(candidate) ?? 0) < MAX_CHARACTERS_PER_LOCATION,
    );
    if (!locationId) continue;

    assignments.set(target.id, locationId);
    occupancy.set(locationId, (occupancy.get(locationId) ?? 0) + 1);
  }

  return assignments;
}
