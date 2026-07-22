import type { GalStoryMessageSave } from '../GalMainStory/storyTypes';
import { useGameStore } from '../stores/gameStore';
import type { SaveRecord } from '../save/protocol';
import type { GameSnapshot } from '../save/snapshot';
import { messageClient } from './client';
import { MESSAGE_SCHEMA_VERSION, type MessageArchive } from './protocol';

export * from './client';
export * from './protocol';

function cloneJson<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

export function captureGameMessages(): GalStoryMessageSave[] {
  return cloneJson(useGameStore.getState().mainStory.messages);
}

export function createMessageArchive(save: SaveRecord<GameSnapshot>, messages: GalStoryMessageSave[]): MessageArchive {
  return {
    schemaVersion: MESSAGE_SCHEMA_VERSION,
    slotId: save.slotId,
    saveUuid: save.saveUuid,
    saveRevision: save.revision,
    chatId: save.chatId,
    updatedAt: save.updatedAt,
    messages: cloneJson(messages),
  };
}

export const gameMessageApi = {
  probe: () => messageClient.probe(),
  saveFor: (save: SaveRecord<GameSnapshot>, messages: GalStoryMessageSave[]) =>
    messageClient.write(createMessageArchive(save, messages)),
  loadFor: async (save: SaveRecord<GameSnapshot>, strict: boolean): Promise<MessageArchive | null> => {
    const { archive } = await messageClient.load(save.slotId, save.saveUuid);
    if (!archive) return null;
    if (archive.saveUuid !== save.saveUuid || archive.saveRevision !== save.revision) {
      if (!strict) return null;
      throw new Error(`对话档与存档版本不一致：存档 REV.${save.revision}，对话档 REV.${archive.saveRevision}`);
    }
    return archive;
  },
  deleteFor: (slotId: string, saveUuid?: string) => messageClient.delete(slotId, saveUuid),
  dispose: () => messageClient.dispose(),
};
