import type { GalChoiceVisual } from '../GalMainStory/GalChoicePanel';

/**
 * Presentation-only metadata for dating interactions.
 * Relationship settlement continues to use DatingOption.id, so new visual types
 * can be added without changing the dating director or its save contract.
 */
const DATING_OPTION_VISUALS: Readonly<Record<string, GalChoiceVisual>> = {
  'riverbank-follow': { type: 'glyph', value: '↝', alt: '沿路' },
  'riverbank-sunset': { type: 'glyph', value: '◒', alt: '晚霞' },
  'riverbank-bond-talk': { type: 'glyph', value: '♢', alt: '默契' },
  'riverbank-shadow': { type: 'glyph', value: '✦', alt: '玩笑' },
  'main-careful': { type: 'glyph', value: '◎', alt: '询问' },
  'main-share': { type: 'glyph', value: '◌', alt: '分享' },
  'main-rush': { type: 'glyph', value: '➚', alt: '主动' },
  'return-thanks': { type: 'glyph', value: '♡', alt: '道谢' },
  'return-next': { type: 'glyph', value: '↗', alt: '约下次' },
  'return-joke': { type: 'glyph', value: '✧', alt: '玩笑' },
};

export function getDatingOptionVisual(optionId: string): GalChoiceVisual | undefined {
  return DATING_OPTION_VISUALS[optionId];
}
