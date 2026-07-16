import {
  MESSAGE_FILE_FORMAT,
  MESSAGE_FILE_FORMAT_VERSION,
  MESSAGE_PROTOCOL_VERSION,
  MESSAGE_REQUEST_EVENT,
  MESSAGE_RESPONSE_EVENT,
  normalizeMessageArchive,
  type MessageArchive,
  type MessageDeleteResult,
  type MessageFileEnvelope,
  type MessageLoadResult,
  type MessageProbeResult,
  type MessageRequest,
  type MessageResponse,
  type MessageWriteResult,
} from '../message/protocol';

const BRIDGE_RUNTIME_KEY = '__toloveMessageBridgeRuntimeV1__';
const MESSAGE_FILE_PREFIX = 'tokimeki-to-love-messages';
const MESSAGE_PUBLIC_ROOT = '/user/files';
const MESSAGE_STORAGE_LABEL = 'user/files/tokimeki-to-love-messages-*.json';
const MESSAGE_SLOT_IDS = [
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
const MESSAGE_SLOT_ID_SET = new Set<string>(MESSAGE_SLOT_IDS);

interface BridgeRuntime {
  stop?: () => void;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function assertSlotId(value: string | undefined): string {
  const slotId = value?.trim();
  if (!slotId || !MESSAGE_SLOT_ID_SET.has(slotId)) {
    throw new Error(`不支持的对话槽位：${slotId || '空'}`);
  }
  return slotId;
}

function getMessageFileName(slotId: string): string {
  return `${MESSAGE_FILE_PREFIX}-${assertSlotId(slotId)}.json`;
}

function getMessageFilePath(slotId: string): string {
  return `${MESSAGE_PUBLIC_ROOT}/${getMessageFileName(slotId)}`;
}

function getRequestHeaders(): Record<string, string> {
  if (typeof SillyTavern === 'undefined' || typeof SillyTavern.getRequestHeaders !== 'function') {
    throw new Error('当前环境没有 SillyTavern 后端请求接口');
  }
  return { ...SillyTavern.getRequestHeaders(), 'Content-Type': 'application/json' };
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

function parseMessageFile(value: unknown, expectedSlotId: string): MessageArchive {
  if (!isRecord(value) || value.format !== MESSAGE_FILE_FORMAT || value.formatVersion !== MESSAGE_FILE_FORMAT_VERSION) {
    throw new Error(`文件 ${getMessageFileName(expectedSlotId)} 不是有效的 ToLove GAL 对话档`);
  }
  return normalizeMessageArchive(value.archive, expectedSlotId);
}

async function readSlotFile(slotId: string): Promise<MessageArchive | null> {
  const response = await fetch(`${getMessageFilePath(slotId)}?tolove=${Date.now()}`, {
    method: 'GET',
    cache: 'no-store',
    headers: getRequestHeaders(),
  });
  if (response.status === 404) return null;
  if (!response.ok) {
    throw new Error(`读取 ${getMessageFileName(slotId)} 失败：${await getResponseError(response)}`);
  }
  return parseMessageFile(await response.json(), slotId);
}

async function uploadSlotFile(archive: MessageArchive): Promise<MessageArchive> {
  const envelope: MessageFileEnvelope = {
    format: MESSAGE_FILE_FORMAT,
    formatVersion: MESSAGE_FILE_FORMAT_VERSION,
    archive,
  };
  const fileName = getMessageFileName(archive.slotId);
  const expectedPath = getMessageFilePath(archive.slotId);
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
    throw new Error(`SillyTavern 返回了意外的对话档路径：${uploadedPath || '空'}`);
  }

  const persisted = await readSlotFile(archive.slotId);
  if (!persisted || persisted.saveUuid !== archive.saveUuid || persisted.saveRevision !== archive.saveRevision) {
    throw new Error(`对话档 ${fileName} 写入后校验失败`);
  }
  return persisted;
}

async function probe(): Promise<MessageProbeResult> {
  const archives = await Promise.all(MESSAGE_SLOT_IDS.map(slotId => readSlotFile(slotId)));
  return {
    backend: 'tavern-file',
    persistent: true,
    storagePath: MESSAGE_STORAGE_LABEL,
    archiveCount: archives.filter(archive => archive !== null).length,
  };
}

async function write(request: MessageRequest): Promise<MessageWriteResult> {
  if (!request.archive) throw new Error('对话档数据不能为空');
  const slotId = assertSlotId(request.archive.slotId);
  const archive = normalizeMessageArchive(request.archive, slotId);
  return { archive: await uploadSlotFile(archive) };
}

async function load(request: MessageRequest): Promise<MessageLoadResult> {
  const archive = await readSlotFile(assertSlotId(request.slotId));
  return {
    archive: request.saveUuid && archive?.saveUuid !== request.saveUuid ? null : archive,
  };
}

async function remove(request: MessageRequest): Promise<MessageDeleteResult> {
  const slotId = assertSlotId(request.slotId);
  const archive = await readSlotFile(slotId);
  if (!archive || (request.saveUuid && archive.saveUuid !== request.saveUuid)) {
    return { deleted: false, saveUuid: null };
  }

  const response = await fetch('/api/files/delete', {
    method: 'POST',
    headers: getRequestHeaders(),
    body: JSON.stringify({ path: getMessageFilePath(slotId) }),
  });
  if (response.status === 404) return { deleted: false, saveUuid: null };
  if (!response.ok) {
    throw new Error(`删除 ${getMessageFileName(slotId)} 失败：${await getResponseError(response)}`);
  }
  return { deleted: true, saveUuid: archive.saveUuid };
}

async function dispatch(request: MessageRequest): Promise<unknown> {
  switch (request.action) {
    case 'probe':
      return probe();
    case 'write':
      return write(request);
    case 'load':
      return load(request);
    case 'delete':
      return remove(request);
    default:
      throw new Error(`不支持的对话档操作：${String(request.action)}`);
  }
}

function isMessageRequest(value: unknown): value is MessageRequest {
  return (
    isRecord(value) &&
    value.protocolVersion === MESSAGE_PROTOCOL_VERSION &&
    typeof value.requestId === 'string' &&
    typeof value.action === 'string'
  );
}

async function respond(request: MessageRequest): Promise<void> {
  let response: MessageResponse;
  try {
    response = {
      protocolVersion: MESSAGE_PROTOCOL_VERSION,
      requestId: request.requestId,
      action: request.action,
      backend: 'tavern-file',
      ok: true,
      result: await dispatch(request),
    };
  } catch (error) {
    response = {
      protocolVersion: MESSAGE_PROTOCOL_VERSION,
      requestId: request.requestId,
      action: request.action,
      backend: 'tavern-file',
      ok: false,
      error: {
        code: 'MESSAGE_FILE_OPERATION_FAILED',
        message: error instanceof Error ? error.message : String(error),
      },
    };
  }
  await eventEmit(MESSAGE_RESPONSE_EVENT, response);
}

let requestQueue = Promise.resolve();
const scope = globalThis as typeof globalThis & Record<string, BridgeRuntime | undefined>;
scope[BRIDGE_RUNTIME_KEY]?.stop?.();

const subscription = eventOn(MESSAGE_REQUEST_EVENT, (request: unknown) => {
  if (!isMessageRequest(request)) return;
  requestQueue = requestQueue.catch(() => undefined).then(() => respond(request));
});

scope[BRIDGE_RUNTIME_KEY] = {
  stop: () => subscription?.stop?.(),
};

console.info(`[ToLove Messages] SillyTavern 对话档桥已启动：${MESSAGE_STORAGE_LABEL}`);
