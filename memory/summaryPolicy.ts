export const RECENT_CONTEXT_MESSAGE_LIMIT = 6;
export const SMALL_SUMMARY_MIN_SOURCE_FLOOR_COUNT = 1;
export const SMALL_SUMMARY_SOURCE_FLOOR_COUNT = 6;
export const LARGE_SUMMARY_SOURCE_COUNT = 5;
export const SMALL_SUMMARY_MIN_LENGTH = 100;
export const SMALL_SUMMARY_MAX_LENGTH = 200;
export const LARGE_SUMMARY_MIN_LENGTH = 300;
export const LARGE_SUMMARY_MAX_LENGTH = 400;

export function getMemorySummaryMinLength(mode: 'small' | 'large'): number {
  return mode === 'small' ? SMALL_SUMMARY_MIN_LENGTH : LARGE_SUMMARY_MIN_LENGTH;
}

export function getMemorySummaryMaxLength(mode: 'small' | 'large'): number {
  return mode === 'small' ? SMALL_SUMMARY_MAX_LENGTH : LARGE_SUMMARY_MAX_LENGTH;
}
