import type { LocationId } from '../types';

export const LOCATION_IDS = [
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

const LOCATION_ID_SET: ReadonlySet<string> = new Set(LOCATION_IDS);

export function isLocationId(value: string): value is LocationId {
  return LOCATION_ID_SET.has(value);
}
