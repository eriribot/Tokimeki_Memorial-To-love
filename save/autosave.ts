import { useCardStore } from '../stores/cardStore';
import { useGameStore } from '../stores/gameStore';
import { usePlayerStore } from '../stores/playerStore';
import { captureGameMessages, gameMessageApi } from '../message';
import { saveClient } from './client';
import { DEFAULT_SAVE_SLOT, type SaveRecord } from './protocol';
import { createGameSnapshot, createSavePreview, type GameSnapshotV1 } from './snapshot';

const DEFAULT_AUTOSAVE_DELAY_MS = 600;

interface TavernAutosaveOptions {
  delayMs?: number;
  onSaved?: (save: SaveRecord<GameSnapshotV1>) => void;
  onError?: (error: Error) => void;
}

function toError(value: unknown): Error {
  return value instanceof Error ? value : new Error(String(value));
}

function canAutosave(): boolean {
  const game = useGameStore.getState();
  return game.hasSession && game.screen === 'game';
}

export function startTavernAutosave(options: TavernAutosaveOptions = {}): () => void {
  const delayMs = Math.max(0, options.delayMs ?? DEFAULT_AUTOSAVE_DELAY_MS);
  let timer: ReturnType<typeof setTimeout> | null = null;
  let dirty = false;
  let writing = false;
  let disposed = false;

  const persist = async () => {
    timer = null;
    if (disposed || !dirty || !canAutosave()) {
      dirty = false;
      return;
    }
    if (writing) return;

    dirty = false;
    writing = true;
    try {
      const snapshot = createGameSnapshot();
      const messages = captureGameMessages();
      const { save } = await saveClient.write(DEFAULT_SAVE_SLOT, snapshot, undefined, createSavePreview(snapshot));
      await gameMessageApi.saveFor(save, messages);
      options.onSaved?.(save);
    } catch (error) {
      options.onError?.(toError(error));
    } finally {
      writing = false;
      if (dirty && !disposed) schedule();
    }
  };

  const schedule = () => {
    if (!canAutosave()) return;
    dirty = true;
    if (timer !== null) clearTimeout(timer);
    timer = setTimeout(() => void persist(), delayMs);
  };

  const flush = () => {
    if (!canAutosave()) return;
    dirty = true;
    if (timer !== null) {
      clearTimeout(timer);
      timer = null;
    }
    void persist();
  };

  const unsubscribers = [
    useGameStore.subscribe(schedule),
    usePlayerStore.subscribe(schedule),
    useCardStore.subscribe(schedule),
  ];
  globalThis.addEventListener('pagehide', flush);

  return () => {
    disposed = true;
    if (timer !== null) clearTimeout(timer);
    globalThis.removeEventListener('pagehide', flush);
    unsubscribers.forEach(unsubscribe => unsubscribe());
  };
}
