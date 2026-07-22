import type { GalStoryMessageSave } from '../GalMainStory/storyTypes';

export const MESSAGE_PROTOCOL_VERSION = 1 as const;
export const MESSAGE_SCHEMA_VERSION = 2 as const;
export const MESSAGE_REQUEST_EVENT = 'tolove:message:request:v1';
export const MESSAGE_RESPONSE_EVENT = 'tolove:message:response:v1';
export const MESSAGE_FILE_FORMAT = 'tokimeki-to-love-gal-messages' as const;
export const MESSAGE_FILE_FORMAT_VERSION = 1 as const;

export type MessageAction = 'probe' | 'write' | 'load' | 'delete';

export interface MessageArchive {
  schemaVersion: typeof MESSAGE_SCHEMA_VERSION;
  slotId: string;
  saveUuid: string;
  saveRevision: number;
  chatId: string | null;
  updatedAt: string;
  messages: GalStoryMessageSave[];
}

export interface MessageFileEnvelope {
  format: typeof MESSAGE_FILE_FORMAT;
  formatVersion: typeof MESSAGE_FILE_FORMAT_VERSION;
  archive: MessageArchive;
}

export interface MessageRequest {
  protocolVersion: typeof MESSAGE_PROTOCOL_VERSION;
  requestId: string;
  action: MessageAction;
  slotId?: string;
  saveUuid?: string;
  archive?: MessageArchive;
}

export interface MessageResponse<TResult = unknown> {
  protocolVersion: typeof MESSAGE_PROTOCOL_VERSION;
  requestId: string;
  action: MessageAction;
  backend: 'tavern-file';
  ok: boolean;
  result?: TResult;
  error?: {
    code: string;
    message: string;
  };
}

export interface MessageProbeResult {
  backend: 'tavern-file';
  persistent: true;
  storagePath: string;
  archiveCount: number;
}

export interface MessageWriteResult {
  archive: MessageArchive;
}

export interface MessageLoadResult {
  archive: MessageArchive | null;
}

export interface MessageDeleteResult {
  deleted: boolean;
  saveUuid: string | null;
}

function cloneJson<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isStoryMessage(value: unknown): value is GalStoryMessageSave {
  if (!isRecord(value) || !isRecord(value.extra)) return false;
  const extra = value.extra;
  return (
    typeof value.id === 'string' &&
    value.id.trim().length > 0 &&
    typeof value.name === 'string' &&
    typeof value.is_user === 'boolean' &&
    typeof value.is_system === 'boolean' &&
    typeof value.mes === 'string' &&
    typeof value.send_date === 'string' &&
    extra.type === 'tolove-main-story' &&
    typeof extra.eventId === 'string' &&
    typeof extra.actId === 'string' &&
    (extra.source === 'tavern' || extra.source === 'fallback') &&
    typeof extra.floorId === 'string' &&
    extra.floorId.trim().length > 0 &&
    typeof extra.period === 'string' &&
    typeof extra.location === 'string' &&
    typeof extra.day === 'number' &&
    Number.isFinite(extra.day) &&
    typeof extra.playerName === 'string' &&
    Array.isArray(extra.contextFloorIds) &&
    extra.contextFloorIds.every(id => typeof id === 'string' && id.trim().length > 0) &&
    new Set(extra.contextFloorIds).size === extra.contextFloorIds.length &&
    (extra.role === 'user' || extra.role === 'assistant') &&
    typeof extra.renderable === 'boolean' &&
    (extra.outcome === 'accepted' || extra.outcome === 'parse_error') &&
    (extra.error === undefined || typeof extra.error === 'string')
  );
}

function hasConsistentFloorPairs(messages: readonly GalStoryMessageSave[]): boolean {
  const pairs = new Map<string, { signature: string; roles: Set<'user' | 'assistant'> }>();
  for (const message of messages) {
    const floorId = message.extra.floorId;
    const role = message.extra.role;
    const hasCompleteFloorMetadata =
      (message.extra.outcome === 'accepted' || message.extra.outcome === 'parse_error') &&
      typeof message.extra.day === 'number' &&
      Number.isFinite(message.extra.day) &&
      typeof message.extra.playerName === 'string' &&
      Array.isArray(message.extra.contextFloorIds) &&
      (message.extra.outcome === 'accepted'
        ? message.extra.error === undefined
        : typeof message.extra.error === 'string' && message.extra.error.trim().length > 0);
    if (
      !hasCompleteFloorMetadata ||
      message.id !== `${floorId}-${role}` ||
      message.is_system ||
      (role === 'user' ? !message.is_user : message.is_user) ||
      message.extra.renderable !== (role === 'assistant' && message.extra.outcome !== 'parse_error')
    ) {
      return false;
    }

    const signature = JSON.stringify([
      message.extra.eventId,
      message.extra.actId,
      message.extra.source,
      message.extra.period,
      message.extra.location,
      message.extra.day,
      message.extra.playerName,
      message.extra.contextFloorIds,
      message.extra.outcome,
      message.extra.error ?? null,
    ]);
    const pair = pairs.get(floorId);
    if (!pair) {
      pairs.set(floorId, { signature, roles: new Set([role]) });
      continue;
    }
    if (pair.signature !== signature || pair.roles.has(role)) return false;
    pair.roles.add(role);
  }
  return [...pairs.values()].every(pair => pair.roles.has('user') && pair.roles.has('assistant'));
}

export function normalizeStoryMessages(value: unknown): GalStoryMessageSave[] {
  if (!Array.isArray(value) || !value.every(isStoryMessage)) {
    throw new Error('剧情消息列表格式无效');
  }
  const messages = value as GalStoryMessageSave[];
  if (new Set(messages.map(message => message.id)).size !== messages.length) {
    throw new Error('剧情消息 ID 重复');
  }
  if (!hasConsistentFloorPairs(messages)) {
    throw new Error('剧情楼层消息配对不完整或身份冲突');
  }
  return cloneJson(messages);
}

export function normalizeMessageArchive(value: unknown, expectedSlotId?: string): MessageArchive {
  if (!isRecord(value) || value.schemaVersion !== MESSAGE_SCHEMA_VERSION) {
    throw new Error('对话档版本无效或暂不兼容');
  }
  if (
    typeof value.slotId !== 'string' ||
    (expectedSlotId !== undefined && value.slotId !== expectedSlotId) ||
    typeof value.saveUuid !== 'string' ||
    typeof value.saveRevision !== 'number' ||
    !Number.isInteger(value.saveRevision) ||
    value.saveRevision < 1 ||
    (value.chatId !== null && typeof value.chatId !== 'string') ||
    typeof value.updatedAt !== 'string' ||
    !Array.isArray(value.messages)
  ) {
    throw new Error('对话档内容不完整或与槽位不匹配');
  }

  return {
    schemaVersion: MESSAGE_SCHEMA_VERSION,
    slotId: value.slotId,
    saveUuid: value.saveUuid,
    saveRevision: value.saveRevision,
    chatId: value.chatId,
    updatedAt: value.updatedAt,
    messages: normalizeStoryMessages(value.messages),
  };
}
