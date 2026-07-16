export const SAVE_PROTOCOL_VERSION = 1 as const;
export const SAVE_SCHEMA_VERSION = 1 as const;
export const SAVE_REQUEST_EVENT = 'tolove:save:request:v1';
export const SAVE_RESPONSE_EVENT = 'tolove:save:response:v1';
export const DEFAULT_SAVE_SLOT = 'autosave';
export const SAVE_FILE_FORMAT = 'tokimeki-to-love-gal-save' as const;
export const SAVE_FILE_FORMAT_VERSION = 1 as const;

export type SaveAction = 'probe' | 'list' | 'write' | 'load' | 'delete';
export type SaveBackend = 'tavern-file';

export interface SaveRequest {
  protocolVersion: typeof SAVE_PROTOCOL_VERSION;
  requestId: string;
  action: SaveAction;
  slotId?: string;
  saveUuid?: string;
  preview?: SavePreview;
  data?: unknown;
}

export interface SaveError {
  code: string;
  message: string;
}

export interface SaveResponse<TResult = unknown> {
  protocolVersion: typeof SAVE_PROTOCOL_VERSION;
  requestId: string;
  action: SaveAction;
  backend: SaveBackend;
  ok: boolean;
  result?: TResult;
  error?: SaveError;
}

export interface SaveRecord<TData = unknown> {
  schemaVersion: typeof SAVE_SCHEMA_VERSION;
  saveUuid: string;
  slotId: string;
  chatId: string | null;
  createdAt: string;
  updatedAt: string;
  revision: number;
  preview?: SavePreview;
  data: TData;
}

export interface SaveFileEnvelope<TData = unknown> {
  format: typeof SAVE_FILE_FORMAT;
  formatVersion: typeof SAVE_FILE_FORMAT_VERSION;
  save: SaveRecord<TData>;
}

export interface SavePreview {
  playerName: string;
  day: number;
  date?: CalendarDateValue;
  periodIndex: number;
  locationId: string;
  sceneId: string | null;
}

export type SaveSummary = Omit<SaveRecord, 'data'>;

export interface SaveProbeResult {
  backend: SaveBackend;
  persistent: boolean;
  sharedAcrossDevices: boolean;
  chatId: string | null;
  storagePath: string | null;
  saveCount: number;
  shujukuAvailable: boolean;
  uuidMode: 'crypto.randomUUID' | 'crypto.getRandomValues' | 'math-random';
}

export interface SaveListResult {
  saves: SaveSummary[];
}

export interface SaveWriteResult<TData = unknown> {
  save: SaveRecord<TData>;
}

export interface SaveLoadResult<TData = unknown> {
  save: SaveRecord<TData> | null;
}

export interface SaveDeleteResult {
  deleted: boolean;
  saveUuid: string | null;
}

export function toSaveSummary(save: SaveRecord): SaveSummary {
  const { data: _data, ...summary } = save;
  return summary;
}
import type { CalendarDateValue } from '../types';
