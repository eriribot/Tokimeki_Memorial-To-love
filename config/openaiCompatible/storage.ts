import {
  DEFAULT_OPENAI_COMPATIBLE_CONFIG,
  OPENAI_COMPATIBLE_CONFIG_VERSION,
  OPENAI_COMPATIBLE_STORAGE_KEY,
  normalizeOpenAICompatibleConfig,
} from './defaults';
import type { OpenAICompatibleConfig } from './types';

interface StoredOpenAICompatibleConfig {
  version: typeof OPENAI_COMPATIBLE_CONFIG_VERSION;
  config: OpenAICompatibleConfig;
}

function getLocalStorage(): Storage {
  const storage = globalThis.localStorage;
  if (!storage) throw new Error('当前页面不允许使用浏览器长期存储。');
  return storage;
}

function isStoredConfig(value: unknown): value is StoredOpenAICompatibleConfig {
  if (!value || typeof value !== 'object') return false;
  const record = value as Partial<StoredOpenAICompatibleConfig>;
  const config = record.config as Partial<OpenAICompatibleConfig> | undefined;
  return (
    record.version === OPENAI_COMPATIBLE_CONFIG_VERSION &&
    !!config &&
    typeof config.enabled === 'boolean' &&
    typeof config.baseUrl === 'string' &&
    typeof config.apiKey === 'string' &&
    typeof config.model === 'string'
  );
}

export function loadOpenAICompatibleConfig(): OpenAICompatibleConfig {
  try {
    const raw = getLocalStorage().getItem(OPENAI_COMPATIBLE_STORAGE_KEY);
    if (!raw) return { ...DEFAULT_OPENAI_COMPATIBLE_CONFIG };
    const parsed: unknown = JSON.parse(raw);
    return isStoredConfig(parsed)
      ? normalizeOpenAICompatibleConfig(parsed.config)
      : { ...DEFAULT_OPENAI_COMPATIBLE_CONFIG };
  } catch {
    return { ...DEFAULT_OPENAI_COMPATIBLE_CONFIG };
  }
}

export function saveOpenAICompatibleConfig(config: OpenAICompatibleConfig): OpenAICompatibleConfig {
  const normalized = normalizeOpenAICompatibleConfig(config);
  const stored: StoredOpenAICompatibleConfig = {
    version: OPENAI_COMPATIBLE_CONFIG_VERSION,
    config: normalized,
  };
  getLocalStorage().setItem(OPENAI_COMPATIBLE_STORAGE_KEY, JSON.stringify(stored));
  return normalized;
}

export function resetOpenAICompatibleConfig(): OpenAICompatibleConfig {
  getLocalStorage().removeItem(OPENAI_COMPATIBLE_STORAGE_KEY);
  return { ...DEFAULT_OPENAI_COMPATIBLE_CONFIG };
}
