import { getDatingLocation } from '../DatingModule/datingRules';
import type { DatingArchive, DatingStageContent } from '../DatingModule/types';
import { getMainStoryAct, getMainStoryActIndex, getMainStoryEpisode } from '../GalMainStory/storyRegistry';
import { extractPlayableText } from '../GalMainStory/storyTextExtraction';
import type { GalStoryFloor, GalStoryMessageSave } from '../GalMainStory/storyTypes';
import type { GameSnapshot } from '../save/snapshot';
import type { CalendarDateValue } from '../types';
import type { SummarySourceMessage } from './summaryPrompts';
import { getCanonicalStoryTimeline } from './storyTimeline';

export const DATING_SUMMARY_EVENT_ID = 'tolove-dating';

export type MemorySummarySourceKind = 'main-story' | 'dating';

export interface MemorySummarySourceMessage extends SummarySourceMessage {
  kind: MemorySummarySourceKind;
  createdAt: string;
  scopeLabel: string;
}

export interface MemorySummarySourceFloor {
  kind: MemorySummarySourceKind;
  floorId: string;
  eventId: string;
  actId: string;
  source: 'tavern' | 'fallback';
  createdAt: string;
  date: CalendarDateValue;
  actionNumber: number;
  messageIds: [string, string];
}

export interface MemorySummarySourceProjection {
  floors: MemorySummarySourceFloor[];
  messages: MemorySummarySourceMessage[];
}

interface PendingFloorProjection {
  floor: MemorySummarySourceFloor;
  messages: [MemorySummarySourceMessage, MemorySummarySourceMessage];
  stableOrder: number;
}

function cleanGalDirectives(text: string): string {
  return text
    .split(/\r?\n/u)
    .map(line => {
      const match = line.match(/^@([^【]+)【[^】]*】：(.*)$/u);
      if (!match) return line;
      return `${match[1].trim()}：${match[2].trim()}`;
    })
    .join('\n')
    .trim();
}

function extractStoryContent(message: { role: 'user' | 'assistant'; content: string }): string {
  if (message.role === 'assistant') {
    try {
      return cleanGalDirectives(extractPlayableText(message.content, { requirePlayableWrapper: false }));
    } catch {
      return cleanGalDirectives(message.content);
    }
  }

  const lines = message.content.split('\n');
  const storyStartIndex = lines.findIndex(
    line => line.includes('SOURCE_MESSAGES') || line.includes('前序剧情') || line.includes('已提供的'),
  );
  if (storyStartIndex >= 0) return lines.slice(storyStartIndex).join('\n').trim();

  const firstLine = lines[0]?.trim() ?? '';
  if (firstLine.length > 0 && firstLine.length < 200) return firstLine;

  const match = message.content.match(/请演绎[《「]([^》」]+)[》」]/u);
  return match ? `请求演绎：${match[1]}` : '（生成请求）';
}

function formatCalendarDate(date: CalendarDateValue): string {
  return `${date.year}年${date.month}月${date.day}日`;
}

function compareCalendarDates(left: CalendarDateValue, right: CalendarDateValue): number {
  return left.year - right.year || left.month - right.month || left.day - right.day;
}

function getMainStoryPair(
  floor: GalStoryFloor,
  messagesById: ReadonlyMap<string, GalStoryMessageSave>,
): [GalStoryMessageSave, GalStoryMessageSave] | null {
  const pair = floor.messageIds
    .map(messageId => messagesById.get(messageId))
    .filter((message): message is GalStoryMessageSave => message !== undefined);
  if (pair.length !== 2) return null;
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

function projectMainStoryFloors(
  snapshot: GameSnapshot,
  messages: readonly GalStoryMessageSave[],
): PendingFloorProjection[] {
  const messagesById = new Map(messages.map(message => [message.id, message]));
  return getCanonicalStoryTimeline(snapshot.game.mainStory.archives).flatMap((floor, stableOrder) => {
    const pair = getMainStoryPair(floor, messagesById);
    const act = getMainStoryAct(floor.eventId, floor.actId);
    if (!pair || !act) return [];

    const episode = getMainStoryEpisode(floor.eventId);
    const actIndex = getMainStoryActIndex(floor.eventId, floor.actId);
    const scopeLabel = `${episode?.title ?? floor.eventId} · ${actIndex >= 0 ? `第 ${actIndex + 1} 幕` : floor.actId}`;
    const sourceFloor: MemorySummarySourceFloor = {
      kind: 'main-story',
      floorId: floor.floorId,
      eventId: floor.eventId,
      actId: floor.actId,
      source: floor.source,
      createdAt: floor.createdAt,
      date: { ...act.trigger.date },
      actionNumber: act.trigger.actionNumber,
      messageIds: [pair[0].id, pair[1].id],
    };
    const projectedMessages = pair.map(message => ({
      id: message.id,
      role: message.extra.role,
      eventId: message.extra.eventId,
      actId: message.extra.actId,
      floorId: message.extra.floorId,
      source: message.extra.source,
      outcome: 'accepted' as const,
      canonicalOrdinal: 0,
      content: extractStoryContent({ role: message.extra.role, content: message.mes }),
      kind: 'main-story' as const,
      createdAt: message.send_date,
      scopeLabel,
    })) as [MemorySummarySourceMessage, MemorySummarySourceMessage];
    return [{ floor: sourceFloor, messages: projectedMessages, stableOrder }];
  });
}

function serializeDatingLines(content: DatingStageContent): string {
  return content.lines
    .map(line => (line.speaker ? `${line.speaker}：${line.text}` : line.text))
    .join('\n')
    .trim();
}

function projectDatingArchive(
  snapshot: GameSnapshot,
  archive: DatingArchive,
  stableOrder: number,
): PendingFloorProjection | null {
  const orderedContents = [...archive.contents].sort((left, right) =>
    left.stageId === right.stageId ? 0 : left.stageId === 'main' ? -1 : 1,
  );
  const body = orderedContents
    .map(content => `${content.stageId === 'main' ? '【约会正文】' : '【返程】'}\n${serializeDatingLines(content)}`)
    .join('\n')
    .trim();
  if (!body) return null;

  const floorId = archive.id;
  const messageIds: [string, string] = [`${floorId}-user`, `${floorId}-assistant`];
  const characterName =
    snapshot.cards.targets.find(target => target.id === archive.characterId)?.name ?? archive.characterId;
  const locationName = getDatingLocation(archive.locationId).label;
  const scopeLabel = `${formatCalendarDate(archive.date)} · ${characterName} · ${locationName}约会`;
  const source: 'tavern' | 'fallback' = orderedContents.every(content => content.source === 'tavern')
    ? 'tavern'
    : 'fallback';
  const common = {
    eventId: DATING_SUMMARY_EVENT_ID,
    actId: archive.appointmentId,
    floorId,
    source,
    outcome: 'accepted' as const,
    canonicalOrdinal: 0,
    kind: 'dating' as const,
    createdAt: archive.createdAt,
    scopeLabel,
  };
  return {
    floor: {
      kind: 'dating',
      floorId,
      eventId: common.eventId,
      actId: common.actId,
      source,
      createdAt: archive.createdAt,
      date: { ...archive.date },
      actionNumber: 1,
      messageIds,
    },
    messages: [
      {
        ...common,
        id: messageIds[0],
        role: 'user',
        content: `${formatCalendarDate(archive.date)}，${snapshot.player.name}与${characterName}在${locationName}完成了一场约会。以下为这场约会已保存的正文与返程记录。`,
      },
      {
        ...common,
        id: messageIds[1],
        role: 'assistant',
        content: body,
      },
    ],
    stableOrder,
  };
}

function projectDatingFloors(snapshot: GameSnapshot): PendingFloorProjection[] {
  const archives = snapshot.dating?.archives ?? [];
  return archives.flatMap((archive, archiveIndex) => {
    const projection = projectDatingArchive(snapshot, archive, archiveIndex);
    return projection ? [projection] : [];
  });
}

function compareFloorProjections(left: PendingFloorProjection, right: PendingFloorProjection): number {
  return (
    compareCalendarDates(left.floor.date, right.floor.date) ||
    left.floor.actionNumber - right.floor.actionNumber ||
    (left.floor.kind === right.floor.kind ? 0 : left.floor.kind === 'main-story' ? -1 : 1) ||
    left.stableOrder - right.stableOrder ||
    left.floor.createdAt.localeCompare(right.floor.createdAt) ||
    left.floor.floorId.localeCompare(right.floor.floorId)
  );
}

/**
 * Projects persisted, accepted narrative records into the two-message floor
 * contract consumed by memory summaries. Active dating runs are intentionally
 * excluded because only DatingArchive entries represent completed dates.
 */
export function createMemorySummarySourceProjection(
  snapshot: GameSnapshot,
  mainStoryMessages: readonly GalStoryMessageSave[],
): MemorySummarySourceProjection {
  const projections = [...projectMainStoryFloors(snapshot, mainStoryMessages), ...projectDatingFloors(snapshot)].sort(
    compareFloorProjections,
  );
  const messages: MemorySummarySourceMessage[] = [];
  const floors = projections.map((projection, canonicalOrdinal) => {
    const pair = projection.messages.map(message => ({ ...message, canonicalOrdinal })) as [
      MemorySummarySourceMessage,
      MemorySummarySourceMessage,
    ];
    messages.push(...pair);
    return { ...projection.floor, messageIds: [pair[0].id, pair[1].id] as [string, string] };
  });
  return { floors, messages };
}
