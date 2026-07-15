/**
 * 占位符图片生成器
 * 当美术资源缺失时，生成精致的SVG占位符
 */
import { useEffect, useState, type ComponentPropsWithoutRef, type ReactEventHandler, type SyntheticEvent } from 'react';
import { resolveAssetPath } from './assetPath';

export interface PlaceholderCharacter {
  name: string;
  color?: string;
  type?: string;
}

export type PlaceholderImageType = 'portrait' | 'chibi' | 'tachie';

export interface ImageWithPlaceholderProps extends Omit<
  ComponentPropsWithoutRef<'img'>,
  'src' | 'alt' | 'onLoad' | 'onError'
> {
  src: string;
  alt: string;
  character?: PlaceholderCharacter;
  type?: PlaceholderImageType;
  onLoad?: ReactEventHandler<HTMLImageElement>;
  onError?: ReactEventHandler<HTMLImageElement>;
}

/**
 * 生成角色立绘占位符 - 优化版
 */
function svgToDataUrl(svg: string): string {
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}

export function generatePortraitPlaceholder(character: PlaceholderCharacter): string {
  const { name, color = '#ff8fab', type = '未知系' } = character;

  const gradientId = `gradient-${name.replace(/\s+/g, '-')}`;
  const lightColor = adjustColorBrightness(color, 30);
  const darkColor = adjustColorBrightness(color, -15);
  const accentColor = adjustColorBrightness(color, 50);

  return svgToDataUrl(`
    <svg width="180" height="240" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="${gradientId}" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style="stop-color:${lightColor};stop-opacity:1" />
          <stop offset="50%" style="stop-color:${color};stop-opacity:1" />
          <stop offset="100%" style="stop-color:${darkColor};stop-opacity:1" />
        </linearGradient>
        <radialGradient id="${gradientId}-glow" cx="50%" cy="40%">
          <stop offset="0%" style="stop-color:${accentColor};stop-opacity:0.8" />
          <stop offset="100%" style="stop-color:${color};stop-opacity:0.2" />
        </radialGradient>
        <filter id="glow">
          <feGaussianBlur stdDeviation="4" result="coloredBlur"/>
          <feMerge>
            <feMergeNode in="coloredBlur"/>
            <feMergeNode in="SourceGraphic"/>
          </feMerge>
        </filter>
        <filter id="shadow">
          <feDropShadow dx="0" dy="4" stdDeviation="8" flood-opacity="0.3"/>
        </filter>
      </defs>

      <!-- 背景渐变 -->
      <rect width="180" height="240" fill="url(#${gradientId})" rx="12"/>

      <!-- 光晕效果 -->
      <ellipse cx="90" cy="80" rx="80" ry="60" fill="url(#${gradientId}-glow)" opacity="0.6"/>

      <!-- 装饰圆圈层 -->
      <circle cx="90" cy="100" r="65" fill="none" stroke="rgba(255,255,255,0.15)" stroke-width="2"/>
      <circle cx="90" cy="100" r="55" fill="none" stroke="rgba(255,255,255,0.25)" stroke-width="3"/>
      <circle cx="90" cy="100" r="45" fill="rgba(255,255,255,0.35)" filter="url(#shadow)"/>

      <!-- 角色名首字母 - 更大更突出 -->
      <text
        x="90"
        y="115"
        font-family="'Arial Black', Arial, sans-serif"
        font-size="56"
        font-weight="900"
        fill="white"
        text-anchor="middle"
        filter="url(#glow)"
        letter-spacing="2">
        ${name.charAt(0)}
      </text>

      <!-- 装饰星星 -->
      <path d="M 30 30 L 33 36 L 40 37 L 35 42 L 36 49 L 30 46 L 24 49 L 25 42 L 20 37 L 27 36 Z"
            fill="rgba(255,255,255,0.6)" filter="url(#glow)"/>
      <path d="M 150 35 L 153 41 L 160 42 L 155 47 L 156 54 L 150 51 L 144 54 L 145 47 L 140 42 L 147 41 Z"
            fill="rgba(255,255,255,0.6)" filter="url(#glow)"/>

      <!-- 角色名背景 -->
      <rect x="30" y="175" width="120" height="40" fill="rgba(0,0,0,0.4)" rx="20" filter="url(#shadow)"/>

      <!-- 角色名 -->
      <text
        x="90"
        y="192"
        font-family="'Microsoft YaHei', 'PingFang SC', sans-serif"
        font-size="22"
        font-weight="bold"
        fill="white"
        text-anchor="middle"
        filter="url(#glow)">
        ${name}
      </text>

      <!-- 类型标签 -->
      <rect x="50" y="200" width="80" height="24" fill="rgba(255,255,255,0.95)" rx="12" filter="url(#shadow)"/>
      <text
        x="90"
        y="216"
        font-family="'Microsoft YaHei', sans-serif"
        font-size="13"
        font-weight="600"
        fill="${darkColor}"
        text-anchor="middle">
        ${type}
      </text>

      <!-- 底部装饰心形 -->
      <g transform="translate(90, 225)">
        <path
          d="M 0 0 C 0 0 -6 -3 -6 -7 C -6 -10 -4 -12 -1 -12 C 1 -12 2 -11 2 -11 C 2 -11 3 -12 5 -12 C 8 -12 10 -10 10 -7 C 10 -3 4 0 0 0 Z"
          fill="rgba(255,255,255,0.8)"
          filter="url(#glow)"
          transform="scale(1.5)"
        />
      </g>

      <!-- 边框装饰 -->
      <rect x="2" y="2" width="176" height="236" rx="12" fill="none" stroke="rgba(255,255,255,0.4)" stroke-width="2"/>
    </svg>
  `);
}

/**
 * 生成Q版立绘占位符 - 优化版
 */
/**
 * 生成全身立绘占位符 - 竖版大尺寸
 */
export function generateTachiePlaceholder(character: PlaceholderCharacter): string {
  const { name, color = '#ff8fab', type = '未知系' } = character;

  const gradientId = `tachie-gradient-${name.replace(/\s+/g, '-')}`;
  const lightColor = adjustColorBrightness(color, 30);
  const darkColor = adjustColorBrightness(color, -20);
  const accentColor = adjustColorBrightness(color, 50);

  return svgToDataUrl(`
    <svg width="360" height="540" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="${gradientId}" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style="stop-color:${lightColor};stop-opacity:1" />
          <stop offset="50%" style="stop-color:${color};stop-opacity:1" />
          <stop offset="100%" style="stop-color:${darkColor};stop-opacity:1" />
        </linearGradient>
        <radialGradient id="${gradientId}-glow" cx="50%" cy="35%">
          <stop offset="0%" style="stop-color:${accentColor};stop-opacity:0.7" />
          <stop offset="100%" style="stop-color:${color};stop-opacity:0.15" />
        </radialGradient>
        <filter id="glow">
          <feGaussianBlur stdDeviation="6" result="coloredBlur"/>
          <feMerge>
            <feMergeNode in="coloredBlur"/>
            <feMergeNode in="SourceGraphic"/>
          </feMerge>
        </filter>
        <filter id="shadow">
          <feDropShadow dx="0" dy="6" stdDeviation="12" flood-opacity="0.3"/>
        </filter>
      </defs>

      <rect width="360" height="540" fill="url(#${gradientId})" rx="16"/>
      <ellipse cx="180" cy="180" rx="160" ry="120" fill="url(#${gradientId}-glow)" opacity="0.6"/>

      <circle cx="180" cy="220" r="110" fill="none" stroke="rgba(255,255,255,0.12)" stroke-width="3"/>
      <circle cx="180" cy="220" r="90" fill="none" stroke="rgba(255,255,255,0.2)" stroke-width="4"/>
      <circle cx="180" cy="220" r="70" fill="rgba(255,255,255,0.25)" filter="url(#shadow)"/>

      <text
        x="180"
        y="255"
        font-family="'Arial Black', Arial, sans-serif"
        font-size="96"
        font-weight="900"
        fill="white"
        text-anchor="middle"
        filter="url(#glow)"
        letter-spacing="4">
        ${name.charAt(0)}
      </text>

      <rect x="60" y="400" width="240" height="56" fill="rgba(0,0,0,0.35)" rx="28" filter="url(#shadow)"/>
      <text
        x="180"
        y="428"
        font-family="'Microsoft YaHei', 'PingFang SC', sans-serif"
        font-size="28"
        font-weight="bold"
        fill="white"
        text-anchor="middle"
        filter="url(#glow)">
        ${name}
      </text>

      <rect x="120" y="464" width="120" height="32" fill="rgba(255,255,255,0.92)" rx="16" filter="url(#shadow)"/>
      <text
        x="180"
        y="486"
        font-family="'Microsoft YaHei', sans-serif"
        font-size="15"
        font-weight="600"
        fill="${darkColor}"
        text-anchor="middle">
        ${type}
      </text>

      <rect x="4" y="4" width="352" height="532" rx="14" fill="none" stroke="rgba(255,255,255,0.35)" stroke-width="3"/>
    </svg>
  `);
}

export function generateChibiPlaceholder(character: PlaceholderCharacter): string {
  const { name, color = '#ff8fab' } = character;

  const gradientId = `chibi-gradient-${name.replace(/\s+/g, '-')}`;
  const lightColor = adjustColorBrightness(color, 35);
  const darkColor = adjustColorBrightness(color, -15);

  return svgToDataUrl(`
    <svg width="64" height="64" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="${gradientId}" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style="stop-color:${lightColor};stop-opacity:1" />
          <stop offset="100%" style="stop-color:${darkColor};stop-opacity:1" />
        </linearGradient>
        <filter id="shadow">
          <feDropShadow dx="0" dy="3" stdDeviation="4" flood-opacity="0.4"/>
        </filter>
        <filter id="glow">
          <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
          <feMerge>
            <feMergeNode in="coloredBlur"/>
            <feMergeNode in="SourceGraphic"/>
          </feMerge>
        </filter>
      </defs>

      <!-- 外层装饰环 -->
      <circle cx="32" cy="32" r="31" fill="url(#${gradientId})" filter="url(#shadow)"/>
      <circle cx="32" cy="32" r="29" fill="none" stroke="rgba(255,255,255,0.4)" stroke-width="2"/>

      <!-- 内层背景 -->
      <circle cx="32" cy="32" r="26" fill="rgba(255,255,255,0.3)"/>

      <!-- 角色名首字母 -->
      <text
        x="32"
        y="40"
        font-family="'Arial Black', Arial, sans-serif"
        font-size="28"
        font-weight="900"
        fill="white"
        text-anchor="middle"
        filter="url(#glow)">
        ${name.charAt(0)}
      </text>

      <!-- 装饰点 -->
      <circle cx="16" cy="16" r="4" fill="rgba(255,255,255,0.7)" filter="url(#glow)"/>
      <circle cx="48" cy="16" r="4" fill="rgba(255,255,255,0.7)" filter="url(#glow)"/>
      <circle cx="32" cy="50" r="3" fill="rgba(255,255,255,0.6)"/>

      <!-- 小星星装饰 -->
      <path d="M 20 10 L 21 12 L 23 12 L 21 14 L 22 16 L 20 15 L 18 16 L 19 14 L 17 12 L 19 12 Z"
            fill="rgba(255,255,255,0.8)"/>
      <path d="M 44 10 L 45 12 L 47 12 L 45 14 L 46 16 L 44 15 L 42 16 L 43 14 L 41 12 L 43 12 Z"
            fill="rgba(255,255,255,0.8)"/>
    </svg>
  `);
}

/**
 * 生成通用占位符
 */
export function generateGenericPlaceholder(width = 180, height = 240, text = '?'): string {
  return svgToDataUrl(`
    <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="generic-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style="stop-color:#ffc9d9;stop-opacity:1" />
          <stop offset="100%" style="stop-color:#e0568d;stop-opacity:1" />
        </linearGradient>
      </defs>

      <rect width="${width}" height="${height}" fill="url(#generic-gradient)" rx="8"/>

      <circle cx="${width / 2}" cy="${height / 2 - 20}" r="40" fill="rgba(255,255,255,0.3)"/>

      <text
        x="${width / 2}"
        y="${height / 2}"
        font-family="Arial, sans-serif"
        font-size="60"
        font-weight="bold"
        fill="white"
        text-anchor="middle">
        ${text}
      </text>

      <text
        x="${width / 2}"
        y="${height / 2 + 40}"
        font-family="Arial, sans-serif"
        font-size="14"
        fill="rgba(255,255,255,0.8)"
        text-anchor="middle">
        暂无图片
      </text>
    </svg>
  `);
}

/**
 * 调整颜色亮度
 */
function adjustColorBrightness(color: string, percent: number): string {
  let channels: [number, number, number] | null = null;
  if (color.startsWith('#')) {
    const hex = color.slice(1);
    if (hex.length === 3) {
      channels = [
        Number.parseInt(`${hex[0]}${hex[0]}`, 16),
        Number.parseInt(`${hex[1]}${hex[1]}`, 16),
        Number.parseInt(`${hex[2]}${hex[2]}`, 16),
      ];
    } else {
      channels = [
        Number.parseInt(hex.slice(0, 2), 16),
        Number.parseInt(hex.slice(2, 4), 16),
        Number.parseInt(hex.slice(4, 6), 16),
      ];
    }
  } else if (color.startsWith('rgb')) {
    const values = color.match(/\d+/g)?.map(Number);
    if (values && values.length >= 3) {
      channels = [values[0], values[1], values[2]];
    }
  }

  if (!channels || channels.some(Number.isNaN)) return color;

  const [red, green, blue] = channels.map(value => Math.max(0, Math.min(255, value + (value * percent) / 100)));

  return `rgb(${Math.round(red)}, ${Math.round(green)}, ${Math.round(blue)})`;
}

/**
 * React组件：带占位符回退的图片
 */
export function ImageWithPlaceholder({
  src,
  alt,
  character,
  type = 'portrait',
  className,
  style,
  onLoad,
  onError,
  ...imageProps
}: ImageWithPlaceholderProps) {
  const [imageSrc, setImageSrc] = useState(() => resolveAssetPath(src));

  useEffect(() => {
    setImageSrc(resolveAssetPath(src));
  }, [src]);

  const handleError = (event: SyntheticEvent<HTMLImageElement>) => {
    // 图片加载失败，使用占位符
    if (character) {
      const placeholder =
        type === 'chibi'
          ? generateChibiPlaceholder(character)
          : type === 'tachie'
            ? generateTachiePlaceholder(character)
            : generatePortraitPlaceholder(character);
      setImageSrc(placeholder);
    } else {
      setImageSrc(generateGenericPlaceholder());
    }
    onError?.(event);
  };

  const handleLoad = (event: SyntheticEvent<HTMLImageElement>) => onLoad?.(event);

  return (
    <img
      src={imageSrc}
      alt={alt}
      className={className}
      style={style}
      onError={handleError}
      onLoad={handleLoad}
      {...imageProps}
    />
  );
}
