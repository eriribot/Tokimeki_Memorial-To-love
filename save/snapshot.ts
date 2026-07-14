import { useCardStore } from '../stores/cardStore';
import { useGameStore } from '../stores/gameStore';
import { usePlayerStore } from '../stores/playerStore';
import type { SavePreview } from './protocol';

export interface GameSnapshotV1 {
  schemaVersion: 1;
  savedAt: string;
  game: {
    screen: string;
    hasSession: boolean;
    day: number;
    periodIndex: number;
    currentLocationId: string;
    currentSceneId: string | null;
    isPlaying: boolean;
    log: unknown[];
    events: unknown[];
  };
  player: {
    name: string;
    color: string;
    avatar: string;
    intelligence: number;
    athletics: number;
    art: number;
    charm: number;
    stamina: number;
    stress: number;
    money: number;
  };
  cards: {
    targets: unknown[];
    activeTargetId: string | null;
    loadedCards: unknown[];
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
    savedAt: new Date().toISOString(),
    game: {
      screen: game.screen,
      hasSession: game.hasSession,
      day: game.day,
      periodIndex: game.periodIndex,
      currentLocationId: game.currentLocationId,
      currentSceneId: game.currentSceneId,
      isPlaying: game.isPlaying,
      log: game.log,
      events: game.events,
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
    periodIndex: snapshot.game.periodIndex,
    locationId: snapshot.game.currentLocationId,
    sceneId: snapshot.game.currentSceneId,
  };
}

export function restoreGameSnapshot(value: unknown): GameSnapshotV1 {
  if (!isRecord(value) || value.schemaVersion !== 1) {
    throw new Error('存档版本无效或暂不兼容');
  }

  if (!isRecord(value.game) || !isRecord(value.player) || !isRecord(value.cards)) {
    throw new Error('存档内容不完整');
  }

  const snapshot = cloneJson(value) as unknown as GameSnapshotV1;
  useGameStore.setState({ ...snapshot.game });
  usePlayerStore.setState({ ...snapshot.player });
  useCardStore.setState({
    ...snapshot.cards,
    isLoading: false,
    error: null,
  });

  return snapshot;
}
