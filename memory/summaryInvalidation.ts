import type { GalStoryActArchive } from '../GalMainStory/storyTypes';
import type { DatingArchive } from '../DatingModule/types';
import { getCanonicalStoryTimeline } from './storyTimeline';
import { getMemorySummariesForSave, useMemorySummaryArchiveStore, type MemorySummaryCandidate } from './summaryArchive';

/**
 * 总结失效检测结果
 */
export interface SummaryInvalidationResult {
  invalidatedSummaries: InvalidatedSummary[];
  affectedCount: number;
  needsRegeneration: boolean;
}

export interface InvalidatedSummary {
  summary: MemorySummaryCandidate;
  reason: 'source-floor-regenerated' | 'source-floor-deleted';
  missingFloorIds: string[];
}

function getActiveSummaryFloorIds(
  archives: readonly GalStoryActArchive[],
  datingArchives: readonly DatingArchive[],
): Set<string> {
  return new Set([
    ...getCanonicalStoryTimeline(archives).map(floor => floor.floorId),
    ...datingArchives.map(archive => archive.id),
  ]);
}

function getCurrentSummariesForSave(
  saveUuid: string,
  currentSummaries?: readonly MemorySummaryCandidate[],
): readonly MemorySummaryCandidate[] {
  const summaries = currentSummaries ?? getMemorySummariesForSave(saveUuid);
  return summaries.filter(summary => summary.saveUuid === saveUuid);
}

/**
 * 检测某个楼层被重新生成后，哪些总结会失效
 */
export function detectSummaryInvalidation(
  archives: readonly GalStoryActArchive[],
  regeneratedFloorId: string,
  saveUuid: string,
  datingArchives: readonly DatingArchive[],
  currentSummaries?: readonly MemorySummaryCandidate[],
): SummaryInvalidationResult {
  const summaries = getCurrentSummariesForSave(saveUuid, currentSummaries);
  const activeFloorIds = getActiveSummaryFloorIds(archives, datingArchives);

  const invalidatedSummaries: InvalidatedSummary[] = [];

  for (const summary of summaries) {
    // 只检查已接受的小总结（大总结依赖小总结，不直接依赖 floor）
    if (summary.status !== 'accepted' || summary.mode !== 'small') continue;

    // 检查是否引用了被重新生成的 floor
    if (!summary.sourceFloorIds.includes(regeneratedFloorId)) continue;

    // 检查有多少源 floor 不再是活动楼层
    const missingFloorIds = summary.sourceFloorIds.filter(floorId => !activeFloorIds.has(floorId));

    invalidatedSummaries.push({
      summary,
      reason: missingFloorIds.length > 0 ? 'source-floor-deleted' : 'source-floor-regenerated',
      missingFloorIds,
    });
  }

  return {
    invalidatedSummaries,
    affectedCount: invalidatedSummaries.length,
    needsRegeneration: invalidatedSummaries.length > 0,
  };
}

/**
 * 使总结失效（标记为 rejected）
 */
export function invalidateSummary(summaryId: string): boolean {
  const store = useMemorySummaryArchiveStore.getState();
  const summary = store.summaries.find(s => s.summaryId === summaryId);

  if (!summary || summary.status === 'rejected') return false;

  // 使用 reviewCandidate 将其标记为 rejected
  return store.reviewCandidate(summaryId, 'reject');
}

/**
 * 批量使总结失效
 */
export function invalidateSummaries(summaryIds: string[]): number {
  let count = 0;
  for (const summaryId of summaryIds) {
    if (invalidateSummary(summaryId)) count++;
  }
  return count;
}

/**
 * 检查当前是否有失效的总结
 */
export function hasInvalidSummaries(
  archives: readonly GalStoryActArchive[],
  datingArchives: readonly DatingArchive[],
  saveUuid: string,
  currentSummaries?: readonly MemorySummaryCandidate[],
): boolean {
  const summaries = getCurrentSummariesForSave(saveUuid, currentSummaries);
  const timelineFloorIds = getActiveSummaryFloorIds(archives, datingArchives);

  for (const summary of summaries) {
    if (summary.status !== 'accepted' || summary.mode !== 'small') continue;

    // 检查源 floor 是否都在时间线中
    const allFloorsExist = summary.sourceFloorIds.every(floorId => timelineFloorIds.has(floorId));
    if (!allFloorsExist) return true;
  }

  return false;
}

/**
 * 获取所有失效的总结
 */
export function getInvalidSummaries(
  archives: readonly GalStoryActArchive[],
  datingArchives: readonly DatingArchive[],
  saveUuid: string,
  currentSummaries?: readonly MemorySummaryCandidate[],
): MemorySummaryCandidate[] {
  const summaries = getCurrentSummariesForSave(saveUuid, currentSummaries);
  const timelineFloorIds = getActiveSummaryFloorIds(archives, datingArchives);

  return summaries.filter(summary => {
    if (summary.status !== 'accepted' || summary.mode !== 'small') return false;
    return !summary.sourceFloorIds.every(floorId => timelineFloorIds.has(floorId));
  });
}

/**
 * 生成失效报告（人类可读）
 */
export function generateInvalidationReport(result: SummaryInvalidationResult): string {
  if (result.affectedCount === 0) {
    return '✅ 没有总结会失效。';
  }

  const lines: string[] = [`⚠️ 重新生成将使 ${result.affectedCount} 条总结失效：\n`];

  for (const { summary, reason, missingFloorIds } of result.invalidatedSummaries) {
    lines.push(`【${summary.title}】`);
    lines.push(`  总结 ID: ${summary.summaryId.slice(0, 20)}...`);
    lines.push(`  覆盖楼层: ${summary.sourceFloorIds.length} 个`);

    if (reason === 'source-floor-deleted') {
      lines.push(`  原因: ${missingFloorIds.length} 个源楼层已被删除或替换`);
    } else {
      lines.push(`  原因: 源楼层已重新生成，内容已改变`);
    }
    lines.push('');
  }

  lines.push('建议操作：');
  lines.push('1. 继续重新生成正文');
  lines.push('2. 失效的总结会自动标记为 rejected');
  lines.push('3. 系统会在新正文生成后自动创建新总结');

  return lines.join('\n');
}
