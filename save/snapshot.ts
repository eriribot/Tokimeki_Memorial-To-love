import { useCardStore } from '../stores/cardStore';
import { useGameStore } from '../stores/gameStore';
import { usePlayerStore } from '../stores/playerStore';
import { getCalendarDateForGameDay, isCalendarDateValue } from '../CalendarModule/date';
import {
  LALA_ARRIVAL_ACT_IDS,
  LALA_ARRIVAL_ALLOWED_SPEAKERS,
  LALA_ARRIVAL_EVENT_ID,
} from '../GalMainStory/lalaArrival';
import {
  normalizeGalStoryActs,
  type GalStoryAct,
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

export interface GameSnapshotV1 {
  schemaVersion: 1;
  messageArchiveVersion?: 1;
  savedAt: string;
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

export function createGameSnapshot(): GameSnapshotV1 {
  const game = useGameStore.getState();
  const player = usePlayerStore.getState();
  const cards = useCardStore.getState();

  return cloneJson({
    schemaVersion: 1,
    messageArchiveVersion: 1,
    savedAt: new Date().toISOString(),
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
  const date = isCalendarDateValue(snapshot.game.date)
    ? snapshot.game.date
    : getCalendarDateForGameDay(snapshot.game.day);
  const completedMainStoryEventIds = Array.isArray(snapshot.game.completedMainStoryEventIds)
    ? [...new Set(snapshot.game.completedMainStoryEventIds.filter((id): id is string => typeof id === 'string'))]
    : [];
  const activeMainStoryEventId =
    snapshot.game.activeMainStoryEventId === LALA_ARRIVAL_EVENT_ID &&
    !completedMainStoryEventIds.includes(LALA_ARRIVAL_EVENT_ID)
      ? LALA_ARRIVAL_EVENT_ID
      : null;
  let mainStoryActs: GalStoryAct[] = [];
  if (activeMainStoryEventId && Array.isArray(snapshot.game.mainStoryActs) && snapshot.game.mainStoryActs.length > 0) {
    try {
      mainStoryActs = normalizeGalStoryActs(snapshot.game.mainStoryActs, {
        expectedActIds: LALA_ARRIVAL_ACT_IDS,
        allowedSpeakers: LALA_ARRIVAL_ALLOWED_SPEAKERS,
        allowPartial: true,
      });
    } catch (error) {
      console.warn('[ToLove Save] 存档中的生成正文无效，将重新请求当前第一集。', error);
    }
  }
  const mainStoryEntryReason =
    activeMainStoryEventId &&
    (snapshot.game.mainStoryEntryReason === 'after_first_action' ||
      snapshot.game.mainStoryEntryReason === 'after_second_action')
      ? snapshot.game.mainStoryEntryReason
      : activeMainStoryEventId
        ? 'after_first_action'
        : null;
  const maxRestorableActIndex = Math.min(LALA_ARRIVAL_ACT_IDS.length - 1, mainStoryActs.length);
  const mainStoryActIndex =
    activeMainStoryEventId && typeof snapshot.game.mainStoryActIndex === 'number'
      ? Math.min(maxRestorableActIndex, Math.max(0, Math.trunc(snapshot.game.mainStoryActIndex)))
      : 0;
  const currentStoryAct = mainStoryActs[mainStoryActIndex];
  const mainStoryPageIndex =
    currentStoryAct && typeof snapshot.game.mainStoryPageIndex === 'number'
      ? Math.min(currentStoryAct.beats.length - 1, Math.max(0, Math.trunc(snapshot.game.mainStoryPageIndex)))
      : 0;
  const mainStoryMessages = archivedMessages
    ? cloneJson(archivedMessages)
    : Array.isArray(snapshot.game.mainStoryMessages)
      ? (snapshot.game.mainStoryMessages as GalStoryMessageSave[])
      : [];
  const mainStoryGenerationSource =
    mainStoryActs.length > 0 &&
    (snapshot.game.mainStoryGenerationSource === 'tavern' || snapshot.game.mainStoryGenerationSource === 'fallback')
      ? snapshot.game.mainStoryGenerationSource
      : null;
  const restoredSnapshot: GameSnapshotV1 = {
    ...snapshot,
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
      mainStoryMessages,
      mainStoryGenerationStatus: currentStoryAct ? 'ready' : 'idle',
      mainStoryGenerationSource,
      mainStoryGenerationError: null,
    },
  };

  useGameStore.setState({ ...restoredSnapshot.game, date });
  usePlayerStore.setState({ ...snapshot.player });
  useCardStore.setState({
    ...snapshot.cards,
    isLoading: false,
    error: null,
  });

  return restoredSnapshot;
}
