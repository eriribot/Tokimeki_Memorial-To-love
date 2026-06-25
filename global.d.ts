declare global {
  interface Window {
    __WEBGAME_ASSET_BASE__?: string;
    advanceTime?: (ms: number) => void;
    render_game_to_text?: () => string;
  }
}

export {};
