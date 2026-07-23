export interface OpenAICompatibleConfig {
  enabled: boolean;
  baseUrl: string;
  apiKey: string;
  model: string;
}

export type OpenAICompatibleConfigField = 'baseUrl' | 'apiKey' | 'model';

export type OpenAICompatibleConfigErrors = Partial<Record<OpenAICompatibleConfigField, string>>;

export interface OpenAICompatibleSafeConfig {
  enabled: boolean;
  baseUrl: string;
  model: string;
  hasApiKey: boolean;
}

export interface OpenAICompatibleCompletionRequest {
  systemPrompt?: string;
  userPrompt: string;
  temperature?: number;
  maxTokens?: number;
  signal?: AbortSignal;
}

export interface OpenAICompatibleCompletionResult {
  text: string;
  requestId?: string;
  usage?: {
    promptTokens?: number;
    completionTokens?: number;
    totalTokens?: number;
  };
}

export interface OpenAICompatibleProbeResult {
  latencyMs: number;
  model: string;
  reply: string;
}

export interface OpenAICompatibleModelListResult {
  endpoint: string;
  models: string[];
}

export type OpenAICompatibleErrorCode =
  'disabled' | 'invalid_config' | 'aborted' | 'timeout' | 'network' | 'http' | 'invalid_response';

export class OpenAICompatibleApiError extends Error {
  constructor(
    message: string,
    public readonly code: OpenAICompatibleErrorCode,
    public readonly status?: number,
  ) {
    super(message);
    this.name = 'OpenAICompatibleApiError';
  }
}
