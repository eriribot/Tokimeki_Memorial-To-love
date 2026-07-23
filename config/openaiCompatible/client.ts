import {
  OPENAI_COMPATIBLE_REQUEST_TIMEOUT_MS,
  getOpenAICompatibleChatCompletionsUrl,
  getOpenAICompatibleModelsUrl,
  validateOpenAICompatibleBaseUrl,
  validateOpenAICompatibleConfig,
} from './defaults';
import { isOpenAICompatibleModelListResponse, parseOpenAICompatibleModelIds } from './modelList';
import {
  OpenAICompatibleApiError,
  type OpenAICompatibleCompletionRequest,
  type OpenAICompatibleCompletionResult,
  type OpenAICompatibleConfig,
  type OpenAICompatibleModelListResult,
  type OpenAICompatibleProbeResult,
} from './types';

interface OpenAICompatibleResponseBody {
  id?: string;
  choices?: Array<{
    message?: {
      content?: string | Array<{ text?: string }>;
    };
  }>;
  usage?: {
    prompt_tokens?: number;
    completion_tokens?: number;
    total_tokens?: number;
  };
  error?: {
    message?: string;
  };
}

type OpenAICompatibleMessageContent = string | Array<{ text?: string }> | undefined;

function getConfigErrorMessage(config: OpenAICompatibleConfig): string | null {
  const errors = validateOpenAICompatibleConfig(config, true);
  return errors.baseUrl ?? errors.apiKey ?? errors.model ?? null;
}

function extractText(content: OpenAICompatibleMessageContent): string {
  if (typeof content === 'string') return content.trim();
  if (!Array.isArray(content)) return '';
  return content
    .map(part => (typeof part?.text === 'string' ? part.text : ''))
    .join('')
    .trim();
}

function getErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

function getResponseErrorDetail(body: unknown): string | undefined {
  if (typeof body !== 'object' || body === null) return undefined;
  const error = (body as { error?: unknown }).error;
  if (typeof error === 'string') return error.trim() || undefined;
  if (typeof error !== 'object' || error === null) return undefined;
  const message = (error as { message?: unknown }).message;
  return typeof message === 'string' ? message.trim() || undefined : undefined;
}

function hasSillyTavernRequestBridge(): boolean {
  return typeof SillyTavern !== 'undefined' && typeof SillyTavern.getRequestHeaders === 'function';
}

async function fetchModelListThroughSillyTavern(
  config: OpenAICompatibleConfig,
  signal: AbortSignal,
): Promise<Response> {
  if (!hasSillyTavernRequestBridge()) throw new Error('当前环境没有酒馆后端请求接口。');
  const apiKey = config.apiKey.trim();
  return fetch('/api/backends/chat-completions/status', {
    method: 'POST',
    headers: {
      ...SillyTavern.getRequestHeaders(),
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      chat_completion_source: 'custom',
      custom_url: config.baseUrl.trim().replace(/\/+$/u, ''),
      custom_include_headers: apiKey ? JSON.stringify({ Authorization: `Bearer ${apiKey}` }) : '',
    }),
    cache: 'no-cache',
    signal,
  });
}

async function fetchOpenAICompatibleModelList(
  config: OpenAICompatibleConfig,
  endpoint: string,
  signal: AbortSignal,
): Promise<Response> {
  const apiKey = config.apiKey.trim();
  try {
    return await fetch(endpoint, {
      method: 'GET',
      headers: {
        Accept: 'application/json',
        ...(apiKey ? { Authorization: `Bearer ${apiKey}` } : {}),
      },
      signal,
    });
  } catch (directError) {
    if (signal.aborted || !hasSillyTavernRequestBridge()) throw directError;
    return fetchModelListThroughSillyTavern(config, signal);
  }
}

async function performCompletion(
  config: OpenAICompatibleConfig,
  request: OpenAICompatibleCompletionRequest,
): Promise<OpenAICompatibleCompletionResult> {
  const configError = getConfigErrorMessage(config);
  if (configError) throw new OpenAICompatibleApiError(configError, 'invalid_config');
  if (!request.userPrompt.trim()) {
    throw new OpenAICompatibleApiError('记忆请求内容不能为空。', 'invalid_config');
  }

  const controller = new AbortController();
  let timedOut = false;
  const abortFromCaller = () => controller.abort();
  if (request.signal?.aborted) controller.abort();
  else request.signal?.addEventListener('abort', abortFromCaller, { once: true });
  const timeoutId = setTimeout(() => {
    timedOut = true;
    controller.abort();
  }, OPENAI_COMPATIBLE_REQUEST_TIMEOUT_MS);

  try {
    let response: Response;
    try {
      response = await fetch(getOpenAICompatibleChatCompletionsUrl(config.baseUrl), {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          Authorization: `Bearer ${config.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: config.model,
          messages: [
            ...(request.systemPrompt?.trim()
              ? [{ role: 'system' as const, content: request.systemPrompt.trim() }]
              : []),
            { role: 'user' as const, content: request.userPrompt.trim() },
          ],
          stream: false,
          ...(request.temperature === undefined ? {} : { temperature: request.temperature }),
          ...(request.maxTokens === undefined ? {} : { max_tokens: request.maxTokens }),
        }),
        signal: controller.signal,
      });
    } catch (error) {
      if (controller.signal.aborted) {
        throw new OpenAICompatibleApiError(
          timedOut ? '连接测试超时，请检查地址或网络。' : '请求已取消。',
          timedOut ? 'timeout' : 'aborted',
        );
      }
      throw new OpenAICompatibleApiError(`无法连接记忆 API：${getErrorMessage(error)}`, 'network');
    }

    let body: OpenAICompatibleResponseBody;
    try {
      body = (await response.json()) as OpenAICompatibleResponseBody;
    } catch {
      throw new OpenAICompatibleApiError('接口没有返回可读取的 JSON。', 'invalid_response', response.status);
    }

    if (!response.ok) {
      const detail = body.error?.message?.trim();
      throw new OpenAICompatibleApiError(
        detail ? `接口返回 ${response.status}：${detail.slice(0, 240)}` : `接口返回 HTTP ${response.status}。`,
        'http',
        response.status,
      );
    }

    const text = extractText(body.choices?.[0]?.message?.content);
    if (!text) throw new OpenAICompatibleApiError('接口响应里没有文本内容。', 'invalid_response', response.status);

    return {
      text,
      ...(body.id ? { requestId: body.id } : {}),
      ...(body.usage
        ? {
            usage: {
              ...(typeof body.usage.prompt_tokens === 'number' ? { promptTokens: body.usage.prompt_tokens } : {}),
              ...(typeof body.usage.completion_tokens === 'number'
                ? { completionTokens: body.usage.completion_tokens }
                : {}),
              ...(typeof body.usage.total_tokens === 'number' ? { totalTokens: body.usage.total_tokens } : {}),
            },
          }
        : {}),
    };
  } finally {
    clearTimeout(timeoutId);
    request.signal?.removeEventListener('abort', abortFromCaller);
  }
}

export async function requestOpenAICompatibleCompletion(
  config: OpenAICompatibleConfig,
  request: OpenAICompatibleCompletionRequest,
): Promise<OpenAICompatibleCompletionResult> {
  if (!config.enabled) throw new OpenAICompatibleApiError('记忆 API 尚未启用。', 'disabled');
  return performCompletion(config, request);
}

export async function probeOpenAICompatibleApi(
  config: OpenAICompatibleConfig,
  signal?: AbortSignal,
): Promise<OpenAICompatibleProbeResult> {
  const startedAt = performance.now();
  const result = await performCompletion(
    { ...config, enabled: true },
    {
      systemPrompt: '你正在执行连接测试。不要解释。',
      userPrompt: '只回复 OK。',
      temperature: 0,
      maxTokens: 8,
      signal,
    },
  );
  return {
    latencyMs: Math.max(0, Math.round(performance.now() - startedAt)),
    model: config.model.trim(),
    reply: result.text,
  };
}

export async function listOpenAICompatibleModels(
  config: OpenAICompatibleConfig,
  signal?: AbortSignal,
): Promise<OpenAICompatibleModelListResult> {
  const baseUrlError = validateOpenAICompatibleBaseUrl(config.baseUrl);
  if (baseUrlError) throw new OpenAICompatibleApiError(baseUrlError, 'invalid_config');

  const endpoint = getOpenAICompatibleModelsUrl(config.baseUrl);
  const controller = new AbortController();
  let timedOut = false;
  const abortFromCaller = () => controller.abort();
  if (signal?.aborted) controller.abort();
  else signal?.addEventListener('abort', abortFromCaller, { once: true });
  const timeoutId = setTimeout(() => {
    timedOut = true;
    controller.abort();
  }, OPENAI_COMPATIBLE_REQUEST_TIMEOUT_MS);

  try {
    let response: Response;
    try {
      response = await fetchOpenAICompatibleModelList(config, endpoint, controller.signal);
    } catch (error) {
      if (controller.signal.aborted) {
        throw new OpenAICompatibleApiError(
          timedOut ? '拉取模型列表超时，请检查地址或网络。' : '请求已取消。',
          timedOut ? 'timeout' : 'aborted',
        );
      }
      throw new OpenAICompatibleApiError(
        `无法拉取模型列表：${getErrorMessage(error)}。可以继续手动填写模型名称。`,
        'network',
      );
    }

    let body: unknown;
    try {
      body = await response.json();
    } catch {
      if (!response.ok) {
        throw new OpenAICompatibleApiError(
          `模型列表接口返回 HTTP ${response.status}，可以继续手动填写模型名称。`,
          'http',
          response.status,
        );
      }
      throw new OpenAICompatibleApiError('模型列表接口没有返回可读取的 JSON。', 'invalid_response', response.status);
    }

    if (!response.ok) {
      const detail = getResponseErrorDetail(body);
      const suffix = detail ? `：${detail.slice(0, 180)}` : '。';
      if (response.status === 401 || response.status === 403) {
        throw new OpenAICompatibleApiError(
          `模型列表请求被拒绝（${response.status}），请检查 API 密钥${detail ? suffix : '。'}`,
          'http',
          response.status,
        );
      }
      if (response.status === 404 || response.status === 405) {
        throw new OpenAICompatibleApiError(
          `这个地址没有提供 /models（${response.status}），可以继续手动填写模型名称${detail ? suffix : '。'}`,
          'http',
          response.status,
        );
      }
      throw new OpenAICompatibleApiError(`模型列表接口返回 ${response.status}${suffix}`, 'http', response.status);
    }

    if (!isOpenAICompatibleModelListResponse(body)) {
      throw new OpenAICompatibleApiError(
        '模型列表格式无法识别，可以继续手动填写模型名称。',
        'invalid_response',
        response.status,
      );
    }

    return {
      endpoint,
      models: parseOpenAICompatibleModelIds(body),
    };
  } finally {
    clearTimeout(timeoutId);
    signal?.removeEventListener('abort', abortFromCaller);
  }
}
