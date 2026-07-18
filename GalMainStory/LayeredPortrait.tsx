import type { CSSProperties } from 'react';
import { resolveAssetPath } from '../utils/assetPath';
import { getPortraitFaceAssets, type LayeredPortraitRig } from './galAssets';
import type { LalaExpression } from './storyTypes';

interface LayeredPortraitProps {
  rig: LayeredPortraitRig;
  expression: LalaExpression;
  isSpeaking: boolean;
  beatKey: number;
}

function getRegionStyle(rig: LayeredPortraitRig, region: 'eyes' | 'mouth'): CSSProperties {
  const rect = rig.regions[region];
  return {
    top: `${(rect.y / rig.canvas.height) * 100}%`,
    left: `${(rect.x / rig.canvas.width) * 100}%`,
    width: `${(rect.width / rig.canvas.width) * 100}%`,
    height: `${(rect.height / rig.canvas.height) * 100}%`,
  };
}

export default function LayeredPortrait({ rig, expression, isSpeaking, beatKey }: LayeredPortraitProps) {
  const maskUrl = resolveAssetPath(rig.mask);
  const faceAssets = getPortraitFaceAssets(rig, expression);
  const shouldBlink = !rig.nonBlinkingExpressions.has(expression);

  return (
    <div className="layered-portrait-stage" role="img" aria-label={`${rig.displayName}，表情 ${expression}`}>
      <div
        className="layered-portrait"
        style={{
          WebkitMaskImage: `url("${maskUrl}")`,
          maskImage: `url("${maskUrl}")`,
        }}
      >
        <img className="layered-portrait__body" src={resolveAssetPath(rig.body)} alt="" aria-hidden="true" />

        <span
          className="layered-portrait__face-window layered-portrait__eyes"
          style={getRegionStyle(rig, 'eyes')}
          aria-hidden="true"
        >
          <img className={shouldBlink ? 'is-blinking' : ''} src={resolveAssetPath(faceAssets.eyes)} alt="" />
        </span>

        <span
          className="layered-portrait__face-window layered-portrait__mouth"
          style={getRegionStyle(rig, 'mouth')}
          aria-hidden="true"
        >
          <img
            key={`${rig.id}-mouth-${beatKey}-${expression}`}
            className={isSpeaking ? 'is-speaking' : ''}
            src={resolveAssetPath(faceAssets.mouth)}
            alt=""
          />
        </span>
      </div>
    </div>
  );
}
