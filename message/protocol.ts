import type { GalStoryMessageSave } from '../GalMainStory/storyTypes';

export const MESSAGE_PROTOCOL_VERSION = 1 as const;
export const MESSAGE_SCHEMA_VERSION = 1 as const;
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
    typeof value.name === 'string' &&
    typeof value.is_user === 'boolean' &&
    typeof value.is_system === 'boolean' &&
    typeof value.mes === 'string' &&
    typeof value.send_date === 'string' &&
    extra.type === 'tolove-main-story' &&
    typeof extra.eventId === 'string' &&
    typeof extra.actIndex === 'number' &&
    typeof extra.actId === 'string' &&
    (extra.entryReason === 'after_first_action' || extra.entryReason === 'after_second_action') &&
    (extra.source === 'tavern' || extra.source === 'fallback') &&
    typeof extra.generationId === 'string' &&
    typeof extra.period === 'string' &&
    typeof extra.location === 'string' &&
    (extra.role === 'user' || extra.role === 'assistant') &&
    typeof extra.renderable === 'boolean'
  );
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
    !Array.isArray(value.messages) ||
    !value.messages.every(isStoryMessage)
  ) {
    throw new Error('对话档内容不完整或与槽位不匹配');
  }

  return cloneJson(value as unknown as MessageArchive);
}
