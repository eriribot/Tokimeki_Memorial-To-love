import { normalizeStoryMessages } from '../message/protocol';
import {
  createPlayerProfileSignature,
  PLAYER_PERSONA_INJECTION_VERSION,
  type StoredPlayerPersonaCarrier,
} from '../services/playerPersona';
import type { PlayerProfile } from '../types';
import { getActiveStoryAct } from './storyArchive';
import { getMainStoryActIndex, getMainStoryActOrThrow, getMainStoryEpisode } from './storyRegistry';
import {
  buildPlayerChoiceContinuityHint,
  normalizeGalStoryActs,
  normalizePlayerChoiceText,
  STORY_CUSTOM_CHOICE_OPTION_ID,
  type GalStoryActArchive,
  type GalStoryFloor,
  type GalStoryMessageSave,
  type MainStoryRun,
  type MainStoryState,
  type StoryChoiceDecision,
} from './storyTypes';

export interface MainStorySaveState {
  run: MainStoryRun | null;
  completedEventIds: string[];
  archives: GalStoryActArchive[];
}

function cloneJson<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isStoredPlayerPersonaCarrier(value: unknown): value is StoredPlayerPersonaCarrier {
  return value === 'preset-persona-description' || value === 'depth-zero-fallback' || value === 'not-generated';
}

function normalizeStoredChoiceInline(value: unknown, maximumLength: number): string {
  if (typeof value !== 'string') throw new Error('剧情选择记录文本无效');
  const normalized = value
    .normalize('NFC')
    .replace(/[\r\n\t]+/gu, ' ')
    .replace(/\s{2,}/gu, ' ')
    .trim();
  if (!normalized || normalized.length > maximumLength) throw new Error('剧情选择记录文本无效');
  return normalized;
}

function normalizeRun(value: unknown): MainStoryRun | null {
  if (value === null) return null;
  if (
    !isRecord(value) ||
    typeof value.eventId !== 'string' ||
    typeof value.actId !== 'string' ||
    (value.phase !== 'waiting' && value.phase !== 'playing') ||
    typeof value.pageIndex !== 'number' ||
    !Number.isInteger(value.pageIndex) ||
    value.pageIndex < 0
  ) {
    throw new Error('主线运行游标格式无效');
  }
  getMainStoryActOrThrow(value.eventId, value.actId);
  return {
    eventId: value.eventId,
    actId: value.actId,
    phase: value.phase,
    pageIndex: value.phase === 'waiting' ? 0 : value.pageIndex,
  };
}

function normalizeStoryFloor(value: unknown, eventId: string, actId: string): GalStoryFloor {
  if (!isRecord(value) || !isRecord(value.context)) throw new Error('剧情楼层格式无效');
  const context = value.context;
  if (
    typeof value.floorId !== 'string' ||
    !value.floorId.trim() ||
    value.eventId !== eventId ||
    value.actId !== actId ||
    (value.source !== 'tavern' && value.source !== 'fallback') ||
    typeof value.createdAt !== 'string' ||
    (value.outcome !== 'accepted' && value.outcome !== 'parse_error' && value.outcome !== 'request_error') ||
    typeof context.playerName !== 'string' ||
    typeof context.playerProfileSignature !== 'string' ||
    !/^tolove-persona-v1-[0-9a-f]{16}$/u.test(context.playerProfileSignature) ||
    context.playerPersonaInjectionVersion !== PLAYER_PERSONA_INJECTION_VERSION ||
    !isStoredPlayerPersonaCarrier(context.playerPersonaCarrier) ||
    typeof context.day !== 'number' ||
    !Number.isFinite(context.day) ||
    typeof context.period !== 'string' ||
    typeof context.location !== 'string' ||
    !Array.isArray(value.contextFloorIds) ||
    !value.contextFloorIds.every(id => typeof id === 'string' && id.trim().length > 0) ||
    new Set(value.contextFloorIds).size !== value.contextFloorIds.length ||
    !Array.isArray(value.messageIds) ||
    !value.messageIds.every(id => typeof id === 'string' && id.trim().length > 0) ||
    new Set(value.messageIds).size !== value.messageIds.length ||
    (value.error !== undefined && typeof value.error !== 'string')
  ) {
    throw new Error('剧情楼层字段不完整');
  }

  if (
    (value.outcome === 'accepted' && value.error !== undefined) ||
    (value.outcome !== 'accepted' && (typeof value.error !== 'string' || !value.error.trim())) ||
    ((value.outcome === 'accepted' || value.outcome === 'parse_error') && value.messageIds.length !== 2) ||
    (value.outcome === 'request_error' && value.messageIds.length !== 0) ||
    (value.outcome !== 'accepted' && value.act !== null)
  ) {
    throw new Error('剧情楼层结果与错误信息不一致');
  }

  const act = value.outcome === 'accepted' ? normalizeGalStoryActs([value.act], { expectedActIds: [actId] })[0] : null;
  return {
    floorId: value.floorId,
    eventId,
    actId,
    source: value.source,
    createdAt: value.createdAt,
    outcome: value.outcome,
    act,
    context: {
      playerName: context.playerName,
      playerProfileSignature: context.playerProfileSignature,
      playerPersonaInjectionVersion: context.playerPersonaInjectionVersion,
      playerPersonaCarrier: context.playerPersonaCarrier,
      day: Math.max(1, Math.trunc(context.day)),
      period: context.period,
      location: context.location,
    },
    contextFloorIds: [...value.contextFloorIds],
    messageIds: [...value.messageIds],
    ...(value.error ? { error: value.error } : {}),
  };
}

function normalizeChoiceDecision(
  value: unknown,
  eventId: string,
  actId: string,
  activeFloor: GalStoryFloor | null,
): StoryChoiceDecision | null {
  if (value === undefined || value === null) return null;
  if (!isRecord(value) || typeof value.choiceId !== 'string' || typeof value.optionId !== 'string') {
    throw new Error('剧情选择记录格式无效');
  }
  const choice = getMainStoryActOrThrow(eventId, actId).choice;
  if (!choice || choice.id !== value.choiceId) {
    throw new Error('剧情选择记录与模板不匹配');
  }

  if (value.optionId === STORY_CUSTOM_CHOICE_OPTION_ID) {
    const selectedLabel = normalizePlayerChoiceText(value.selectedLabel);
    return {
      choiceId: value.choiceId,
      optionId: value.optionId,
      source: 'custom',
      selectedLabel,
      continuityHint: buildPlayerChoiceContinuityHint(selectedLabel),
    };
  }

  const activeOption = (activeFloor?.act?.choiceOptions ?? choice.options).find(option => option.id === value.optionId);
  if (
    value.source === 'ai' &&
    /^ai-option-[1-3]$/u.test(value.optionId) &&
    typeof value.selectedLabel === 'string' &&
    typeof value.continuityHint === 'string'
  ) {
    return {
      choiceId: value.choiceId,
      optionId: value.optionId,
      source: 'ai',
      selectedLabel: normalizeStoredChoiceInline(value.selectedLabel, 56),
      continuityHint: normalizeStoredChoiceInline(value.continuityHint, 160),
    };
  }
  if (!activeOption) throw new Error('剧情选择记录与采用楼层不匹配');
  return {
    choiceId: value.choiceId,
    optionId: value.optionId,
    source: activeFloor?.source === 'tavern' ? 'ai' : 'fallback',
    selectedLabel: activeOption.label,
    continuityHint: activeOption.continuityHint,
  };
}

function normalizeStoryArchives(value: unknown): GalStoryActArchive[] {
  if (!Array.isArray(value)) throw new Error('剧情楼层档案必须是数组');
  const seenFloorIds = new Set<string>();
  const seenActKeys = new Set<string>();
  const archives = value.map(rawArchive => {
    if (!isRecord(rawArchive) || !Array.isArray(rawArchive.floors)) throw new Error('剧情幕档案格式无效');
    const { eventId, actId } = rawArchive;
    if (
      typeof eventId !== 'string' ||
      typeof actId !== 'string' ||
      getMainStoryActIndex(eventId, actId) < 0 ||
      (rawArchive.activeFloorId !== null && typeof rawArchive.activeFloorId !== 'string')
    ) {
      throw new Error('剧情幕档案与模板不匹配');
    }
    const actKey = `${eventId}:${actId}`;
    if (seenActKeys.has(actKey)) throw new Error('剧情幕档案重复');
    seenActKeys.add(actKey);

    const floors = rawArchive.floors.map(rawFloor => {
      const floor = normalizeStoryFloor(rawFloor, eventId, actId);
      if (seenFloorIds.has(floor.floorId)) throw new Error('剧情楼层 ID 重复');
      seenFloorIds.add(floor.floorId);
      return floor;
    });
    const activeFloorId = rawArchive.activeFloorId as string | null;
    if (
      activeFloorId !== null &&
      !floors.some(floor => floor.floorId === activeFloorId && floor.outcome === 'accepted' && floor.act !== null)
    ) {
      throw new Error('剧情幕采用楼层不可播放');
    }
    const activeFloor = floors.find(floor => floor.floorId === activeFloorId) ?? null;
    return {
      eventId,
      actId,
      activeFloorId,
      choiceDecision: normalizeChoiceDecision(rawArchive.choiceDecision, eventId, actId, activeFloor),
      floors,
    };
  });

  const acceptedFloors = new Map(
    archives.flatMap(archive =>
      archive.floors.filter(floor => floor.outcome === 'accepted').map(floor => [floor.floorId, floor] as const),
    ),
  );
  for (const archive of archives) {
    for (const floor of archive.floors) {
      const episode = getMainStoryEpisode(floor.eventId);
      const actIndex = getMainStoryActIndex(floor.eventId, floor.actId);
      const expectedPreviousActIds = episode?.acts.slice(0, actIndex).map(act => act.id) ?? [];
      if (actIndex < 0 || floor.contextFloorIds.length !== expectedPreviousActIds.length) {
        throw new Error('剧情楼层缺少完整前文');
      }
      for (const [contextIndex, contextFloorId] of floor.contextFloorIds.entries()) {
        const contextFloor = acceptedFloors.get(contextFloorId);
        if (
          !contextFloor ||
          contextFloor.eventId !== floor.eventId ||
          contextFloor.actId !== expectedPreviousActIds[contextIndex]
        ) {
          throw new Error('剧情楼层引用了无效前文');
        }
      }
    }
  }
  return archives;
}

function assertMessagesMatchFloors(
  archives: readonly GalStoryActArchive[],
  messages: readonly GalStoryMessageSave[],
): void {
  const messagesById = new Map(messages.map(message => [message.id, message]));
  const referencedMessageIds = new Set<string>();
  for (const archive of archives) {
    for (const floor of archive.floors) {
      for (const messageId of floor.messageIds) {
        const message = messagesById.get(messageId);
        if (
          !message ||
          message.extra.floorId !== floor.floorId ||
          message.extra.eventId !== floor.eventId ||
          message.extra.actId !== floor.actId ||
          message.extra.source !== floor.source ||
          message.extra.outcome !== floor.outcome ||
          message.extra.playerName !== floor.context.playerName ||
          JSON.stringify(message.extra.contextFloorIds) !== JSON.stringify(floor.contextFloorIds)
        ) {
          throw new Error('剧情消息与楼层不匹配');
        }
        referencedMessageIds.add(messageId);
      }
    }
  }
  if (messages.some(message => !referencedMessageIds.has(message.id))) {
    throw new Error('剧情消息没有对应楼层');
  }
}

export function createMainStorySaveState(state: MainStoryState): MainStorySaveState {
  return cloneJson({
    run: state.run,
    completedEventIds: state.completedEventIds,
    archives: state.archives,
  });
}

export function restoreMainStoryState(
  value: unknown,
  archivedMessages: readonly GalStoryMessageSave[],
  playerProfile: PlayerProfile | null,
): MainStoryState {
  if (!isRecord(value) || !Array.isArray(value.completedEventIds)) throw new Error('主线存档格式无效');
  const completedEventIds = [...new Set(value.completedEventIds)];
  if (
    !completedEventIds.every(
      (eventId): eventId is string => typeof eventId === 'string' && getMainStoryEpisode(eventId) !== null,
    )
  ) {
    throw new Error('主线完成记录引用了未登记事件');
  }
  for (const eventId of completedEventIds) {
    const episode = getMainStoryEpisode(eventId);
    if (!(episode?.prerequisiteEventIds ?? []).every(prerequisiteId => completedEventIds.includes(prerequisiteId))) {
      throw new Error('主线完成记录缺少前置事件');
    }
  }
  const run = normalizeRun(value.run);
  if (run && completedEventIds.includes(run.eventId)) throw new Error('已完成主线不能仍处于运行状态');
  const runEpisode = run ? getMainStoryEpisode(run.eventId) : null;
  if (runEpisode && !(runEpisode.prerequisiteEventIds ?? []).every(eventId => completedEventIds.includes(eventId))) {
    throw new Error('主线运行状态缺少前置事件');
  }
  const archives = normalizeStoryArchives(value.archives);
  const expectedPlayerProfileSignature = playerProfile ? createPlayerProfileSignature(playerProfile) : null;
  for (const floor of archives.flatMap(archive => archive.floors)) {
    if (
      expectedPlayerProfileSignature === null ||
      floor.context.playerProfileSignature !== expectedPlayerProfileSignature ||
      floor.context.playerPersonaInjectionVersion !== PLAYER_PERSONA_INJECTION_VERSION ||
      floor.context.playerName !== playerProfile?.displayName
    ) {
      throw new Error('剧情楼层玩家资料签名与当前存档不一致');
    }
  }
  const messages = normalizeStoryMessages(archivedMessages);
  assertMessagesMatchFloors(archives, messages);
  const activeAct = run?.phase === 'playing' ? getActiveStoryAct(archives, run.eventId, run.actId) : null;
  const activeArchive = run
    ? archives.find(archive => archive.eventId === run.eventId && archive.actId === run.actId)
    : null;
  const activeFloor = activeArchive?.floors.find(floor => floor.floorId === activeArchive.activeFloorId) ?? null;
  const pageIndex = activeAct ? Math.min(activeAct.beats.length - 1, run?.pageIndex ?? 0) : 0;

  return {
    run: run ? { ...run, pageIndex } : null,
    completedEventIds,
    archives,
    messages,
    generation:
      run?.phase === 'playing' && activeAct && activeFloor
        ? { status: 'ready', requestId: null, source: activeFloor.source, error: null }
        : { status: 'idle', requestId: null, source: null, error: null },
  };
}
