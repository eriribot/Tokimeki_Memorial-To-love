import type { CSSProperties } from 'react';
import { resolveAssetPath } from '../utils/assetPath';
import type { LayeredPortraitRig } from './characters';

interface LayeredPortraitProps {
  rig: LayeredPortraitRig;
  expressionId: string;
  isSpeaking: boolean;
  beatKey: number;
}

type FaceWindowStyle = CSSProperties & {
  '--portrait-feather-x'?: string;
  '--portrait-feather-y'?: string;
};

function getRegionStyle(rig: LayeredPortraitRig, region: 'eyes' | 'mouth'): FaceWindowStyle {
  const rect = rig.regions[region];
  const style: FaceWindowStyle = {
    top: `${(rect.y / rig.canvas.height) * 100}%`,
    left: `${(rect.x / rig.canvas.width) * 100}%`,
    width: `${(rect.width / rig.canvas.width) * 100}%`,
    height: `${(rect.height / rig.canvas.height) * 100}%`,
  };

  if (rect.feather) {
    style['--portrait-feather-x'] = `${(rect.feather / rect.width) * 100}%`;
    style['--portrait-feather-y'] = `${(rect.feather / rect.height) * 100}%`;
  }

  return style;
}

export default function LayeredPortrait({ rig, expressionId, isSpeaking, beatKey }: LayeredPortraitProps) {
  const maskUrl = resolveAssetPath(rig.mask);
  const expression = rig.expressions[expressionId] ?? rig.expressions[rig.defaultExpressionId];
  if (!expression) throw new Error(`立绘“${rig.id}”没有默认表情“${rig.defaultExpressionId}”。`);

  return (
    <div className="layered-portrait-stage" role="img" aria-label={`${rig.displayName}，表情 ${expression.id}`}>
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
          data-feathered={rig.regions.eyes.feather ? 'true' : undefined}
          style={getRegionStyle(rig, 'eyes')}
          aria-hidden="true"
        >
          <img className={expression.blinking ? 'is-blinking' : ''} src={resolveAssetPath(expression.eyes)} alt="" />
        </span>

        <span
          className="layered-portrait__face-window layered-portrait__mouth"
          data-feathered={rig.regions.mouth.feather ? 'true' : undefined}
          style={getRegionStyle(rig, 'mouth')}
          aria-hidden="true"
        >
          <img
            key={`${rig.characterId}-${rig.id}-mouth-${beatKey}-${expression.id}`}
            className={isSpeaking ? 'is-speaking' : ''}
            src={resolveAssetPath(expression.mouth)}
            alt=""
          />
        </span>
      </div>
    </div>
  );
}
