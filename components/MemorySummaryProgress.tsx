import { useEffect } from 'react';
import { GALBOX_ASSETS } from '../GalMainStory/galAssets';
import { MEMORY_SUMMARY_PHASE_LABELS, useMemorySummaryProgressStore } from '../memory/summaryProgress';
import { resolveAssetPath } from '../utils/assetPath';
import './MemorySummaryProgress.css';

export default function MemorySummaryProgress() {
  const visible = useMemorySummaryProgressStore(state => state.visible);
  const status = useMemorySummaryProgressStore(state => state.status);
  const mode = useMemorySummaryProgressStore(state => state.mode);
  const phase = useMemorySummaryProgressStore(state => state.phase);
  const progress = useMemorySummaryProgressStore(state => state.progress);
  const message = useMemorySummaryProgressStore(state => state.message);
  const error = useMemorySummaryProgressStore(state => state.error);
  const dismiss = useMemorySummaryProgressStore(state => state.dismiss);
  const reset = useMemorySummaryProgressStore(state => state.reset);

  useEffect(() => {
    if (status !== 'ready') return undefined;
    const timeoutId = window.setTimeout(reset, 3500);
    return () => window.clearTimeout(timeoutId);
  }, [reset, status]);

  useEffect(() => {
    if (status !== 'error' || !visible) return undefined;
    const timeoutId = window.setTimeout(dismiss, 5000);
    return () => window.clearTimeout(timeoutId);
  }, [dismiss, error, status, visible]);

  if (!visible || status === 'idle' || phase === null || mode === null) return null;

  const label = message || MEMORY_SUMMARY_PHASE_LABELS[phase];
  const isIndeterminate = status === 'running' && progress === null;
  const barStyle = progress === null ? undefined : { width: progress + '%' };
  const modeLabel = mode === 'small' ? '小总结' : '大总结';

  return (
    <aside
      className={'memory-summary-progress is-' + status}
      role={status === 'error' ? 'alert' : 'status'}
      aria-live="polite"
      aria-label={modeLabel + '：' + (error ?? label)}
      data-summary-mode={mode}
      data-summary-phase={phase}
      data-summary-status={status}
    >
      <span className="memory-summary-progress__push" aria-hidden="true">
        {GALBOX_ASSETS.nextIndicatorFrames.map((src, frame) => (
          <img
            key={src}
            className={'memory-summary-progress__frame memory-summary-progress__frame-' + frame}
            src={resolveAssetPath(src)}
            alt=""
          />
        ))}
      </span>

      <span className="memory-summary-progress__content">
        <span className="memory-summary-progress__heading">
          <b>{modeLabel}</b>
          <span>{label}</span>
          {progress !== null && <strong>{progress}%</strong>}
        </span>
        <span
          className={'memory-summary-progress__track ' + (isIndeterminate ? 'is-indeterminate' : '')}
          aria-hidden="true"
        >
          <span className="memory-summary-progress__fill" style={barStyle} />
        </span>
      </span>
    </aside>
  );
}
