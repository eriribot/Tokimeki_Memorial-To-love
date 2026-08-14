import { normalizeMessageArchive, type MessageArchive } from './protocol';

export const FLOOR0_MESSAGE_MIRROR_KEY = '__tolove_message_archive_mirror_v1' as const;
export const FLOOR0_MESSAGE_MIRROR_SCHEMA_VERSION = 1 as const;

const FLOOR0_MESSAGE_MIRROR_KIND = 'tolove-message-archive-mirror' as const;
const FLOOR0_MESSAGE_MIRROR_AUTHORITY = 'tavern-file' as const;

export interface Floor0MessageMirrorPayload {
  schemaVersion: typeof FLOOR0_MESSAGE_MIRROR_SCHEMA_VERSION;
  kind: typeof FLOOR0_MESSAGE_MIRROR_KIND;
  authority: typeof FLOOR0_MESSAGE_MIRROR_AUTHORITY;
  mirroredAt: string;
  archive: MessageArchive;
}

export interface Floor0MirrorMessage {
  messageId: number;
  extra: Record<string, unknown>;
}

export interface Floor0MessageMirrorHost {
  getCurrentChatId(): string | null;
  getLastMessageId(): number;
  readFloor0(): Floor0MirrorMessage | null;
  writeFloor0Extra(extra: Record<string, unknown>): Promise<void>;
}

export type Floor0MessageMirrorResult =
  | {
      status: 'written';
      slotId: string;
      saveUuid: string;
      saveRevision: number;
    }
  | {
      status: 'skipped' | 'failed';
      reason: string;
      slotId: string;
      saveUuid: string;
      saveRevision: number;
    };

type HostFactory = () => Floor0MessageMirrorHost | null;

interface TavernMessageMirrorApi {
  getChatMessages: typeof getChatMessages;
  getLastMessageId: typeof getLastMessageId;
  setChatMessages: typeof setChatMessages;
}

interface SillyTavernChatIdentityApi {
  getCurrentChatId?: () => string;
}

function cloneJson<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function createPayload(archive: MessageArchive): Floor0MessageMirrorPayload {
  return {
    schemaVersion: FLOOR0_MESSAGE_MIRROR_SCHEMA_VERSION,
    kind: FLOOR0_MESSAGE_MIRROR_KIND,
    authority: FLOOR0_MESSAGE_MIRROR_AUTHORITY,
    mirroredAt: new Date().toISOString(),
    archive: normalizeMessageArchive(archive, archive.slotId),
  };
}

export function normalizeFloor0MessageMirrorPayload(value: unknown): Floor0MessageMirrorPayload {
  if (
    !isRecord(value) ||
    value.schemaVersion !== FLOOR0_MESSAGE_MIRROR_SCHEMA_VERSION ||
    value.kind !== FLOOR0_MESSAGE_MIRROR_KIND ||
    value.authority !== FLOOR0_MESSAGE_MIRROR_AUTHORITY ||
    typeof value.mirroredAt !== 'string'
  ) {
    throw new Error('chat[0].extra 中的 ToLove 对话镜像格式无效');
  }

  return {
    schemaVersion: FLOOR0_MESSAGE_MIRROR_SCHEMA_VERSION,
    kind: FLOOR0_MESSAGE_MIRROR_KIND,
    authority: FLOOR0_MESSAGE_MIRROR_AUTHORITY,
    mirroredAt: value.mirroredAt,
    archive: normalizeMessageArchive(value.archive),
  };
}

function resolveTavernHost(): Floor0MessageMirrorHost | null {
  const scope = globalThis as typeof globalThis & {
    SillyTavern?: SillyTavernChatIdentityApi;
    TavernHelper?: Partial<TavernMessageMirrorApi>;
  };
  const helper = scope.TavernHelper;
  if (
    typeof helper?.getChatMessages !== 'function' ||
    typeof helper.getLastMessageId !== 'function' ||
    typeof helper.setChatMessages !== 'function'
  ) {
    return null;
  }

  return {
    getCurrentChatId: () => scope.SillyTavern?.getCurrentChatId?.() ?? null,
    getLastMessageId: () => helper.getLastMessageId!(),
    readFloor0: () => {
      const message = helper.getChatMessages!(0, { include_swipes: false })[0];
      if (!message) return null;
      return {
        messageId: message.message_id,
        extra: isRecord(message.extra) ? cloneJson(message.extra) : {},
      };
    },
    writeFloor0Extra: extra =>
      helper.setChatMessages!([{ message_id: 0, extra: cloneJson(extra) }], { refresh: 'none' }),
  };
}

function resultBase(archive: MessageArchive) {
  return {
    slotId: archive.slotId,
    saveUuid: archive.saveUuid,
    saveRevision: archive.saveRevision,
  };
}

function archivesEqual(left: MessageArchive, right: MessageArchive): boolean {
  return JSON.stringify(left) === JSON.stringify(right);
}

export function createFloor0MessageMirror(hostFactory: HostFactory = resolveTavernHost) {
  let queue: Promise<void> = Promise.resolve();

  const writeOnce = async (input: MessageArchive): Promise<Floor0MessageMirrorResult> => {
    let archive: MessageArchive;
    try {
      archive = normalizeMessageArchive(input, input.slotId);
    } catch (error) {
      return {
        status: 'failed',
        reason: error instanceof Error ? error.message : String(error),
        ...resultBase(input),
      };
    }

    const base = resultBase(archive);
    try {
      const host = hostFactory();
      if (!host) {
        return { status: 'skipped', reason: '当前环境没有可用的 Tavern Helper 楼层消息接口', ...base };
      }
      if (host.getLastMessageId() !== 0) {
        return { status: 'skipped', reason: '当前聊天不是仅含 chat[0] 的同层拓扑', ...base };
      }

      const currentChatId = host.getCurrentChatId();
      if (archive.chatId && currentChatId && archive.chatId !== currentChatId) {
        return { status: 'skipped', reason: '对话档所属聊天与当前聊天不一致', ...base };
      }

      const floor0 = host.readFloor0();
      if (!floor0 || floor0.messageId !== 0) {
        return { status: 'skipped', reason: '当前聊天不存在可写入的 chat[0]', ...base };
      }

      const existingValue = floor0.extra[FLOOR0_MESSAGE_MIRROR_KEY];
      if (existingValue !== undefined) {
        let existing: Floor0MessageMirrorPayload;
        try {
          existing = normalizeFloor0MessageMirrorPayload(existingValue);
        } catch (error) {
          return {
            status: 'failed',
            reason: error instanceof Error ? error.message : String(error),
            ...base,
          };
        }

        if (existing.archive.slotId === archive.slotId) {
          if (existing.archive.saveRevision > archive.saveRevision) {
            return { status: 'skipped', reason: 'chat[0].extra 已有更新的同槽位对话镜像', ...base };
          }
          if (
            existing.archive.saveRevision === archive.saveRevision &&
            existing.archive.saveUuid === archive.saveUuid &&
            archivesEqual(existing.archive, archive)
          ) {
            return { status: 'skipped', reason: 'chat[0].extra 已是当前对话镜像', ...base };
          }
        }
      }

      const payload = createPayload(archive);
      await host.writeFloor0Extra({
        ...floor0.extra,
        [FLOOR0_MESSAGE_MIRROR_KEY]: payload,
      });

      const persistedFloor0 = host.readFloor0();
      const persisted = normalizeFloor0MessageMirrorPayload(persistedFloor0?.extra[FLOOR0_MESSAGE_MIRROR_KEY]);
      if (
        persistedFloor0?.messageId !== 0 ||
        persisted.archive.slotId !== archive.slotId ||
        persisted.archive.saveUuid !== archive.saveUuid ||
        persisted.archive.saveRevision !== archive.saveRevision ||
        !archivesEqual(persisted.archive, archive)
      ) {
        throw new Error('chat[0].extra 对话镜像写入后运行态校验失败');
      }

      return { status: 'written', ...base };
    } catch (error) {
      return {
        status: 'failed',
        reason: error instanceof Error ? error.message : String(error),
        ...base,
      };
    }
  };

  return {
    write(archive: MessageArchive): Promise<Floor0MessageMirrorResult> {
      const task = queue.then(() => writeOnce(archive));
      queue = task.then(
        () => undefined,
        () => undefined,
      );
      return task;
    },
  };
}

export const floor0MessageMirror = createFloor0MessageMirror();
