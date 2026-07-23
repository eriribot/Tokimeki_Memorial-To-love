import { useCardStore } from '../stores/cardStore';
import { useGameStore } from '../stores/gameStore';
import { usePlayerStore } from '../stores/playerStore';
import { useSkillStore } from '../skilllogic';
import { captureGameMessages, gameMessageApi } from '../message';
import { saveClient } from './client';
import { DEFAULT_SAVE_SLOT, type SaveRecord } from './protocol';
import { createGameSnapshot, createSavePreview, type GameSnapshot } from './snapshot';
import { createSaveUuid } from './uuid';

const DEFAULT_AUTOSAVE_DELAY_MS = 600;

interface TavernAutosaveOptions {
  delayMs?: number;
  onSaved?: (save: SaveRecord<GameSnapshot>, messages: ReturnType<typeof captureGameMessages>) => void;
  onError?: (error: Error) => void;
}

interface TavernAutosaveRuntime {
  pause: () => Promise<string | null>;
  resume: (fingerprint: string | null) => void;
  invalidatePersistedFingerprint: () => void;
}

let activeAutosaveRuntime: TavernAutosaveRuntime | null = null;
let autosaveSaveUuid: string | undefined;
let autosaveIdentityGeneration = 0;

export function beginNewTavernAutosaveIdentity(): string {
  const saveUuid = createSaveUuid();
  autosaveSaveUuid = saveUuid;
  autosaveIdentityGeneration += 1;
  activeAutosaveRuntime?.invalidatePersistedFingerprint();
  return saveUuid;
}

export function getTavernAutosaveIdentityGeneration(): number {
  return autosaveIdentityGeneration;
}

export function getTavernAutosaveSaveUuid(): string | undefined {
  return autosaveSaveUuid;
}

export function adoptTavernAutosaveIdentity(saveUuid: string | null, expectedGeneration?: number): boolean {
  if (expectedGeneration !== undefined && expectedGeneration !== autosaveIdentityGeneration) return false;
  autosaveSaveUuid = saveUuid?.trim() || undefined;
  autosaveIdentityGeneration += 1;
  activeAutosaveRuntime?.invalidatePersistedFingerprint();
  return true;
}

function toError(value: unknown): Error {
  return value instanceof Error ? value : new Error(String(value));
}

function canAutosave(): boolean {
  const game = useGameStore.getState();
  return game.hasSession && game.screen === 'game';
}

function createAutosaveFingerprint(snapshot: GameSnapshot, messages: ReturnType<typeof captureGameMessages>): string {
  return JSON.stringify({
    snapshot: {
      ...snapshot,
      savedAt: '',
      game: {
        ...snapshot.game,
        // GAL 翻页只改变本地阅读位置，不值得反复上传两份酒馆文件。
        mainStory: {
          ...snapshot.game.mainStory,
          run: snapshot.game.mainStory.run ? { ...snapshot.game.mainStory.run, pageIndex: 0 } : null,
        },
      },
    },
    messages,
  });
}

export async function withTavernAutosavePaused<T>(
  operation: () => Promise<T>,
  shouldAdoptFingerprintOnError: () => boolean = () => false,
  shouldAdoptFingerprintOnSuccess: (result: T) => boolean = () => true,
): Promise<T> {
  const runtime = activeAutosaveRuntime;
  if (!runtime) return operation();

  const fingerprint = await runtime.pause();
  let completedResult: { value: T } | null = null;
  try {
    const result = await operation();
    completedResult = { value: result };
    return result;
  } finally {
    const adoptSuccessfulFingerprint =
      completedResult !== null && shouldAdoptFingerprintOnSuccess(completedResult.value);
    runtime.resume(adoptSuccessfulFingerprint || shouldAdoptFingerprintOnError() ? fingerprint : null);
  }
}

export function startTavernAutosave(options: TavernAutosaveOptions = {}): () => void {
  const delayMs = Math.max(0, options.delayMs ?? DEFAULT_AUTOSAVE_DELAY_MS);
  let timer: ReturnType<typeof setTimeout> | null = null;
  let dirty = false;
  let writing = false;
  let disposed = false;
  let suspended = false;
  let currentWrite: Promise<void> | null = null;
  let pendingFingerprint: string | null = null;
  let persistedFingerprint: string | null = null;

  const persist = async () => {
    timer = null;
    if (disposed || suspended || !dirty || !canAutosave()) {
      dirty = false;
      return;
    }
    if (writing) return;

    const snapshot = createGameSnapshot();
    const messages = captureGameMessages();
    const fingerprint = createAutosaveFingerprint(snapshot, messages);
    if (fingerprint === persistedFingerprint) {
      dirty = false;
      pendingFingerprint = null;
      return;
    }

    dirty = false;
    pendingFingerprint = null;
    writing = true;
    const requestedSaveUuid = autosaveSaveUuid;
    const writeIdentityGeneration = autosaveIdentityGeneration;
    const write = (async () => {
      try {
        const { save } = await saveClient.write(
          DEFAULT_SAVE_SLOT,
          snapshot,
          requestedSaveUuid,
          createSavePreview(snapshot),
        );
        await gameMessageApi.saveFor(save, messages);
        if (autosaveIdentityGeneration === writeIdentityGeneration) {
          persistedFingerprint = fingerprint;
          autosaveSaveUuid = save.saveUuid;
          options.onSaved?.(save, messages);
        }
      } catch (error) {
        options.onError?.(toError(error));
      } finally {
        writing = false;
        if (dirty && !disposed && !suspended) schedule();
      }
    })();
    currentWrite = write;
    try {
      await write;
    } finally {
      if (currentWrite === write) currentWrite = null;
    }
  };

  const schedule = () => {
    if (suspended || !canAutosave()) return;
    const snapshot = createGameSnapshot();
    const messages = captureGameMessages();
    const fingerprint = createAutosaveFingerprint(snapshot, messages);
    if (fingerprint === persistedFingerprint || (fingerprint === pendingFingerprint && timer !== null)) return;
    pendingFingerprint = fingerprint;
    dirty = true;
    if (timer !== null) clearTimeout(timer);
    timer = setTimeout(() => void persist(), delayMs);
  };

  const flush = () => {
    if (suspended || !canAutosave()) return;
    const snapshot = createGameSnapshot();
    const messages = captureGameMessages();
    const fingerprint = createAutosaveFingerprint(snapshot, messages);
    if (fingerprint === persistedFingerprint) return;
    pendingFingerprint = fingerprint;
    dirty = true;
    if (timer !== null) {
      clearTimeout(timer);
      timer = null;
    }
    void persist();
  };

  const runtime: TavernAutosaveRuntime = {
    pause: async () => {
      const fingerprint = canAutosave()
        ? createAutosaveFingerprint(createGameSnapshot(), captureGameMessages())
        : null;
      suspended = true;
      dirty = false;
      pendingFingerprint = null;
      if (timer !== null) {
        clearTimeout(timer);
        timer = null;
      }
      await currentWrite;
      return disposed ? null : fingerprint;
    },
    resume: fingerprint => {
      if (disposed) return;
      if (fingerprint !== null) persistedFingerprint = fingerprint;
      suspended = false;
      schedule();
    },
    invalidatePersistedFingerprint: () => {
      persistedFingerprint = null;
      pendingFingerprint = null;
    },
  };
  activeAutosaveRuntime = runtime;

  const unsubscribers = [
    useGameStore.subscribe(schedule),
    usePlayerStore.subscribe(schedule),
    useCardStore.subscribe(schedule),
    useSkillStore.subscribe(schedule),
  ];
  globalThis.addEventListener('pagehide', flush);
  schedule();

  return () => {
    disposed = true;
    suspended = true;
    if (timer !== null) clearTimeout(timer);
    globalThis.removeEventListener('pagehide', flush);
    unsubscribers.forEach(unsubscribe => unsubscribe());
    if (activeAutosaveRuntime === runtime) activeAutosaveRuntime = null;
  };
}
