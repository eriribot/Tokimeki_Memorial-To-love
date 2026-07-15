import { resolveAssetPath } from '../utils/assetPath';
import type { LalaExpression } from './lalaArrival';

const LALA_BODY = '/artsource/lala/004_03_03_a%20%232247.png';
const LALA_MASK = '/artsource/lala/004_03_03_a.png';

interface LalaPortraitProps {
  expression: LalaExpression;
  isSpeaking: boolean;
  beatKey: number;
}

export default function LalaPortrait({ expression, isSpeaking, beatKey }: LalaPortraitProps) {
  const maskUrl = resolveAssetPath(LALA_MASK);
  const eyeSheet = resolveAssetPath(`/artsource/lala/004_03_03_${expression}_eye.png`);
  const mouthSheet = resolveAssetPath(`/artsource/lala/004_03_03_${expression}_mouth.png`);
  const shouldBlink = expression !== 'c' && expression !== 'f';

  return (
    <div className="lala-portrait-stage" role="img" aria-label={`菈菈，表情 ${expression}`}>
      <div
        className="lala-portrait"
        style={{
          WebkitMaskImage: `url("${maskUrl}")`,
          maskImage: `url("${maskUrl}")`,
        }}
      >
        <img className="lala-portrait__body" src={resolveAssetPath(LALA_BODY)} alt="" aria-hidden="true" />

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
