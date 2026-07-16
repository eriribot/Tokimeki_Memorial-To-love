import { useCallback, useEffect, useRef } from 'react';
import {
  actToPlainText,
  createFallbackLalaArrivalMessages,
  generateLalaArrivalAct,
} from '../services/tavernStoryGeneration';
import { PERIODS, useGameStore } from '../stores/gameStore';
import { useCardStore } from '../stores/cardStore';
import { usePlayerStore } from '../stores/playerStore';
import { resolveAssetPath } from '../utils/assetPath';
import { GALBOX_ASSETS, getSpeakerNameplateAsset } from './galAssets';
import LalaPortrait from './LalaPortrait';
import { createLalaArrivalFallbackAct, LALA_ARRIVAL_EVENT_ID, LALA_ARRIVAL_STORY } from './lalaArrival';
import './GalMainStory.css';

function getErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

export default function GalMainStory() {
  const activeEventId = useGameStore(state => state.activeMainStoryEventId);
  const entryReason = useGameStore(state => state.mainStoryEntryReason);
  const actIndex = useGameStore(state => state.mainStoryActIndex);
  const pageIndex = useGameStore(state => state.mainStoryPageIndex);
  const acts = useGameStore(state => state.mainStoryActs);
  const generationStatus = useGameStore(state => state.mainStoryGenerationStatus);
  const generationSource = useGameStore(state => state.mainStoryGenerationSource);
  const generationError = useGameStore(state => state.mainStoryGenerationError);
  const messageHistory = useGameStore(state => state.mainStoryMessages);
  const day = useGameStore(state => state.day);
  const periodIndex = useGameStore(state => state.periodIndex);
  const currentLocationId = useGameStore(state => state.currentLocationId);
  const beginGeneration = useGameStore(state => state.beginMainStoryGeneration);
  const setStoryActContent = useGameStore(state => state.setMainStoryActContent);
  const failGeneration = useGameStore(state => state.failMainStoryGeneration);
  const setStoryPosition = useGameStore(state => state.setMainStoryPosition);
  const advanceMainStoryAct = useGameStore(state => state.advanceMainStoryAct);
  const completeMainStoryEvent = useGameStore(state => state.completeMainStoryEvent);
  const playerName = usePlayerStore(state => state.name);
  const spawnTargetsForPeriod = useCardStore(state => state.spawnTargetsForPeriod);
  const storyRef = useRef<HTMLElement | null>(null);

  const act = acts[actIndex];
  const beat = act?.beats[pageIndex];
  const isLastPage = Boolean(act && pageIndex === act.beats.length - 1);
  const isLastAct = actIndex === LALA_ARRIVAL_STORY.acts.length - 1;
  const isLalaSpeaking = beat?.speaker === '菈菈';
  const speakerNameplate = getSpeakerNameplateAsset(beat?.speaker ?? null);

  const requestGeneration = useCallback(async () => {
    if (!entryReason || !beginGeneration()) return;
    const period = PERIODS[periodIndex] ?? PERIODS[0];

    try {
      const generated = await generateLalaArrivalAct({
        actIndex,
        entryReason,
        playerName,
        day,
        period: period.key,
        location: currentLocationId,
        messageHistory,
      });
      setStoryActContent(generated.act, 'tavern', generated.messages);
    } catch (error) {
      console.error('[ToLove Story] 第一集生成失败。', error);
      failGeneration(getErrorMessage(error));
    }
  }, [
    beginGeneration,
    actIndex,
    currentLocationId,
    day,
    entryReason,
    failGeneration,
    messageHistory,
    periodIndex,
    playerName,
    setStoryActContent,
  ]);

  useEffect(() => {
    if (activeEventId === LALA_ARRIVAL_EVENT_ID && generationStatus === 'idle') {
      void requestGeneration();
    }
  }, [activeEventId, generationStatus, requestGeneration]);

  const finishCurrentAct = useCallback(() => {
    if (!isLastAct) {
      advanceMainStoryAct();
      return;
    }
    if (completeMainStoryEvent()) spawnTargetsForPeriod(PERIODS[0].key);
  }, [advanceMainStoryAct, completeMainStoryEvent, isLastAct, spawnTargetsForPeriod]);

  const useFallbackAct = useCallback(() => {
    if (!entryReason) return;
    const period = PERIODS[periodIndex] ?? PERIODS[0];
    const fallbackAct = createLalaArrivalFallbackAct(entryReason, actIndex);
    const messages = createFallbackLalaArrivalMessages(
      {
        actIndex,
        entryReason,
        playerName,
        day,
        period: period.key,
        location: currentLocationId,
        messageHistory,
      },
      actToPlainText(fallbackAct),
    );
    setStoryActContent(fallbackAct, 'fallback', messages);
  }, [actIndex, currentLocationId, day, entryReason, messageHistory, periodIndex, playerName, setStoryActContent]);

  const goNext = useCallback(() => {
    if (!act || !beat) return;
    if (!isLastPage) {
      setStoryPosition(actIndex, pageIndex + 1);
      return;
    }
    finishCurrentAct();
  }, [act, actIndex, beat, finishCurrentAct, isLastPage, pageIndex, setStoryPosition]);

  const goPrevious = useCallback(() => {
    if (!act || !beat || pageIndex <= 0) return;
    setStoryPosition(actIndex, pageIndex - 1);
  }, [act, actIndex, beat, pageIndex, setStoryPosition]);

  useEffect(() => {
    if (activeEventId !== LALA_ARRIVAL_EVENT_ID || generationStatus !== 'ready') return;

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
  }, [activeEventId, generationStatus, goNext, goPrevious]);

  if (activeEventId !== LALA_ARRIVAL_EVENT_ID) return null;

  if (generationStatus !== 'ready' || !act || !beat) {
    const isError = generationStatus === 'error';
    return (
      <section
        className="gal-main-story is-generating"
        role="dialog"
        aria-modal="true"
        aria-label={isError ? '第一集生成失败' : '第一集生成中'}
        data-generation-status={generationStatus}
      >
        <img
          className="gal-main-story__background"
          src={resolveAssetPath(LALA_ARRIVAL_STORY.backgrounds.night)}
          alt="夜色中的校园"
        />
        <div className="gal-main-story__shade" aria-hidden="true" />
        <div className={`gal-main-story__generation-panel ${isError ? 'is-error' : ''}`}>
          {!isError && (
            <span className="gal-main-story__scanner" aria-hidden="true">
              <span />
              <span />
              <span />
            </span>
          )}
          <strong>{isError ? '传送坐标中断' : '沛凯正在校准这场大乱子'}</strong>
          <p>{isError ? generationError : `正在调用酒馆当前预设生成第 ${actIndex + 1} 幕正文……`}</p>
          {isError && (
            <div className="gal-main-story__generation-actions">
              <button type="button" onClick={() => void requestGeneration()}>
                重试
              </button>
              <button type="button" onClick={useFallbackAct}>
                使用保底版
              </button>
            </div>
          )}
        </div>
      </section>
    );
  }

  const actMeta = LALA_ARRIVAL_STORY.acts[actIndex];
  const background = LALA_ARRIVAL_STORY.backgrounds[beat.background];
  const previousDisabled = pageIndex === 0;

  return (
    <section
      className="gal-main-story"
      ref={storyRef}
      role="dialog"
      aria-modal="true"
      aria-label={`主线事件：${LALA_ARRIVAL_STORY.title}`}
      tabIndex={-1}
      data-event-id={activeEventId}
      data-act-id={act.id}
      data-page-index={pageIndex}
      data-speaker={beat.speaker ?? 'narration'}
      data-speaker-ui={speakerNameplate ? 'galbox-nameplate' : beat.speaker ? 'generic-nameplate' : 'narration'}
      data-lala-expression={beat.lalaExpression ?? 'hidden'}
      data-effect={beat.effect}
      data-generation-source={generationSource ?? 'unknown'}
      onClick={goNext}
    >
      <img
        key={`${act.id}-${pageIndex}-${beat.background}`}
        className="gal-main-story__background"
        src={resolveAssetPath(background)}
        alt={beat.background === 'school' ? '彩南高校' : '夜晚场景'}
      />
      <div className="gal-main-story__shade" aria-hidden="true" />
      <div className="gal-main-story__act-label">
        第 {actIndex + 1} 幕 · {actMeta?.title ?? act.id}
      </div>

      {beat.lalaExpression && (
        <LalaPortrait
          expression={beat.lalaExpression}
          isSpeaking={isLalaSpeaking}
          beatKey={actIndex * 100 + pageIndex}
        />
      )}

      <div className="gal-main-story__dialogue">
        <img
          className="gal-main-story__window"
          src={resolveAssetPath(GALBOX_ASSETS.messageWindow)}
          alt=""
          aria-hidden="true"
        />

        {speakerNameplate ? (
          <div className="gal-main-story__nameplate" role="img" aria-label={beat.speaker ?? undefined}>
            <img src={resolveAssetPath(speakerNameplate)} alt="" aria-hidden="true" />
            <strong>{beat.speaker}</strong>
          </div>
        ) : (
          beat.speaker && <strong className="gal-main-story__speaker">{beat.speaker}</strong>
        )}

        <div className="gal-main-story__copy">
          <p className={beat.speaker ? '' : 'is-narration'}>{beat.text}</p>
        </div>

        <span className="gal-main-story__push" aria-hidden="true">
          {GALBOX_ASSETS.nextIndicatorFrames.map((src, frame) => (
            <img key={src} className={`push-frame push-frame-${frame}`} src={resolveAssetPath(src)} alt="" />
          ))}
        </span>

        <nav className="gal-main-story__controls" aria-label="剧情翻页" onClick={event => event.stopPropagation()}>
          <button
            type="button"
            className="gal-main-story__icon-button"
            disabled={previousDisabled}
            onClick={goPrevious}
            aria-label="上一页"
            title="上一页"
          >
            ←
          </button>
          <span className="gal-main-story__progress">
            {actIndex + 1}-{pageIndex + 1} / {LALA_ARRIVAL_STORY.acts.length}-{act.beats.length}
          </span>
          <button type="button" className="gal-main-story__skip" onClick={finishCurrentAct} aria-label="跳过当前幕">
            跳过
          </button>
          <button
            type="button"
            className="gal-main-story__icon-button is-primary"
            onClick={goNext}
            aria-label={isLastAct && isLastPage ? '结束剧情' : isLastPage ? '回到自由行动' : '下一页'}
            title={isLastAct && isLastPage ? '结束剧情' : isLastPage ? '回到自由行动' : '下一页'}
          >
            {isLastAct && isLastPage ? '✓' : '→'}
          </button>
        </nav>
      </div>
    </section>
  );
}
