import type { GalStoryActArchive, GalStoryFloor, GalStoryMessageSave } from './storyTypes';

export interface RawStoryTextPage {
  pageIndex: number;
  start: number;
  end: number;
  text: string;
}

export interface RawStoryVersionView {
  floor: GalStoryFloor;
  floorIndex: number;
  message: GalStoryMessageSave;
  pages: RawStoryTextPage[];
  isActive: boolean;
}

export interface RawStoryActView {
  actIndex: number;
  actId: string;
  versions: RawStoryVersionView[];
}

const RAW_PAGE_MAX_CHARACTERS = 900;
const RAW_PAGE_BREAK_MARKERS = ['\r\n\r\n', '\n\n', '\r\n', '\n', '。', '！', '？', '!', '?'] as const;

export function paginateRawStoryText(
  text: string,
  maxCharacters = RAW_PAGE_MAX_CHARACTERS,
): RawStoryTextPage[] {
  const pageSize = Math.max(200, Math.trunc(maxCharacters));
  const pages: RawStoryTextPage[] = [];
  let start = 0;

  while (start < text.length) {
    let end = Math.min(text.length, start + pageSize);
    if (end < text.length) {
      const candidate = text.slice(start, end);
      const minimumBreakOffset = Math.floor(pageSize * 0.55);
      let breakOffset = -1;
      for (const marker of RAW_PAGE_BREAK_MARKERS) {
        const markerIndex = candidate.lastIndexOf(marker);
        if (markerIndex < minimumBreakOffset) continue;
        breakOffset = Math.max(breakOffset, markerIndex + marker.length);
      }
      if (breakOffset > 0) end = start + breakOffset;
    }

    pages.push({ pageIndex: pages.length, start, end, text: text.slice(start, end) });
    start = end;
  }

  return pages.length > 0 ? pages : [{ pageIndex: 0, start: 0, end: 0, text: '' }];
}

function getRawAssistantMessage(
  floor: GalStoryFloor,
  messagesById: ReadonlyMap<string, GalStoryMessageSave>,
): GalStoryMessageSave | null {
  for (const messageId of floor.messageIds) {
    const message = messagesById.get(messageId);
    if (
      message &&
      !message.is_user &&
      message.extra.role === 'assistant' &&
      message.extra.source === 'tavern'
    ) {
      return message;
    }
  }
  return null;
}

export function buildRawStoryArchive(
  archives: readonly GalStoryActArchive[],
  messages: readonly GalStoryMessageSave[],
): RawStoryActView[] {
  const messagesById = new Map(messages.map(message => [message.id, message]));

  return [...archives]
    .sort((left, right) => left.actIndex - right.actIndex)
    .flatMap(archive => {
      const versions = archive.floors.flatMap((floor, floorIndex): RawStoryVersionView[] => {
        const message = getRawAssistantMessage(floor, messagesById);
        if (!message) return [];
        return [
          {
            floor,
            floorIndex,
            message,
            pages: paginateRawStoryText(message.mes),
            isActive: floor.floorId === archive.activeFloorId,
          },
        ];
      });
      return versions.length > 0 ? [{ actIndex: archive.actIndex, actId: archive.actId, versions }] : [];
    });
}
