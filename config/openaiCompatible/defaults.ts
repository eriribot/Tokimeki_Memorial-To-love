import type { OpenAICompatibleConfig, OpenAICompatibleConfigErrors, OpenAICompatibleSafeConfig } from './types';

export const OPENAI_COMPATIBLE_CONFIG_VERSION = 1 as const;
export const OPENAI_COMPATIBLE_STORAGE_KEY = 'tokimeki-to-love:openai-compatible:v1';
export const OPENAI_COMPATIBLE_REQUEST_TIMEOUT_MS = 30_000;

export const DEFAULT_OPENAI_COMPATIBLE_CONFIG: OpenAICompatibleConfig = {
  enabled: false,
  baseUrl: '',
  apiKey: '',
  model: '',
};

export function normalizeOpenAICompatibleConfig(config: OpenAICompatibleConfig): OpenAICompatibleConfig {
  return {
    enabled: config.enabled,
    baseUrl: config.baseUrl.trim().replace(/\/+$/u, ''),
    apiKey: config.apiKey.trim(),
    model: config.model.trim(),
  };
}

export function getOpenAICompatibleChatCompletionsUrl(baseUrl: string): string {
  return `${baseUrl.trim().replace(/\/+$/u, '')}/chat/completions`;
}

export function getOpenAICompatibleModelsUrl(baseUrl: string): string {
  return `${baseUrl.trim().replace(/\/+$/u, '')}/models`;
}

export function validateOpenAICompatibleBaseUrl(baseUrl: string): string | undefined {
  const normalized = baseUrl.trim().replace(/\/+$/u, '');
  if (!normalized) return '请填写 API 地址。';

  try {
    const parsed = new URL(normalized);
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
      return 'API 地址只能使用 http 或 https。';
    }
    if (parsed.search || parsed.hash) return 'API 地址不能带查询参数或 # 片段。';
  } catch {
    return 'API 地址格式不正确。';
  }

  return undefined;
}

export function validateOpenAICompatibleConfig(
  config: OpenAICompatibleConfig,
  requireComplete = true,
): OpenAICompatibleConfigErrors {
  const normalized = normalizeOpenAICompatibleConfig(config);
  const errors: OpenAICompatibleConfigErrors = {};

  if (normalized.baseUrl || requireComplete) errors.baseUrl = validateOpenAICompatibleBaseUrl(normalized.baseUrl);

  if (requireComplete && !normalized.apiKey) errors.apiKey = '请填写 API 密钥。';
  if (requireComplete && !normalized.model) errors.model = '请填写模型名称。';

  return errors;
}

export function toSafeOpenAICompatibleConfig(config: OpenAICompatibleConfig): OpenAICompatibleSafeConfig {
  const normalized = normalizeOpenAICompatibleConfig(config);
  return {
    enabled: normalized.enabled,
    baseUrl: normalized.baseUrl,
    model: normalized.model,
    hasApiKey: normalized.apiKey.length > 0,
  };
}
