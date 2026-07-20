import { useCardStore } from '../stores/cardStore';
import { syncDefaultCards } from '../stores/characterStore';
import { useGameStore } from '../stores/gameStore';
import { usePlayerStore } from '../stores/playerStore';
import {
  INITIAL_SKILL_PROGRESSION_STATE,
  skillGraph,
  toSkillProgressionSnapshot,
  useSkillStore,
  validateSkillProgressionSnapshot,
  type SkillProgressionSnapshot,
} from '../skilllogic';
import { getCalendarDateForGameDay, isCalendarDateValue } from '../CalendarModule/date';
import { EPISODE_01_ACT_IDS, EPISODE_01_EVENT_ID } from '../GalMainStory/episodes/episode01';
import {
  normalizeGalStoryActs,
  type GalStoryActArchive,
  type GalStoryAct,
  type GalStoryFloor,
  type GalStoryMessageSave,
  type MainStoryEntryReason,
  type StoryGenerationSource,
  type StoryGenerationStatus,
} from '../GalMainStory/storyTypes';
import type {
  CalendarDateValue,
  CharacterCard,
  GameCharacter,
  GameEvent,
  GameScreen,
  LocationId,
  PlayerState,
} from '../types';
import type { SavePreview } from './protocol';
import { normalizeStoryMessages } from '../message/protocol';
import { syncCharacterPresence } from '../services/characterPresence';

export interface GameSnapshotV1 {
  schemaVersion: 1;
  messageArchiveVersion?: 1;
  storyArchiveVersion?: 1;
  savedAt: string;
  skills?: SkillProgressionSnapshot;
  game: {
    screen: GameScreen;
    hasSession: boolean;
    day: number;
    date?: CalendarDateValue;
    actionPointsRemaining?: number;
    periodIndex: number;
    currentLocationId: LocationId;
    currentSceneId: LocationId | null;
    isPlaying: boolean;
    log: string[];
    events: GameEvent[];
    activeMainStoryEventId?: string | null;
    completedMainStoryEventIds?: string[];
    mainStoryEntryReason?: MainStoryEntryReason | null;
    mainStoryActIndex?: number;
    mainStoryPageIndex?: number;
    mainStoryActs?: GalStoryAct[];
    mainStoryArchives?: GalStoryActArchive[];
    mainStoryMessages?: GalStoryMessageSave[];
    mainStoryGenerationStatus?: StoryGenerationStatus;
    mainStoryGenerationSource?: StoryGenerationSource | null;
    mainStoryGenerationError?: string | null;
  };
  player: PlayerState;
  cards: {
    targets: GameCharacter[];
    activeTargetId: string | null;
    loadedCards: CharacterCard[];
  };
}

function cloneJson<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function normalizeStoryFloor(value: unknown, actIndex: number, actId: string): GalStoryFloor {
  if (!isRecord(value) || !isRecord(value.context)) throw new Error('剧情楼层格式无效');
  const context = value.context;
  if (
    typeof value.floorId !== 'string' ||
    value.floorId.trim().length === 0 ||
    value.eventId !== EPISODE_01_EVENT_ID ||
    value.actIndex !== actIndex ||
    value.actId !== actId ||
    (value.source !== 'tavern' && value.source !== 'fallback') ||
    typeof value.createdAt !== 'string' ||
    (value.outcome !== 'accepted' && value.outcome !== 'parse_error' && value.outcome !== 'request_error') ||
    (context.entryReason !== 'after_first_action' && context.entryReason !== 'after_second_action') ||
    typeof context.playerName !== 'string' ||
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
    (value.outcome !== 'accepted' && (typeof value.error !== 'string' || value.error.trim().length === 0)) ||
    (value.outcome === 'parse_error' && value.messageIds.length !== 2) ||
    (value.outcome === 'request_error' && value.messageIds.length !== 0)
  ) {
    throw new Error('剧情楼层结果与错误信息不一致');
  }

  const act =
    value.outcome === 'accepted'
      ? normalizeGalStoryActs([value.act], {
          expectedActIds: [actId],
        })[0]
      : null;
  if (value.outcome !== 'accepted' && value.act !== null) throw new Error('失败楼层不能携带可播放正文');

  return {
    floorId: value.floorId,
    eventId: EPISODE_01_EVENT_ID,
    actIndex,
    actId,
    source: value.source,
    createdAt: value.createdAt,
    outcome: value.outcome,
    act,
    context: {
      entryReason: context.entryReason,
      playerName: context.playerName,
      day: Math.max(1, Math.trunc(context.day)),
      period: context.period,
      location: context.location,
    },
    contextFloorIds: [...value.contextFloorIds],
    messageIds: [...value.messageIds],
    ...(value.error ? { error: value.error } : {}),
  };
}

function normalizeStoryArchives(value: unknown): GalStoryActArchive[] {
  if (!Array.isArray(value)) throw new Error('剧情楼层档案必须是数组');
  const seenFloorIds = new Set<string>();
  const seenActIndexes = new Set<number>();
  const archives: GalStoryActArchive[] = [];
  for (const rawArchive of value) {
    try {
      if (!isRecord(rawArchive) || !Array.isArray(rawArchive.floors)) throw new Error('剧情幕档案格式无效');
      const actIndex = rawArchive.actIndex;
      if (typeof actIndex !== 'number' || !Number.isInteger(actIndex) || actIndex < 0) {
        throw new Error('剧情幕编号无效');
      }
      const actId = EPISODE_01_ACT_IDS[actIndex];
      if (
        !actId ||
        rawArchive.eventId !== EPISODE_01_EVENT_ID ||
        rawArchive.actId !== actId ||
        (rawArchive.activeFloorId !== null && typeof rawArchive.activeFloorId !== 'string')
      ) {
        throw new Error('剧情幕档案与事件不匹配');
      }
      if (seenActIndexes.has(actIndex)) throw new Error('剧情幕档案重复');
      const floors: GalStoryFloor[] = [];
      for (const rawFloor of rawArchive.floors) {
        try {
          const floor = normalizeStoryFloor(rawFloor, actIndex, actId);
          if (seenFloorIds.has(floor.floorId)) throw new Error('剧情楼层 ID 重复');
          seenFloorIds.add(floor.floorId);
          floors.push(floor);
        } catch (error) {
          console.warn(`[ToLove Save] 第 ${actIndex + 1} 幕有一个楼层无效，已跳过。`, error);
        }
      }
      if (floors.length === 0) {
        console.warn(`[ToLove Save] 第 ${actIndex + 1} 幕没有可恢复楼层，已跳过。`);
        continue;
      }
      seenActIndexes.add(actIndex);
      const requestedActiveFloorId = rawArchive.activeFloorId as string | null;
      const activeFloorId = floors.some(
        floor => floor.floorId === requestedActiveFloorId && floor.outcome === 'accepted' && floor.act !== null,
      )
        ? requestedActiveFloorId
        : null;
      if (requestedActiveFloorId !== null && activeFloorId === null) {
        console.warn(`[ToLove Save] 第 ${actIndex + 1} 幕的采用楼层不可播放，已保留候选但取消采用。`);
      }
      archives.push({
        eventId: EPISODE_01_EVENT_ID,
        actIndex,
        actId,
        activeFloorId,
        floors,
      });
    } catch (error) {
      console.warn('[ToLove Save] 有一个剧情幕档案无效，已跳过。', error);
    }
  }
  const acceptedFloorsByAct = new Map<number, Set<string>>();
  const contextSafeArchives: GalStoryActArchive[] = [];
  for (const archive of archives.sort((left, right) => left.actIndex - right.actIndex)) {
    const floors = archive.floors.filter(floor => {
      const contextIsValid =
        floor.contextFloorIds.length === floor.actIndex &&
        floor.contextFloorIds.every((floorId, contextActIndex) =>
          acceptedFloorsByAct.get(contextActIndex)?.has(floorId),
        );
      if (!contextIsValid) {
        console.warn(`[ToLove Save] 第 ${archive.actIndex + 1} 幕有一个楼层引用了无效前文，已跳过。`);
      }
      return contextIsValid;
    });
    if (floors.length === 0) continue;
    const activeFloorId = floors.some(floor => floor.floorId === archive.activeFloorId) ? archive.activeFloorId : null;
    contextSafeArchives.push({ ...archive, activeFloorId, floors });
    acceptedFloorsByAct.set(
      archive.actIndex,
      new Set(floors.filter(floor => floor.outcome === 'accepted').map(floor => floor.floorId)),
    );
  }
  return contextSafeArchives;
}

function createLegacyStoryArchives(
  acts: readonly GalStoryAct[],
  messages: readonly GalStoryMessageSave[],
  snapshot: GameSnapshotV1,
): GalStoryActArchive[] {
  const activeFloorIds: string[] = [];
  return acts.map((act, actIndex) => {
    const acceptedAssistant = [...messages]
      .reverse()
      .find(
        message =>
          !message.is_user &&
          message.extra.actIndex === actIndex &&
          message.extra.role === 'assistant' &&
          message.extra.outcome !== 'parse_error',
      );
    const floorId =
      acceptedAssistant?.extra.floorId ??
      acceptedAssistant?.extra.generationId ??
      `legacy-${EPISODE_01_EVENT_ID}-${act.id}`;
    const generationMessages = acceptedAssistant
      ? messages.filter(
          message =>
            (message.extra.floorId ?? message.extra.generationId) ===
            (acceptedAssistant.extra.floorId ?? acceptedAssistant.extra.generationId),
        )
      : [];
    const source = acceptedAssistant?.extra.source ?? snapshot.game.mainStoryGenerationSource ?? 'tavern';
    const contextFloorIds = [...activeFloorIds];
    const floor: GalStoryFloor = {
      floorId,
      eventId: EPISODE_01_EVENT_ID,
      actIndex,
      actId: act.id,
      source,
      createdAt: acceptedAssistant?.send_date ?? snapshot.savedAt,
      outcome: 'accepted',
      act,
      context: {
        entryReason:
          acceptedAssistant?.extra.entryReason ?? (actIndex === 0 ? 'after_first_action' : 'after_second_action'),
        playerName: acceptedAssistant?.extra.playerName ?? snapshot.player.name,
        day: acceptedAssistant?.extra.day ?? snapshot.game.day,
        period:
          acceptedAssistant?.extra.period ??
          ['morning', 'afterSchool', 'evening'][snapshot.game.periodIndex] ??
          'afterSchool',
        location: acceptedAssistant?.extra.location ?? snapshot.game.currentLocationId,
      },
      contextFloorIds: [...contextFloorIds],
      messageIds: generationMessages.map(message => message.id),
    };
    activeFloorIds.push(floorId);
    return {
      eventId: EPISODE_01_EVENT_ID,
      actIndex,
      actId: act.id,
      activeFloorId: floorId,
      floors: [floor],
    };
  });
}

function projectActiveStoryActs(archives: readonly GalStoryActArchive[]): GalStoryAct[] {
  const acts: GalStoryAct[] = [];
  const sortedArchives = [...archives].sort((left, right) => left.actIndex - right.actIndex);
  for (const archive of sortedArchives) {
    if (archive.actIndex !== acts.length) break;
    const activeFloor = archive.floors.find(floor => floor.floorId === archive.activeFloorId);
    if (!activeFloor?.act) break;
    acts.push(activeFloor.act);
  }
  return acts;
}

export function createGameSnapshot(): GameSnapshotV1 {
  const game = useGameStore.getState();
  const player = usePlayerStore.getState();
  const cards = useCardStore.getState();
  const skillProgression = useSkillStore.getState();

  return cloneJson({
    schemaVersion: 1,
    messageArchiveVersion: 1,
    storyArchiveVersion: 1,
    savedAt: new Date().toISOString(),
    skills: skillProgression.createSnapshot(),
    game: {
      screen: game.screen,
      hasSession: game.hasSession,
      day: game.day,
      date: game.date,
      actionPointsRemaining: game.actionPointsRemaining,
      periodIndex: game.periodIndex,
      currentLocationId: game.currentLocationId,
      currentSceneId: game.currentSceneId,
      isPlaying: game.isPlaying,
      log: game.log,
      events: game.events,
      activeMainStoryEventId: game.activeMainStoryEventId,
      completedMainStoryEventIds: game.completedMainStoryEventIds,
      mainStoryEntryReason: game.mainStoryEntryReason,
      mainStoryActIndex: game.mainStoryActIndex,
      mainStoryPageIndex: game.mainStoryPageIndex,
      mainStoryActs: game.mainStoryActs,
      mainStoryArchives: game.mainStoryArchives,
      mainStoryGenerationSource: game.mainStoryGenerationSource,
    },
    player: {
      name: player.name,
      color: player.color,
      avatar: player.avatar,
      intelligence: player.intelligence,
      athletics: player.athletics,
      art: player.art,
      charm: player.charm,
      stamina: player.stamina,
      stress: player.stress,
      money: player.money,
    },
    cards: {
      targets: cards.targets,
      activeTargetId: cards.activeTargetId,
      loadedCards: cards.loadedCards,
    },
  });
}

export function createSavePreview(snapshot: GameSnapshotV1): SavePreview {
  return {
    playerName: snapshot.player.name,
    day: snapshot.game.day,
    date: snapshot.game.date,
    periodIndex: snapshot.game.periodIndex,
    locationId: snapshot.game.currentLocationId,
    sceneId: snapshot.game.currentSceneId,
  };
}

export function restoreGameSnapshot(value: unknown, archivedMessages?: GalStoryMessageSave[]): GameSnapshotV1 {
  if (!isRecord(value) || value.schemaVersion !== 1) {
    throw new Error('存档版本无效或暂不兼容');
  }

  if (!isRecord(value.game) || !isRecord(value.player) || !isRecord(value.cards)) {
    throw new Error('存档内容不完整');
  }

  const snapshot = cloneJson(value) as unknown as GameSnapshotV1;
  const normalizedSkillsResult =
    snapshot.skills === undefined
      ? { ok: true as const, value: toSkillProgressionSnapshot(INITIAL_SKILL_PROGRESSION_STATE) }
      : validateSkillProgressionSnapshot(skillGraph, snapshot.skills);
  if (!normalizedSkillsResult.ok) {
    throw new Error(normalizedSkillsResult.error.message);
  }
  const normalizedSkills = normalizedSkillsResult.value;
  const date = isCalendarDateValue(snapshot.game.date)
    ? snapshot.game.date
    : getCalendarDateForGameDay(snapshot.game.day);
  const completedMainStoryEventIds = Array.isArray(snapshot.game.completedMainStoryEventIds)
    ? [...new Set(snapshot.game.completedMainStoryEventIds.filter((id): id is string => typeof id === 'string'))]
    : [];
  const activeMainStoryEventId =
    snapshot.game.activeMainStoryEventId === EPISODE_01_EVENT_ID &&
    !completedMainStoryEventIds.includes(EPISODE_01_EVENT_ID)
      ? EPISODE_01_EVENT_ID
      : null;
  let mainStoryActs: GalStoryAct[] = [];
  if (Array.isArray(snapshot.game.mainStoryActs) && snapshot.game.mainStoryActs.length > 0) {
    try {
      mainStoryActs = normalizeGalStoryActs(snapshot.game.mainStoryActs, {
        expectedActIds: EPISODE_01_ACT_IDS,
        allowPartial: true,
      });
    } catch (error) {
      console.warn('[ToLove Save] 存档中的生成正文无效，将重新请求当前第一集。', error);
    }
  }
  let mainStoryMessages: GalStoryMessageSave[] = archivedMessages ? cloneJson(archivedMessages) : [];
  if (!archivedMessages && snapshot.game.mainStoryMessages !== undefined) {
    try {
      mainStoryMessages = normalizeStoryMessages(snapshot.game.mainStoryMessages);
    } catch (error) {
      console.warn('[ToLove Save] 旧存档中的剧情消息无效，将只恢复可播放正文。', error);
    }
  }
  let mainStoryArchives: GalStoryActArchive[] = [];
  let shouldProjectStoryArchives = false;
  if (Array.isArray(snapshot.game.mainStoryArchives)) {
    try {
      mainStoryArchives = normalizeStoryArchives(snapshot.game.mainStoryArchives);
      shouldProjectStoryArchives =
        snapshot.storyArchiveVersion === 1 || mainStoryArchives.length > 0 || mainStoryActs.length === 0;
    } catch (error) {
      console.warn('[ToLove Save] 剧情楼层档案无效，将从已采用正文重建。', error);
    }
  }
  if (!shouldProjectStoryArchives && mainStoryActs.length > 0) {
    mainStoryArchives = createLegacyStoryArchives(mainStoryActs, mainStoryMessages, snapshot);
    shouldProjectStoryArchives = true;
  }
  if (shouldProjectStoryArchives) mainStoryActs = projectActiveStoryActs(mainStoryArchives);

  const mainStoryEntryReason =
    activeMainStoryEventId &&
    (snapshot.game.mainStoryEntryReason === 'after_first_action' ||
      snapshot.game.mainStoryEntryReason === 'after_second_action')
      ? snapshot.game.mainStoryEntryReason
      : activeMainStoryEventId
        ? 'after_first_action'
        : null;
  const maxRestorableActIndex = Math.min(EPISODE_01_ACT_IDS.length - 1, mainStoryActs.length);
  const mainStoryActIndex = completedMainStoryEventIds.includes(EPISODE_01_EVENT_ID)
    ? 0
    : activeMainStoryEventId && typeof snapshot.game.mainStoryActIndex === 'number'
      ? Math.min(maxRestorableActIndex, Math.max(0, Math.trunc(snapshot.game.mainStoryActIndex)))
      : maxRestorableActIndex;
  const currentStoryAct = mainStoryActs[mainStoryActIndex];
  const mainStoryPageIndex =
    currentStoryAct && typeof snapshot.game.mainStoryPageIndex === 'number'
      ? Math.min(currentStoryAct.beats.length - 1, Math.max(0, Math.trunc(snapshot.game.mainStoryPageIndex)))
      : 0;
  const currentArchive = mainStoryArchives.find(archive => archive.actIndex === mainStoryActIndex);
  const currentFloor = currentArchive?.floors.find(floor => floor.floorId === currentArchive.activeFloorId);
  const mainStoryGenerationSource =
    currentFloor?.source ??
    (mainStoryActs.length > 0 &&
    (snapshot.game.mainStoryGenerationSource === 'tavern' || snapshot.game.mainStoryGenerationSource === 'fallback')
      ? snapshot.game.mainStoryGenerationSource
      : null);
  const restoredSnapshot: GameSnapshotV1 = {
    ...snapshot,
    skills: normalizedSkills,
    game: {
      ...snapshot.game,
      date,
      actionPointsRemaining:
        typeof snapshot.game.actionPointsRemaining === 'number'
          ? Math.min(2, Math.max(0, Math.trunc(snapshot.game.actionPointsRemaining)))
          : 2,
      activeMainStoryEventId,
      completedMainStoryEventIds,
      mainStoryEntryReason,
      mainStoryActIndex,
      mainStoryPageIndex,
      mainStoryActs,
      mainStoryArchives,
      mainStoryMessages,
      mainStoryGenerationStatus: activeMainStoryEventId && currentStoryAct ? 'ready' : 'idle',
      mainStoryGenerationSource,
      mainStoryGenerationError: null,
    },
  };

  useGameStore.setState({ ...restoredSnapshot.game, date });
  useGameStore.getState().reconcilePendingMainStoryEntry();
  usePlayerStore.setState({ ...snapshot.player });
  useCardStore.setState({
    ...snapshot.cards,
    isLoading: false,
    error: null,
  });
  const skillHydration = useSkillStore.getState().hydrate(normalizedSkills);
  if (!skillHydration.ok) throw new Error(skillHydration.error.message);
  syncCharacterPresence();

  // Old saves predate newer bundled characters (e.g. haruna); top up any that
  // are missing instead of letting the snapshot permanently hide them.
  void syncDefaultCards();

  return restoredSnapshot;
}
