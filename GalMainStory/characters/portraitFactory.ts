import type { LayeredPortraitExpression } from './types';

export function createFaceAtlasExpressions(
  facePrefix: string,
  suffixes: Readonly<Record<string, string>>,
  nonBlinkingExpressionIds: readonly string[] = [],
): Readonly<Record<string, LayeredPortraitExpression>> {
  const nonBlinking = new Set(nonBlinkingExpressionIds);
  return Object.fromEntries(
    Object.entries(suffixes).map(([expressionId, suffix]) => [
      expressionId,
      {
        id: expressionId,
        eyes: `${facePrefix}${suffix}_eye.png`,
        mouth: `${facePrefix}${suffix}_mouth.png`,
        blinking: !nonBlinking.has(expressionId),
      },
    ]),
  );
}
