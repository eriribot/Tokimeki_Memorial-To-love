import type { WorldbookReader } from './data/worldbook';

declare module '*.txt?raw' {
  const content: string;
  export default content;
}

declare global {
  interface Window {
    __WEBGAME_ASSET_BASE__?: string;
    advanceTime?: (ms: number) => void;
    render_game_to_text?: () => string;
    /** 提供世界书读取、确定性扫描注入和真实激活事件观察入口。 */
    toloveWorldbook?: WorldbookReader;
    /** 调试用：读取本地模拟酒馆楼层的主线正文记录，不进入 render_game_to_text。 */
    toloveStoryMessages?: (format?: 'json' | 'jsonl') => string;
  }
}

export {};
