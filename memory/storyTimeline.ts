import { MAIN_STORY_EPISODES } from '../GalMainStory/storyRegistry';
import type { GalStoryActArchive, GalStoryFloor, GalStoryMessageSave } from '../GalMainStory/storyTypes';
import { RECENT_CONTEXT_MESSAGE_LIMIT } from './summaryPolicy';

export interface StoryTimelineBoundary {
  eventId: string;
  actId: string;
}

function isCanonicalFloor(floor: GalStoryFloor | undefined, episodeId: string, actId: string): floor is GalStoryFloor {
  return (
    floor !== undefined &&
    floor.eventId === episodeId &&
    floor.actId === actId &&
    floor.outcome === 'accepted' &&
    floor.act !== null &&
    floor.act.id === actId &&
    floor.messageIds.length === 2
  );
}

function hasRegisteredBoundary(boundary: StoryTimelineBoundary): boolean {
  return MAIN_STORY_EPISODES.some(
    episode => episode.id === boundary.eventId && episode.acts.some(act => act.id === boundary.actId),
  );
}

/**
 * Returns the active, accepted story floors in registry order.
 *
 * The optional boundary is exclusive. Passing it keeps only canonical floors
 * that precede the requested act across all registered episodes.
 *
 * The input is expected to have passed the snapshot validator. Invalid or
 * incomplete archive entries are ignored here so this selector remains a
 * read-only projection; strict persistence validation remains the authority.
 */
export function getCanonicalStoryTimeline(
  archives: readonly GalStoryActArchive[],
  before?: StoryTimelineBoundary,
): GalStoryFloor[] {
  if (before && !hasRegisteredBoundary(before)) {
    throw new Error('故事时间线边界未登记。');
  }

  const timeline: GalStoryFloor[] = [];

  for (const episode of MAIN_STORY_EPISODES) {
    for (const act of episode.acts) {
      if (before?.eventId === episode.id && before.actId === act.id) return timeline;

      const archive = archives.find(candidate => candidate.eventId === episode.id && candidate.actId === act.id);
      if (!archive || archive.activeFloorId === null) continue;

      const activeFloor = archive.floors.find(floor => floor.floorId === archive.activeFloorId);
      if (isCanonicalFloor(activeFloor, episode.id, act.id)) timeline.push(activeFloor);
    }
  }

  return timeline;
}

function getCanonicalFloorMessages(
  floor: GalStoryFloor,
  messagesById: ReadonlyMap<string, GalStoryMessageSave>,
): [GalStoryMessageSave, GalStoryMessageSave] | null {
  const pair = floor.messageIds.map(messageId => messagesById.get(messageId));
  if (pair.length !== 2 || !pair[0] || !pair[1]) return null;
  const user = pair.find(message => message.extra.role === 'user');
  const assistant = pair.find(message => message.extra.role === 'assistant');
  if (
    !user ||
    !assistant ||
    user.extra.floorId !== floor.floorId ||
    assistant.extra.floorId !== floor.floorId ||
    user.extra.outcome !== 'accepted' ||
    assistant.extra.outcome !== 'accepted'
  ) {
    return null;
  }
  return [user, assistant];
}

/** Selects complete canonical User/Assistant pairs from the end of the timeline. */
export function selectRecentStoryMessages(
  timeline: readonly GalStoryFloor[],
  messages: readonly GalStoryMessageSave[],
  limit = RECENT_CONTEXT_MESSAGE_LIMIT,
): GalStoryMessageSave[] {
  const pairLimit = Math.max(0, Math.floor(limit / 2));
  if (pairLimit === 0) return [];
  const messagesById = new Map(messages.map(message => [message.id, message]));
  return timeline
    .slice(-pairLimit)
    .flatMap(floor => getCanonicalFloorMessages(floor, messagesById) ?? []);
}

/** Returns complete canonical pairs older than the fixed recent-message window. */
export function selectStoryMessagesBeforeRecentWindow(
  timeline: readonly GalStoryFloor[],
  messages: readonly GalStoryMessageSave[],
  recentLimit = RECENT_CONTEXT_MESSAGE_LIMIT,
): GalStoryMessageSave[] {
  const recentPairCount = Math.max(0, Math.floor(recentLimit / 2));
  const sourceFloors = recentPairCount === 0 ? timeline : timeline.slice(0, -recentPairCount);
  const messagesById = new Map(messages.map(message => [message.id, message]));
  return sourceFloors.flatMap(floor => getCanonicalFloorMessages(floor, messagesById) ?? []);
}
