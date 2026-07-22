import { saveClient } from './client';
import { DEFAULT_SAVE_SLOT, type SaveRecord } from './protocol';
import { createGameSnapshot, createSavePreview, restoreGameSnapshot, type GameSnapshot } from './snapshot';
import { captureGameMessages, gameMessageApi } from '../message';
import { withTavernAutosavePaused } from './autosave';

export * from './client';
export * from './autosave';
export * from './protocol';
export * from './snapshot';
export * from './uuid';

export const gameSaveApi = {
  probe: async (force = false) => {
    const [saveProbe, messageProbe] = await Promise.all([saveClient.probe(force), gameMessageApi.probe()]);
    return {
      ...saveProbe,
      storagePath: `${saveProbe.storagePath}; ${messageProbe.storagePath}`,
    };
  },
  list: () => saveClient.list(),
  save: async (slotId = DEFAULT_SAVE_SLOT, saveUuid?: string) => {
    const snapshot = createGameSnapshot();
    const messages = captureGameMessages();
    const result = await saveClient.write(slotId, snapshot, saveUuid, createSavePreview(snapshot));
    await gameMessageApi.saveFor(result.save, messages);
    return result;
  },
  load: async (slotId = DEFAULT_SAVE_SLOT, saveUuid?: string): Promise<SaveRecord<GameSnapshot>> => {
    const { save } = await saveClient.load<GameSnapshot>(slotId, saveUuid);
    if (!save) {
      throw new Error(`没有找到存档：${saveUuid ?? slotId}`);
    }
    const archive = await gameMessageApi.loadFor(save, true);
    if (!archive) {
      throw new Error(`存档 ${save.slotId} 缺少对应的对话档`);
    }
    restoreGameSnapshot(save.data, archive?.messages);
    return save;
  },
  delete: async (slotId = DEFAULT_SAVE_SLOT, saveUuid?: string) => {
    let mainSaveDeleted = false;
    const deleteFiles = async () => {
      const result = await saveClient.delete(slotId, saveUuid);
      mainSaveDeleted = result.deleted;
      await gameMessageApi.deleteFor(slotId, result.saveUuid ?? saveUuid);
      return result;
    };
    return slotId === DEFAULT_SAVE_SLOT ? withTavernAutosavePaused(deleteFiles, () => mainSaveDeleted) : deleteFiles();
  },
  resetBackend: () => {
    saveClient.resetBackend();
    gameMessageApi.dispose();
  },
};
