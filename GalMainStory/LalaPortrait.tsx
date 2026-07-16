import { resolveAssetPath } from '../utils/assetPath';
import { getLalaFaceAssets, LALA_PORTRAIT_ASSETS } from './galAssets';
import type { LalaExpression } from './storyTypes';

interface LalaPortraitProps {
  expression: LalaExpression;
  isSpeaking: boolean;
  beatKey: number;
}

export default function LalaPortrait({ expression, isSpeaking, beatKey }: LalaPortraitProps) {
  const maskUrl = resolveAssetPath(LALA_PORTRAIT_ASSETS.mask);
  const faceAssets = getLalaFaceAssets(expression);
  const eyeSheet = resolveAssetPath(faceAssets.eyes);
  const mouthSheet = resolveAssetPath(faceAssets.mouth);
  const shouldBlink = !LALA_PORTRAIT_ASSETS.nonBlinkingExpressions.has(expression);

  return (
    <div className="lala-portrait-stage" role="img" aria-label={`菈菈，表情 ${expression}`}>
      <div
        className="lala-portrait"
        style={{
          WebkitMaskImage: `url("${maskUrl}")`,
          maskImage: `url("${maskUrl}")`,
        }}
      >
        <img
          className="lala-portrait__body"
          src={resolveAssetPath(LALA_PORTRAIT_ASSETS.body)}
          alt=""
          aria-hidden="true"
        />

        <span className="lala-portrait__face-window lala-portrait__eyes" aria-hidden="true">
          <img
            key={`eyes-${beatKey}-${expression}`}
            className={shouldBlink ? 'is-blinking' : ''}
            src={eyeSheet}
            alt=""
          />
        </span>

        <span className="lala-portrait__face-window lala-portrait__mouth" aria-hidden="true">
          <img
            key={`mouth-${beatKey}-${expression}`}
            className={isSpeaking ? 'is-speaking' : ''}
            src={mouthSheet}
            alt=""
          />
        </span>
      </div>
    </div>
  );
}
