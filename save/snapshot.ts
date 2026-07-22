import { isCalendarDateValue } from '../CalendarModule/date';
import {
  createMainStorySaveState,
  restoreMainStoryState,
  type MainStorySaveState,
} from '../GalMainStory/storyPersistence';
import type { GalStoryMessageSave } from '../GalMainStory/storyTypes';
import { syncCharacterPresence } from '../services/characterPresence';
import {
  INITIAL_SKILL_PROGRESSION_STATE,
  skillGraph,
  toSkillProgressionSnapshot,
  useSkillStore,
  validateSkillProgressionSnapshot,
  type SkillProgressionSnapshot,
} from '../skilllogic';
import { useCardStore } from '../stores/cardStore';
import { syncDefaultCards } from '../stores/characterStore';
import { useGameStore } from '../stores/gameStore';
import { usePlayerStore } from '../stores/playerStore';
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

export const GAME_SNAPSHOT_SCHEMA_VERSION = 2 as const;

export interface GameSnapshot {
  schemaVersion: typeof GAME_SNAPSHOT_SCHEMA_VERSION;
  savedAt: string;
  skills: SkillProgressionSnapshot;
  game: {
    screen: GameScreen;
    hasSession: boolean;
    day: number;
    date: CalendarDateValue;
    actionPointsRemaining: number;
    periodIndex: number;
    currentLocationId: LocationId;
    currentSceneId: LocationId | null;
    isPlaying: boolean;
    log: string[];
    events: GameEvent[];
    mainStory: MainStorySaveState;
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

function assertSnapshotShape(value: unknown): asserts value is GameSnapshot {
  if (!isRecord(value) || value.schemaVersion !== GAME_SNAPSHOT_SCHEMA_VERSION) {
    throw new Error('存档版本无效；开发阶段旧存档不再兼容，请新开档。');
  }
  if (!isRecord(value.game) || !isRecord(value.player) || !isRecord(value.cards)) {
    throw new Error('存档内容不完整');
  }
  const game = value.game;
  if (
    (game.screen !== 'start' && game.screen !== 'game') ||
    typeof game.hasSession !== 'boolean' ||
    typeof game.day !== 'number' ||
    !Number.isFinite(game.day) ||
    !isCalendarDateValue(game.date) ||
    typeof game.actionPointsRemaining !== 'number' ||
    !Number.isFinite(game.actionPointsRemaining) ||
    typeof game.periodIndex !== 'number' ||
    !Number.isFinite(game.periodIndex) ||
    typeof game.currentLocationId !== 'string' ||
    (game.currentSceneId !== null && typeof game.currentSceneId !== 'string') ||
    typeof game.isPlaying !== 'boolean' ||
    !Array.isArray(game.log) ||
    !game.log.every(item => typeof item === 'string') ||
    !Array.isArray(game.events) ||
    !isRecord(game.mainStory) ||
    !Array.isArray(value.cards.targets) ||
    !Array.isArray(value.cards.loadedCards) ||
    (value.cards.activeTargetId !== null && typeof value.cards.activeTargetId !== 'string')
  ) {
    throw new Error('存档字段格式无效');
  }
}

export function createGameSnapshot(): GameSnapshot {
  const game = useGameStore.getState();
  const player = usePlayerStore.getState();
  const cards = useCardStore.getState();
  const skillProgression = useSkillStore.getState();

  return cloneJson({
    schemaVersion: GAME_SNAPSHOT_SCHEMA_VERSION,
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
      mainStory: createMainStorySaveState(game.mainStory),
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

export function createSavePreview(snapshot: GameSnapshot): SavePreview {
  return {
    playerName: snapshot.player.name,
    day: snapshot.game.day,
    date: snapshot.game.date,
    periodIndex: snapshot.game.periodIndex,
    locationId: snapshot.game.currentLocationId,
    sceneId: snapshot.game.currentSceneId,
  };
}

export function restoreGameSnapshot(
  value: unknown,
  archivedMessages: readonly GalStoryMessageSave[] = [],
): GameSnapshot {
  assertSnapshotShape(value);
  const snapshot = cloneJson(value);
  const normalizedSkillsResult = validateSkillProgressionSnapshot(
    skillGraph,
    snapshot.skills ?? toSkillProgressionSnapshot(INITIAL_SKILL_PROGRESSION_STATE),
  );
  if (!normalizedSkillsResult.ok) throw new Error(normalizedSkillsResult.error.message);
  const normalizedSkills = normalizedSkillsResult.value;
  const mainStory = restoreMainStoryState(snapshot.game.mainStory, archivedMessages);
  const game = {
    ...snapshot.game,
    day: Math.max(1, Math.trunc(snapshot.game.day)),
    actionPointsRemaining: Math.min(2, Math.max(0, Math.trunc(snapshot.game.actionPointsRemaining))),
    periodIndex: Math.min(2, Math.max(0, Math.trunc(snapshot.game.periodIndex))),
    mainStory,
  };

  useGameStore.setState(game);
  useGameStore.getState().reconcilePendingMainStoryEntry();
  usePlayerStore.setState({ ...snapshot.player });
  useCardStore.setState({ ...snapshot.cards, isLoading: false, error: null });
  const skillHydration = useSkillStore.getState().hydrate(normalizedSkills);
  if (!skillHydration.ok) throw new Error(skillHydration.error.message);
  syncCharacterPresence();
  void syncDefaultCards();

  const restored = createGameSnapshot();
  return {
    ...restored,
    savedAt: snapshot.savedAt,
  };
}
