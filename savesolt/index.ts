import {
  SAVE_FILE_FORMAT,
  SAVE_FILE_FORMAT_VERSION,
  SAVE_PROTOCOL_VERSION,
  SAVE_REQUEST_EVENT,
  SAVE_RESPONSE_EVENT,
  SAVE_SCHEMA_VERSION,
  type SaveDeleteResult,
  type SaveFileEnvelope,
  type SaveListResult,
  type SaveLoadResult,
  type SaveProbeResult,
  type SaveRecord,
  type SaveRequest,
  type SaveResponse,
  type SaveWriteResult,
  toSaveSummary,
} from '../save/protocol';
import { createSaveUuid, getUuidMode } from '../save/uuid';

const BRIDGE_RUNTIME_KEY = '__toloveSaveBridgeRuntimeV1__';
const SAVE_FILE_PREFIX = 'tokimeki-to-love-save';
const SAVE_PUBLIC_ROOT = '/user/files';
const SAVE_STORAGE_LABEL = 'user/files/tokimeki-to-love-save-*.json';
const SAVE_SLOT_IDS = [
  'autosave',
  'slot-01',
  'slot-02',
  'slot-03',
  'slot-04',
  'slot-05',
  'slot-06',
  'slot-07',
  'slot-08',
] as const;
const SAVE_SLOT_ID_SET = new Set<string>(SAVE_SLOT_IDS);

interface BridgeRuntime {
  stop?: () => void;
}

function cloneJson<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function assertSlotId(value: string | undefined): string {
  const slotId = value?.trim();
  if (!slotId || !SAVE_SLOT_ID_SET.has(slotId)) {
    throw new Error(`不支持的存档槽位：${slotId || '空'}`);
  }
  return slotId;
}

function getSaveFileName(slotId: string): string {
  return `${SAVE_FILE_PREFIX}-${assertSlotId(slotId)}.json`;
}

function getSaveFilePath(slotId: string): string {
  return `${SAVE_PUBLIC_ROOT}/${getSaveFileName(slotId)}`;
}

function getCurrentChatId(): string | null {
  try {
    return SillyTavern.getCurrentChatId() ?? null;
  } catch {
    return null;
  }
}

function getRequestHeaders(): Record<string, string> {
  if (typeof SillyTavern === 'undefined' || typeof SillyTavern.getRequestHeaders !== 'function') {
    throw new Error('当前环境没有 SillyTavern 后端请求接口');
  }
  return { ...SillyTavern.getRequestHeaders(), 'Content-Type': 'application/json' };
}

function hasShujukuApi(): boolean {
  let currentWindow: Window | null = window;

  for (let depth = 0; depth < 8 && currentWindow; depth += 1) {
    try {
      if ((currentWindow as Window & { AutoCardUpdaterAPI?: unknown }).AutoCardUpdaterAPI) {
        return true;
      }
      if (currentWindow.parent === currentWindow) break;
      currentWindow = currentWindow.parent;
    } catch {
      break;
    }
  }

  return false;
}

function encodeBase64Utf8(value: string): string {
  const bytes = new TextEncoder().encode(value);
  const chunks: string[] = [];

  for (let offset = 0; offset < bytes.length; offset += 0x8000) {
    chunks.push(String.fromCharCode(...bytes.subarray(offset, offset + 0x8000)));
  }

  return btoa(chunks.join(''));
}

async function getResponseError(response: Response): Promise<string> {
  try {
    const message = (await response.text()).trim();
    return message || `${response.status} ${response.statusText}`;
  } catch {
    return `${response.status} ${response.statusText}`;
  }
}

function normalizeSaveRecord(value: unknown, expectedSlotId: string): SaveRecord {
  if (!isRecord(value) || value.schemaVersion !== SAVE_SCHEMA_VERSION) {
    throw new Error(`存档文件 ${getSaveFileName(expectedSlotId)} 的版本无效`);
  }
  if (
    typeof value.saveUuid !== 'string' ||
    value.slotId !== expectedSlotId ||
    typeof value.createdAt !== 'string' ||
    typeof value.updatedAt !== 'string' ||
    typeof value.revision !== 'number' ||
    !('data' in value)
  ) {
    throw new Error(`存档文件 ${getSaveFileName(expectedSlotId)} 的内容不完整`);
  }

  return cloneJson(value as unknown as SaveRecord);
}

function parseSaveFile(value: unknown, expectedSlotId: string): SaveRecord {
  if (!isRecord(value) || value.format !== SAVE_FILE_FORMAT || value.formatVersion !== SAVE_FILE_FORMAT_VERSION) {
    throw new Error(`文件 ${getSaveFileName(expectedSlotId)} 不是有效的 ToLove GAL 存档`);
  }

  return normalizeSaveRecord(value.save, expectedSlotId);
}

async function readSlotFile(slotId: string): Promise<SaveRecord | null> {
  const filePath = getSaveFilePath(slotId);
  const response = await fetch(`${filePath}?tolove=${Date.now()}`, {
    method: 'GET',
    cache: 'no-store',
    headers: getRequestHeaders(),
  });

  if (response.status === 404) return null;
  if (!response.ok) {
    throw new Error(`读取 ${getSaveFileName(slotId)} 失败：${await getResponseError(response)}`);
  }

  try {
    return parseSaveFile(await response.json(), slotId);
  } catch (error) {
    if (error instanceof Error) throw error;
    throw new Error(`无法解析 ${getSaveFileName(slotId)}`, { cause: error });
  }
}

async function uploadSlotFile(save: SaveRecord): Promise<SaveRecord> {
  const envelope: SaveFileEnvelope = {
    format: SAVE_FILE_FORMAT,
    formatVersion: SAVE_FILE_FORMAT_VERSION,
    save: cloneJson(save),
  };
  const fileName = getSaveFileName(save.slotId);
  const expectedPath = getSaveFilePath(save.slotId);
  const response = await fetch('/api/files/upload', {
    method: 'POST',
    headers: getRequestHeaders(),
    body: JSON.stringify({
      name: fileName,
      data: encodeBase64Utf8(JSON.stringify(envelope, null, 2)),
    }),
  });

  if (!response.ok) {
    throw new Error(`写入 ${fileName} 失败：${await getResponseError(response)}`);
  }

  const result = (await response.json()) as { path?: unknown };
  const uploadedPath = typeof result.path === 'string' ? result.path.replace(/\\/g, '/') : '';
  if (uploadedPath !== expectedPath) {
    throw new Error(`SillyTavern 返回了意外的存档路径：${uploadedPath || '空'}`);
  }

  const persisted = await readSlotFile(save.slotId);
  if (!persisted || persisted.saveUuid !== save.saveUuid || persisted.revision !== save.revision) {
    throw new Error(`存档 ${fileName} 写入后校验失败`);
  }
  return persisted;
}

async function list(): Promise<SaveListResult> {
  const records = await Promise.all(SAVE_SLOT_IDS.map(slotId => readSlotFile(slotId)));
  const saves = records
    .filter((save): save is SaveRecord => save !== null)
    .map(toSaveSummary)
    .sort((left, right) => right.updatedAt.localeCompare(left.updatedAt));
  return { saves };
}

async function probe(): Promise<SaveProbeResult> {
  const result = await list();
  return {
    backend: 'tavern-file',
    persistent: true,
    sharedAcrossDevices: true,
    chatId: getCurrentChatId(),
    storagePath: SAVE_STORAGE_LABEL,
    saveCount: result.saves.length,
    shujukuAvailable: hasShujukuApi(),
    uuidMode: getUuidMode(),
  };
}

async function write(request: SaveRequest): Promise<SaveWriteResult> {
  const slotId = assertSlotId(request.slotId);
  if (request.data === undefined) {
    throw new Error('存档数据不能为空');
  }

  const existing = await readSlotFile(slotId);
  const requestedUuid = request.saveUuid?.trim();
  const saveUuid = requestedUuid || existing?.saveUuid || createSaveUuid();
  const now = new Date().toISOString();
  const save: SaveRecord = {
    schemaVersion: SAVE_SCHEMA_VERSION,
    saveUuid,
    slotId,
    chatId: getCurrentChatId(),
    createdAt: existing?.createdAt ?? now,
    updatedAt: now,
    revision: (existing?.revision ?? 0) + 1,
    preview: request.preview ? cloneJson(request.preview) : existing?.preview,
    data: cloneJson(request.data),
  };

  return { save: await uploadSlotFile(save) };
}

async function resolveSave(request: SaveRequest): Promise<SaveRecord | null> {
  if (request.slotId) {
    const save = await readSlotFile(assertSlotId(request.slotId));
    return request.saveUuid && save?.saveUuid !== request.saveUuid ? null : save;
  }

  if (request.saveUuid) {
    const records = await Promise.all(SAVE_SLOT_IDS.map(slotId => readSlotFile(slotId)));
    return records.find(save => save?.saveUuid === request.saveUuid) ?? null;
  }

  return null;
}

async function load(request: SaveRequest): Promise<SaveLoadResult> {
  return { save: await resolveSave(request) };
}

async function remove(request: SaveRequest): Promise<SaveDeleteResult> {
  const save = await resolveSave(request);
  if (!save) return { deleted: false, saveUuid: null };

  const response = await fetch('/api/files/delete', {
    method: 'POST',
    headers: getRequestHeaders(),
    body: JSON.stringify({ path: getSaveFilePath(save.slotId) }),
  });
  if (response.status === 404) return { deleted: false, saveUuid: null };
  if (!response.ok) {
    throw new Error(`删除 ${getSaveFileName(save.slotId)} 失败：${await getResponseError(response)}`);
  }

  return { deleted: true, saveUuid: save.saveUuid };
}

async function dispatch(request: SaveRequest): Promise<unknown> {
  switch (request.action) {
    case 'probe':
      return probe();
    case 'list':
      return list();
    case 'write':
      return write(request);
    case 'load':
      return load(request);
    case 'delete':
      return remove(request);
    default:
      throw new Error(`不支持的存档操作：${String(request.action)}`);
  }
}

function isSaveRequest(value: unknown): value is SaveRequest {
  return (
    isRecord(value) &&
    value.protocolVersion === SAVE_PROTOCOL_VERSION &&
    typeof value.requestId === 'string' &&
    typeof value.action === 'string'
  );
}

async function respond(request: SaveRequest): Promise<void> {
  let response: SaveResponse;

  try {
    const result = await dispatch(request);
    response = {
      protocolVersion: SAVE_PROTOCOL_VERSION,
      requestId: request.requestId,
      action: request.action,
      backend: 'tavern-file',
      ok: true,
      result,
    };
  } catch (error) {
    response = {
      protocolVersion: SAVE_PROTOCOL_VERSION,
      requestId: request.requestId,
      action: request.action,
      backend: 'tavern-file',
      ok: false,
      error: {
        code: 'SAVE_FILE_OPERATION_FAILED',
        message: error instanceof Error ? error.message : String(error),
      },
    };
  }

  await eventEmit(SAVE_RESPONSE_EVENT, response);
}

let requestQueue = Promise.resolve();
const scope = globalThis as typeof globalThis & Record<string, BridgeRuntime | undefined>;
scope[BRIDGE_RUNTIME_KEY]?.stop?.();

const subscription = eventOn(SAVE_REQUEST_EVENT, (request: unknown) => {
  if (!isSaveRequest(request)) return;
  requestQueue = requestQueue.catch(() => undefined).then(() => respond(request));
});

scope[BRIDGE_RUNTIME_KEY] = {
  stop: () => subscription?.stop?.(),
};

console.info(`[ToLove Save] SillyTavern 文件存档桥已启动：${SAVE_STORAGE_LABEL}`);
