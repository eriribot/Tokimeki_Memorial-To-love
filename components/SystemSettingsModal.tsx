import { type FormEvent, useEffect, useMemo, useRef, useState } from 'react';
import {
  getOpenAICompatibleChatCompletionsUrl,
  listOpenAICompatibleModels,
  loadOpenAICompatibleConfig,
  probeOpenAICompatibleApi,
  resetOpenAICompatibleConfig,
  saveOpenAICompatibleConfig,
  validateOpenAICompatibleBaseUrl,
  validateOpenAICompatibleConfig,
  type OpenAICompatibleConfig,
  type OpenAICompatibleConfigErrors,
} from '../config/openaiCompatible';
import { refreshMemorySummarySchedule } from '../memory/summaryRuntime';
import {
  LARGE_SUMMARY_MIN_LENGTH,
  LARGE_SUMMARY_MAX_LENGTH,
  LARGE_SUMMARY_SOURCE_COUNT,
  RECENT_CONTEXT_MESSAGE_LIMIT,
  SMALL_SUMMARY_MIN_LENGTH,
  SMALL_SUMMARY_MAX_LENGTH,
  SMALL_SUMMARY_SOURCE_FLOOR_COUNT,
} from '../memory/summaryPolicy';
import { resolveAssetPath } from '../utils/assetPath';
import './SystemSettingsModal.css';

interface SystemSettingsModalProps {
  onClose: () => void;
}

type SettingsStatus =
  | { kind: 'idle'; message: string }
  | { kind: 'saved'; message: string }
  | { kind: 'loading-models'; message: string }
  | { kind: 'testing'; message: string }
  | { kind: 'success'; message: string }
  | { kind: 'error'; message: string };

type SettingsPage = 'menu' | 'memory-api';

const IDLE_STATUS: SettingsStatus = {
  kind: 'idle',
  message: '启用后，权威自动存档成功时会按固定合同检查并触发自动总结。',
};

function hasErrors(errors: OpenAICompatibleConfigErrors): boolean {
  return Object.values(errors).some(Boolean);
}

function getErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

export default function SystemSettingsModal({ onClose }: SystemSettingsModalProps) {
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const memorySettingsButtonRef = useRef<HTMLButtonElement>(null);
  const requestControllerRef = useRef<AbortController | null>(null);
  const [page, setPage] = useState<SettingsPage>('menu');
  const [draft, setDraft] = useState<OpenAICompatibleConfig>(() => loadOpenAICompatibleConfig());
  const [availableModels, setAvailableModels] = useState<string[]>([]);
  const [errors, setErrors] = useState<OpenAICompatibleConfigErrors>({});
  const [showApiKey, setShowApiKey] = useState(false);
  const [status, setStatus] = useState<SettingsStatus>(IDLE_STATUS);
  const endpoint = useMemo(
    () => (draft.baseUrl.trim() ? getOpenAICompatibleChatCompletionsUrl(draft.baseUrl) : '填写后自动生成'),
    [draft.baseUrl],
  );
  const isBusy = status.kind === 'loading-models' || status.kind === 'testing';
  useEffect(() => {
    if (page === 'menu') memorySettingsButtonRef.current?.focus({ preventScroll: true });
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return;
      event.preventDefault();
      requestControllerRef.current?.abort();
      requestControllerRef.current = null;
      if (page === 'memory-api') {
        setPage('menu');
        return;
      }
      onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      requestControllerRef.current?.abort();
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [onClose, page]);

  const updateTextField = (field: 'baseUrl' | 'apiKey' | 'model', value: string) => {
    setDraft(current => ({ ...current, [field]: value }));
    if (field === 'baseUrl') {
      requestControllerRef.current?.abort();
      requestControllerRef.current = null;
      setAvailableModels([]);
    }
    setErrors(current => ({ ...current, [field]: undefined }));
    setStatus(IDLE_STATUS);
  };

  const handleSave = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const nextErrors = validateOpenAICompatibleConfig(draft, draft.enabled);
    setErrors(nextErrors);
    if (hasErrors(nextErrors)) {
      setStatus({ kind: 'error', message: '还有配置没有填对，请看输入框下面的提示。' });
      return;
    }

    try {
      const saved = saveOpenAICompatibleConfig(draft);
      setDraft(saved);
      refreshMemorySummarySchedule();
      setStatus({ kind: 'saved', message: '配置已长期保存在当前浏览器。' });
    } catch (error) {
      setStatus({ kind: 'error', message: `保存失败：${getErrorMessage(error)}` });
    }
  };

  const handleProbe = async () => {
    const nextErrors = validateOpenAICompatibleConfig(draft, true);
    setErrors(nextErrors);
    if (hasErrors(nextErrors)) {
      setStatus({ kind: 'error', message: '先把地址、模型和密钥填写完整。' });
      return;
    }

    requestControllerRef.current?.abort();
    const controller = new AbortController();
    requestControllerRef.current = controller;
    setStatus({ kind: 'testing', message: '正在发送一条只要求回复 OK 的测试请求……' });

    try {
      const result = await probeOpenAICompatibleApi(draft, controller.signal);
      if (requestControllerRef.current !== controller) return;
      setStatus({
        kind: 'success',
        message: `连接成功 · ${result.model} · ${result.latencyMs} ms · 返回 ${result.reply.slice(0, 40)}`,
      });
    } catch (error) {
      if (requestControllerRef.current !== controller) return;
      setStatus({ kind: 'error', message: getErrorMessage(error) });
    } finally {
      if (requestControllerRef.current === controller) requestControllerRef.current = null;
    }
  };

  const handleLoadModels = async () => {
    const baseUrlError = validateOpenAICompatibleBaseUrl(draft.baseUrl);
    setErrors(current => ({ ...current, baseUrl: baseUrlError }));
    if (baseUrlError) {
      setStatus({ kind: 'error', message: '先填写正确的 API 地址。' });
      return;
    }

    requestControllerRef.current?.abort();
    const controller = new AbortController();
    requestControllerRef.current = controller;
    setStatus({ kind: 'loading-models', message: '正在从当前 API 地址拉取模型列表……' });

    try {
      const result = await listOpenAICompatibleModels(draft, controller.signal);
      if (requestControllerRef.current !== controller) return;
      setAvailableModels(result.models);
      setStatus(
        result.models.length > 0
          ? { kind: 'success', message: `已拉取 ${result.models.length} 个模型，请点模型名称框选择。` }
          : { kind: 'success', message: '接口返回了空模型列表，可以继续手动填写模型名称。' },
      );
    } catch (error) {
      if (requestControllerRef.current !== controller) return;
      setAvailableModels([]);
      setStatus({ kind: 'error', message: getErrorMessage(error) });
    } finally {
      if (requestControllerRef.current === controller) requestControllerRef.current = null;
    }
  };

  const handleReset = () => {
    requestControllerRef.current?.abort();
    requestControllerRef.current = null;
    try {
      setDraft(resetOpenAICompatibleConfig());
      refreshMemorySummarySchedule();
      setAvailableModels([]);
      setErrors({});
      setShowApiKey(false);
      setStatus({ kind: 'saved', message: '当前浏览器保存的记忆 API 配置已清空。' });
    } catch (error) {
      setStatus({ kind: 'error', message: `清空失败：${getErrorMessage(error)}` });
    }
  };

  const close = () => {
    requestControllerRef.current?.abort();
    onClose();
  };

  const returnToMenu = () => {
    requestControllerRef.current?.abort();
    requestControllerRef.current = null;
    setPage('menu');
  };

  return (
    <div className="system-settings__overlay" role="presentation">
      <section
        className={`system-settings is-${page}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby="system-settings-title"
      >
        <img
          className="system-settings__window-art"
          src={resolveAssetPath('/artsource/ui/window_kani.png')}
          alt=""
          aria-hidden="true"
        />

        <header className="system-settings__header">
          <div className="system-settings__nameplate" role="img" aria-label="系统设定">
            <img src={resolveAssetPath('/artsource/ui/midashi_op.png')} alt="" aria-hidden="true" />
            <h2 id="system-settings-title">系统设定</h2>
          </div>
          <button ref={closeButtonRef} type="button" onClick={close} aria-label="关闭系统设定">
            ×
          </button>
        </header>

        {page === 'menu' ? (
          <div className="system-settings__menu">
            <nav aria-label="系统设定分类">
              <button ref={memorySettingsButtonRef} type="button" onClick={() => setPage('memory-api')}>
                AI 记忆设定
              </button>
            </nav>
            <footer className="system-settings__menu-actions">
              <button type="button" onClick={close}>
                返回
              </button>
            </footer>
          </div>
        ) : (
          <form className="system-settings__form" onSubmit={handleSave}>
            <div className="system-settings__form-content">
              <label className="system-settings__toggle-row">
                <span>
                  <b>启用记忆 API</b>
                  <small>启用后，只在权威自动存档成功后按固定合同触发总结。</small>
                </span>
                <input
                  type="checkbox"
                  checked={draft.enabled}
                  onChange={event => {
                    setDraft(current => ({ ...current, enabled: event.target.checked }));
                    setStatus(IDLE_STATUS);
                  }}
                />
                <i aria-hidden="true" />
              </label>

              <label className="system-settings__field system-settings__field--base-url">
                <span>API 地址</span>
                <input
                  type="url"
                  value={draft.baseUrl}
                  placeholder="https://example.com"
                  autoComplete="url"
                  spellCheck={false}
                  aria-invalid={Boolean(errors.baseUrl)}
                  onChange={event => updateTextField('baseUrl', event.target.value)}
                />
                <small className={errors.baseUrl ? 'is-error' : ''}>{errors.baseUrl ?? `实际请求：${endpoint}`}</small>
              </label>

              <label className="system-settings__field system-settings__field--model">
                <span>模型名称</span>
                <span className="system-settings__model-input">
                  <input
                    type="text"
                    list="memory-api-model-options"
                    value={draft.model}
                    placeholder="例如 gpt-4.1-mini"
                    autoComplete="off"
                    spellCheck={false}
                    aria-invalid={Boolean(errors.model)}
                    onChange={event => updateTextField('model', event.target.value)}
                  />
                  <button
                    type="button"
                    aria-label="拉取模型列表"
                    title="从当前 API 地址拉取模型列表"
                    disabled={isBusy}
                    onClick={() => void handleLoadModels()}
                  >
                    {status.kind === 'loading-models' ? '拉取中' : '拉取'}
                  </button>
                </span>
                <datalist id="memory-api-model-options">
                  {availableModels.map(model => (
                    <option key={model} value={model} />
                  ))}
                </datalist>
                <small className={errors.model ? 'is-error' : ''}>
                  {errors.model ??
                    (availableModels.length > 0
                      ? `当前列表有 ${availableModels.length} 个模型，也可以手动输入。`
                      : '可从当前地址拉取，也可以直接输入模型名称。')}
                </small>
              </label>

              <label className="system-settings__field system-settings__field--key">
                <span>API 密钥</span>
                <span className="system-settings__key-input">
                  <input
                    type={showApiKey ? 'text' : 'password'}
                    value={draft.apiKey}
                    placeholder="sk-..."
                    autoComplete="new-password"
                    spellCheck={false}
                    aria-invalid={Boolean(errors.apiKey)}
                    onChange={event => updateTextField('apiKey', event.target.value)}
                  />
                  <button type="button" onClick={() => setShowApiKey(value => !value)}>
                    {showApiKey ? '隐藏' : '显示'}
                  </button>
                </span>
                <small className={errors.apiKey ? 'is-error' : ''}>
                  {errors.apiKey ?? '密钥会长期保存在当前浏览器，不会进入游戏存档或剧情消息。'}
                </small>
              </label>

              <fieldset className="system-settings__cadence">
                <legend>固定总结合同</legend>
                <label>
                  <span>小总结</span>
                  <output>
                    校准窗口 {RECENT_CONTEXT_MESSAGE_LIMIT} 条原文 · 累计 {SMALL_SUMMARY_SOURCE_FLOOR_COUNT} 楼触发 ·{' '}
                    {SMALL_SUMMARY_MIN_LENGTH}–{SMALL_SUMMARY_MAX_LENGTH} 字
                  </output>
                </label>
                <label>
                  <span>大总结</span>
                  <output>
                    每 {LARGE_SUMMARY_SOURCE_COUNT} 条已接受小总结 · {LARGE_SUMMARY_MIN_LENGTH}–
                    {LARGE_SUMMARY_MAX_LENGTH} 字
                  </output>
                </label>
                <small>最近原文不参与总结；不足一批不会请求副 API，失败或未接受的候选不计入大总结。</small>
              </fieldset>

              <p className={`system-settings__status is-${status.kind}`} role="status" aria-live="polite">
                {status.message}
              </p>
            </div>

            <footer className="system-settings__actions">
              <button type="button" className="is-secondary" onClick={handleReset} disabled={isBusy}>
                清空配置
              </button>
              <span />
              <button type="button" onClick={() => void handleProbe()} disabled={isBusy}>
                {status.kind === 'testing' ? '测试中…' : '测试连接'}
              </button>
              <button type="submit" disabled={isBusy}>
                保存
              </button>
              <button type="button" onClick={returnToMenu}>
                返回
              </button>
            </footer>
          </form>
        )}
      </section>
    </div>
  );
}
