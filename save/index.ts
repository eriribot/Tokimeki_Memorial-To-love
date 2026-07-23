import { saveClient } from './client';
import { DEFAULT_SAVE_SLOT, type SaveRecord } from './protocol';
import { createGameSnapshot, createSavePreview, restoreGameSnapshot, type GameSnapshot } from './snapshot';
import { captureGameMessages, gameMessageApi } from '../message';
import {
  adoptTavernAutosaveIdentity,
  getTavernAutosaveIdentityGeneration,
  getTavernAutosaveSaveUuid,
  withTavernAutosavePaused,
} from './autosave';

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
    const identityGeneration = getTavernAutosaveIdentityGeneration();
    const targetSaveUuid = slotId === DEFAULT_SAVE_SLOT ? getTavernAutosaveSaveUuid() ?? saveUuid : saveUuid;
    let identityAdopted = slotId !== DEFAULT_SAVE_SLOT;
    const snapshot = createGameSnapshot();
    const messages = captureGameMessages();
    const saveFiles = async () => {
      const result = await saveClient.write(slotId, snapshot, targetSaveUuid, createSavePreview(snapshot));
      await gameMessageApi.saveFor(result.save, messages);
      if (slotId === DEFAULT_SAVE_SLOT) {
        identityAdopted = adoptTavernAutosaveIdentity(result.save.saveUuid, identityGeneration);
      }
      return result;
    };
    return slotId === DEFAULT_SAVE_SLOT
      ? withTavernAutosavePaused(saveFiles, () => false, () => identityAdopted)
      : saveFiles();
  },
  load: async (slotId = DEFAULT_SAVE_SLOT, saveUuid?: string): Promise<SaveRecord<GameSnapshot>> => {
    const identityGeneration = getTavernAutosaveIdentityGeneration();
    const loadFiles = async () => {
      const { save } = await saveClient.load<GameSnapshot>(slotId, saveUuid);
      if (!save) {
        throw new Error(`没有找到存档：${saveUuid ?? slotId}`);
      }
      const archive = await gameMessageApi.loadFor(save, true);
      if (!archive) {
        throw new Error(`存档 ${save.slotId} 缺少对应的对话档`);
      }
      if (getTavernAutosaveIdentityGeneration() !== identityGeneration) {
        throw new Error('载入期间当前游戏会话已经变化，旧存档响应已丢弃。');
      }
      restoreGameSnapshot(save.data, archive.messages);
      adoptTavernAutosaveIdentity(save.saveUuid, identityGeneration);
      return save;
    };
    return withTavernAutosavePaused(loadFiles, () => false, () => false);
  },
  delete: async (slotId = DEFAULT_SAVE_SLOT, saveUuid?: string) => {
    const identityGeneration = getTavernAutosaveIdentityGeneration();
    let mainSaveDeleted = false;
    let identityAdopted = false;
    const deleteFiles = async () => {
      const result = await saveClient.delete(slotId, saveUuid);
      mainSaveDeleted = result.deleted;
      await gameMessageApi.deleteFor(slotId, result.saveUuid ?? saveUuid);
      if (slotId === DEFAULT_SAVE_SLOT && result.deleted) {
        identityAdopted = adoptTavernAutosaveIdentity(null, identityGeneration);
      }
      return result;
    };
    return slotId === DEFAULT_SAVE_SLOT
      ? withTavernAutosavePaused(
          deleteFiles,
          () => mainSaveDeleted && getTavernAutosaveIdentityGeneration() === identityGeneration,
          result => (!result.deleted && getTavernAutosaveIdentityGeneration() === identityGeneration) || identityAdopted,
        )
      : deleteFiles();
  },
  resetBackend: () => {
    saveClient.resetBackend();
    gameMessageApi.dispose();
  },
};
