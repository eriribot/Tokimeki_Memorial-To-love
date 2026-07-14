import {
  createEmptySaveRoot,
  SAVE_SCHEMA_VERSION,
  type SaveDeleteResult,
  type SaveListResult,
  type SaveLoadResult,
  type SaveProbeResult,
  type SavePreview,
  type SaveRecord,
  type SaveRoot,
  type SaveWriteResult,
  toSaveSummary,
} from './protocol';
import { createSaveUuid, getUuidMode } from './uuid';

const BROWSER_STORAGE_KEY = 'tolove.save.v1';

function cloneJson<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function normalizeRoot(value: unknown): SaveRoot {
  if (!isRecord(value) || value.schemaVersion !== SAVE_SCHEMA_VERSION) {
    return createEmptySaveRoot();
  }

  return {
    schemaVersion: SAVE_SCHEMA_VERSION,
    slots: isRecord(value.slots) ? (value.slots as Record<string, string>) : {},
    saves: isRecord(value.saves) ? (value.saves as Record<string, SaveRecord>) : {},
  };
}

function readRoot(): SaveRoot {
  const raw = globalThis.localStorage.getItem(BROWSER_STORAGE_KEY);
  return raw ? normalizeRoot(JSON.parse(raw)) : createEmptySaveRoot();
}

function writeRoot(root: SaveRoot): void {
  globalThis.localStorage.setItem(BROWSER_STORAGE_KEY, JSON.stringify(root));
}

function resolveSaveUuid(root: SaveRoot, slotId?: string, saveUuid?: string): string | null {
  if (saveUuid && root.saves[saveUuid]) {
    return saveUuid;
  }

  if (slotId && root.slots[slotId]) {
    return root.slots[slotId];
  }

  return null;
}

export class BrowserSaveStore {
  probe(): SaveProbeResult {
    const probeKey = `${BROWSER_STORAGE_KEY}.probe`;
    let persistent: boolean;

    try {
      globalThis.localStorage.setItem(probeKey, '1');
      persistent = globalThis.localStorage.getItem(probeKey) === '1';
      globalThis.localStorage.removeItem(probeKey);
    } catch {
      persistent = false;
    }

    let saveCount = 0;
    if (persistent) {
      try {
        saveCount = Object.keys(readRoot().saves).length;
      } catch {
        saveCount = 0;
      }
    }

    return {
      backend: 'browser-local',
      persistent,
      sharedAcrossDevices: false,
      chatId: null,
      storagePath: null,
      saveCount,
      shujukuAvailable: false,
      uuidMode: getUuidMode(),
    };
  }

  list(): SaveListResult {
    const root = readRoot();
    const saves = Object.values(root.saves)
      .map(toSaveSummary)
      .sort((left, right) => right.updatedAt.localeCompare(left.updatedAt));
    return { saves };
  }

  write<TData>(slotId: string, data: TData, requestedUuid?: string, preview?: SavePreview): SaveWriteResult<TData> {
    const root = readRoot();
    const saveUuid = requestedUuid || root.slots[slotId] || createSaveUuid();
    const existing = root.saves[saveUuid];
    const now = new Date().toISOString();
    const save: SaveRecord<TData> = {
      schemaVersion: SAVE_SCHEMA_VERSION,
      saveUuid,
      slotId,
      chatId: null,
      createdAt: existing?.createdAt ?? now,
      updatedAt: now,
      revision: (existing?.revision ?? 0) + 1,
      preview: preview ? cloneJson(preview) : existing?.preview,
      data: cloneJson(data),
    };

    root.slots[slotId] = saveUuid;
    root.saves[saveUuid] = save;
    writeRoot(root);
    return { save };
  }

  load<TData>(slotId?: string, saveUuid?: string): SaveLoadResult<TData> {
    const root = readRoot();
    const resolvedUuid = resolveSaveUuid(root, slotId, saveUuid);
    const save = resolvedUuid ? root.saves[resolvedUuid] : null;
    return { save: save ? (cloneJson(save) as SaveRecord<TData>) : null };
  }

  delete(slotId?: string, saveUuid?: string): SaveDeleteResult {
    const root = readRoot();
    const resolvedUuid = resolveSaveUuid(root, slotId, saveUuid);
    if (!resolvedUuid) {
      return { deleted: false, saveUuid: null };
    }

    delete root.saves[resolvedUuid];
    for (const [mappedSlot, mappedUuid] of Object.entries(root.slots)) {
      if (mappedUuid === resolvedUuid) {
        delete root.slots[mappedSlot];
      }
    }
    writeRoot(root);
    return { deleted: true, saveUuid: resolvedUuid };
  }
}
