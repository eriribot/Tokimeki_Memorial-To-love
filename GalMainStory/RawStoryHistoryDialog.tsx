import { useEffect, useMemo, useRef, useState } from 'react';
import { EPISODE_01_STORY } from './episodes/episode01';
import type { RawStoryActView, RawStoryVersionView } from './storyRawArchive';

interface RawStoryHistoryDialogProps {
  acts: readonly RawStoryActView[];
  initialFloorId: string | null;
  onClose: () => void;
}

function findInitialVersion(acts: readonly RawStoryActView[], floorId: string | null): RawStoryVersionView | null {
  if (floorId) {
    for (const act of acts) {
      const requested = act.versions.find(version => version.floor.floorId === floorId);
      if (requested) return requested;
    }
  }
  for (const act of acts) {
    const active = act.versions.find(version => version.isActive);
    if (active) return active;
  }
  return acts[0]?.versions[0] ?? null;
}

function formatFloorTime(value: string): string {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleString('zh-CN', { hour12: false });
}

function getVersionStatus(version: RawStoryVersionView): string {
  if (version.floor.outcome === 'parse_error') return '未转换为 GAL';
  return version.isActive ? '当前采用' : '可播放';
}

export default function RawStoryHistoryDialog({ acts, initialFloorId, onClose }: RawStoryHistoryDialogProps) {
  const closeButtonRef = useRef<HTMLButtonElement | null>(null);
  const initialVersion = useMemo(() => findInitialVersion(acts, initialFloorId), [acts, initialFloorId]);
  const [selectedFloorId, setSelectedFloorId] = useState(initialVersion?.floor.floorId ?? '');
  const [pageIndex, setPageIndex] = useState(0);
  const selectedAct =
    acts.find(act => act.versions.some(version => version.floor.floorId === selectedFloorId)) ?? acts[0];
  const selectedVersion =
    selectedAct?.versions.find(version => version.floor.floorId === selectedFloorId) ??
    selectedAct?.versions[0] ??
    null;
  const pageCount = selectedVersion?.pages.length ?? 0;
  const safePageIndex = pageCount > 0 ? Math.min(pageCount - 1, pageIndex) : 0;
  const selectedPage = selectedVersion?.pages[safePageIndex] ?? null;

  useEffect(() => {
    closeButtonRef.current?.focus();
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return;
      event.preventDefault();
      onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  useEffect(() => {
    if (selectedVersion) return;
    setSelectedFloorId(initialVersion?.floor.floorId ?? '');
    setPageIndex(0);
  }, [initialVersion, selectedVersion]);

  const selectVersion = (floorId: string) => {
    setSelectedFloorId(floorId);
    setPageIndex(0);
  };

  const selectAct = (act: RawStoryActView) => {
    const version = act.versions.find(candidate => candidate.isActive) ?? act.versions[0];
    if (version) selectVersion(version.floor.floorId);
  };

  return (
    <div
      className="gal-main-story__raw-backdrop"
      role="presentation"
      onClick={event => {
        event.stopPropagation();
        onClose();
      }}
    >
      <section
        id="gal-main-story-raw-dialog"
        className="gal-main-story__raw-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="gal-main-story-raw-title"
        onClick={event => event.stopPropagation()}
      >
        <header>
          <div>
            <span>按幕、生成版本与页整理</span>
            <h2 id="gal-main-story-raw-title">AI 生成原文</h2>
          </div>
          <button ref={closeButtonRef} type="button" onClick={onClose} aria-label="关闭 AI 原文">
            ×
          </button>
        </header>

        <nav className="gal-main-story__raw-act-tabs" aria-label="选择剧情幕">
          {acts.map(act => (
            <button
              key={act.actId}
              type="button"
              className={act.actIndex === selectedAct?.actIndex ? 'is-active' : ''}
              aria-pressed={act.actIndex === selectedAct?.actIndex}
              onClick={() => selectAct(act)}
            >
              第 {act.actIndex + 1} 幕 · {EPISODE_01_STORY.acts[act.actIndex]?.title ?? act.actId}
            </button>
          ))}
        </nav>

        <div className="gal-main-story__raw-reader">
          <aside className="gal-main-story__raw-versions" aria-label="选择生成版本">
            {selectedAct?.versions.map(version => (
              <button
                key={version.floor.floorId}
                type="button"
                className={version.floor.floorId === selectedVersion?.floor.floorId ? 'is-active' : ''}
                aria-pressed={version.floor.floorId === selectedVersion?.floor.floorId}
                onClick={() => selectVersion(version.floor.floorId)}
              >
                <strong>版本 {version.floorIndex + 1}</strong>
                <span>{getVersionStatus(version)}</span>
                <time dateTime={version.floor.createdAt}>{formatFloorTime(version.floor.createdAt)}</time>
              </button>
            ))}
          </aside>

          <section className="gal-main-story__raw-page" aria-live="polite">
            {selectedVersion && selectedPage ? (
              <>
                <header>
                  <div>
                    <strong>
                      第 {selectedVersion.floor.actIndex + 1} 幕 · 版本 {selectedVersion.floorIndex + 1}
                    </strong>
                    <span>{getVersionStatus(selectedVersion)}</span>
                  </div>
                  <span>
                    第 {safePageIndex + 1} / {pageCount} 页
                  </span>
                </header>
                {selectedVersion.message.extra.error && (
                  <p className="gal-main-story__raw-error">解析原因：{selectedVersion.message.extra.error}</p>
                )}
                <div className="gal-main-story__raw-copy">
                  <pre>{selectedPage.text}</pre>
                </div>
                <footer>
                  <button
                    type="button"
                    disabled={safePageIndex === 0}
                    onClick={() => setPageIndex(current => Math.max(0, current - 1))}
                    aria-label="上一页"
                    title="上一页"
                  >
                    ←
                  </button>
                  <span>
                    {safePageIndex + 1} / {pageCount}
                  </span>
                  <button
                    type="button"
                    disabled={safePageIndex >= pageCount - 1}
                    onClick={() => setPageIndex(current => Math.min(pageCount - 1, current + 1))}
                    aria-label="下一页"
                    title="下一页"
                  >
                    →
                  </button>
                </footer>
              </>
            ) : (
              <p className="gal-main-story__raw-empty">没有可阅读的 AI 原文。</p>
            )}
          </section>
        </div>
      </section>
    </div>
  );
}
