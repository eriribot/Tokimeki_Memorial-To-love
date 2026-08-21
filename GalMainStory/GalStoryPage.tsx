import { useEffect, useState, type ReactNode } from 'react';
import { resolveAssetPath } from '../utils/assetPath';
import { getSpeakerNameplateAsset, type LayeredPortraitRig } from './characters';
import { GALBOX_ASSETS } from './galAssets';
import GalChoicePanel, { type GalChoiceOption } from './GalChoicePanel';
import LayeredPortrait from './LayeredPortrait';

interface GalStoryPortraitView {
  rig: LayeredPortraitRig;
  expressionId: string;
  isSpeaking: boolean;
  beatKey: number;
}

interface GalStoryPageProps {
  backgroundAsset: string;
  backgroundAlt: string;
  backgroundKey?: string;
  speaker: string | null;
  text: string;
  portrait?: GalStoryPortraitView | null;
  actLabel?: ReactNode;
  controls?: ReactNode;
  theme?: 'blue' | 'pink';
  choice?: {
    prompt: string;
    options: readonly GalChoiceOption[];
    optionSource: 'ai' | 'fallback' | 'authored';
    selectedOptionId: string | null;
    selectedLabel?: string | null;
    onSelect: (optionId: string, customText?: string) => void;
    readOnly?: boolean;
    allowCustomChoice?: boolean;
    showSource?: boolean;
    showPrompt?: boolean;
    autoFocusFirstOption?: boolean;
  } | null;
}

export interface GalStoryPagePagerProps {
  currentPage: number;
  pageCount: number;
  onSelectPage: (pageIndex: number) => void;
}

/** Shared page-jump control for dating scenes and dating-history playback. */
export function GalStoryPagePager({ currentPage, pageCount, onSelectPage }: GalStoryPagePagerProps) {
  const safePageCount = Math.max(0, Math.trunc(pageCount));
  const safePageIndex = safePageCount > 0 ? Math.min(safePageCount - 1, Math.max(0, Math.trunc(currentPage))) : 0;
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    setIsOpen(false);
  }, [safePageIndex, safePageCount]);

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return;
      event.preventDefault();
      setIsOpen(false);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  const label = `${safePageCount > 0 ? safePageIndex + 1 : 0} / ${safePageCount}`;
  if (safePageCount <= 1) {
    return <span className="gal-main-story__progress">{label}</span>;
  }

  return (
    <div className="gal-main-story__page-jump" onClick={event => event.stopPropagation()}>
      <button
        type="button"
        className="gal-main-story__progress"
        aria-haspopup="dialog"
        aria-expanded={isOpen}
        aria-label="选择回放页码"
        title="选择回放页码"
        onClick={() => setIsOpen(value => !value)}
      >
        {label}
      </button>
      {isOpen && (
        <div className="gal-main-story__page-jump-menu" role="dialog" aria-label="选择回放页码">
          <div className="gal-main-story__page-jump-grid">
            {Array.from({ length: safePageCount }, (_, pageIndex) => (
              <button
                key={pageIndex}
                type="button"
                className={pageIndex === safePageIndex ? 'is-active' : undefined}
                aria-current={pageIndex === safePageIndex ? 'page' : undefined}
                onClick={() => {
                  setIsOpen(false);
                  onSelectPage(pageIndex);
                }}
              >
                {pageIndex + 1}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * The only visual renderer for an accepted Gal story page.
 * Generation, history and state transitions stay in their owning modules;
 * this component only turns one page into the shared stage, portrait and dialogue UI.
 */
export default function GalStoryPage({
  backgroundAsset,
  backgroundAlt,
  backgroundKey,
  speaker,
  text,
  portrait = null,
  actLabel,
  controls,
  theme = 'pink',
  choice = null,
}: GalStoryPageProps) {
  const speakerNameplate = getSpeakerNameplateAsset(speaker);

  return (
    <>
      <img
        key={backgroundKey}
        className="gal-main-story__background"
        src={resolveAssetPath(backgroundAsset)}
        alt={backgroundAlt}
      />
      <div className="gal-main-story__shade" aria-hidden="true" />
      {actLabel && (
        <div className={`gal-main-story__act-label is-${theme}`}>
          <img src={resolveAssetPath(GALBOX_ASSETS.headings[theme])} alt="" aria-hidden="true" />
          <span>{actLabel}</span>
        </div>
      )}

      {portrait && (
        <LayeredPortrait
          key={`${portrait.rig.characterId}-${portrait.rig.id}`}
          rig={portrait.rig}
          expressionId={portrait.expressionId}
          isSpeaking={portrait.isSpeaking}
          beatKey={portrait.beatKey}
        />
      )}

      {choice ? (
        <GalChoicePanel {...choice} controls={controls} theme={theme} />
      ) : (
        <div className="gal-main-story__dialogue">
          <img
            className="gal-main-story__window"
            src={resolveAssetPath(GALBOX_ASSETS.messageWindow)}
            alt=""
            aria-hidden="true"
          />

          {speakerNameplate ? (
            <div className="gal-main-story__nameplate" role="img" aria-label={speaker ?? undefined}>
              <img src={resolveAssetPath(speakerNameplate)} alt="" aria-hidden="true" />
              <strong>{speaker}</strong>
            </div>
          ) : (
            <strong className={`gal-main-story__speaker${speaker ? '' : ' is-narration'}`}>{speaker ?? '旁白'}</strong>
          )}

          <div className="gal-main-story__copy" aria-live="polite" aria-atomic="true">
            <p className={speaker ? '' : 'is-narration'}>{text}</p>
          </div>

          <span className="gal-main-story__push" aria-hidden="true">
            {GALBOX_ASSETS.nextIndicatorFrames.map((src, frame) => (
              <img key={src} className={`push-frame push-frame-${frame}`} src={resolveAssetPath(src)} alt="" />
            ))}
          </span>

          {controls}
        </div>
      )}
    </>
  );
}
