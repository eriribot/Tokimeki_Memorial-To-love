import { getMainStoryLoreReferences } from '../GalMainStory/storyRegistry';
import { getPreviousActiveStoryFloors } from '../GalMainStory/storyArchive';
import type { GalStoryMessageSave } from '../GalMainStory/storyTypes';
import { captureGameMessages } from '../message';
import { createGameSnapshot, type GameSnapshot } from '../save/snapshot';
import {
  createStoryGenerationContextProjection,
  type StoryGenerationContextProjection,
} from './storyGenerationContext';
import { getCanonicalStoryTimeline, selectRecentStoryMessages } from '../memory/storyTimeline';

export interface LocalContextPreviewGeneration {
  projection: StoryGenerationContextProjection;
  loreReferences: ReturnType<typeof getMainStoryLoreReferences>;
  activeFloorId: string | null;
  source: 'active-run' | 'latest-floor';
}

export interface LocalContextPreview {
  capturedAt: string;
  snapshot: GameSnapshot;
  messages: GalStoryMessageSave[];
  generation: LocalContextPreviewGeneration | null;
}

function cloneJson<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

export function createLocalContextPreview(): LocalContextPreview {
  const snapshot = createGameSnapshot();
  const messages = captureGameMessages();
  const run = snapshot.game.mainStory.run?.phase === 'playing' ? snapshot.game.mainStory.run : null;
  const latestFloor = snapshot.game.mainStory.archives
    .flatMap(archive => archive.floors)
    .filter(floor => floor.messageIds.length > 0)
    .sort((left, right) => left.createdAt.localeCompare(right.createdAt))
    .at(-1);
  const target = run
    ? {
        eventId: run.eventId,
        actId: run.actId,
        contextFloorIds: getPreviousActiveStoryFloors(snapshot.game.mainStory.archives, run.eventId, run.actId).map(
          floor => floor.floorId,
        ),
        activeFloorId:
          snapshot.game.mainStory.archives.find(
            archive => archive.eventId === run.eventId && archive.actId === run.actId,
          )?.activeFloorId ?? null,
        source: 'active-run' as const,
        exactUserInput: null,
      }
    : latestFloor
      ? {
          eventId: latestFloor.eventId,
          actId: latestFloor.actId,
          contextFloorIds: latestFloor.contextFloorIds,
          activeFloorId: latestFloor.floorId,
          source: 'latest-floor' as const,
          exactUserInput:
            messages.find(message => latestFloor.messageIds.includes(message.id) && message.extra.role === 'user')
              ?.mes ?? null,
        }
      : null;

  if (!target) {
    return {
      capturedAt: new Date().toISOString(),
      snapshot,
      messages,
      generation: null,
    };
  }

  const projection = createStoryGenerationContextProjection({
    eventId: target.eventId,
    actId: target.actId,
    contextFloorIds: target.contextFloorIds,
    historyFloorIds: getCanonicalStoryTimeline(snapshot.game.mainStory.archives, {
      eventId: target.eventId,
      actId: target.actId,
    }).map(floor => floor.floorId),
    chatHistory: messages,
  });

  return {
    capturedAt: new Date().toISOString(),
    snapshot,
    messages,
    generation: {
      projection: target.exactUserInput ? { ...projection, userInput: target.exactUserInput } : projection,
      loreReferences: getMainStoryLoreReferences(target.eventId, target.actId),
      activeFloorId: target.activeFloorId,
      source: target.source,
    },
  };
}

export function getPreviewWindowMessages(preview: LocalContextPreview): GalStoryMessageSave[] {
  if (preview.generation?.source === 'active-run') {
    const messagesById = new Map(preview.messages.map(message => [message.id, message]));
    return cloneJson(
      preview.generation.projection.messageIds
        .map(messageId => messagesById.get(messageId))
        .filter((message): message is GalStoryMessageSave => message !== undefined),
    );
  }
  const timeline = getCanonicalStoryTimeline(preview.snapshot.game.mainStory.archives);
  return cloneJson(selectRecentStoryMessages(timeline, preview.messages));
}

export function getPreviewConnectionLabels(): {
  snapshot: 'local-state';
  messageArchive: 'local-mirror';
  generation: 'tavern-generate' | 'fallback-only';
  hostMessages: 'not-connected';
  shujuku: 'not-connected';
} {
  const hasTavernGenerate = typeof window !== 'undefined' && typeof window.TavernHelper?.generate === 'function';
  return {
    snapshot: 'local-state',
    messageArchive: 'local-mirror',
    generation: hasTavernGenerate ? 'tavern-generate' : 'fallback-only',
    hostMessages: 'not-connected',
    shujuku: 'not-connected',
  };
}
