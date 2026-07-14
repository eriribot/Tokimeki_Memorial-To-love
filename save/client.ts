import { BrowserSaveStore } from './browserStore';
import {
  SAVE_PROTOCOL_VERSION,
  SAVE_REQUEST_EVENT,
  SAVE_RESPONSE_EVENT,
  type SaveAction,
  type SaveBackend,
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

type BackendSelection = 'unknown' | SaveBackend;

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

  isAvailable(): boolean {
    return resolveEventApi() !== null;
  }

  request<TResult>(
    action: SaveAction,
    payload: Omit<SaveRequest, 'protocolVersion' | 'requestId' | 'action'> = {},
    timeoutMs = 3500,
  ): Promise<TResult> {
    this.ensureListening();
    if (!this.api) {
      return Promise.reject(new Error('当前页面没有酒馆助手事件接口'));
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
        reject(new Error('SillyTavern 文件存档桥未响应；请确认角色卡已绑定并启用存档脚本'));
      }, timeoutMs);

      this.pending.set(requestId, {
        timeoutId,
        reject,
        resolve: response => {
          if (!response.ok) {
            reject(new Error(response.error?.message ?? 'SillyTavern 文件存档桥返回未知错误'));
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

export class HybridSaveClient {
  private backend: BackendSelection = 'unknown';
  private readonly browser = new BrowserSaveStore();
  private readonly tavern = new TavernSaveTransport();

  async probe(force = false): Promise<SaveProbeResult> {
    if (force) {
      this.backend = 'unknown';
    }

    if (this.backend === 'tavern-file') {
      return this.tavern.request<SaveProbeResult>('probe');
    }

    if (this.backend === 'browser-local') {
      return this.browser.probe();
    }

    if (this.tavern.isAvailable()) {
      try {
        const result = await this.tavern.request<SaveProbeResult>('probe', {}, 2500);
        this.backend = 'tavern-file';
        return result;
      } catch (error) {
        console.warn('[ToLove Save] SillyTavern 文件存档桥不可用，改用当前浏览器本地存档。', error);
      }
    }

    this.backend = 'browser-local';
    return this.browser.probe();
  }

  async list(): Promise<SaveListResult> {
    return this.run('list', {}, () => this.browser.list());
  }

  async write<TData>(
    slotId: string,
    data: TData,
    saveUuid?: string,
    preview?: SavePreview,
  ): Promise<SaveWriteResult<TData>> {
    if (!slotId.trim()) {
      throw new Error('存档槽位不能为空');
    }

    return this.run('write', { slotId, data, saveUuid, preview }, () =>
      this.browser.write(slotId, data, saveUuid, preview),
    );
  }

  async load<TData>(slotId?: string, saveUuid?: string): Promise<SaveLoadResult<TData>> {
    return this.run('load', { slotId, saveUuid }, () => this.browser.load<TData>(slotId, saveUuid));
  }

  async delete(slotId?: string, saveUuid?: string): Promise<SaveDeleteResult> {
    return this.run('delete', { slotId, saveUuid }, () => this.browser.delete(slotId, saveUuid));
  }

  resetBackend(): void {
    this.backend = 'unknown';
  }

  private async run<TResult>(
    action: Exclude<SaveAction, 'probe'>,
    payload: Omit<SaveRequest, 'protocolVersion' | 'requestId' | 'action'>,
    browserOperation: () => TResult,
  ): Promise<TResult> {
    if (this.backend === 'unknown') {
      await this.probe();
    }

    if (this.backend === 'tavern-file') {
      return this.tavern.request<TResult>(action, payload);
    }

    return browserOperation();
  }
}

export const saveClient = new HybridSaveClient();
