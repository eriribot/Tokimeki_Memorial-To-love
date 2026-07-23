import { getMainStoryEpisode } from '../GalMainStory/storyRegistry';
import type { GalStoryFloor, GalStoryMessageSave } from '../GalMainStory/storyTypes';
import { loadOpenAICompatibleConfig, requestOpenAICompatibleCompletion } from '../config/openaiCompatible';
import { captureGameMessages } from '../message';
import type { SaveRecord } from '../save';
import { createGameSnapshot, type GameSnapshot } from '../save/snapshot';
import { PERIODS } from '../stores/gameStore';
import {
  createLargeSummaryPrompt,
  createSmallSummaryPrompt,
  type AcceptedSummaryInput,
  type SummaryDeterministicState,
  type SummarySourceMessage,
} from './summaryPrompts';
import {
  createMemoryRuntimeId,
  getMemoryJobsForSave,
  getMemorySummariesForSave,
  useMemorySummaryArchiveStore,
  type MemorySummaryCandidate,
  type MemorySummaryJob,
} from './summaryArchive';
import { createMemorySummaryPayloadFromText } from './summaryAnalyzer';
import {
  LARGE_SUMMARY_SOURCE_COUNT,
  SMALL_SUMMARY_MIN_SOURCE_FLOOR_COUNT,
  SMALL_SUMMARY_SOURCE_FLOOR_COUNT,
} from './summaryPolicy';
import { useMemorySummaryProgressStore } from './summaryProgress';
import { getCanonicalStoryTimeline } from './storyTimeline';

const SUMMARY_RUNTIME_DELAY_MS = 350;

interface SavedMemoryContext {
  save: SaveRecord<GameSnapshot>;
  messages: GalStoryMessageSave[];
}

interface SmallSummarySource {
  eventIds: string[];
  actIds: string[];
  floorIds: string[];
  messages: SummarySourceMessage[];
  sourceFingerprint: string;
}

let latestContext: SavedMemoryContext | null = null;
let queuedContext: SavedMemoryContext | null = null;
let queueTimer: ReturnType<typeof setTimeout> | null = null;
let activeController: AbortController | null = null;
let running = false;
let contextGeneration = 0;
let activeContextTransitionGeneration: number | null = null;
let suppressedPairedContext: SavedMemoryContext | null = null;

function cloneJson<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

function getErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

function unique(values: readonly string[]): string[] {
  return [...new Set(values)];
}

function areEqualStringArrays(left: readonly string[], right: readonly string[]): boolean {
  return left.length === right.length && left.every((value, index) => value === right[index]);
}

function hasSameSummarySource(left: MemorySummaryCandidate, right: MemorySummaryCandidate): boolean {
  return (
    left.saveUuid === right.saveUuid &&
    left.mode === right.mode &&
    left.sourceFingerprint === right.sourceFingerprint &&
    areEqualStringArrays(left.sourceMessageIds, right.sourceMessageIds) &&
    areEqualStringArrays(left.sourceSummaryIds, right.sourceSummaryIds)
  );
}

function hasSameJobSource(candidate: MemorySummaryCandidate, job: MemorySummaryJob): boolean {
  return (
    candidate.saveUuid === job.saveUuid &&
    candidate.mode === job.mode &&
    candidate.sourceFingerprint === job.sourceFingerprint &&
    areEqualStringArrays(candidate.sourceMessageIds, job.sourceMessageIds) &&
    areEqualStringArrays(candidate.sourceSummaryIds, job.sourceSummaryIds)
  );
}

function hasRejectedSummaryReplacement(candidate: MemorySummaryCandidate): boolean {
  const reviewedAt = candidate.reviewedAt;
  if (!reviewedAt) return true;
  const archive = useMemorySummaryArchiveStore.getState();
  const hasNewerCandidate = archive.summaries.some(
    summary =>
      summary.summaryId !== candidate.summaryId &&
      summary.createdAt >= reviewedAt &&
      hasSameSummarySource(candidate, summary),
  );
  if (hasNewerCandidate) return true;
  return archive.jobs.some(
    job =>
      job.candidateId !== candidate.summaryId && job.createdAt >= reviewedAt && hasSameJobSource(candidate, job),
  );
}

function hashText(value: string): string {
  let hash = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return `fnv1a:${(hash >>> 0).toString(16).padStart(8, '0')}`;
}

function createSourceFingerprint(value: unknown): string {
  return hashText(JSON.stringify(value));
}

function getDeterministicState(snapshot: GameSnapshot): SummaryDeterministicState {
  const period = PERIODS[snapshot.game.periodIndex] ?? PERIODS[0];
  return {
    date: snapshot.game.date,
    period: period.key,
    locationId: snapshot.game.currentLocationId,
    player: {
      name: snapshot.player.name,
      intelligence: snapshot.player.intelligence,
      athletics: snapshot.player.athletics,
      art: snapshot.player.art,
      charm: snapshot.player.charm,
    },
    relationships: snapshot.cards.targets.map(target => ({
      characterId: target.id,
      affection: target.affection,
      friendship: target.friendship,
      romance: target.romance,
    })),
    completedEventIds: [...snapshot.game.mainStory.completedEventIds],
  };
}

function getAllowedSubjectIds(snapshot: GameSnapshot): string[] {
  return unique(['player', ...snapshot.cards.targets.map(target => target.id)]);
}

function hasSameDeterministicState(left: GameSnapshot, right: GameSnapshot): boolean {
  return createSourceFingerprint(getDeterministicState(left)) === createSourceFingerprint(getDeterministicState(right));
}

function getSourceFromFloors(
  timeline: readonly GalStoryFloor[],
  floors: readonly GalStoryFloor[],
  messages: readonly GalStoryMessageSave[],
): SmallSummarySource | null {
  if (floors.length === 0) return null;
  const messagesById = new Map(messages.map(message => [message.id, message]));
  const ordinalByFloorId = new Map(timeline.map((floor, index) => [floor.floorId, index]));
  const sourceMessages: SummarySourceMessage[] = [];

  for (const floor of floors) {
    const pair = floor.messageIds
      .map(messageId => messagesById.get(messageId))
      .filter((message): message is GalStoryMessageSave => message !== undefined)
      .sort((left, right) => (left.extra.role === 'user' ? -1 : right.extra.role === 'user' ? 1 : 0));
    if (pair.length !== 2 || pair[0].extra.role !== 'user' || pair[1].extra.role !== 'assistant') return null;
    for (const message of pair) {
      sourceMessages.push({
        id: message.id,
        role: message.extra.role,
        eventId: message.extra.eventId,
        actId: message.extra.actId,
        floorId: message.extra.floorId,
        source: message.extra.source,
        outcome: 'accepted',
        canonicalOrdinal: ordinalByFloorId.get(message.extra.floorId) ?? 0,
        content: message.mes,
      });
    }
  }

  const sourceFingerprint = createSourceFingerprint(
    sourceMessages.map(message => [
      message.id,
      message.eventId,
      message.actId,
      message.floorId,
      message.source,
      message.content,
    ]),
  );
  return {
    eventIds: unique(sourceMessages.map(message => message.eventId)),
    actIds: unique(sourceMessages.map(message => message.actId)),
    floorIds: floors.map(floor => floor.floorId),
    messages: sourceMessages,
    sourceFingerprint,
  };
}

function getEligibleFloors(context: SavedMemoryContext): { timeline: GalStoryFloor[]; floors: GalStoryFloor[] } {
  const timeline = getCanonicalStoryTimeline(context.save.data.game.mainStory.archives);
  const availableMessageIds = new Set(context.messages.map(message => message.id));
  return {
    timeline,
    floors: timeline.filter(floor => floor.messageIds.every(messageId => availableMessageIds.has(messageId))),
  };
}

function getUncoveredSmallSummaryFloors(context: SavedMemoryContext): {
  timeline: GalStoryFloor[];
  floors: GalStoryFloor[];
} {
  const { timeline, floors } = getEligibleFloors(context);
  const summaries = getMemorySummariesForSave(context.save.saveUuid);
  const jobs = getMemoryJobsForSave(context.save.saveUuid);
  const coveredIds = new Set([
    ...summaries.filter(summary => summary.mode === 'small').flatMap(summary => summary.sourceMessageIds),
    ...jobs.filter(job => job.mode === 'small').flatMap(job => job.sourceMessageIds),
  ]);
  return {
    timeline,
    floors: floors.filter(floor => floor.messageIds.every(messageId => !coveredIds.has(messageId))),
  };
}

function createAutomaticSmallSource(context: SavedMemoryContext): SmallSummarySource | null {
  const { timeline, floors } = getUncoveredSmallSummaryFloors(context);
  if (floors.length < SMALL_SUMMARY_SOURCE_FLOOR_COUNT) return null;
  return getSourceFromFloors(
    timeline,
    floors.slice(0, SMALL_SUMMARY_SOURCE_FLOOR_COUNT),
    context.messages,
  );
}

function createManualSmallSource(context: SavedMemoryContext): SmallSummarySource | null {
  const { timeline, floors } = getUncoveredSmallSummaryFloors(context);
  const selectedFloors = floors.slice(0, SMALL_SUMMARY_SOURCE_FLOOR_COUNT);
  if (selectedFloors.length < SMALL_SUMMARY_MIN_SOURCE_FLOOR_COUNT) return null;
  return getSourceFromFloors(timeline, selectedFloors, context.messages);
}

function createSpecificSmallSource(
  context: SavedMemoryContext,
  sourceMessageIds: readonly string[],
): SmallSummarySource | null {
  const sourceFloorCount = sourceMessageIds.length / 2;
  if (
    !Number.isInteger(sourceFloorCount) ||
    sourceFloorCount < SMALL_SUMMARY_MIN_SOURCE_FLOOR_COUNT ||
    sourceFloorCount > SMALL_SUMMARY_SOURCE_FLOOR_COUNT
  ) {
    return null;
  }
  const { timeline, floors } = getEligibleFloors(context);
  const requestedIds = new Set(sourceMessageIds);
  const selectedFloors = floors.filter(floor => floor.messageIds.every(messageId => requestedIds.has(messageId)));
  const source = getSourceFromFloors(timeline, selectedFloors, context.messages);
  if (!source || source.messages.length !== sourceMessageIds.length) return null;
  const actualIds = source.messages.map(message => message.id);
  return actualIds.every((messageId, index) => messageId === sourceMessageIds[index]) ? source : null;
}

function toAcceptedSummaryInput(summary: MemorySummaryCandidate): AcceptedSummaryInput {
  return {
    summaryId: summary.summaryId,
    status: 'accepted',
    origin: summary.origin,
    source: {
      eventIds: [...summary.sourceEventIds],
      actIds: [...summary.sourceActIds],
      floorIds: [...summary.sourceFloorIds],
      messageIds: [...summary.sourceMessageIds],
      sourceFingerprint: summary.sourceFingerprint,
    },
    title: summary.title,
    text: summary.text,
    facts: summary.facts,
  };
}

function createLargeFingerprint(summaries: readonly MemorySummaryCandidate[]): string {
  return createSourceFingerprint(
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

function getCurrentSmallSummarySource(
  context: SavedMemoryContext,
  summary: MemorySummaryCandidate,
): SmallSummarySource | null {
  if (
    summary.mode !== 'small' ||
    summary.status !== 'accepted' ||
    summary.sourceFloorIds.length < SMALL_SUMMARY_MIN_SOURCE_FLOOR_COUNT ||
    summary.sourceFloorIds.length > SMALL_SUMMARY_SOURCE_FLOOR_COUNT
  ) {
    return null;
  }
  const source = createSpecificSmallSource(context, summary.sourceMessageIds);
  return source?.sourceFingerprint === summary.sourceFingerprint &&
    areEqualStringArrays(source.eventIds, summary.sourceEventIds) &&
    areEqualStringArrays(source.actIds, summary.sourceActIds) &&
    areEqualStringArrays(source.floorIds, summary.sourceFloorIds)
    ? source
    : null;
}

function getCurrentSmallSummaryBatch(
  context: SavedMemoryContext,
  sourceSummaryIds: readonly string[],
): MemorySummaryCandidate[] | null {
  if (sourceSummaryIds.length !== LARGE_SUMMARY_SOURCE_COUNT) return null;
  const summariesById = new Map(
    getMemorySummariesForSave(context.save.saveUuid)
      .filter(summary => summary.mode === 'small' && summary.status === 'accepted')
      .map(summary => [summary.summaryId, summary]),
  );
  const summaries = sourceSummaryIds
    .map(summaryId => summariesById.get(summaryId))
    .filter((summary): summary is MemorySummaryCandidate => summary !== undefined);
  if (summaries.length !== sourceSummaryIds.length) return null;
  if (!summaries.every(summary => getCurrentSmallSummarySource(context, summary) !== null)) return null;
  const sourceFingerprints = summaries.map(summary => summary.sourceFingerprint);
  const sourceFloorIds = summaries.flatMap(summary => summary.sourceFloorIds);
  const sourceMessageIds = summaries.flatMap(summary => summary.sourceMessageIds);
  if (
    new Set(sourceFingerprints).size !== summaries.length ||
    new Set(sourceFloorIds).size !== sourceFloorIds.length ||
    new Set(sourceMessageIds).size !== sourceMessageIds.length
  ) {
    return null;
  }
  return summaries;
}

function hasCurrentLargeSource(
  context: SavedMemoryContext,
  sourceSummaryIds: readonly string[],
  sourceFingerprint: string,
): boolean {
  const batch = getCurrentSmallSummaryBatch(context, sourceSummaryIds);
  return batch !== null && createLargeFingerprint(batch) === sourceFingerprint;
}

function getAutomaticLargeBatch(context: SavedMemoryContext): MemorySummaryCandidate[] {
  const summaries = getMemorySummariesForSave(context.save.saveUuid);
  const jobs = getMemoryJobsForSave(context.save.saveUuid);
  const coveredIds = new Set([
    ...summaries
      .filter(
        summary =>
          summary.mode === 'large' &&
          hasCurrentLargeSource(context, summary.sourceSummaryIds, summary.sourceFingerprint),
      )
      .flatMap(summary => summary.sourceSummaryIds),
    ...jobs
      .filter(
        job =>
          job.mode === 'large' && hasCurrentLargeSource(context, job.sourceSummaryIds, job.sourceFingerprint),
      )
      .flatMap(job => job.sourceSummaryIds),
  ]);
  const eligible = summaries
    .filter(
      summary =>
        summary.mode === 'small' &&
        summary.status === 'accepted' &&
        !coveredIds.has(summary.summaryId) &&
        getCurrentSmallSummarySource(context, summary) !== null,
    )
    .sort((left, right) => {
      const leftSource = getCurrentSmallSummarySource(context, left);
      const rightSource = getCurrentSmallSummarySource(context, right);
      const leftOrdinal = Math.min(...(leftSource?.messages.map(message => message.canonicalOrdinal) ?? [Infinity]));
      const rightOrdinal = Math.min(...(rightSource?.messages.map(message => message.canonicalOrdinal) ?? [Infinity]));
      return leftOrdinal - rightOrdinal || left.createdAt.localeCompare(right.createdAt);
    });
  const selected: MemorySummaryCandidate[] = [];
  const usedFingerprints = new Set<string>();
  const usedFloorIds = new Set<string>();
  const usedMessageIds = new Set<string>();
  for (const summary of eligible) {
    if (
      usedFingerprints.has(summary.sourceFingerprint) ||
      summary.sourceFloorIds.some(floorId => usedFloorIds.has(floorId)) ||
      summary.sourceMessageIds.some(messageId => usedMessageIds.has(messageId))
    ) {
      continue;
    }
    selected.push(summary);
    usedFingerprints.add(summary.sourceFingerprint);
    summary.sourceFloorIds.forEach(floorId => usedFloorIds.add(floorId));
    summary.sourceMessageIds.forEach(messageId => usedMessageIds.add(messageId));
    if (selected.length === LARGE_SUMMARY_SOURCE_COUNT) return selected;
  }
  return [];
}

function getSpecificLargeBatch(context: SavedMemoryContext, job: MemorySummaryJob): MemorySummaryCandidate[] | null {
  if (context.save.saveUuid !== job.saveUuid) return null;
  return getCurrentSmallSummaryBatch(context, job.sourceSummaryIds);
}

function isCurrentFailedJob(context: SavedMemoryContext, job: MemorySummaryJob): boolean {
  if (job.status !== 'failed' || job.saveUuid !== context.save.saveUuid) return false;
  if (job.mode === 'large') {
    return hasCurrentLargeSource(context, job.sourceSummaryIds, job.sourceFingerprint);
  }
  const source = createSpecificSmallSource(context, job.sourceMessageIds);
  return source?.sourceFingerprint === job.sourceFingerprint;
}

function createJob(
  context: SavedMemoryContext,
  mode: 'small' | 'large',
  sourceFingerprint: string,
  sourceMessageIds: string[],
  sourceSummaryIds: string[],
): MemorySummaryJob {
  const now = new Date().toISOString();
  return {
    jobId: createMemoryRuntimeId('job'),
    saveUuid: context.save.saveUuid,
    saveRevision: context.save.revision,
    mode,
    sourceFingerprint,
    sourceMessageIds,
    sourceSummaryIds,
    status: 'running',
    attempt: 1,
    candidateId: null,
    error: null,
    createdAt: now,
    updatedAt: now,
  };
}

function isRequestAnchorCurrent(job: MemorySummaryJob): boolean {
  return (
    latestContext !== null &&
    latestContext.save.saveUuid === job.saveUuid &&
    latestContext.save.revision === job.saveRevision
  );
}

function createLiveContext(anchor: SavedMemoryContext): SavedMemoryContext {
  return {
    save: { ...anchor.save, data: createGameSnapshot() },
    messages: captureGameMessages(),
  };
}

async function executeSmallJob(
  context: SavedMemoryContext,
  source: SmallSummarySource,
  retryJob?: MemorySummaryJob,
): Promise<void> {
  const archive = useMemorySummaryArchiveStore.getState();
  const progress = useMemorySummaryProgressStore.getState();
  const config = loadOpenAICompatibleConfig();
  const job = retryJob
    ? {
        ...retryJob,
        saveRevision: context.save.revision,
        status: 'running' as const,
        attempt: retryJob.attempt + 1,
        candidateId: null,
        error: null,
        updatedAt: new Date().toISOString(),
      }
    : createJob(
        context,
        'small',
        source.sourceFingerprint,
        source.messages.map(message => message.id),
        [],
      );
  if (retryJob) archive.restartJob(job.jobId, context.save.revision);
  else archive.beginJob(job);
  progress.begin('small');
  progress.setPhase('requesting-small', null);
  const controller = new AbortController();
  activeController = controller;

  try {
    const allowedSubjectIds = getAllowedSubjectIds(context.save.data);
    const prompt = createSmallSummaryPrompt({
      sourceFingerprint: source.sourceFingerprint,
      messages: source.messages,
      allowedSubjectIds,
      deterministicState: getDeterministicState(context.save.data),
    });
    const response = await requestOpenAICompatibleCompletion(config, {
      systemPrompt: prompt.systemPrompt,
      userPrompt: prompt.userPrompt,
      temperature: 0.1,
      maxTokens: 1600,
      signal: controller.signal,
    });
    progress.setPhase('validating', 85);
    const payload = createMemorySummaryPayloadFromText(response.text, {
      mode: 'small',
      sourceFloorIds: source.floorIds,
      sourceSummaryIds: [],
    });
    const currentContext = latestContext;
    if (!isRequestAnchorCurrent(job) || !currentContext) {
      throw new Error('摘要返回时存档版本已经变化，候选已丢弃。');
    }
    const savedSource = createSpecificSmallSource(currentContext, job.sourceMessageIds);
    const liveContext = createLiveContext(currentContext);
    const liveSource = createSpecificSmallSource(liveContext, job.sourceMessageIds);
    if (
      !savedSource ||
      savedSource.sourceFingerprint !== job.sourceFingerprint ||
      !liveSource ||
      liveSource.sourceFingerprint !== job.sourceFingerprint ||
      !hasSameDeterministicState(context.save.data, liveContext.save.data)
    ) {
      throw new Error('摘要返回时采用楼层、原文或确定性状态已经变化，候选已丢弃。');
    }

    const candidate: MemorySummaryCandidate = {
      summaryId: createMemoryRuntimeId('summary'),
      saveUuid: context.save.saveUuid,
      saveRevision: context.save.revision,
      mode: 'small',
      origin: 'secondary-api',
      status: 'pending',
      sourceFingerprint: source.sourceFingerprint,
      sourceEventIds: source.eventIds,
      sourceActIds: source.actIds,
      sourceFloorIds: source.floorIds,
      sourceMessageIds: source.messages.map(message => message.id),
      sourceSummaryIds: [],
      title: payload.title,
      text: payload.text,
      facts: payload.facts,
      model: config.model,
      ...(response.requestId ? { providerRequestId: response.requestId } : {}),
      createdAt: new Date().toISOString(),
      reviewedAt: null,
    };
    archive.completeJob(job.jobId, candidate);
    progress.ready('小总结候选已生成，请到目录确认');
  } catch (error) {
    const detail = getErrorMessage(error);
    archive.failJob(job.jobId, detail);
    progress.fail(detail);
  } finally {
    if (activeController === controller) activeController = null;
  }
}

async function executeLargeJob(
  context: SavedMemoryContext,
  sourceSummaries: MemorySummaryCandidate[],
  retryJob?: MemorySummaryJob,
): Promise<void> {
  const archive = useMemorySummaryArchiveStore.getState();
  const progress = useMemorySummaryProgressStore.getState();
  const config = loadOpenAICompatibleConfig();
  const summaries = sourceSummaries.map(toAcceptedSummaryInput);
  const sourceFingerprint = createLargeFingerprint(sourceSummaries);
  const job = retryJob
    ? {
        ...retryJob,
        saveRevision: context.save.revision,
        status: 'running' as const,
        attempt: retryJob.attempt + 1,
        candidateId: null,
        error: null,
        updatedAt: new Date().toISOString(),
      }
    : createJob(
        context,
        'large',
        sourceFingerprint,
        sourceSummaries.flatMap(summary => summary.sourceMessageIds),
        sourceSummaries.map(summary => summary.summaryId),
      );
  if (retryJob) archive.restartJob(job.jobId, context.save.revision);
  else archive.beginJob(job);
  progress.begin('large');
  progress.setPhase('requesting-large', null);
  const controller = new AbortController();
  activeController = controller;

  try {
    const allowedSubjectIds = getAllowedSubjectIds(context.save.data);
    const prompt = createLargeSummaryPrompt({
      sourceFingerprint,
      summaries,
      allowedSubjectIds,
      deterministicState: getDeterministicState(context.save.data),
    });
    const response = await requestOpenAICompatibleCompletion(config, {
      systemPrompt: prompt.systemPrompt,
      userPrompt: prompt.userPrompt,
      temperature: 0,
      maxTokens: 2200,
      signal: controller.signal,
    });
    progress.setPhase('validating', 85);
    const payload = createMemorySummaryPayloadFromText(response.text, {
      mode: 'large',
      sourceFloorIds: unique(sourceSummaries.flatMap(summary => summary.sourceFloorIds)),
      sourceSummaryIds: sourceSummaries.map(summary => summary.summaryId),
    });
    if (!isRequestAnchorCurrent(job)) throw new Error('大总结返回时存档版本已经变化，候选已丢弃。');
    const currentContext = latestContext;
    const currentSummaries = currentContext ? getSpecificLargeBatch(currentContext, job) : null;
    const liveContext = currentContext ? createLiveContext(currentContext) : null;
    const liveSummaries = liveContext ? getSpecificLargeBatch(liveContext, job) : null;
    if (
      !currentSummaries ||
      createLargeFingerprint(currentSummaries) !== job.sourceFingerprint ||
      !liveSummaries ||
      createLargeFingerprint(liveSummaries) !== job.sourceFingerprint ||
      !liveContext ||
      !hasSameDeterministicState(context.save.data, liveContext.save.data)
    ) {
      throw new Error('大总结返回时已接受小总结或确定性状态已经变化，候选已丢弃。');
    }

    const candidate: MemorySummaryCandidate = {
      summaryId: createMemoryRuntimeId('summary'),
      saveUuid: context.save.saveUuid,
      saveRevision: context.save.revision,
      mode: 'large',
      origin: 'secondary-api',
      status: 'pending',
      sourceFingerprint,
      sourceEventIds: unique(sourceSummaries.flatMap(summary => summary.sourceEventIds)),
      sourceActIds: unique(sourceSummaries.flatMap(summary => summary.sourceActIds)),
      sourceFloorIds: unique(sourceSummaries.flatMap(summary => summary.sourceFloorIds)),
      sourceMessageIds: unique(sourceSummaries.flatMap(summary => summary.sourceMessageIds)),
      sourceSummaryIds: sourceSummaries.map(summary => summary.summaryId),
      title: payload.title,
      text: payload.text,
      facts: payload.facts,
      model: config.model,
      ...(response.requestId ? { providerRequestId: response.requestId } : {}),
      createdAt: new Date().toISOString(),
      reviewedAt: null,
    };
    archive.completeJob(job.jobId, candidate);
    progress.ready('大总结候选已生成，请到目录确认');
  } catch (error) {
    const detail = getErrorMessage(error);
    archive.failJob(job.jobId, detail);
    progress.fail(detail);
  } finally {
    if (activeController === controller) activeController = null;
  }
}

async function processContext(context: SavedMemoryContext): Promise<void> {
  const config = loadOpenAICompatibleConfig();
  if (!config.enabled) return;
  const liveContext = createLiveContext(context);
  if (!hasSameDeterministicState(context.save.data, liveContext.save.data)) return;
  useMemorySummaryArchiveStore.getState().setActiveSave(context.save.saveUuid);
  if (getMemoryJobsForSave(context.save.saveUuid).some(job => isCurrentFailedJob(context, job))) return;

  const largeBatch = getAutomaticLargeBatch(context);
  if (largeBatch.length === LARGE_SUMMARY_SOURCE_COUNT) {
    const liveBatch = getCurrentSmallSummaryBatch(
      liveContext,
      largeBatch.map(summary => summary.summaryId),
    );
    if (!liveBatch || createLargeFingerprint(liveBatch) !== createLargeFingerprint(largeBatch)) return;
    await executeLargeJob(context, largeBatch);
    return;
  }

  const smallSource = createAutomaticSmallSource(context);
  if (smallSource) {
    const liveSource = createSpecificSmallSource(
      liveContext,
      smallSource.messages.map(message => message.id),
    );
    if (!liveSource || liveSource.sourceFingerprint !== smallSource.sourceFingerprint) return;
    await executeSmallJob(context, smallSource);
  }
}

async function drainQueue(): Promise<void> {
  if (running) return;
  running = true;
  try {
    while (queuedContext) {
      const context = queuedContext;
      queuedContext = null;
      await processContext(context);
    }
  } finally {
    running = false;
  }
}

function adoptMemorySummaryContext(
  save: SaveRecord<GameSnapshot>,
  messages: readonly GalStoryMessageSave[],
  schedule: boolean,
): void {
  const context = { save: cloneJson(save), messages: cloneJson(messages) };
  latestContext = context;
  useMemorySummaryArchiveStore.getState().setActiveSave(save.saveUuid);
  if (!schedule) return;
  queuedContext = context;
  if (queueTimer !== null) clearTimeout(queueTimer);
  queueTimer = setTimeout(() => {
    queueTimer = null;
    void drainQueue();
  }, SUMMARY_RUNTIME_DELAY_MS);
}

export function queueMemorySummaryAfterAutosave(
  save: SaveRecord<GameSnapshot>,
  messages: readonly GalStoryMessageSave[],
): void {
  if (activeContextTransitionGeneration !== null) {
    suppressedPairedContext = { save: cloneJson(save), messages: cloneJson(messages) };
    return;
  }
  contextGeneration += 1;
  adoptMemorySummaryContext(save, messages, true);
}

export function refreshMemorySummarySchedule(): void {
  const config = loadOpenAICompatibleConfig();
  if (!config.enabled) {
    cancelMemorySummaryJobs('记忆 API 已停用。');
    return;
  }
  if (!latestContext) return;
  queuedContext = latestContext;
  if (queueTimer !== null) clearTimeout(queueTimer);
  queueTimer = setTimeout(() => {
    queueTimer = null;
    void drainQueue();
  }, SUMMARY_RUNTIME_DELAY_MS);
}

export interface NextMemorySmallSummaryBatch {
  startFloorNumber: number;
  endFloorNumber: number;
  availableFloorCount: number;
  requiredFloorCount: number;
  ready: boolean;
}

export function getNextMemorySmallSummaryBatch(): NextMemorySmallSummaryBatch | null {
  if (!latestContext) return null;
  const { timeline, floors } = getUncoveredSmallSummaryFloors(latestContext);
  const selectedFloors = floors.slice(0, SMALL_SUMMARY_SOURCE_FLOOR_COUNT);
  const firstFloor = selectedFloors[0];
  const firstFloorIndex = firstFloor
    ? timeline.findIndex(floor => floor.floorId === firstFloor.floorId)
    : timeline.length;
  const startFloorNumber = Math.max(0, firstFloorIndex) + 1;
  const lastFloor = selectedFloors[selectedFloors.length - 1];
  const lastFloorIndex = lastFloor
    ? timeline.findIndex(floor => floor.floorId === lastFloor.floorId)
    : startFloorNumber + SMALL_SUMMARY_SOURCE_FLOOR_COUNT - 2;
  return {
    startFloorNumber,
    endFloorNumber: Math.max(startFloorNumber - 1, lastFloorIndex) + 1,
    availableFloorCount: selectedFloors.length,
    requiredFloorCount: SMALL_SUMMARY_SOURCE_FLOOR_COUNT,
    ready: selectedFloors.length >= SMALL_SUMMARY_MIN_SOURCE_FLOOR_COUNT,
  };
}

export async function generateNextMemorySmallSummary(): Promise<void> {
  if (running || activeController) throw new Error('已有摘要任务正在运行，请稍后再试。');
  if (!loadOpenAICompatibleConfig().enabled) throw new Error('副 API 尚未启用。');
  if (!latestContext) throw new Error('当前存档尚未完成可校验的自动保存。');

  const context = cloneJson(latestContext);
  if (getMemoryJobsForSave(context.save.saveUuid).some(job => isCurrentFailedJob(context, job))) {
    throw new Error('当前存在失败任务，请先重试或处理该任务。');
  }
  const source = createManualSmallSource(context);
  if (!source) throw new Error('当前没有尚未归档的完整楼层。');

  const liveContext = createLiveContext(context);
  const liveSource = createSpecificSmallSource(
    liveContext,
    source.messages.map(message => message.id),
  );
  if (
    !liveSource ||
    liveSource.sourceFingerprint !== source.sourceFingerprint ||
    !hasSameDeterministicState(context.save.data, liveContext.save.data)
  ) {
    throw new Error('当前采用楼层、原文或确定性状态已经变化，请先完成自动保存。');
  }

  running = true;
  try {
    await executeSmallJob(context, source);
  } finally {
    running = false;
    if (queuedContext) void drainQueue();
  }
}

export function cancelMemorySummaryJobs(reason = '记忆摘要任务已取消。'): void {
  queuedContext = null;
  if (queueTimer !== null) {
    clearTimeout(queueTimer);
    queueTimer = null;
  }
  activeController?.abort(reason);
}

export function invalidateMemorySummaryContext(reason = '权威存档上下文已经变化。'): void {
  contextGeneration += 1;
  activeContextTransitionGeneration = null;
  suppressedPairedContext = null;
  latestContext = null;
  cancelMemorySummaryJobs(reason);
  useMemorySummaryArchiveStore.getState().setActiveSave(null);
}

export interface MemorySummaryContextTransition {
  adopt: (
    save: SaveRecord<GameSnapshot>,
    messages: readonly GalStoryMessageSave[],
    schedule?: boolean,
  ) => boolean;
  rollback: () => boolean;
  commitInvalidated: () => boolean;
}

export function beginMemorySummaryContextTransition(
  reason = '权威存档上下文正在切换。',
): MemorySummaryContextTransition {
  const previousContext = latestContext ? cloneJson(latestContext) : null;
  const previousActiveSaveUuid = useMemorySummaryArchiveStore.getState().activeSaveUuid;
  invalidateMemorySummaryContext(reason);
  const generation = contextGeneration;
  activeContextTransitionGeneration = generation;
  let settled = false;

  return {
    adopt: (save, messages, schedule = true) => {
      if (settled || contextGeneration !== generation) return false;
      settled = true;
      activeContextTransitionGeneration = null;
      suppressedPairedContext = null;
      adoptMemorySummaryContext(save, messages, schedule);
      return true;
    },
    rollback: () => {
      if (settled || contextGeneration !== generation) return false;
      settled = true;
      activeContextTransitionGeneration = null;
      const pairedContext = suppressedPairedContext;
      suppressedPairedContext = null;
      queuedContext = null;
      const restoredContext = pairedContext ?? previousContext;
      if (restoredContext) {
        adoptMemorySummaryContext(restoredContext.save, restoredContext.messages, true);
      } else {
        latestContext = null;
        useMemorySummaryArchiveStore.getState().setActiveSave(previousActiveSaveUuid);
      }
      return true;
    },
    commitInvalidated: () => {
      if (settled || contextGeneration !== generation) return false;
      settled = true;
      activeContextTransitionGeneration = null;
      suppressedPairedContext = null;
      return true;
    },
  };
}

export async function retryMemoryJob(jobId: string): Promise<void> {
  if (running || activeController) throw new Error('已有摘要任务正在运行，请稍后再试。');
  running = true;
  try {
    const saveUuid = useMemorySummaryArchiveStore.getState().activeSaveUuid;
    const job = getMemoryJobsForSave(saveUuid).find(item => item.jobId === jobId);
    if (!job || job.status !== 'failed') throw new Error('找不到可重试的失败任务。');
    if (!latestContext || latestContext.save.saveUuid !== job.saveUuid) {
      throw new Error('当前存档尚未完成可校验的自动保存，不能重试旧任务。');
    }

    const context = cloneJson(latestContext);
    const liveContext = createLiveContext(context);
    if (job.mode === 'small') {
      const source = createSpecificSmallSource(context, job.sourceMessageIds);
      const liveSource = createSpecificSmallSource(liveContext, job.sourceMessageIds);
      if (
        !source ||
        source.sourceFingerprint !== job.sourceFingerprint ||
        !liveSource ||
        liveSource.sourceFingerprint !== job.sourceFingerprint
      ) {
        throw new Error('失败任务的采用楼层或原文已经变化，不能沿用旧请求。');
      }
      await executeSmallJob(context, source, job);
      return;
    }

    const summaries = getSpecificLargeBatch(context, job);
    const liveSummaries = getSpecificLargeBatch(liveContext, job);
    if (
      !summaries ||
      createLargeFingerprint(summaries) !== job.sourceFingerprint ||
      !liveSummaries ||
      createLargeFingerprint(liveSummaries) !== job.sourceFingerprint
    ) {
      throw new Error('失败任务引用的小总结已经变化，不能沿用旧请求。');
    }
    await executeLargeJob(context, summaries, job);
  } finally {
    running = false;
    if (queuedContext) void drainQueue();
  }
}

export async function retryRejectedMemorySummary(summaryId: string): Promise<void> {
  if (running || activeController) throw new Error('已有摘要任务正在运行，请稍后再试。');
  running = true;
  try {
    const archive = useMemorySummaryArchiveStore.getState();
    const candidate = archive.summaries.find(
      summary => summary.summaryId === summaryId && summary.status === 'rejected',
    );
    if (!candidate) throw new Error('找不到可重新生成的已拒绝总结。');
    if (hasRejectedSummaryReplacement(candidate)) {
      throw new Error('该来源已有后续候选或任务，请处理最新记录。');
    }
    if (!latestContext || latestContext.save.saveUuid !== candidate.saveUuid) {
      throw new Error('当前存档尚未完成可校验的自动保存，不能重新生成旧总结。');
    }

    const context = cloneJson(latestContext);
    const liveContext = createLiveContext(context);
    if (candidate.mode === 'small') {
      const source = createSpecificSmallSource(context, candidate.sourceMessageIds);
      const liveSource = createSpecificSmallSource(liveContext, candidate.sourceMessageIds);
      if (
        !source ||
        source.sourceFingerprint !== candidate.sourceFingerprint ||
        !liveSource ||
        liveSource.sourceFingerprint !== candidate.sourceFingerprint
      ) {
        throw new Error('已拒绝总结的采用楼层或原文已经变化，不能沿用旧来源。');
      }
      await executeSmallJob(context, source);
      return;
    }

    const summaries = getCurrentSmallSummaryBatch(context, candidate.sourceSummaryIds);
    const liveSummaries = getCurrentSmallSummaryBatch(liveContext, candidate.sourceSummaryIds);
    if (
      !summaries ||
      createLargeFingerprint(summaries) !== candidate.sourceFingerprint ||
      !liveSummaries ||
      createLargeFingerprint(liveSummaries) !== candidate.sourceFingerprint
    ) {
      throw new Error('已拒绝大总结引用的小总结已经变化，不能沿用旧来源。');
    }
    await executeLargeJob(context, summaries);
  } finally {
    running = false;
    if (queuedContext) void drainQueue();
  }
}

export function canRetryRejectedMemorySummary(summaryId: string): boolean {
  const candidate = useMemorySummaryArchiveStore
    .getState()
    .summaries.find(summary => summary.summaryId === summaryId && summary.status === 'rejected');
  return !!candidate && !hasRejectedSummaryReplacement(candidate);
}

export function reviewMemorySummaryCandidate(
  summaryId: string,
  decision: 'accept' | 'reject' | 'edit',
  edits?: { title: string; text: string },
): boolean {
  const archive = useMemorySummaryArchiveStore.getState();
  const candidate = archive.summaries.find(summary => summary.summaryId === summaryId && summary.status === 'pending');
  if (!candidate) return false;
  if (decision === 'reject') return archive.reviewCandidate(summaryId, decision, edits);

  const savedContext = latestContext;
  if (!savedContext || savedContext.save.saveUuid !== candidate.saveUuid) return false;
  const liveContext = createLiveContext(savedContext);
  const isCurrent =
    candidate.mode === 'small'
      ? [savedContext, liveContext].every(context => {
          const source = createSpecificSmallSource(context, candidate.sourceMessageIds);
          return source?.sourceFingerprint === candidate.sourceFingerprint;
        })
      : [savedContext, liveContext].every(context => {
          const summaries = getCurrentSmallSummaryBatch(context, candidate.sourceSummaryIds);
          return summaries !== null && createLargeFingerprint(summaries) === candidate.sourceFingerprint;
        });
  if (!isCurrent) return false;

  const reviewed = archive.reviewCandidate(summaryId, decision, edits);
  if (reviewed && decision !== 'reject') refreshMemorySummarySchedule();
  return reviewed;
}

export function getMemorySummaryRuntimeLabel(): string {
  const config = loadOpenAICompatibleConfig();
  if (!config.enabled) return '副 API 已关闭';
  const saveUuid = useMemorySummaryArchiveStore.getState().activeSaveUuid;
  const pending = getMemorySummariesForSave(saveUuid).filter(summary => summary.status === 'pending').length;
  const failed = getMemoryJobsForSave(saveUuid).filter(job => job.status === 'failed').length;
  return `自动摘要 · 待确认 ${pending} · 失败 ${failed}`;
}

export function getMemorySourceLabel(candidate: MemorySummaryCandidate): string {
  const episode = getMainStoryEpisode(candidate.sourceEventIds[0]);
  return episode?.title ?? candidate.sourceFloorIds[0] ?? '未知来源';
}
