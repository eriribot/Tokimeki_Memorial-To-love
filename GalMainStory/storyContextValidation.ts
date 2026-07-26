import type { GalStoryActArchive, GalStoryFloor } from './storyTypes';
import { getMainStoryActIndex, getMainStoryEpisode } from './storyRegistry';
import { getPreviousActiveStoryFloors } from './storyArchive';

/**
 * 上下文验证结果
 */
export interface ContextValidationResult {
  isValid: boolean;
  floorId: string;
  eventId: string;
  actId: string;
  actIndex: number;
  expectedContextFloorIds: string[];
  actualContextFloorIds: string[];
  mismatches: ContextMismatch[];
}

export interface ContextMismatch {
  position: number;
  expected: string;
  actual: string;
}

/**
 * 上下文影响分析
 */
export interface ContextImpactAnalysis {
  targetFloor: {
    floorId: string;
    eventId: string;
    actId: string;
    actIndex: number;
  };
  affectedFloors: ContextValidationResult[];
  totalAffected: number;
  needsRegeneration: boolean;
}

/**
 * 验证单个楼层的上下文是否有效
 */
export function validateFloorContext(
  archives: readonly GalStoryActArchive[],
  floor: GalStoryFloor,
): ContextValidationResult {
  const actIndex = getMainStoryActIndex(floor.eventId, floor.actId);
  const expectedFloors = getPreviousActiveStoryFloors(archives, floor.eventId, floor.actId);
  const expectedContextFloorIds = expectedFloors.map(f => f.floorId);
  const actualContextFloorIds = floor.contextFloorIds;

  const mismatches: ContextMismatch[] = [];
  const maxLength = Math.max(expectedContextFloorIds.length, actualContextFloorIds.length);

  for (let i = 0; i < maxLength; i++) {
    const expected = expectedContextFloorIds[i] ?? '(missing)';
    const actual = actualContextFloorIds[i] ?? '(missing)';
    if (expected !== actual) {
      mismatches.push({ position: i, expected, actual });
    }
  }

  return {
    isValid: mismatches.length === 0,
    floorId: floor.floorId,
    eventId: floor.eventId,
    actId: floor.actId,
    actIndex,
    expectedContextFloorIds,
    actualContextFloorIds,
    mismatches,
  };
}

/**
 * 验证整个剧情档案的上下文完整性
 */
export function validateAllContexts(
  archives: readonly GalStoryActArchive[],
): ContextValidationResult[] {
  const results: ContextValidationResult[] = [];

  for (const archive of archives) {
    const activeFloor = archive.floors.find(f => f.floorId === archive.activeFloorId);
    if (!activeFloor || !activeFloor.act) continue;

    const validation = validateFloorContext(archives, activeFloor);
    results.push(validation);
  }

  return results;
}

/**
 * 分析重新生成某个楼层会影响哪些后续楼层
 */
export function analyzeRegenerationImpact(
  archives: readonly GalStoryActArchive[],
  targetFloorId: string,
): ContextImpactAnalysis | null {
  // 找到目标楼层
  let targetFloor: GalStoryFloor | null = null;
  let targetArchive: GalStoryActArchive | null = null;

  for (const archive of archives) {
    const floor = archive.floors.find(f => f.floorId === targetFloorId);
    if (floor) {
      targetFloor = floor;
      targetArchive = archive;
      break;
    }
  }

  if (!targetFloor || !targetArchive) return null;

  const targetActIndex = getMainStoryActIndex(targetFloor.eventId, targetFloor.actId);
  if (targetActIndex < 0) return null;

  // 找到所有依赖此楼层的后续楼层
  const affectedFloors: ContextValidationResult[] = [];

  for (const archive of archives) {
    if (archive.eventId !== targetFloor.eventId) continue;

    const actIndex = getMainStoryActIndex(archive.eventId, archive.actId);
    if (actIndex <= targetActIndex) continue; // 只检查后续幕

    const activeFloor = archive.floors.find(f => f.floorId === archive.activeFloorId);
    if (!activeFloor || !activeFloor.act) continue;

    // 检查是否引用了目标楼层
    if (activeFloor.contextFloorIds.includes(targetFloorId)) {
      const validation = validateFloorContext(archives, activeFloor);
      affectedFloors.push(validation);
    }
  }

  return {
    targetFloor: {
      floorId: targetFloor.floorId,
      eventId: targetFloor.eventId,
      actId: targetFloor.actId,
      actIndex: targetActIndex,
    },
    affectedFloors,
    totalAffected: affectedFloors.length,
    needsRegeneration: affectedFloors.length > 0,
  };
}

/**
 * 获取所有上下文失效的楼层
 */
export function getInvalidContextFloors(
  archives: readonly GalStoryActArchive[],
): ContextValidationResult[] {
  return validateAllContexts(archives).filter(result => !result.isValid);
}

/**
 * 生成上下文验证报告（人类可读）
 */
export function generateContextReport(
  archives: readonly GalStoryActArchive[],
): string {
  const validations = validateAllContexts(archives);
  const invalid = validations.filter(v => !v.isValid);

  if (invalid.length === 0) {
    return `✅ 所有 ${validations.length} 个活动楼层的上下文均有效。`;
  }

  const lines: string[] = [
    `⚠️ 发现 ${invalid.length} / ${validations.length} 个楼层的上下文失效：\n`,
  ];

  for (const result of invalid) {
    const episode = getMainStoryEpisode(result.eventId);
    const episodeName = episode?.displayName ?? result.eventId;
    lines.push(`【${episodeName} - Act ${result.actIndex + 1}】`);
    lines.push(`  楼层 ID: ${result.floorId.slice(0, 20)}...`);
    lines.push(`  期望依赖: ${result.expectedContextFloorIds.length} 个前置楼层`);
    lines.push(`  实际记录: ${result.actualContextFloorIds.length} 个前置楼层`);

    for (const mismatch of result.mismatches) {
      lines.push(`  - 位置 ${mismatch.position}:`);
      if (mismatch.expected === '(missing)') {
        lines.push(`    实际有多余引用: ${mismatch.actual.slice(0, 20)}...`);
      } else if (mismatch.actual === '(missing)') {
        lines.push(`    缺少必需引用: ${mismatch.expected.slice(0, 20)}...`);
      } else {
        lines.push(`    期望: ${mismatch.expected.slice(0, 20)}...`);
        lines.push(`    实际: ${mismatch.actual.slice(0, 20)}...`);
      }
    }
    lines.push('');
  }

  return lines.join('\n');
}

/**
 * 生成重新生成影响报告
 */
export function generateImpactReport(impact: ContextImpactAnalysis): string {
  const episode = getMainStoryEpisode(impact.targetFloor.eventId);
  const episodeName = episode?.displayName ?? impact.targetFloor.eventId;

  const lines: string[] = [
    `🎯 目标楼层：【${episodeName} - Act ${impact.targetFloor.actIndex + 1}】`,
    `   ID: ${impact.targetFloor.floorId.slice(0, 30)}...\n`,
  ];

  if (impact.totalAffected === 0) {
    lines.push('✅ 没有其他楼层依赖此楼层，可以安全重新生成。');
  } else {
    lines.push(`⚠️ 重新生成此楼层将影响后续 ${impact.totalAffected} 个幕：\n`);

    for (const affected of impact.affectedFloors) {
      lines.push(`  - Act ${affected.actIndex + 1} (${affected.actId})`);
      lines.push(`    当前引用了旧楼层，重新生成后需要连带更新`);
    }

    lines.push('\n建议操作：');
    lines.push('1. 重新生成目标楼层');
    lines.push('2. 依次重新生成所有受影响的后续楼层');
    lines.push('   （系统会自动使用新的上下文）');
  }

  return lines.join('\n');
}
