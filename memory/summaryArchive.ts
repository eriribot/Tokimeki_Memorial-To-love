import { create } from 'zustand';
import {
  getMemorySummaryMaxLength,
  getMemorySummaryMinLength,
  LARGE_SUMMARY_SOURCE_COUNT,
  SMALL_SUMMARY_MIN_SOURCE_FLOOR_COUNT,
  SMALL_SUMMARY_SOURCE_FLOOR_COUNT,
} from './summaryPolicy';
import type { MemoryFactCategory, MemorySummaryMode, MemorySummaryOrigin, SummaryFactInput } from './summaryPrompts';

const MEMORY_SUMMARY_ARCHIVE_KEY = 'tokimeki-to-love:memory-summary-archive:v3';
const MEMORY_SUMMARY_ARCHIVE_VERSION = 3 as const;

export type MemorySummaryReviewStatus = 'pending' | 'accepted' | 'rejected';
export type MemorySummaryJobStatus = 'running' | 'ready' | 'failed';

export interface MemorySummaryFact extends SummaryFactInput {
  category: MemoryFactCategory;
  evidence: Array<{ messageId: string; quote: string }>;
}

export interface MemorySummaryCandidate {
  summaryId: string;
  saveUuid: string;
  saveRevision: number;
  mode: MemorySummaryMode;
  origin: MemorySummaryOrigin;
  status: MemorySummaryReviewStatus;
  sourceFingerprint: string;
  sourceEventIds: string[];
  sourceActIds: string[];
  sourceFloorIds: string[];
  sourceMessageIds: string[];
  sourceSummaryIds: string[];
  title: string;
  text: string;
  facts: MemorySummaryFact[];
  model: string;
  providerRequestId?: string;
  createdAt: string;
  reviewedAt: string | null;
  originalTitle?: string;
  originalText?: string;
}

export interface MemorySummaryJob {
  jobId: string;
  saveUuid: string;
  saveRevision: number;
  mode: MemorySummaryMode;
  sourceFingerprint: string;
  sourceMessageIds: string[];
  sourceSummaryIds: string[];
  status: MemorySummaryJobStatus;
  attempt: number;
  candidateId: string | null;
  error: string | null;
  createdAt: string;
  updatedAt: string;
}

interface StoredMemorySummaryArchive {
  version: typeof MEMORY_SUMMARY_ARCHIVE_VERSION;
  activeSaveUuid: string | null;
  jobs: MemorySummaryJob[];
  summaries: MemorySummaryCandidate[];
}

interface MemorySummaryArchiveState extends StoredMemorySummaryArchive {
  setActiveSave: (saveUuid: string | null) => void;
  beginJob: (job: MemorySummaryJob) => void;
  restartJob: (jobId: string, saveRevision: number) => void;
  completeJob: (jobId: string, candidate: MemorySummaryCandidate) => void;
  failJob: (jobId: string, error: string) => void;
  reviewCandidate: (
    summaryId: string,
    decision: 'accept' | 'reject' | 'edit',
    edits?: { title: string; text: string },
  ) => boolean;
}

const EMPTY_ARCHIVE: StoredMemorySummaryArchive = {
  version: MEMORY_SUMMARY_ARCHIVE_VERSION,
  activeSaveUuid: null,
  jobs: [],
  summaries: [],
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every(item => typeof item === 'string');
}

function isNullableNonEmptyString(value: unknown): value is string | null {
  return value === null || (typeof value === 'string' && value.trim().length > 0);
}

function isNonEmptyUniqueStringArray(value: unknown): value is string[] {
  return (
    isStringArray(value) &&
    value.length > 0 &&
    value.every(item => item.trim().length > 0) &&
    new Set(value).size === value.length
  );
}

function areEqualStringArrays(left: readonly string[], right: readonly string[]): boolean {
  return left.length === right.length && left.every((value, index) => value === right[index]);
}

function uniqueStrings(values: readonly string[]): string[] {
  return [...new Set(values)];
}

function createLargeSourceFingerprint(summaries: readonly MemorySummaryCandidate[]): string {
  const value = JSON.stringify(
    summaries.map(summary => [
      summary.summaryId,
      summary.sourceFingerprint,
      summary.origin,
      summary.title,
      summary.text,
      summary.facts,
    ]),
  );
  let hash = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return `fnv1a:${(hash >>> 0).toString(16).padStart(8, '0')}`;
}

function hasStaticSourceShape(
  mode: MemorySummaryMode,
  sourceFloorIds: readonly string[],
  sourceMessageIds: readonly string[],
  sourceSummaryIds: readonly string[],
): boolean {
  if (mode === 'small') {
    return (
      sourceFloorIds.length >= SMALL_SUMMARY_MIN_SOURCE_FLOOR_COUNT &&
      sourceFloorIds.length <= SMALL_SUMMARY_SOURCE_FLOOR_COUNT &&
      sourceMessageIds.length === sourceFloorIds.length * 2 &&
      sourceSummaryIds.length === 0
    );
  }
  return (
    sourceFloorIds.length >= SMALL_SUMMARY_MIN_SOURCE_FLOOR_COUNT * LARGE_SUMMARY_SOURCE_COUNT &&
    sourceFloorIds.length <= SMALL_SUMMARY_SOURCE_FLOOR_COUNT * LARGE_SUMMARY_SOURCE_COUNT &&
    sourceMessageIds.length === sourceFloorIds.length * 2 &&
    sourceSummaryIds.length === LARGE_SUMMARY_SOURCE_COUNT
  );
}

function isSummary(value: unknown): value is MemorySummaryCandidate {
  if (!isRecord(value)) return false;
  if (value.mode !== 'small' && value.mode !== 'large') return false;
  if (
    !isNonEmptyUniqueStringArray(value.sourceFloorIds) ||
    !isNonEmptyUniqueStringArray(value.sourceMessageIds) ||
    !isStringArray(value.sourceSummaryIds) ||
    !value.sourceSummaryIds.every(item => item.trim().length > 0) ||
    new Set(value.sourceSummaryIds).size !== value.sourceSummaryIds.length ||
    !hasStaticSourceShape(value.mode, value.sourceFloorIds, value.sourceMessageIds, value.sourceSummaryIds)
  ) {
    return false;
  }
  return (
    typeof value.summaryId === 'string' &&
    value.summaryId.trim().length > 0 &&
    typeof value.saveUuid === 'string' &&
    value.saveUuid.trim().length > 0 &&
    typeof value.saveRevision === 'number' &&
    Number.isInteger(value.saveRevision) &&
    value.saveRevision >= 1 &&
    (value.origin === 'local-digest' || value.origin === 'secondary-api' || value.origin === 'player-edited') &&
    (value.status === 'pending' || value.status === 'accepted' || value.status === 'rejected') &&
    typeof value.sourceFingerprint === 'string' &&
    value.sourceFingerprint.trim().length > 0 &&
    isNonEmptyUniqueStringArray(value.sourceEventIds) &&
    isNonEmptyUniqueStringArray(value.sourceActIds) &&
    typeof value.title === 'string' &&
    value.title.trim().length > 0 &&
    value.title.length <= 30 &&
    typeof value.text === 'string' &&
    value.text.trim().length >= getMemorySummaryMinLength(value.mode) &&
    value.text.length <= getMemorySummaryMaxLength(value.mode) &&
    Array.isArray(value.facts) &&
    value.facts.length === 0 &&
    typeof value.model === 'string' &&
    value.model.trim().length > 0 &&
    (value.providerRequestId === undefined ||
      (typeof value.providerRequestId === 'string' && value.providerRequestId.trim().length > 0)) &&
    typeof value.createdAt === 'string' &&
    value.createdAt.trim().length > 0 &&
    (value.status === 'pending'
      ? value.reviewedAt === null
      : typeof value.reviewedAt === 'string' && value.reviewedAt.trim().length > 0) &&
    (value.originalTitle === undefined || typeof value.originalTitle === 'string') &&
    (value.originalText === undefined || typeof value.originalText === 'string')
  );
}

function isJob(value: unknown): value is MemorySummaryJob {
  if (!isRecord(value)) return false;
  if (value.mode !== 'small' && value.mode !== 'large') return false;
  if (!isNonEmptyUniqueStringArray(value.sourceMessageIds) || !isStringArray(value.sourceSummaryIds)) return false;
  if (
    !value.sourceSummaryIds.every(item => item.trim().length > 0) ||
    new Set(value.sourceSummaryIds).size !== value.sourceSummaryIds.length
  ) {
    return false;
  }
  const sourceFloorCount = value.sourceMessageIds.length / 2;
  const hasStaticJobSource =
    value.mode === 'small'
      ? Number.isInteger(sourceFloorCount) &&
        sourceFloorCount >= SMALL_SUMMARY_MIN_SOURCE_FLOOR_COUNT &&
        sourceFloorCount <= SMALL_SUMMARY_SOURCE_FLOOR_COUNT &&
        value.sourceSummaryIds.length === 0
      : Number.isInteger(sourceFloorCount) &&
        sourceFloorCount >= SMALL_SUMMARY_MIN_SOURCE_FLOOR_COUNT * LARGE_SUMMARY_SOURCE_COUNT &&
        sourceFloorCount <= SMALL_SUMMARY_SOURCE_FLOOR_COUNT * LARGE_SUMMARY_SOURCE_COUNT &&
        value.sourceSummaryIds.length === LARGE_SUMMARY_SOURCE_COUNT;
  if (!hasStaticJobSource) return false;
  return (
    typeof value.jobId === 'string' &&
    value.jobId.trim().length > 0 &&
    typeof value.saveUuid === 'string' &&
    value.saveUuid.trim().length > 0 &&
    typeof value.saveRevision === 'number' &&
    Number.isInteger(value.saveRevision) &&
    value.saveRevision >= 1 &&
    typeof value.sourceFingerprint === 'string' &&
    value.sourceFingerprint.trim().length > 0 &&
    (value.status === 'running' || value.status === 'ready' || value.status === 'failed') &&
    typeof value.attempt === 'number' &&
    Number.isInteger(value.attempt) &&
    value.attempt > 0 &&
    (value.status === 'ready'
      ? typeof value.candidateId === 'string' && value.candidateId.trim().length > 0 && value.error === null
      : value.candidateId === null &&
        (value.status === 'failed'
          ? typeof value.error === 'string' && value.error.trim().length > 0
          : value.error === null)) &&
    typeof value.createdAt === 'string' &&
    value.createdAt.trim().length > 0 &&
    typeof value.updatedAt === 'string' &&
    value.updatedAt.trim().length > 0
  );
}

function isReadyJobForCandidate(job: MemorySummaryJob, candidate: MemorySummaryCandidate): boolean {
  return (
    job.status === 'ready' &&
    job.candidateId === candidate.summaryId &&
    job.saveUuid === candidate.saveUuid &&
    job.saveRevision === candidate.saveRevision &&
    job.mode === candidate.mode &&
    job.sourceFingerprint === candidate.sourceFingerprint &&
    areEqualStringArrays(job.sourceMessageIds, candidate.sourceMessageIds) &&
    areEqualStringArrays(job.sourceSummaryIds, candidate.sourceSummaryIds)
  );
}

function hasValidLargeSummarySources(
  candidate: MemorySummaryCandidate,
  summariesById: ReadonlyMap<string, MemorySummaryCandidate>,
): boolean {
  if (candidate.mode === 'small') return true;
  const sources = candidate.sourceSummaryIds.map(summaryId => summariesById.get(summaryId));
  if (
    sources.some(
      source =>
        !source || source.mode !== 'small' || source.status !== 'accepted' || source.saveUuid !== candidate.saveUuid,
    )
  ) {
    return false;
  }
  const smallSources = sources as MemorySummaryCandidate[];
  return (
    candidate.sourceFingerprint === createLargeSourceFingerprint(smallSources) &&
    areEqualStringArrays(
      candidate.sourceEventIds,
      uniqueStrings(smallSources.flatMap(source => source.sourceEventIds)),
    ) &&
    areEqualStringArrays(
      candidate.sourceActIds,
      uniqueStrings(smallSources.flatMap(source => source.sourceActIds)),
    ) &&
    areEqualStringArrays(
      candidate.sourceFloorIds,
      smallSources.flatMap(source => source.sourceFloorIds),
    ) &&
    areEqualStringArrays(
      candidate.sourceMessageIds,
      smallSources.flatMap(source => source.sourceMessageIds),
    )
  );
}

function sanitizeArchiveEntries(
  jobs: readonly MemorySummaryJob[],
  summaries: readonly MemorySummaryCandidate[],
): Pick<StoredMemorySummaryArchive, 'jobs' | 'summaries'> {
  const summaryIdCounts = new Map<string, number>();
  const jobIdCounts = new Map<string, number>();
  for (const summary of summaries) summaryIdCounts.set(summary.summaryId, (summaryIdCounts.get(summary.summaryId) ?? 0) + 1);
  for (const job of jobs) jobIdCounts.set(job.jobId, (jobIdCounts.get(job.jobId) ?? 0) + 1);

  const uniqueSummaries = summaries.filter(summary => summaryIdCounts.get(summary.summaryId) === 1);
  const summariesById = new Map(uniqueSummaries.map(summary => [summary.summaryId, summary]));
  const uniqueJobs = jobs.filter(job => jobIdCounts.get(job.jobId) === 1);
  const readyCandidateCounts = new Map<string, number>();
  for (const job of uniqueJobs) {
    if (job.status !== 'ready' || !job.candidateId) continue;
    const candidate = summariesById.get(job.candidateId);
    if (!candidate || !isReadyJobForCandidate(job, candidate)) continue;
    readyCandidateCounts.set(job.candidateId, (readyCandidateCounts.get(job.candidateId) ?? 0) + 1);
  }

  const linkedSummaries = uniqueSummaries.filter(summary => readyCandidateCounts.get(summary.summaryId) === 1);
  const linkedSummariesById = new Map(linkedSummaries.map(summary => [summary.summaryId, summary]));
  const validSummaries = linkedSummaries.filter(summary => hasValidLargeSummarySources(summary, linkedSummariesById));
  const validSummaryIds = new Set(validSummaries.map(summary => summary.summaryId));
  const validJobs = uniqueJobs.filter(job => {
    if (job.status !== 'ready') return true;
    const candidate = job.candidateId ? linkedSummariesById.get(job.candidateId) : undefined;
    return !!candidate && validSummaryIds.has(candidate.summaryId) && isReadyJobForCandidate(job, candidate);
  });
  return { jobs: validJobs, summaries: validSummaries };
}

function loadArchive(): StoredMemorySummaryArchive {
  try {
    const raw = globalThis.localStorage?.getItem(MEMORY_SUMMARY_ARCHIVE_KEY);
    if (!raw) return { ...EMPTY_ARCHIVE };
    const parsed: unknown = JSON.parse(raw);
    if (!isRecord(parsed)) return { ...EMPTY_ARCHIVE };
    const activeSaveUuid = isNullableNonEmptyString(parsed.activeSaveUuid) ? parsed.activeSaveUuid : null;
    if (
      parsed.version !== MEMORY_SUMMARY_ARCHIVE_VERSION ||
      !Array.isArray(parsed.jobs) ||
      !Array.isArray(parsed.summaries)
    ) {
      return { ...EMPTY_ARCHIVE };
    }

    const interruptedAt = new Date().toISOString();
    const sanitized = sanitizeArchiveEntries(parsed.jobs.filter(isJob), parsed.summaries.filter(isSummary));
    return {
      version: MEMORY_SUMMARY_ARCHIVE_VERSION,
      activeSaveUuid,
      jobs: sanitized.jobs.map(job =>
        job.status === 'running'
          ? { ...job, status: 'failed' as const, error: '页面关闭或刷新，摘要请求已中断。', updatedAt: interruptedAt }
          : job,
      ),
      summaries: sanitized.summaries,
    };
  } catch {
    return { ...EMPTY_ARCHIVE };
  }
}

function persistArchive(state: Pick<MemorySummaryArchiveState, 'activeSaveUuid' | 'jobs' | 'summaries'>): void {
  try {
    const archive: StoredMemorySummaryArchive = {
      version: MEMORY_SUMMARY_ARCHIVE_VERSION,
      activeSaveUuid: state.activeSaveUuid,
      jobs: state.jobs,
      summaries: state.summaries,
    };
    globalThis.localStorage?.setItem(MEMORY_SUMMARY_ARCHIVE_KEY, JSON.stringify(archive));
  } catch (error) {
    console.warn('[ToLove Memory] 无法保存浏览器内的摘要候选记录。', error);
  }
}

export function createMemoryRuntimeId(prefix: 'job' | 'summary'): string {
  const suffix = globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(36).slice(2)}`;
  return `${prefix}-${suffix}`;
}

const initialArchive = loadArchive();

export const useMemorySummaryArchiveStore = create<MemorySummaryArchiveState>((set, get) => ({
  ...initialArchive,

  setActiveSave: saveUuid => {
    if (saveUuid !== null && !saveUuid.trim()) return;
    if (get().activeSaveUuid === saveUuid) return;
    set({ activeSaveUuid: saveUuid });
    persistArchive(get());
  },

  beginJob: job => {
    set(state => ({ jobs: [...state.jobs.filter(item => item.jobId !== job.jobId), job] }));
    persistArchive(get());
  },

  restartJob: (jobId, saveRevision) => {
    const now = new Date().toISOString();
    set(state => ({
      jobs: state.jobs.map(job =>
        job.jobId === jobId
          ? {
              ...job,
              saveRevision,
              status: 'running' as const,
              attempt: job.attempt + 1,
              candidateId: null,
              error: null,
              updatedAt: now,
            }
          : job,
      ),
    }));
    persistArchive(get());
  },

  completeJob: (jobId, candidate) => {
    const now = new Date().toISOString();
    set(state => ({
      jobs: state.jobs.map(job =>
        job.jobId === jobId
          ? { ...job, status: 'ready' as const, candidateId: candidate.summaryId, error: null, updatedAt: now }
          : job,
      ),
      summaries: [...state.summaries.filter(summary => summary.summaryId !== candidate.summaryId), candidate],
    }));
    persistArchive(get());
  },

  failJob: (jobId, error) => {
    const now = new Date().toISOString();
    set(state => ({
      jobs: state.jobs.map(job =>
        job.jobId === jobId
          ? { ...job, status: 'failed' as const, candidateId: null, error, updatedAt: now }
          : job,
      ),
    }));
    persistArchive(get());
  },

  reviewCandidate: (summaryId, decision, edits) => {
    const candidate = get().summaries.find(summary => summary.summaryId === summaryId);
    if (!candidate || candidate.status !== 'pending') return false;
    if (decision === 'edit') {
      const title = edits?.title.trim() ?? '';
      const text = edits?.text.trim() ?? '';
      const minTextLength = getMemorySummaryMinLength(candidate.mode);
      const maxTextLength = getMemorySummaryMaxLength(candidate.mode);
      if (!title || title.length > 30 || text.length < minTextLength || text.length > maxTextLength) return false;
    }

    const reviewedAt = new Date().toISOString();
    set(state => ({
      summaries: state.summaries.map(summary => {
        if (summary.summaryId !== summaryId) return summary;
        if (decision === 'reject') return { ...summary, status: 'rejected' as const, reviewedAt };
        if (decision === 'accept') return { ...summary, status: 'accepted' as const, reviewedAt };
        return {
          ...summary,
          origin: 'player-edited' as const,
          status: 'accepted' as const,
          originalTitle: summary.title,
          originalText: summary.text,
          title: edits?.title.trim() ?? summary.title,
          text: edits?.text.trim() ?? summary.text,
          facts: [],
          reviewedAt,
        };
      }),
    }));
    persistArchive(get());
    return true;
  },
}));

export function getMemorySummariesForSave(saveUuid: string | null): MemorySummaryCandidate[] {
  if (!saveUuid) return [];
  return useMemorySummaryArchiveStore
    .getState()
    .summaries.filter(summary => summary.saveUuid === saveUuid)
    .sort((left, right) => right.createdAt.localeCompare(left.createdAt));
}

export function getMemoryJobsForSave(saveUuid: string | null): MemorySummaryJob[] {
  if (!saveUuid) return [];
  return useMemorySummaryArchiveStore
    .getState()
    .jobs.filter(job => job.saveUuid === saveUuid)
    .sort((left, right) => right.updatedAt.localeCompare(left.updatedAt));
}
