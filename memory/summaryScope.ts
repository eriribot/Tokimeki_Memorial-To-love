import type { MemorySummaryCandidate, MemorySummaryJob } from './summaryArchive';
import {
  LARGE_SUMMARY_SOURCE_COUNT,
  SMALL_SUMMARY_MIN_SOURCE_FLOOR_COUNT,
  SMALL_SUMMARY_SOURCE_FLOOR_COUNT,
} from './summaryPolicy';
import type {
  MemorySummarySourceFloor,
  MemorySummarySourceMessage,
  MemorySummarySourceProjection,
} from './summarySourceProjection';

interface CurrentSmallSummarySource {
  eventIds: string[];
  actIds: string[];
  floorIds: string[];
  messageIds: string[];
  sourceFingerprint: string;
}

export interface MemorySummaryScope {
  saveUuid: string;
  saveRevision: number;
  projection: MemorySummarySourceProjection;
}

export interface ScopedMemorySummaryArchive {
  summaries: MemorySummaryCandidate[];
  jobs: MemorySummaryJob[];
}

export interface CreateScopedMemorySummaryArchiveInput {
  saveUuid: string | null;
  saveRevision: number | null;
  projection: MemorySummarySourceProjection;
  summaries: readonly MemorySummaryCandidate[];
  jobs: readonly MemorySummaryJob[];
}

function unique(values: readonly string[]): string[] {
  return [...new Set(values)];
}

function areEqualStringArrays(left: readonly string[], right: readonly string[]): boolean {
  return left.length === right.length && left.every((value, index) => value === right[index]);
}

function createFingerprint(value: unknown): string {
  const text = JSON.stringify(value);
  let hash = 2166136261;
  for (let index = 0; index < text.length; index += 1) {
    hash ^= text.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return `fnv1a:${(hash >>> 0).toString(16).padStart(8, '0')}`;
}

function createLargeFingerprint(summaries: readonly MemorySummaryCandidate[]): string {
  return createFingerprint(
    summaries.map(summary => [
      summary.summaryId,
      summary.sourceFingerprint,
      summary.origin,
      summary.title,
      summary.text,
      summary.facts,
    ]),
  );
}

function getFloorPair(
  floor: MemorySummarySourceFloor,
  messagesById: ReadonlyMap<string, MemorySummarySourceMessage>,
): [MemorySummarySourceMessage, MemorySummarySourceMessage] | null {
  const pair = floor.messageIds
    .map(messageId => messagesById.get(messageId))
    .filter((message): message is MemorySummarySourceMessage => message !== undefined)
    .sort((left, right) => (left.role === 'user' ? -1 : right.role === 'user' ? 1 : 0));
  if (
    pair.length !== 2 ||
    pair[0].role !== 'user' ||
    pair[1].role !== 'assistant' ||
    pair.some(
      message =>
        message.floorId !== floor.floorId ||
        message.eventId !== floor.eventId ||
        message.actId !== floor.actId ||
        message.source !== floor.source ||
        message.outcome !== 'accepted',
    )
  ) {
    return null;
  }
  return [pair[0], pair[1]];
}

function resolveCurrentSmallSource(
  scope: MemorySummaryScope,
  sourceMessageIds: readonly string[],
): CurrentSmallSummarySource | null {
  const sourceFloorCount = sourceMessageIds.length / 2;
  if (
    !Number.isInteger(sourceFloorCount) ||
    sourceFloorCount < SMALL_SUMMARY_MIN_SOURCE_FLOOR_COUNT ||
    sourceFloorCount > SMALL_SUMMARY_SOURCE_FLOOR_COUNT ||
    new Set(sourceMessageIds).size !== sourceMessageIds.length
  ) {
    return null;
  }

  const requestedIds = new Set(sourceMessageIds);
  const selectedFloors = scope.projection.floors.filter(floor =>
    floor.messageIds.every(messageId => requestedIds.has(messageId)),
  );
  if (selectedFloors.length !== sourceFloorCount) return null;

  const messagesById = new Map(scope.projection.messages.map(message => [message.id, message]));
  const selectedMessages: MemorySummarySourceMessage[] = [];
  const timeline: Array<{
    floorId: string;
    eventId: string;
    actId: string;
    kind: MemorySummarySourceFloor['kind'];
    date: MemorySummarySourceFloor['date'];
    actionNumber: number;
    scopeLabel: string;
  }> = [];

  for (const floor of selectedFloors) {
    const pair = getFloorPair(floor, messagesById);
    if (!pair || !pair[0].scopeLabel || pair.some(message => message.scopeLabel !== pair[0].scopeLabel)) return null;
    selectedMessages.push(...pair);
    timeline.push({
      floorId: floor.floorId,
      eventId: floor.eventId,
      actId: floor.actId,
      kind: floor.kind,
      date: { ...floor.date },
      actionNumber: floor.actionNumber,
      scopeLabel: pair[0].scopeLabel,
    });
  }

  const selectedMessageIds = selectedMessages.map(message => message.id);
  if (!areEqualStringArrays(selectedMessageIds, sourceMessageIds)) return null;

  return {
    eventIds: unique(selectedMessages.map(message => message.eventId)),
    actIds: unique(selectedMessages.map(message => message.actId)),
    floorIds: selectedFloors.map(floor => floor.floorId),
    messageIds: selectedMessageIds,
    sourceFingerprint: createFingerprint({
      messages: selectedMessages.map(message => [
        message.id,
        message.eventId,
        message.actId,
        message.floorId,
        message.source,
        message.content,
      ]),
      timeline,
    }),
  };
}

function hasCurrentRecordIdentity(
  scope: MemorySummaryScope,
  record: Pick<MemorySummaryCandidate | MemorySummaryJob, 'saveUuid' | 'saveRevision'>,
): boolean {
  return record.saveUuid === scope.saveUuid && record.saveRevision <= scope.saveRevision;
}

function isCurrentSmallSummary(scope: MemorySummaryScope, summary: MemorySummaryCandidate): boolean {
  if (summary.mode !== 'small' || !hasCurrentRecordIdentity(scope, summary)) return false;
  const source = resolveCurrentSmallSource(scope, summary.sourceMessageIds);
  return (
    source !== null &&
    source.sourceFingerprint === summary.sourceFingerprint &&
    areEqualStringArrays(source.eventIds, summary.sourceEventIds) &&
    areEqualStringArrays(source.actIds, summary.sourceActIds) &&
    areEqualStringArrays(source.floorIds, summary.sourceFloorIds) &&
    areEqualStringArrays(source.messageIds, summary.sourceMessageIds)
  );
}

function getCurrentAcceptedSmallSummaries(
  scope: MemorySummaryScope,
  sourceSummaryIds: readonly string[],
  summariesById: ReadonlyMap<string, MemorySummaryCandidate>,
): MemorySummaryCandidate[] | null {
  if (
    sourceSummaryIds.length !== LARGE_SUMMARY_SOURCE_COUNT ||
    new Set(sourceSummaryIds).size !== sourceSummaryIds.length
  ) {
    return null;
  }
  const summaries = sourceSummaryIds
    .map(summaryId => summariesById.get(summaryId))
    .filter((summary): summary is MemorySummaryCandidate => summary !== undefined);
  if (
    summaries.length !== sourceSummaryIds.length ||
    summaries.some(summary => summary.status !== 'accepted' || !isCurrentSmallSummary(scope, summary))
  ) {
    return null;
  }
  const floorIds = summaries.flatMap(summary => summary.sourceFloorIds);
  const messageIds = summaries.flatMap(summary => summary.sourceMessageIds);
  if (new Set(floorIds).size !== floorIds.length || new Set(messageIds).size !== messageIds.length) return null;
  return summaries;
}

export function createMemorySummaryScope(
  saveUuid: string | null,
  saveRevision: number | null,
  projection: MemorySummarySourceProjection,
): MemorySummaryScope | null {
  if (!saveUuid?.trim() || saveRevision === null || !Number.isInteger(saveRevision) || saveRevision < 1) {
    return null;
  }
  return { saveUuid, saveRevision, projection };
}

export function isMemorySummaryCurrent(
  scope: MemorySummaryScope,
  summary: MemorySummaryCandidate,
  allSummaries: readonly MemorySummaryCandidate[],
): boolean {
  if (summary.mode === 'small') return isCurrentSmallSummary(scope, summary);
  if (!hasCurrentRecordIdentity(scope, summary)) return false;

  const summariesById = new Map(allSummaries.map(candidate => [candidate.summaryId, candidate]));
  const sources = getCurrentAcceptedSmallSummaries(scope, summary.sourceSummaryIds, summariesById);
  if (!sources) return false;
  return (
    summary.sourceFingerprint === createLargeFingerprint(sources) &&
    areEqualStringArrays(summary.sourceEventIds, unique(sources.flatMap(source => source.sourceEventIds))) &&
    areEqualStringArrays(summary.sourceActIds, unique(sources.flatMap(source => source.sourceActIds))) &&
    areEqualStringArrays(
      summary.sourceFloorIds,
      sources.flatMap(source => source.sourceFloorIds),
    ) &&
    areEqualStringArrays(
      summary.sourceMessageIds,
      sources.flatMap(source => source.sourceMessageIds),
    )
  );
}

export function isMemorySummaryJobCurrent(
  scope: MemorySummaryScope,
  job: MemorySummaryJob,
  allSummaries: readonly MemorySummaryCandidate[],
): boolean {
  if (!hasCurrentRecordIdentity(scope, job)) return false;
  if (job.mode === 'small') {
    const source = resolveCurrentSmallSource(scope, job.sourceMessageIds);
    return job.sourceSummaryIds.length === 0 && source?.sourceFingerprint === job.sourceFingerprint;
  }

  const summariesById = new Map(allSummaries.map(summary => [summary.summaryId, summary]));
  const sources = getCurrentAcceptedSmallSummaries(scope, job.sourceSummaryIds, summariesById);
  return (
    sources !== null &&
    job.sourceFingerprint === createLargeFingerprint(sources) &&
    areEqualStringArrays(
      job.sourceMessageIds,
      sources.flatMap(source => source.sourceMessageIds),
    )
  );
}

export function createScopedMemorySummaryArchive(
  input: CreateScopedMemorySummaryArchiveInput,
): ScopedMemorySummaryArchive {
  const scope = createMemorySummaryScope(input.saveUuid, input.saveRevision, input.projection);
  if (!scope) return { summaries: [], jobs: [] };

  return {
    summaries: input.summaries
      .filter(summary => isMemorySummaryCurrent(scope, summary, input.summaries))
      .sort((left, right) => right.createdAt.localeCompare(left.createdAt)),
    jobs: input.jobs
      .filter(job => isMemorySummaryJobCurrent(scope, job, input.summaries))
      .sort((left, right) => right.updatedAt.localeCompare(left.updatedAt)),
  };
}
