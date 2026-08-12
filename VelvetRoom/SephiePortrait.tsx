import type { CSSProperties } from 'react';
import { resolveAssetPath } from '../utils/assetPath';

const SEPHIE_ASSETS = {
  body: '/artsource/sephie/sephie_body_runtime_v2.png',
  eyes: '/artsource/sephie/sephie_a_eye.png',
  mouth: '/artsource/sephie/sephie_a_mouth.png',
} as const;

const SEPHIE_CANVAS_SIZE = 1024;

function regionStyle(x: number, y: number, width: number, height: number): CSSProperties {
  return {
    top: `${(y / SEPHIE_CANVAS_SIZE) * 100}%`,
    left: `${(x / SEPHIE_CANVAS_SIZE) * 100}%`,
    width: `${(width / SEPHIE_CANVAS_SIZE) * 100}%`,
    height: `${(height / SEPHIE_CANVAS_SIZE) * 100}%`,
  };
}

interface SephiePortraitProps {
  /** 只在赛菲实际发言时重启嘴型动画。 */
  speaking: boolean;
  beatKey: number;
}

/**
 * 赛菲使用正式母图导出的透明 body 与原眼嘴图集。面纱仍在原始像素中，
 * 这里只应用相同 Alpha、眼嘴裁切和整体呼吸，不重新解释面纱设计。
 */
export default function SephiePortrait({ speaking, beatKey }: SephiePortraitProps) {
  return (
    <div
      className="sephie-portrait"
      data-speaking={speaking ? 'true' : 'false'}
      role="img"
      aria-label="赛菲"
    >
      <div className="sephie-portrait__composite">
        <img
          className="sephie-portrait__body"
          src={resolveAssetPath(SEPHIE_ASSETS.body)}
          alt=""
          aria-hidden="true"
          decoding="async"
        />
        <span className="sephie-portrait__face-window sephie-portrait__eyes" style={regionStyle(400, 90, 225, 145)}>
          <span className="sephie-portrait__face-mask">
            <img className="is-blinking" src={resolveAssetPath(SEPHIE_ASSETS.eyes)} alt="" aria-hidden="true" />
          </span>
        </span>
        <span
          className="sephie-portrait__face-window sephie-portrait__mouth"
          style={regionStyle(420, 185, 185, 105)}
        >
          <span className="sephie-portrait__face-mask">
            <img
              key={`sephie-mouth-${beatKey}`}
              className={speaking ? 'is-speaking' : ''}
              src={resolveAssetPath(SEPHIE_ASSETS.mouth)}
              alt=""
              aria-hidden="true"
            />
          </span>
        </span>
      </div>
    </div>
  );
}
