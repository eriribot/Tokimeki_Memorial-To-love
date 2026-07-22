import type { GalStoryAct, GalStoryActArchive, GalStoryFloor } from './storyTypes';
import { getMainStoryActIndex, getMainStoryEpisode } from './storyRegistry';

export function mergeStoryMessages<T extends { id: string }>(current: readonly T[], incoming: readonly T[]): T[] {
  if (incoming.length === 0) return [...current];
  const knownIds = new Set(current.map(message => message.id));
  const merged = [...current];
  for (const message of incoming) {
    if (knownIds.has(message.id)) continue;
    knownIds.add(message.id);
    merged.push(message);
  }
  return merged;
}

export function getStoryArchive(
  archives: readonly GalStoryActArchive[],
  eventId: string,
  actId: string,
): GalStoryActArchive | null {
  return archives.find(archive => archive.eventId === eventId && archive.actId === actId) ?? null;
}

export function getActiveStoryFloor(archive: GalStoryActArchive | null | undefined): GalStoryFloor | null {
  return archive?.floors.find(floor => floor.floorId === archive.activeFloorId) ?? null;
}

export function getActiveStoryAct(
  archives: readonly GalStoryActArchive[],
  eventId: string,
  actId: string,
): GalStoryAct | null {
  return getActiveStoryFloor(getStoryArchive(archives, eventId, actId))?.act ?? null;
}

export function getEpisodeStoryActs(
  archives: readonly GalStoryActArchive[],
  eventId: string,
  actIds: readonly string[],
): Array<GalStoryAct | null> {
  return actIds.map(actId => getActiveStoryAct(archives, eventId, actId));
}

export function getPreviousActiveStoryFloors(
  archives: readonly GalStoryActArchive[],
  eventId: string,
  actId: string,
): GalStoryFloor[] {
  const episode = getMainStoryEpisode(eventId);
  const actIndex = getMainStoryActIndex(eventId, actId);
  if (!episode || actIndex < 0) return [];
  const previousActOrder = new Map(episode.acts.slice(0, actIndex).map((act, index) => [act.id, index]));
  return archives
    .filter(archive => archive.eventId === eventId && previousActOrder.has(archive.actId))
    .sort(
      (left, right) =>
        (previousActOrder.get(left.actId) ?? Number.MAX_SAFE_INTEGER) -
        (previousActOrder.get(right.actId) ?? Number.MAX_SAFE_INTEGER),
    )
    .map(getActiveStoryFloor)
    .filter((floor): floor is GalStoryFloor => floor !== null && floor.act !== null);
}

export function hasCurrentStoryContext(
  archives: readonly GalStoryActArchive[],
  floor: Pick<GalStoryFloor, 'eventId' | 'actId' | 'contextFloorIds'>,
): boolean {
  if (getMainStoryActIndex(floor.eventId, floor.actId) < 0) return false;
  const expectedFloorIds = getPreviousActiveStoryFloors(archives, floor.eventId, floor.actId).map(
    previousFloor => previousFloor.floorId,
  );
  return (
    expectedFloorIds.length === floor.contextFloorIds.length &&
    expectedFloorIds.every((floorId, index) => floorId === floor.contextFloorIds[index])
  );
}

export function upsertStoryFloor(
  archives: readonly GalStoryActArchive[],
  floor: GalStoryFloor,
  activate: boolean,
): GalStoryActArchive[] {
  const archiveIndex = archives.findIndex(
    archive => archive.eventId === floor.eventId && archive.actId === floor.actId,
  );
  const current =
    archiveIndex >= 0
      ? archives[archiveIndex]
      : {
          eventId: floor.eventId,
          actId: floor.actId,
          activeFloorId: null,
          floors: [],
        };
  const floors = current.floors.some(savedFloor => savedFloor.floorId === floor.floorId)
    ? current.floors
    : [...current.floors, floor];
  const canActivate = activate && floor.outcome === 'accepted' && floor.act !== null;
  const nextArchive: GalStoryActArchive = {
    ...current,
    floors,
    activeFloorId: canActivate ? floor.floorId : current.activeFloorId,
  };

  return archiveIndex < 0
    ? [...archives, nextArchive]
    : archives.map((archive, index) => (index === archiveIndex ? nextArchive : archive));
}
