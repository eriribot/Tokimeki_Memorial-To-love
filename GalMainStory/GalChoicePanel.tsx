import { type FormEvent, type ReactNode, useEffect, useId, useState } from 'react';
import { resolveAssetPath } from '../utils/assetPath';
import { STORY_CUSTOM_CHOICE_OPTION_ID } from './storyTypes';
import { GALBOX_ASSETS } from './galAssets';

interface GalChoicePanelProps {
  prompt: string;
  options: readonly { id: string; label: string }[];
  optionSource: 'ai' | 'fallback';
  selectedOptionId: string | null;
  selectedLabel?: string | null;
  onSelect: (optionId: string, customText?: string) => void;
  controls?: ReactNode;
  readOnly?: boolean;
  theme: 'blue' | 'pink';
}

export default function GalChoicePanel({
  prompt,
  options,
  optionSource,
  selectedOptionId,
  selectedLabel = null,
  onSelect,
  controls,
  readOnly = false,
  theme,
}: GalChoicePanelProps) {
  const inputId = useId();
  const [page, setPage] = useState<'options' | 'custom'>('options');
  const [customText, setCustomText] = useState('');
  const normalizedCustomText = customText.normalize('NFC').trim();
  const locked = Boolean(selectedOptionId) || readOnly;

  useEffect(() => {
    setPage('options');
    setCustomText('');
  }, [prompt]);

  const submitCustomChoice = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!normalizedCustomText || locked) return;
    onSelect(STORY_CUSTOM_CHOICE_OPTION_ID, normalizedCustomText);
    setPage('options');
  };

  return (
    <div
      className={`gal-main-story__choice is-${theme}`}
      role="group"
      aria-label={prompt}
      data-option-source={optionSource}
      data-choice-page={page}
      onClick={event => event.stopPropagation()}
    >
      <img src={resolveAssetPath(GALBOX_ASSETS.choiceWindows[theme])} alt="" aria-hidden="true" />
      {page === 'custom' && !locked ? (
        <form className="gal-main-story__custom-choice" onSubmit={submitCustomChoice}>
          <label htmlFor={inputId}>写下你此刻要采取的行动</label>
          <textarea
            id={inputId}
            value={customText}
            maxLength={80}
            rows={2}
            placeholder="例如：先让大家冷静下来，再亲自去找菈菈……"
            onChange={event => setCustomText(event.target.value)}
          />
          <div className="gal-main-story__custom-choice-footer">
            <span aria-live="polite">{customText.length}/80</span>
            <div>
              <button type="button" onClick={() => setPage('options')}>
                返回三个选项
              </button>
              <button type="submit" className="is-primary" disabled={!normalizedCustomText}>
                采用这个行动
              </button>
            </div>
          </div>
        </form>
      ) : (
        <>
          <div className="gal-main-story__choice-options">
            {options.map(option => {
              const selected = option.id === selectedOptionId;
              return (
                <button
                  key={option.id}
                  type="button"
                  className={selected ? 'is-selected' : ''}
                  aria-pressed={selected}
                  disabled={locked}
                  onClick={() => onSelect(option.id)}
                >
                  {option.label}
                </button>
              );
            })}
          </div>
          <button
            type="button"
            className={`gal-main-story__custom-choice-entry ${
              selectedOptionId === STORY_CUSTOM_CHOICE_OPTION_ID ? 'is-selected' : ''
            }`}
            aria-pressed={selectedOptionId === STORY_CUSTOM_CHOICE_OPTION_ID}
            disabled={locked}
            onClick={() => setPage('custom')}
          >
            {selectedOptionId === STORY_CUSTOM_CHOICE_OPTION_ID && selectedLabel
              ? `已决定：${selectedLabel}`
              : '✎ 自己输入行动……'}
          </button>
        </>
      )}
      <span className="gal-main-story__choice-source">
        {optionSource === 'ai' ? 'AI 即时提议 · 也可以自己决定' : '离线保底提议 · 也可以自己决定'}
      </span>
      {controls}
    </div>
  );
}
