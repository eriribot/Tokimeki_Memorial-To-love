import { createSaveUuid } from '../save/uuid';
import {
  MESSAGE_PROTOCOL_VERSION,
  MESSAGE_REQUEST_EVENT,
  MESSAGE_RESPONSE_EVENT,
  type MessageAction,
  type MessageArchive,
  type MessageDeleteResult,
  type MessageLoadResult,
  type MessageProbeResult,
  type MessageRequest,
  type MessageResponse,
  type MessageWriteResult,
} from './protocol';

interface EventSubscription {
  stop?: () => void;
}

interface EventApi {
  on: (eventName: string, listener: (payload: MessageResponse) => void) => EventSubscription | void;
  emit: (eventName: string, payload: MessageRequest) => Promise<void> | void;
}

interface PendingRequest {
  resolve: (response: MessageResponse) => void;
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

class TavernMessageTransport {
  private api: EventApi | null = null;
  private subscription?: EventSubscription;
  private readonly pending = new Map<string, PendingRequest>();

  request<TResult>(
    action: MessageAction,
    payload: Omit<MessageRequest, 'protocolVersion' | 'requestId' | 'action'> = {},
    timeoutMs = 3500,
  ): Promise<TResult> {
    this.ensureListening();
    if (!this.api) {
      return Promise.reject(new Error('当前页面没有 Tavern Helper 事件接口，无法读取酒馆本地对话档'));
    }

    const requestId = createSaveUuid();
    const request: MessageRequest = {
      protocolVersion: MESSAGE_PROTOCOL_VERSION,
      requestId,
      action,
      ...payload,
    };

    return new Promise<TResult>((resolve, reject) => {
      const timeoutId = setTimeout(() => {
        this.pending.delete(requestId);
        reject(new Error('ToLove对话槽脚本未响应；请在 Tavern Helper 中导入、绑定并启用该脚本'));
      }, timeoutMs);

      this.pending.set(requestId, {
        timeoutId,
        reject,
        resolve: response => {
          if (!response.ok) {
            reject(new Error(response.error?.message ?? 'ToLove对话槽脚本返回未知错误'));
            return;
          }
          resolve(response.result as TResult);
        },
      });

      Promise.resolve(this.api?.emit(MESSAGE_REQUEST_EVENT, request)).catch((error: unknown) => {
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
      pending.reject(new Error('对话档客户端已关闭'));
    }
    this.pending.clear();
  }

  private ensureListening(): void {
    if (this.api) return;
    this.api = resolveEventApi();
    if (!this.api) return;

    const subscription = this.api.on(MESSAGE_RESPONSE_EVENT, response => {
      if (response?.protocolVersion !== MESSAGE_PROTOCOL_VERSION || !response.requestId) return;
      const pending = this.pending.get(response.requestId);
      if (!pending) return;
      clearTimeout(pending.timeoutId);
      this.pending.delete(response.requestId);
      pending.resolve(response);
    });
    this.subscription = subscription || undefined;
  }
}

export class TavernFileMessageClient {
  private readonly tavern = new TavernMessageTransport();

  probe(): Promise<MessageProbeResult> {
    return this.tavern.request<MessageProbeResult>('probe', {}, 2500);
  }

  write(archive: MessageArchive): Promise<MessageWriteResult> {
    return this.tavern.request<MessageWriteResult>('write', { archive });
  }

  load(slotId: string, saveUuid?: string): Promise<MessageLoadResult> {
    return this.tavern.request<MessageLoadResult>('load', { slotId, saveUuid });
  }

  delete(slotId: string, saveUuid?: string): Promise<MessageDeleteResult> {
    return this.tavern.request<MessageDeleteResult>('delete', { slotId, saveUuid });
  }

  dispose(): void {
    this.tavern.dispose();
  }
}

export const messageClient = new TavernFileMessageClient();
