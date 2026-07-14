declare global {
  interface Window {
    __WEBGAME_ASSET_BASE__?: string;
    advanceTime?: (ms: number) => void;
    render_game_to_text?: () => string;
    toloveSave?: {
      probe: (force?: boolean) => Promise<unknown>;
      list: () => Promise<unknown>;
      save: (slotId?: string, saveUuid?: string) => Promise<unknown>;
      load: (slotId?: string, saveUuid?: string) => Promise<unknown>;
      delete: (slotId?: string, saveUuid?: string) => Promise<unknown>;
      resetBackend: () => void;
    };
  }
}

export {};
