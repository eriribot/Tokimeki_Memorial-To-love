import { getMainStoryEpisode } from '../GalMainStory/storyRegistry';
import type { GalStoryMessageSave } from '../GalMainStory/storyTypes';
import { loadOpenAICompatibleConfig } from '../config/openaiCompatible';
import type { SaveRecord } from '../save';
import type { GameSnapshot } from '../save/snapshot';
import {
  createLargeSummaryPrompt,
  createSmallSummaryPrompt,
  type AcceptedSummaryInput,
  type SummarySourceMessage,
  type SummaryTimelineEntry,
} from './summaryPrompts';

// 通过SillyTavern后端发送API请求，避免CORS问题，同时能在CMD看到日志
async function requestThroughSillyTavern(
  config: ReturnType<typeof loadOpenAICompatibleConfig>,
  systemPrompt: string,
  userPrompt: string,
  options: { temperature: number; maxTokens: number; signal: AbortSignal },
): Promise<string> {
  const hasSillyTavern = typeof SillyTavern !== 'undefined' && typeof SillyTavern.getRequestHeaders === 'function';

  if (!hasSillyTavern) {
    // 如果不在SillyTavern环境，直接调用API
    console.warn('[ToLove Memory] 不在SillyTavern环境，直接调用API');
    const { requestOpenAICompatibleCompletion } = await import('../config/openaiCompatible');
    const response = await requestOpenAICompatibleCompletion(config, {
      systemPrompt,
      userPrompt,
      temperature: options.temperature,
      maxTokens: options.maxTokens,
      signal: options.signal,
    });
    return response.text;
  }

  // 通过SillyTavern后端的chat-completions代理
  console.log('[ToLove Memory] 通过SillyTavern后端发送总结请求');

  const messages = [
    { role: 'system', content: systemPrompt },
    { role: 'user', content: userPrompt },
  ];

  const response = await fetch('/api/backends/chat-completions/generate', {
    method: 'POST',
    headers: {
      ...SillyTavern.getRequestHeaders(),
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      messages,
      model: config.model,
      temperature: options.temperature,
      max_tokens: options.maxTokens,
      stream: false,
      // 使用custom源
      api: 'custom',
      chat_completion_source: 'custom',
      custom_url: config.baseUrl.trim().replace(/\/+$/u, ''),
      custom_include_headers: config.apiKey ? JSON.stringify({ Authorization: `Bearer ${config.apiKey}` }) : '',
    }),
    signal: options.signal,
  });

  if (!response.ok) {
    const errorText = await response.text().catch(() => `HTTP ${response.status}`);
    throw new Error(`SillyTavern后端返回错误: ${errorText}`);
  }

  const result = await response.json();

  // 提取文本内容，兼容不同的响应格式
  if (typeof result === 'string') {
    return result;
  }

  // OpenAI格式
  if (result.choices?.[0]?.message?.content) {
    return result.choices[0].message.content;
  }

  // 其他可能的格式
  return result.response || result.text || result.content || '';
}
import {
  createMemoryRuntimeId,
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
import {
  createMemorySummarySourceProjection,
  DATING_SUMMARY_EVENT_ID,
  type MemorySummarySourceFloor,
  type MemorySummarySourceMessage,
  type MemorySummarySourceProjection,
} from './summarySourceProjection';
import { createScopedMemorySummaryArchive, type ScopedMemorySummaryArchive } from './summaryScope';

const SUMMARY_RUNTIME_DELAY_MS = 350;

interface SavedMemoryContext {
  save: SaveRecord<GameSnapshot>;
  messages: readonly GalStoryMessageSave[];
}

interface SmallSummarySource {
  eventIds: string[];
  actIds: string[];
  floorIds: string[];
  messages: SummarySourceMessage[];
  timeline: SummaryTimelineEntry[];
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
  if (!latestContext || latestContext.save.saveUuid !== candidate.saveUuid) return true;
  const archive = getScopedArchiveForContext(latestContext);
  if (!archive.summaries.some(summary => summary.summaryId === candidate.summaryId)) return true;
  const hasNewerCandidate = archive.summaries.some(
    summary =>
      summary.summaryId !== candidate.summaryId &&
      summary.createdAt >= reviewedAt &&
      hasSameSummarySource(candidate, summary),
  );
  if (hasNewerCandidate) return true;
  return archive.jobs.some(
    job => job.candidateId !== candidate.summaryId && job.createdAt >= reviewedAt && hasSameJobSource(candidate, job),
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

function getSourceFromFloors(
  floors: readonly MemorySummarySourceFloor[],
  messages: readonly MemorySummarySourceMessage[],
): SmallSummarySource | null {
  if (floors.length === 0) return null;
  const messagesById = new Map(messages.map(message => [message.id, message]));
  const sourceMessages: SummarySourceMessage[] = [];
  const timeline: SummaryTimelineEntry[] = [];

  for (const floor of floors) {
    const pair = floor.messageIds
      .map(messageId => messagesById.get(messageId))
      .filter((message): message is MemorySummarySourceMessage => message !== undefined)
      .sort((left, right) => (left.role === 'user' ? -1 : right.role === 'user' ? 1 : 0));
    if (pair.length !== 2 || pair[0].role !== 'user' || pair[1].role !== 'assistant') return null;
    const scopeLabel = pair[0].scopeLabel;
    if (!scopeLabel || pair.some(message => message.scopeLabel !== scopeLabel)) return null;
    timeline.push({
      floorId: floor.floorId,
      eventId: floor.eventId,
      actId: floor.actId,
      kind: floor.kind,
      date: { ...floor.date },
      actionNumber: floor.actionNumber,
      scopeLabel,
    });
    for (const message of pair) {
      sourceMessages.push({
        id: message.id,
        role: message.role,
        eventId: message.eventId,
        actId: message.actId,
        floorId: message.floorId,
        source: message.source,
        outcome: 'accepted',
        canonicalOrdinal: message.canonicalOrdinal,
        content: message.content,
      });
    }
  }

  const sourceFingerprint = createSourceFingerprint({
    messages: sourceMessages.map(message => [
      message.id,
      message.eventId,
      message.actId,
      message.floorId,
      message.source,
      message.content,
    ]),
    timeline,
  });
  return {
    eventIds: unique(sourceMessages.map(message => message.eventId)),
    actIds: unique(sourceMessages.map(message => message.actId)),
    floorIds: floors.map(floor => floor.floorId),
    messages: sourceMessages,
    timeline,
    sourceFingerprint,
  };
}

function getTimelineForFloors(context: SavedMemoryContext, floorIds: readonly string[]): SummaryTimelineEntry[] | null {
  const projection = createMemorySummarySourceProjection(context.save.data, context.messages);
  const floorIndexes = new Map(projection.floors.map((floor, index) => [floor.floorId, index]));
  const selected = floorIds.map(floorId => projection.floors.find(floor => floor.floorId === floorId));
  if (
    selected.some((floor): floor is undefined => floor === undefined) ||
    selected.some(
      (floor, index) =>
        index > 0 && floorIndexes.get(floor!.floorId)! <= floorIndexes.get(selected[index - 1]!.floorId)!,
    )
  ) {
    return null;
  }
  const messagesById = new Map(projection.messages.map(message => [message.id, message]));
  const timeline = selected.map(floor => {
    const scopeLabel = messagesById.get(floor!.messageIds[0])?.scopeLabel;
    if (!scopeLabel) return null;
    return {
      floorId: floor!.floorId,
      eventId: floor!.eventId,
      actId: floor!.actId,
      kind: floor!.kind,
      date: { ...floor!.date },
      actionNumber: floor!.actionNumber,
      scopeLabel,
    } satisfies SummaryTimelineEntry;
  });
  return timeline.every((entry): entry is SummaryTimelineEntry => entry !== null) ? timeline : null;
}

function getEligibleFloors(context: SavedMemoryContext): {
  timeline: MemorySummarySourceFloor[];
  floors: MemorySummarySourceFloor[];
  messages: MemorySummarySourceMessage[];
} {
  const projection = createMemorySummarySourceProjection(context.save.data, context.messages);
  console.log('[ToLove Memory] getEligibleFloors', {
    timelineLength: projection.floors.length,
    eligibleFloorsLength: projection.floors.length,
    mainStoryFloorCount: projection.floors.filter(floor => floor.kind === 'main-story').length,
    datingFloorCount: projection.floors.filter(floor => floor.kind === 'dating').length,
    floorIds: projection.floors.map(floor => floor.floorId),
  });
  return {
    timeline: projection.floors,
    floors: projection.floors,
    messages: projection.messages,
  };
}

function getScopedArchiveForContext(
  context: SavedMemoryContext,
  projection: MemorySummarySourceProjection = createMemorySummarySourceProjection(context.save.data, context.messages),
): ScopedMemorySummaryArchive {
  const archive = useMemorySummaryArchiveStore.getState();
  return createScopedMemorySummaryArchive({
    saveUuid: context.save.saveUuid,
    saveRevision: context.save.revision,
    projection,
    summaries: archive.summaries,
    jobs: archive.jobs,
  });
}

export function getCurrentMemorySummaryArchiveView(): ScopedMemorySummaryArchive {
  return latestContext ? getScopedArchiveForContext(latestContext) : { summaries: [], jobs: [] };
}

function getUncoveredSmallSummaryFloors(context: SavedMemoryContext): {
  timeline: MemorySummarySourceFloor[];
  floors: MemorySummarySourceFloor[];
  messages: MemorySummarySourceMessage[];
} {
  const { timeline, floors, messages } = getEligibleFloors(context);
  const { summaries, jobs } = getScopedArchiveForContext(context, { floors: timeline, messages });
  const coveredIds = new Set([
    ...summaries.filter(summary => summary.mode === 'small').flatMap(summary => summary.sourceMessageIds),
    ...jobs.filter(job => job.mode === 'small').flatMap(job => job.sourceMessageIds),
  ]);
  return {
    timeline,
    floors: floors.filter(floor => floor.messageIds.every(messageId => !coveredIds.has(messageId))),
    messages,
  };
}

function createAutomaticSmallSource(context: SavedMemoryContext): SmallSummarySource | null {
  const { floors, messages } = getUncoveredSmallSummaryFloors(context);
  if (floors.length < SMALL_SUMMARY_SOURCE_FLOOR_COUNT) return null;
  return getSourceFromFloors(floors.slice(0, SMALL_SUMMARY_SOURCE_FLOOR_COUNT), messages);
}

function createManualSmallSource(context: SavedMemoryContext): SmallSummarySource | null {
  const { floors, messages } = getUncoveredSmallSummaryFloors(context);
  const selectedFloors = floors.slice(0, SMALL_SUMMARY_SOURCE_FLOOR_COUNT);
  if (selectedFloors.length < SMALL_SUMMARY_MIN_SOURCE_FLOOR_COUNT) return null;
  return getSourceFromFloors(selectedFloors, messages);
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
  const { floors, messages } = getEligibleFloors(context);
  const requestedIds = new Set(sourceMessageIds);
  const selectedFloors = floors.filter(floor => floor.messageIds.every(messageId => requestedIds.has(messageId)));
  const source = getSourceFromFloors(selectedFloors, messages);
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
    summary.saveUuid !== context.save.saveUuid ||
    summary.saveRevision > context.save.revision ||
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
    getScopedArchiveForContext(context)
      .summaries.filter(summary => summary.mode === 'small' && summary.status === 'accepted')
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
  const { summaries, jobs } = getScopedArchiveForContext(context);
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
        job => job.mode === 'large' && hasCurrentLargeSource(context, job.sourceSummaryIds, job.sourceFingerprint),
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
  if (context.save.saveUuid !== job.saveUuid || job.saveRevision > context.save.revision) return null;
  return getCurrentSmallSummaryBatch(context, job.sourceSummaryIds);
}

function isCurrentFailedJob(context: SavedMemoryContext, job: MemorySummaryJob): boolean {
  if (job.status !== 'failed' || job.saveUuid !== context.save.saveUuid || job.saveRevision > context.save.revision) {
    return false;
  }
  if (job.mode === 'large') {
    return hasCurrentLargeSource(context, job.sourceSummaryIds, job.sourceFingerprint);
  }
  const source = createSpecificSmallSource(context, job.sourceMessageIds);
  return source?.sourceFingerprint === job.sourceFingerprint;
}

/** UI capability check shared with the manual summary control. Stale failures are visible but do not block new work. */
export function hasBlockingMemorySummaryJob(): boolean {
  if (!latestContext) return false;
  const context = latestContext;
  return getScopedArchiveForContext(context).jobs.some(
    job => job.status === 'running' || isCurrentFailedJob(context, job),
  );
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
  // Revisions advance during normal play and autosave, so an in-flight request
  // may finish against a newer revision. A rollback to an older revision must
  // still invalidate it, otherwise a future-timeline result could reappear
  // after the player advances again.
  return (
    latestContext !== null &&
    latestContext.save.saveUuid === job.saveUuid &&
    latestContext.save.revision >= job.saveRevision
  );
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
    const prompt = createSmallSummaryPrompt({
      sourceFingerprint: source.sourceFingerprint,
      messages: source.messages,
      timeline: source.timeline,
    });

    console.log('[ToLove Memory] 开始生成小总结...', {
      sourceFloorCount: source.floorIds.length,
      sourceMessageCount: source.messages.length,
      model: config.model,
    });

    // 通过SillyTavern后端发送请求，避免预设干扰
    const responseText = await requestThroughSillyTavern(config, prompt.systemPrompt, prompt.userPrompt, {
      temperature: 0.1,
      maxTokens: 1600,
      signal: controller.signal,
    });

    console.log('[ToLove Memory] 小总结生成成功', {
      textLength: responseText.length,
    });
    progress.setPhase('validating', 85);

    const payload = createMemorySummaryPayloadFromText(responseText, {
      mode: 'small',
      sourceFloorIds: source.floorIds,
      sourceSummaryIds: [],
    });
    const currentContext = latestContext;
    if (!isRequestAnchorCurrent(job) || !currentContext) {
      throw new Error('摘要返回时当前存档已经切换，候选已丢弃。');
    }
    const savedSource = createSpecificSmallSource(currentContext, job.sourceMessageIds);
    if (!savedSource || savedSource.sourceFingerprint !== job.sourceFingerprint) {
      throw new Error('摘要返回时采用楼层或原文已经变化，候选已丢弃。');
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
      createdAt: new Date().toISOString(),
      reviewedAt: null,
    };
    console.log('[ToLove Memory] 创建小总结候选', {
      sourceFloorIds: source.floorIds,
      sourceMessageIds: source.messages.map(message => message.id),
      title: payload.title,
      textLength: payload.text.length,
    });
    archive.completeJob(job.jobId, candidate);
    progress.ready('小总结候选已生成，请到目录确认');
  } catch (error) {
    const detail = getErrorMessage(error);
    console.error('[ToLove Memory] 小总结生成失败', {
      error: detail,
      jobId: job.jobId,
      attempt: job.attempt,
    });
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
    const timeline = getTimelineForFloors(
      context,
      sourceSummaries.flatMap(summary => summary.sourceFloorIds),
    );
    if (!timeline) throw new Error('大总结来源楼层无法映射到当前日历时间线。');
    const prompt = createLargeSummaryPrompt({
      sourceFingerprint,
      summaries,
      timeline,
    });

    console.log('[ToLove Memory] 开始生成大总结...', {
      sourceSummaryCount: sourceSummaries.length,
      model: config.model,
    });

    // 通过SillyTavern后端发送请求，避免预设干扰
    const responseText = await requestThroughSillyTavern(config, prompt.systemPrompt, prompt.userPrompt, {
      temperature: 0,
      maxTokens: 2200,
      signal: controller.signal,
    });

    console.log('[ToLove Memory] 大总结生成成功', {
      textLength: responseText.length,
    });
    progress.setPhase('validating', 85);

    const payload = createMemorySummaryPayloadFromText(responseText, {
      mode: 'large',
      sourceFloorIds: unique(sourceSummaries.flatMap(summary => summary.sourceFloorIds)),
      sourceSummaryIds: sourceSummaries.map(summary => summary.summaryId),
    });
    if (!isRequestAnchorCurrent(job)) throw new Error('大总结返回时当前存档已经切换，候选已丢弃。');
    const currentContext = latestContext;
    const currentSummaries = currentContext ? getSpecificLargeBatch(currentContext, job) : null;
    if (!currentSummaries || createLargeFingerprint(currentSummaries) !== job.sourceFingerprint) {
      throw new Error('大总结返回时已接受小总结或来源已经变化，候选已丢弃。');
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
      createdAt: new Date().toISOString(),
      reviewedAt: null,
    };
    archive.completeJob(job.jobId, candidate);
    progress.ready('大总结候选已生成，请到目录确认');
  } catch (error) {
    const detail = getErrorMessage(error);
    console.error('[ToLove Memory] 大总结生成失败', {
      error: detail,
      jobId: job.jobId,
      attempt: job.attempt,
    });
    archive.failJob(job.jobId, detail);
    progress.fail(detail);
  } finally {
    if (activeController === controller) activeController = null;
  }
}

async function processContext(context: SavedMemoryContext): Promise<void> {
  const config = loadOpenAICompatibleConfig();
  if (!config.enabled) return;
  useMemorySummaryArchiveStore.getState().setActiveSave(context.save.saveUuid, context.save.revision);
  if (getScopedArchiveForContext(context).jobs.some(job => isCurrentFailedJob(context, job))) return;

  const largeBatch = getAutomaticLargeBatch(context);
  if (largeBatch.length === LARGE_SUMMARY_SOURCE_COUNT) {
    await executeLargeJob(context, largeBatch);
    return;
  }

  const smallSource = createAutomaticSmallSource(context);
  if (smallSource) {
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
  useMemorySummaryArchiveStore.getState().setActiveSave(save.saveUuid, save.revision);
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
  if (getScopedArchiveForContext(context).jobs.some(job => isCurrentFailedJob(context, job))) {
    throw new Error('当前存在失败任务，请先重试或处理该任务。');
  }
  const source = createManualSmallSource(context);
  if (!source) throw new Error('当前没有尚未归档的完整楼层。');

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
  adopt: (save: SaveRecord<GameSnapshot>, messages: readonly GalStoryMessageSave[], schedule?: boolean) => boolean;
  rollback: () => boolean;
  commitInvalidated: () => boolean;
}

export function beginMemorySummaryContextTransition(
  reason = '权威存档上下文正在切换。',
): MemorySummaryContextTransition {
  const previousContext = latestContext ? cloneJson(latestContext) : null;
  const previousActiveSaveUuid = useMemorySummaryArchiveStore.getState().activeSaveUuid;
  const previousActiveSaveRevision = useMemorySummaryArchiveStore.getState().activeSaveRevision;
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
        useMemorySummaryArchiveStore.getState().setActiveSave(previousActiveSaveUuid, previousActiveSaveRevision);
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
    if (!latestContext) {
      throw new Error('当前存档尚未完成可校验的自动保存，不能重试旧任务。');
    }
    const job = getScopedArchiveForContext(latestContext).jobs.find(item => item.jobId === jobId);
    if (!job || job.status !== 'failed') throw new Error('找不到当前存档可重试的失败任务。');
    if (latestContext.save.saveUuid !== job.saveUuid) {
      throw new Error('当前存档尚未完成可校验的自动保存，不能重试旧任务。');
    }

    const context = cloneJson(latestContext);
    if (job.mode === 'small') {
      const source = createSpecificSmallSource(context, job.sourceMessageIds);
      if (!source || source.sourceFingerprint !== job.sourceFingerprint) {
        throw new Error('失败任务的采用楼层或原文已经变化，不能沿用旧请求。');
      }
      await executeSmallJob(context, source, job);
      return;
    }

    const summaries = getSpecificLargeBatch(context, job);
    if (!summaries || createLargeFingerprint(summaries) !== job.sourceFingerprint) {
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
    if (!latestContext) {
      throw new Error('当前存档尚未完成可校验的自动保存，不能重新生成旧总结。');
    }
    const candidate = getScopedArchiveForContext(latestContext).summaries.find(
      summary => summary.summaryId === summaryId && summary.status === 'rejected',
    );
    if (!candidate) throw new Error('找不到当前存档可重新生成的已拒绝总结。');
    if (hasRejectedSummaryReplacement(candidate)) {
      throw new Error('该来源已有后续候选或任务，请处理最新记录。');
    }
    if (!latestContext || latestContext.save.saveUuid !== candidate.saveUuid) {
      throw new Error('当前存档尚未完成可校验的自动保存，不能重新生成旧总结。');
    }

    const context = cloneJson(latestContext);
    if (candidate.mode === 'small') {
      const source = createSpecificSmallSource(context, candidate.sourceMessageIds);
      if (!source || source.sourceFingerprint !== candidate.sourceFingerprint) {
        throw new Error('已拒绝总结的采用楼层或原文已经变化，不能沿用旧来源。');
      }
      await executeSmallJob(context, source);
      return;
    }

    const summaries = getCurrentSmallSummaryBatch(context, candidate.sourceSummaryIds);
    if (!summaries || createLargeFingerprint(summaries) !== candidate.sourceFingerprint) {
      throw new Error('已拒绝大总结引用的小总结已经变化，不能沿用旧来源。');
    }
    await executeLargeJob(context, summaries);
  } finally {
    running = false;
    if (queuedContext) void drainQueue();
  }
}

/**
 * 重新生成任何状态的总结（包括已接受的）
 */
export async function regenerateMemorySummary(summaryId: string): Promise<void> {
  if (running || activeController) throw new Error('已有摘要任务正在运行，请稍后再试。');
  running = true;
  try {
    if (!latestContext) {
      throw new Error('当前存档尚未完成可校验的自动保存，不能重新生成旧总结。');
    }
    const scopedArchive = getScopedArchiveForContext(latestContext);
    const candidate = scopedArchive.summaries.find(summary => summary.summaryId === summaryId);
    if (!candidate) throw new Error('找不到当前存档中的指定总结。');

    // 对于已接受的总结，不需要检查是否有后续候选
    if (candidate.status === 'rejected' && hasRejectedSummaryReplacement(candidate)) {
      throw new Error('该来源已有后续候选或任务，请处理最新记录。');
    }

    if (!latestContext || latestContext.save.saveUuid !== candidate.saveUuid) {
      throw new Error('当前存档尚未完成可校验的自动保存，不能重新生成旧总结。');
    }

    const context = cloneJson(latestContext);

    // 在重新生成前，删除相同来源的其他pending候选（避免重复）
    const sourceFingerprint = candidate.sourceFingerprint;
    const duplicates = scopedArchive.summaries.filter(
      s =>
        s.summaryId !== summaryId &&
        s.status === 'pending' &&
        s.sourceFingerprint === sourceFingerprint &&
        s.mode === candidate.mode,
    );
    if (duplicates.length > 0) {
      console.log(
        '[ToLove Memory] 删除重复的pending候选:',
        duplicates.map(d => d.summaryId),
      );
      useMemorySummaryArchiveStore.setState(state => ({
        summaries: state.summaries.filter(s => !duplicates.some(dup => dup.summaryId === s.summaryId)),
      }));
    }

    if (candidate.mode === 'small') {
      const source = createSpecificSmallSource(context, candidate.sourceMessageIds);
      if (!source || source.sourceFingerprint !== candidate.sourceFingerprint) {
        throw new Error('总结的采用楼层或原文已经变化，不能沿用旧来源。');
      }
      await executeSmallJob(context, source);
      return;
    }

    const summaries = getCurrentSmallSummaryBatch(context, candidate.sourceSummaryIds);
    if (!summaries || createLargeFingerprint(summaries) !== candidate.sourceFingerprint) {
      throw new Error('大总结引用的小总结已经变化，不能沿用旧来源。');
    }
    await executeLargeJob(context, summaries);
  } finally {
    running = false;
    if (queuedContext) void drainQueue();
  }
}

export function canRetryRejectedMemorySummary(summaryId: string): boolean {
  if (!latestContext) return false;
  const candidate = getScopedArchiveForContext(latestContext).summaries.find(
    summary => summary.summaryId === summaryId && summary.status === 'rejected',
  );
  return !!candidate && !hasRejectedSummaryReplacement(candidate);
}

export function reviewMemorySummaryCandidate(
  summaryId: string,
  decision: 'accept' | 'reject' | 'edit',
  edits?: { title: string; text: string },
): boolean {
  const archive = useMemorySummaryArchiveStore.getState();
  const savedContext = latestContext;
  if (!savedContext) return false;
  const candidate = getScopedArchiveForContext(savedContext).summaries.find(
    summary => summary.summaryId === summaryId && summary.status === 'pending',
  );
  if (!candidate) return false;
  if (savedContext.save.saveUuid !== candidate.saveUuid) return false;
  const isCurrent =
    candidate.mode === 'small'
      ? createSpecificSmallSource(savedContext, candidate.sourceMessageIds)?.sourceFingerprint ===
        candidate.sourceFingerprint
      : (() => {
          const summaries = getCurrentSmallSummaryBatch(savedContext, candidate.sourceSummaryIds);
          return summaries !== null && createLargeFingerprint(summaries) === candidate.sourceFingerprint;
        })();
  if (!isCurrent) return false;

  const reviewed = archive.reviewCandidate(summaryId, decision, edits);
  if (reviewed) refreshMemorySummarySchedule();
  return reviewed;
}

export function getMemorySummaryRuntimeLabel(): string {
  const config = loadOpenAICompatibleConfig();
  if (!config.enabled) return '副 API 已关闭';
  const archive = getCurrentMemorySummaryArchiveView();
  const pending = archive.summaries.filter(summary => summary.status === 'pending').length;
  const failed = archive.jobs.filter(job => job.status === 'failed').length;
  return `自动摘要 · 待确认 ${pending} · 失败 ${failed}`;
}

export function getMemorySourceLabel(candidate: MemorySummaryCandidate): string {
  const includesDating = candidate.sourceEventIds.includes(DATING_SUMMARY_EVENT_ID);
  if (includesDating && candidate.sourceEventIds.length === 1) return '约会记录';
  const firstMainStoryEventId = candidate.sourceEventIds.find(eventId => eventId !== DATING_SUMMARY_EVENT_ID);
  const episode = getMainStoryEpisode(firstMainStoryEventId);
  const label = episode?.title ?? candidate.sourceFloorIds[0] ?? '未知来源';
  return includesDating ? `${label} · 含约会` : label;
}
