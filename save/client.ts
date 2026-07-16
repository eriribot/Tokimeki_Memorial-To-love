import {
  SAVE_PROTOCOL_VERSION,
  SAVE_REQUEST_EVENT,
  SAVE_RESPONSE_EVENT,
  type SaveAction,
  type SaveDeleteResult,
  type SaveListResult,
  type SaveLoadResult,
  type SaveProbeResult,
  type SavePreview,
  type SaveRequest,
  type SaveResponse,
  type SaveWriteResult,
} from './protocol';
import { createSaveUuid } from './uuid';

interface EventSubscription {
  stop?: () => void;
}

interface EventApi {
  on: (eventName: string, listener: (payload: SaveResponse) => void) => EventSubscription | void;
  emit: (eventName: string, payload: SaveRequest) => Promise<void> | void;
}

interface PendingRequest {
  resolve: (response: SaveResponse) => void;
  reject: (error: Error) => void;
  timeoutId: ReturnType<typeof setTimeout>;
}

function resolveEventApi(): EventApi | null {
  const scope = globalThis as typeof globalThis & {
    eventOn?: EventApi['on'];
    eventEmit?: EventApi['emit'];
    TavernHelper?: {
      eventOn?: EventApi['on'];
      eventEmit?: EventApi['emit'];
    };
  };

  if (typeof scope.eventOn === 'function' && typeof scope.eventEmit === 'function') {
    return { on: scope.eventOn.bind(scope), emit: scope.eventEmit.bind(scope) };
  }

  const helper = scope.TavernHelper;
  if (typeof helper?.eventOn === 'function' && typeof helper.eventEmit === 'function') {
    return { on: helper.eventOn.bind(helper), emit: helper.eventEmit.bind(helper) };
  }

  return null;
}

class TavernSaveTransport {
  private api: EventApi | null = null;
  private subscription?: EventSubscription;
  private readonly pending = new Map<string, PendingRequest>();

  request<TResult>(
    action: SaveAction,
    payload: Omit<SaveRequest, 'protocolVersion' | 'requestId' | 'action'> = {},
    timeoutMs = 3500,
  ): Promise<TResult> {
    this.ensureListening();
    if (!this.api) {
      return Promise.reject(new Error('当前页面没有 Tavern Helper 事件接口，无法读取酒馆本地文件存档'));
    }

    const requestId = createSaveUuid();
    const request: SaveRequest = {
      protocolVersion: SAVE_PROTOCOL_VERSION,
      requestId,
      action,
      ...payload,
    };

    return new Promise<TResult>((resolve, reject) => {
      const timeoutId = setTimeout(() => {
        this.pending.delete(requestId);
        reject(new Error('ToLove存档槽脚本未响应；请在 Tavern Helper 中导入、绑定并启用该脚本'));
      }, timeoutMs);

      this.pending.set(requestId, {
        timeoutId,
        reject,
        resolve: response => {
          if (!response.ok) {
            reject(new Error(response.error?.message ?? 'ToLove存档槽脚本返回未知错误'));
            return;
          }
          resolve(response.result as TResult);
        },
      });

      Promise.resolve(this.api?.emit(SAVE_REQUEST_EVENT, request)).catch((error: unknown) => {
        const pending = this.pending.get(requestId);
        if (!pending) return;
        clearTimeout(pending.timeoutId);
        this.pending.delete(requestId);
        reject(error instanceof Error ? error : new Error(String(error)));
      });
    });
  }

  dispose(): void {
    this.subscription?.stop?.();
    this.subscription = undefined;
    this.api = null;

    for (const pending of this.pending.values()) {
      clearTimeout(pending.timeoutId);
      pending.reject(new Error('存档客户端已关闭'));
    }
    this.pending.clear();
  }

  private ensureListening(): void {
    if (this.api) return;
    this.api = resolveEventApi();
    if (!this.api) return;

    const subscription = this.api.on(SAVE_RESPONSE_EVENT, response => {
      if (response?.protocolVersion !== SAVE_PROTOCOL_VERSION || !response.requestId) return;
      const pending = this.pending.get(response.requestId);
      if (!pending) return;

      clearTimeout(pending.timeoutId);
      this.pending.delete(response.requestId);
      pending.resolve(response);
    });
    this.subscription = subscription || undefined;
  }
}

export class TavernFileSaveClient {
  private readonly tavern = new TavernSaveTransport();

  probe(_force = false): Promise<SaveProbeResult> {
    return this.tavern.request<SaveProbeResult>('probe', {}, 2500);
  }

  list(): Promise<SaveListResult> {
    return this.tavern.request<SaveListResult>('list');
  }

  write<TData>(slotId: string, data: TData, saveUuid?: string, preview?: SavePreview): Promise<SaveWriteResult<TData>> {
    if (!slotId.trim()) {
      return Promise.reject(new Error('存档槽位不能为空'));
    }
    return this.tavern.request<SaveWriteResult<TData>>('write', { slotId, data, saveUuid, preview });
  }

  load<TData>(slotId?: string, saveUuid?: string): Promise<SaveLoadResult<TData>> {
    return this.tavern.request<SaveLoadResult<TData>>('load', { slotId, saveUuid });
  }

  delete(slotId?: string, saveUuid?: string): Promise<SaveDeleteResult> {
    return this.tavern.request<SaveDeleteResult>('delete', { slotId, saveUuid });
  }

  resetBackend(): void {
    this.tavern.dispose();
  }
}

export const saveClient = new TavernFileSaveClient();
