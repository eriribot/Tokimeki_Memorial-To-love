import type { DatingStageContent } from './types';

/**
 * A floor preview is one persisted stage. Omitting stageIndex preserves the
 * older whole-date replay that walks every stage in archive order.
 */
export function selectDatingHistoryReplayContents(
  contents: readonly DatingStageContent[],
  stageIndex?: number,
): readonly DatingStageContent[] {
  if (stageIndex === undefined) return contents;
  if (!Number.isSafeInteger(stageIndex) || stageIndex < 0) return [];
  const content = contents[stageIndex];
  return content ? [content] : [];
}
