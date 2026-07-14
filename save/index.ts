import { saveClient } from './client';
import { DEFAULT_SAVE_SLOT, type SaveRecord } from './protocol';
import { createGameSnapshot, createSavePreview, restoreGameSnapshot, type GameSnapshotV1 } from './snapshot';

export * from './client';
export * from './protocol';
export * from './snapshot';
export * from './uuid';

export const gameSaveApi = {
  probe: (force = false) => saveClient.probe(force),
  list: () => saveClient.list(),
  save: (slotId = DEFAULT_SAVE_SLOT, saveUuid?: string) => {
    const snapshot = createGameSnapshot();
    return saveClient.write(slotId, snapshot, saveUuid, createSavePreview(snapshot));
  },
  load: async (slotId = DEFAULT_SAVE_SLOT, saveUuid?: string): Promise<SaveRecord<GameSnapshotV1>> => {
    const { save } = await saveClient.load<GameSnapshotV1>(slotId, saveUuid);
    if (!save) {
      throw new Error(`没有找到存档：${saveUuid ?? slotId}`);
    }
    restoreGameSnapshot(save.data);
    return save;
  },
  delete: (slotId = DEFAULT_SAVE_SLOT, saveUuid?: string) => saveClient.delete(slotId, saveUuid),
  resetBackend: () => saveClient.resetBackend(),
};
