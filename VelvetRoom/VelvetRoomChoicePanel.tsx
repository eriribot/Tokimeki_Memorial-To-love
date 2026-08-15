import { type FormEvent, type KeyboardEvent, type ReactNode, useEffect, useId, useRef, useState } from 'react';
import { GALBOX_ASSETS } from '../GalMainStory/galAssets';
import { resolveAssetPath } from '../utils/assetPath';
import type { VelvetRoomChoiceOption } from './velvetRoomGeneration';

interface VelvetRoomChoicePanelProps {
  mode: 'consent' | 'interview';
  prompt: string;
  options: readonly VelvetRoomChoiceOption[];
  selectedOptionId: string | null;
  locked?: boolean;
  error?: string | null;
  controls?: ReactNode;
  onSelect: (optionId: string, answer: string) => void;
  onEditingChange?: (editing: boolean) => void;
}

/**
 * 赛菲局部使用的 episode04 式选择窗。视觉沿用同一套 GALBOX 资源，
 * 但自由输入文案是“回答问题”而不是主线的“采取行动”，避免修改共享主线组件。
 */
export default function VelvetRoomChoicePanel({
  mode,
  prompt,
  options,
  selectedOptionId,
  locked = false,
  error = null,
  controls,
  onSelect,
  onEditingChange,
}: VelvetRoomChoicePanelProps) {
  const inputId = useId();
  const optionButtonRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const [page, setPage] = useState<'options' | 'custom'>('options');
  const [customText, setCustomText] = useState('');
  const normalizedCustomText = customText.normalize('NFKC').trim();
  const inputLength = Array.from(customText.normalize('NFKC')).length;
  const customAllowed = mode === 'interview';
  const choiceLocked = locked || Boolean(selectedOptionId);

  useEffect(() => {
    setPage('options');
    setCustomText('');
  }, [prompt]);

  useEffect(() => {
    onEditingChange?.(page === 'custom');
  }, [onEditingChange, page]);

  useEffect(() => {
    if (choiceLocked || page !== 'options') return;
    const animationFrame = requestAnimationFrame(() => optionButtonRefs.current[0]?.focus());
    return () => cancelAnimationFrame(animationFrame);
  }, [choiceLocked, page, prompt]);

  const handleOptionKeyDown = (event: KeyboardEvent<HTMLButtonElement>, optionIndex: number) => {
    const direction =
      event.key === 'ArrowUp' || event.key === 'ArrowLeft'
        ? -1
        : event.key === 'ArrowDown' || event.key === 'ArrowRight'
          ? 1
          : 0;
    if (direction === 0 || options.length === 0) return;
    event.preventDefault();
    event.stopPropagation();
    const nextIndex = (optionIndex + direction + options.length) % options.length;
    optionButtonRefs.current[nextIndex]?.focus();
  };

  const submitCustomAnswer = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!normalizedCustomText || choiceLocked) return;
    onSelect('custom-answer', normalizedCustomText);
  };

  return (
    <div
      className="gal-main-story__choice is-blue velvet-room__choice"
      role="group"
      aria-label={prompt}
      data-choice-mode={mode}
      data-choice-page={page}
      data-option-source={mode === 'interview' ? 'ai' : 'authored'}
      onClick={event => event.stopPropagation()}
    >
      <img src={resolveAssetPath(GALBOX_ASSETS.choiceWindows.blue)} alt="" aria-hidden="true" />
      <strong className="gal-main-story__choice-prompt">{prompt}</strong>

      {page === 'custom' && customAllowed ? (
        <form className="gal-main-story__custom-choice velvet-room__custom-answer" onSubmit={submitCustomAnswer}>
          <label htmlFor={inputId}>写下你的回答</label>
          <textarea
            id={inputId}
            value={customText}
            maxLength={600}
            rows={2}
            placeholder="不必迎合选项，写下你真正的回答……"
            disabled={choiceLocked}
            autoFocus
            onChange={event => setCustomText(event.target.value)}
          />
          {error && (
            <p className="velvet-room__choice-error" role="alert">
              {error}
            </p>
          )}
          <div className="gal-main-story__custom-choice-footer">
            <span aria-live="polite">{inputLength}/600</span>
            <div>
              <button type="button" disabled={choiceLocked} onClick={() => setPage('options')}>
                返回选项
              </button>
              <button type="submit" className="is-primary" disabled={choiceLocked || !normalizedCustomText}>
                提交回答
              </button>
            </div>
          </div>
        </form>
      ) : (
        <>
          <div className="gal-main-story__choice-options">
            {options.map((option, optionIndex) => {
              const selected = option.id === selectedOptionId;
              return (
                <button
                  ref={element => {
                    optionButtonRefs.current[optionIndex] = element;
                  }}
                  key={option.id}
                  type="button"
                  className={selected ? 'is-selected' : ''}
                  aria-pressed={selected}
                  disabled={choiceLocked}
                  onKeyDown={event => handleOptionKeyDown(event, optionIndex)}
                  onClick={() => onSelect(option.id, option.label)}
                >
                  {option.label}
                </button>
              );
            })}
          </div>
          {customAllowed && (
            <button
              type="button"
              className="gal-main-story__custom-choice-entry"
              disabled={choiceLocked}
              onClick={() => setPage('custom')}
            >
              ✎ 自己输入回答
            </button>
          )}
          {error && (
            <p className="velvet-room__choice-error" role="alert">
              {error}
            </p>
          )}
        </>
      )}

      {mode === 'interview' && <span className="gal-main-story__choice-source">赛菲即时生成 · 也可以自由回答</span>}
      {controls}
    </div>
  );
}
