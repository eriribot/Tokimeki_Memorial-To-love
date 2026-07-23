import type { MemorySummaryFact } from './summaryArchive';
import {
  getMemorySummaryMaxLength,
  getMemorySummaryMinLength,
  LARGE_SUMMARY_SOURCE_COUNT,
  SMALL_SUMMARY_MIN_SOURCE_FLOOR_COUNT,
  SMALL_SUMMARY_SOURCE_FLOOR_COUNT,
} from './summaryPolicy';
import type { MemorySummaryMode } from './summaryPrompts';

export interface LocalMemorySummaryPayload {
  title: string;
  text: string;
  facts: MemorySummaryFact[];
}

export interface MemorySummaryTextContext {
  mode: MemorySummaryMode;
  sourceFloorIds: readonly string[];
  sourceSummaryIds: readonly string[];
}

function normalizePlainSummaryText(responseText: string, mode: MemorySummaryMode): string {
  const text = responseText
    .replace(/\r\n?/gu, '\n')
    .replace(/[ \t]+$/gmu, '')
    .replace(/\n{3,}/gu, '\n\n')
    .trim();
  if (!text) throw new Error('记忆 API 返回了空白摘要。');
  if (/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/u.test(text)) {
    throw new Error('记忆 API 返回的摘要包含不允许的控制字符。');
  }

  const minLength = getMemorySummaryMinLength(mode);
  const maxLength = getMemorySummaryMaxLength(mode);
  if (text.length < minLength || text.length > maxLength) {
    throw new Error(
      `记忆 API 返回的${mode === 'small' ? '小总结' : '大总结'}必须为${minLength}至${maxLength}个字符。`,
    );
  }
  return text;
}

export function createMemorySummaryPayloadFromText(
  responseText: string,
  context: MemorySummaryTextContext,
): LocalMemorySummaryPayload {
  if (context.mode === 'small') {
    const sourceFloorCount = context.sourceFloorIds.length;
    if (
      sourceFloorCount < SMALL_SUMMARY_MIN_SOURCE_FLOOR_COUNT ||
      sourceFloorCount > SMALL_SUMMARY_SOURCE_FLOOR_COUNT ||
      context.sourceSummaryIds.length !== 0
    ) {
      throw new Error(
        `小总结必须由${SMALL_SUMMARY_MIN_SOURCE_FLOOR_COUNT}至${SMALL_SUMMARY_SOURCE_FLOOR_COUNT}个完整楼层构成。`,
      );
    }
    return {
      title: `剧情小结 · ${sourceFloorCount} 个楼层`,
      text: normalizePlainSummaryText(responseText, context.mode),
      facts: [],
    };
  }

  if (context.sourceSummaryIds.length !== LARGE_SUMMARY_SOURCE_COUNT) {
    throw new Error(`大总结必须由${LARGE_SUMMARY_SOURCE_COUNT}条已接受小总结构成。`);
  }
  return {
    title: `阶段总览 · ${LARGE_SUMMARY_SOURCE_COUNT} 条小总结`,
    text: normalizePlainSummaryText(responseText, context.mode),
    facts: [],
  };
}
