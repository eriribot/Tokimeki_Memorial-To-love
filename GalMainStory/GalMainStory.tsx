import { useCallback, useEffect, useRef } from 'react';
import { useGameStore } from '../stores/gameStore';
import { resolveAssetPath } from '../utils/assetPath';
import LalaPortrait from './LalaPortrait';
import { LALA_ARRIVAL_EVENT_ID, LALA_ARRIVAL_STORY } from './lalaArrival';
import './GalMainStory.css';

const PUSH_FRAMES = [0, 1, 2, 3].map(frame => `/artsource/galbox/push_${frame}.png`);

export default function GalMainStory() {
  const activeEventId = useGameStore(state => state.activeMainStoryEventId);
  const storedPageIndex = useGameStore(state => state.mainStoryPageIndex);
  const setMainStoryPage = useGameStore(state => state.setMainStoryPage);
  const completeMainStoryEvent = useGameStore(state => state.completeMainStoryEvent);
  const storyRef = useRef<HTMLElement | null>(null);

  const pageIndex = Math.min(storedPageIndex, LALA_ARRIVAL_STORY.beats.length - 1);
  const beat = LALA_ARRIVAL_STORY.beats[pageIndex];
  const isLastPage = pageIndex === LALA_ARRIVAL_STORY.beats.length - 1;

  const goNext = useCallback(() => {
    if (isLastPage) {
      completeMainStoryEvent();
      return;
    }
    setMainStoryPage(pageIndex + 1);
  }, [completeMainStoryEvent, isLastPage, pageIndex, setMainStoryPage]);

  const goPrevious = useCallback(() => {
    if (pageIndex > 0) setMainStoryPage(pageIndex - 1);
  }, [pageIndex, setMainStoryPage]);

  useEffect(() => {
    if (activeEventId !== LALA_ARRIVAL_EVENT_ID) return;

    storyRef.current?.focus();
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'ArrowLeft') {
        event.preventDefault();
        goPrevious();
      } else if (event.key === 'ArrowRight' || event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        goNext();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeEventId, goNext, goPrevious, pageIndex]);

  if (activeEventId !== LALA_ARRIVAL_EVENT_ID || !beat) return null;

  return (
    <section
      className="gal-main-story"
      ref={storyRef}
      role="dialog"
      aria-modal="true"
      aria-label={`主线事件：${LALA_ARRIVAL_STORY.title}`}
      tabIndex={-1}
      data-event-id={activeEventId}
      data-page-index={pageIndex}
      data-lala-expression={beat.lalaExpression ?? 'hidden'}
      onClick={goNext}
    >
      <img
        className="gal-main-story__background"
        src={resolveAssetPath(LALA_ARRIVAL_STORY.background)}
        alt="夜晚的公园"
      />
      <div className="gal-main-story__shade" aria-hidden="true" />

      {beat.lalaExpression && (
        <LalaPortrait expression={beat.lalaExpression} isSpeaking={beat.speaker === '菈菈'} beatKey={pageIndex} />
      )}

      <div className="gal-main-story__dialogue">
        <img
          className="gal-main-story__window"
          src={resolveAssetPath('/artsource/galbox/msg_window.png')}
          alt=""
          aria-hidden="true"
        />

        {beat.speaker === '菈菈' ? (
          <div className="gal-main-story__nameplate" role="img" aria-label="菈菈">
            <img src={resolveAssetPath('/artsource/galbox/lala/wasya04_lala.png')} alt="" aria-hidden="true" />
            <strong>菈菈</strong>
          </div>
        ) : (
          beat.speaker && <strong className="gal-main-story__speaker">{beat.speaker}</strong>
        )}

        <div className="gal-main-story__copy">
          <p className={beat.speaker ? '' : 'is-narration'}>{beat.text}</p>
        </div>

        <span className="gal-main-story__push" aria-hidden="true">
          {PUSH_FRAMES.map((src, frame) => (
            <img key={src} className={`push-frame push-frame-${frame}`} src={resolveAssetPath(src)} alt="" />
          ))}
        </span>

        <nav className="gal-main-story__controls" aria-label="剧情翻页" onClick={event => event.stopPropagation()}>
          <button
            type="button"
            className="gal-main-story__icon-button"
            disabled={pageIndex === 0}
            onClick={goPrevious}
            aria-label="上一页"
            title="上一页"
          >
            ←
          </button>
          <span
            className="gal-main-story__progress"
            aria-label={`第 ${pageIndex + 1} 页，共 ${LALA_ARRIVAL_STORY.beats.length} 页`}
          >
            {pageIndex + 1} / {LALA_ARRIVAL_STORY.beats.length}
          </span>
          <button
            type="button"
            className="gal-main-story__skip"
            onClick={completeMainStoryEvent}
            aria-label="跳过并结束剧情"
          >
            跳过
          </button>
          <button
            type="button"
            className="gal-main-story__icon-button is-primary"
            onClick={goNext}
            aria-label={isLastPage ? '结束剧情' : '下一页'}
            title={isLastPage ? '结束剧情' : '下一页'}
          >
            {isLastPage ? '✓' : '→'}
          </button>
        </nav>
      </div>
    </section>
  );
}
