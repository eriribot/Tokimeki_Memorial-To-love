import type { CSSProperties } from 'react';
import { resolveAssetPath } from '../utils/assetPath';
import type { StoryActCgDefinition, StoryCgFrameDefinition } from './storyTypes';

interface GalCgPageProps {
  cg: StoryActCgDefinition;
  frameIndex: number;
  isLeaving: boolean;
}

type StoryCgFrameStyle = CSSProperties & {
  '--story-cg-focus-x': string;
  '--story-cg-focus-y': string;
  '--story-cg-scale-from': string;
  '--story-cg-scale-to': string;
};

/** Converts source-space camera data into renderer-only CSS variables. */
function getFrameStyle(frame: StoryCgFrameDefinition): StoryCgFrameStyle {
  const defaultZoom = frame.framing === 'safe-face-closeup' ? 1.1 : 1;
  const focusXPercent = frame.camera?.focusXPercent ?? 100;
  const focusYPercent = frame.camera?.focusYPercent ?? (frame.framing === 'safe-face-closeup' ? 0 : 100);
  const zoom = frame.camera?.zoom ?? defaultZoom;

  return {
    '--story-cg-focus-x': `${focusXPercent}%`,
    '--story-cg-focus-y': `${focusYPercent}%`,
    '--story-cg-scale-from': String(zoom + 0.08),
    '--story-cg-scale-to': String(zoom),
  };
}

/** A derived, click-through visual beat. It owns no story or settlement state. */
export default function GalCgPage({ cg, frameIndex, isLeaving }: GalCgPageProps) {
  const activeFrame = cg.frames[frameIndex];
  if (!activeFrame) return null;

  return (
    <div
      className={`gal-main-story__cg ${isLeaving ? 'is-leaving' : 'is-visible'}`}
      data-cg-id={cg.id}
      data-cg-frame-index={frameIndex}
      data-cg-frame-count={cg.frames.length}
      data-framing={activeFrame.framing}
      data-transition={cg.transition}
    >
      {cg.frames.map((frame, index) => {
        const isActive = index === frameIndex;
        return (
          <img
            key={frame.id}
            className={`gal-main-story__cg-frame ${isActive ? 'is-active' : ''}`}
            src={resolveAssetPath(frame.asset)}
            alt={isActive ? frame.alt : ''}
            aria-hidden={!isActive}
            data-framing={frame.framing}
            data-frame-id={frame.id}
            data-frame-index={index}
            style={getFrameStyle(frame)}
            draggable={false}
          />
        );
      })}
    </div>
  );
}
