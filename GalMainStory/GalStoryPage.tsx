import type { ReactNode } from 'react';
import { resolveAssetPath } from '../utils/assetPath';
import { getSpeakerNameplateAsset, type LayeredPortraitRig } from './characters';
import { GALBOX_ASSETS } from './galAssets';
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
    options: readonly { id: string; label: string }[];
    selectedOptionId: string | null;
    onSelect: (optionId: string) => void;
    readOnly?: boolean;
  } | null;
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
        <div
          className={`gal-main-story__choice is-${theme}`}
          role="group"
          aria-label={choice.prompt}
          onClick={event => event.stopPropagation()}
        >
          <img src={resolveAssetPath(GALBOX_ASSETS.choiceWindows[theme])} alt="" aria-hidden="true" />
          <div className="gal-main-story__choice-options">
            {choice.options.map(option => {
              const selected = option.id === choice.selectedOptionId;
              return (
                <button
                  key={option.id}
                  type="button"
                  className={selected ? 'is-selected' : ''}
                  aria-pressed={selected}
                  disabled={Boolean(choice.selectedOptionId) || choice.readOnly}
                  onClick={() => choice.onSelect(option.id)}
                >
                  {option.label}
                </button>
              );
            })}
          </div>
          {controls}
        </div>
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
            speaker && <strong className="gal-main-story__speaker">{speaker}</strong>
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
