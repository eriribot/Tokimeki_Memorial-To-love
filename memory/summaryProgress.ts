import { create } from 'zustand';
import type { MemorySummaryMode } from './summaryPrompts';

export type MemorySummaryPhase =
  | 'collecting'
  | 'local-index'
  | 'requesting-small'
  | 'requesting-large'
  | 'validating'
  | 'saving'
  | 'ready'
  | 'error';

export type MemorySummaryProgressStatus = 'idle' | 'running' | 'ready' | 'error';

export interface MemorySummaryProgressState {
  visible: boolean;
  status: MemorySummaryProgressStatus;
  mode: MemorySummaryMode | null;
  phase: MemorySummaryPhase | null;
  progress: number | null;
  message: string;
  error: string | null;
  begin: (mode: MemorySummaryMode) => void;
  setPhase: (phase: Exclude<MemorySummaryPhase, 'ready' | 'error'>, progress?: number | null, message?: string) => void;
  ready: (message?: string) => void;
  fail: (error: string) => void;
  dismiss: () => void;
  reset: () => void;
}

export const MEMORY_SUMMARY_PHASE_LABELS: Record<MemorySummaryPhase, string> = {
  collecting: '正在读取来源',
  'local-index': '正在整理本地索引',
  'requesting-small': '正在等待小总结',
  'requesting-large': '正在等待大总结',
  validating: '正在校验候选',
  saving: '正在准备待确认记录',
  ready: '候选已生成，等待确认',
  error: '摘要失败，本地记忆已保留',
};

const INITIAL_STATE = {
  visible: false,
  status: 'idle' as const,
  mode: null,
  phase: null,
  progress: null,
  message: '',
  error: null,
};

function clampProgress(value: number | null | undefined): number | null {
  if (value === null || value === undefined) return null;
  if (!Number.isFinite(value)) throw new Error('摘要进度必须是有限数字。');
  return Math.min(100, Math.max(0, Math.round(value)));
}

export const useMemorySummaryProgressStore = create<MemorySummaryProgressState>((set, get) => ({
  ...INITIAL_STATE,

  begin: mode =>
    set({
      visible: true,
      status: 'running',
      mode,
      phase: 'collecting',
      progress: null,
      message: mode === 'small' ? '准备小总结来源' : '准备大总结来源',
      error: null,
    }),

  setPhase: (phase, progress, message) => {
    const current = get();
    if (current.status !== 'running') return;
    if (phase === 'requesting-small' && current.mode !== 'small') {
      throw new Error('大总结不能进入小总结请求阶段。');
    }
    if (phase === 'requesting-large' && current.mode !== 'large') {
      throw new Error('小总结不能进入大总结请求阶段。');
    }
    set({
      phase,
      progress: clampProgress(progress),
      message: message?.trim() || MEMORY_SUMMARY_PHASE_LABELS[phase],
      error: null,
    });
  },

  ready: message => {
    if (get().status !== 'running') return;
    set({
      visible: true,
      status: 'ready',
      phase: 'ready',
      progress: 100,
      message: message?.trim() || MEMORY_SUMMARY_PHASE_LABELS.ready,
      error: null,
    });
  },

  fail: error => {
    if (get().status !== 'running') return;
    set({
      visible: true,
      status: 'error',
      phase: 'error',
      progress: null,
      message: MEMORY_SUMMARY_PHASE_LABELS.error,
      error: error.trim() || '摘要处理失败。',
    });
  },

  dismiss: () => set({ visible: false }),

  reset: () => set({ ...INITIAL_STATE }),
}));
