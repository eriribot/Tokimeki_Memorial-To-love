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
    /** 调试用：读取当前本地快照、原文镜像与可重建的生成上下文。 */
    toloveContextPreview?: () => string;
    /** 调试用：只预览非持久化的地图摘要进度 UI，不会发 API 或写入记忆。 */
    toloveMemorySummaryProgressPreview?: (preset: 'small-running' | 'large-running' | 'fallback' | 'reset') => string;
  }
}

export {};
