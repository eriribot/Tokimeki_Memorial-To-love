import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  actToPlainText,
  createFallbackLalaArrivalMessages,
  createLalaArrivalFloor,
  createLalaArrivalFloorId,
  generateLalaArrivalAct,
} from '../services/tavernStoryGeneration';
import { PERIODS, useGameStore } from '../stores/gameStore';
import { useCardStore } from '../stores/cardStore';
import { usePlayerStore } from '../stores/playerStore';
import { resolveAssetPath } from '../utils/assetPath';
import {
  GALBOX_ASSETS,
  getSpeakerNameplateAsset,
  HARUNA_PORTRAIT_RIG,
  LALA_PORTRAIT_RIG,
  RIKO_PORTRAIT_RIG,
} from './galAssets';
import LayeredPortrait from './LayeredPortrait';
import { createLalaArrivalFallbackAct, LALA_ARRIVAL_EVENT_ID, LALA_ARRIVAL_STORY } from './lalaArrival';
import StoryHistoryArchive from './StoryHistoryArchive';
import type { GalStoryBeat, GalStoryFloor, GalStoryMessageSave, LalaExpression, StoryBackgroundId } from './storyTypes';
import './GalMainStory.css';

interface StoryCursor {
  actIndex: number;
  pageIndex: number;
}

interface GalMainStoryProps {
  historyMode?: boolean;
  onExitHistory?: () => void;
}

type HistoryPlaybackTarget = { kind: 'all' } | { kind: 'floor'; floorId: string } | null;

interface RawStoryEntry {
  message: GalStoryMessageSave;
  index: number;
}

interface RawStoryHistoryDialogProps {
  entries: readonly RawStoryEntry[];
  onClose: () => void;
}

const STORY_BACKGROUND_ALT: Record<StoryBackgroundId, string> = {
  school: '彩南高校',
  night: '夜晚场景',
  washroomDoor: '浴室门前',
  washroom: '浴室内部',
};

function RawStoryHistoryDialog({ entries, onClose }: RawStoryHistoryDialogProps) {
  const closeButtonRef = useRef<HTMLButtonElement | null>(null);

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
            <span>仅显示 Assistant · 按消息 index 排序</span>
            <h2 id="gal-main-story-raw-title">AI 生成原文</h2>
          </div>
          <button ref={closeButtonRef} type="button" onClick={onClose} aria-label="关闭 AI 原文">
            ×
          </button>
        </header>
        <div className="gal-main-story__raw-list">
          {entries.map(({ message, index }) => (
            <article key={message.id}>
              <div className="gal-main-story__raw-entry-heading">
                <strong>第 {message.extra.actIndex + 1} 幕</strong>
                <span>index {index}</span>
                <span>{message.extra.outcome === 'parse_error' ? '未转换为 GAL' : '已转换为 GAL'}</span>
              </div>
              {message.extra.error && <p className="gal-main-story__raw-error">解析原因：{message.extra.error}</p>}
              <pre>{message.mes}</pre>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}

function getErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

function getHarunaPortraitExpression(beat: GalStoryBeat | undefined, actIndex: number): LalaExpression | null {
  if (!beat || actIndex !== 0 || beat.background !== 'school' || beat.lalaExpression) return null;
  if (beat.effect === 'shake') return 'e';
  if (beat.effect === 'flash') return 'd';
  return beat.speaker === '西连寺春菜' ? 'f' : 'a';
}

function getRikoPortraitExpression(beat: GalStoryBeat | undefined, actIndex: number): LalaExpression | null {
  if (!beat || actIndex !== 0 || beat.background !== 'school' || beat.lalaExpression) return null;
  if (beat.speaker && /^(?:夕崎梨子|梨子)$/u.test(beat.speaker)) return 'a';
  return beat.speaker === null && /夕崎梨子|梨子/u.test(beat.text) ? 'a' : null;
}

export default function GalMainStory({ historyMode = false, onExitHistory }: GalMainStoryProps) {
  const activeEventId = useGameStore(state => state.activeMainStoryEventId);
  const entryReason = useGameStore(state => state.mainStoryEntryReason);
  const actIndex = useGameStore(state => state.mainStoryActIndex);
  const pageIndex = useGameStore(state => state.mainStoryPageIndex);
  const acts = useGameStore(state => state.mainStoryActs);
  const storyArchives = useGameStore(state => state.mainStoryArchives);
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
  const selectStoryFloor = useGameStore(state => state.selectMainStoryFloor);
  const advanceMainStoryAct = useGameStore(state => state.advanceMainStoryAct);
  const completeMainStoryEvent = useGameStore(state => state.completeMainStoryEvent);
  const playerName = usePlayerStore(state => state.name);
  const spawnTargetsForPeriod = useCardStore(state => state.spawnTargetsForPeriod);
  const storyRef = useRef<HTMLElement | null>(null);
  const [replayIndex, setReplayIndex] = useState<number | null>(null);
  const [historyPlaybackTarget, setHistoryPlaybackTarget] = useState<HistoryPlaybackTarget>(null);
  const [isRawHistoryOpen, setIsRawHistoryOpen] = useState(false);

  const liveAct = acts[actIndex];
  const liveBeat = liveAct?.beats[pageIndex];
  const isLastLivePage = Boolean(liveAct && pageIndex === liveAct.beats.length - 1);
  const isLastLiveAct = actIndex === LALA_ARRIVAL_STORY.acts.length - 1;
  const liveReadCursors = useMemo<StoryCursor[]>(
    () =>
      acts.flatMap((savedAct, savedActIndex) => {
        if (savedActIndex > actIndex) return [];
        const lastPageIndex =
          savedActIndex < actIndex ? savedAct.beats.length - 1 : Math.min(pageIndex, savedAct.beats.length - 1);
        if (lastPageIndex < 0) return [];
        return savedAct.beats.slice(0, lastPageIndex + 1).map((_, savedPageIndex) => ({
          actIndex: savedActIndex,
          pageIndex: savedPageIndex,
        }));
      }),
    [actIndex, acts, pageIndex],
  );
  const historyFloor = useMemo<GalStoryFloor | null>(() => {
    if (historyPlaybackTarget?.kind !== 'floor') return null;
    for (const archive of storyArchives) {
      const floor = archive.floors.find(candidate => candidate.floorId === historyPlaybackTarget.floorId);
      if (floor) return floor;
    }
    return null;
  }, [historyPlaybackTarget, storyArchives]);
  const historyActs = useMemo(() => {
    if (!historyFloor?.act) return acts;
    const previewActs = [...acts];
    previewActs[historyFloor.actIndex] = historyFloor.act;
    return previewActs;
  }, [acts, historyFloor]);
  const historyCursors = useMemo<StoryCursor[]>(() => {
    if (!historyPlaybackTarget) return [];
    if (historyPlaybackTarget.kind === 'floor' && historyFloor?.act) {
      return historyFloor.act.beats.map((_, savedPageIndex) => ({
        actIndex: historyFloor.actIndex,
        pageIndex: savedPageIndex,
      }));
    }
    return historyActs.flatMap((savedAct, savedActIndex) =>
      savedAct.beats.map((_, savedPageIndex) => ({
        actIndex: savedActIndex,
        pageIndex: savedPageIndex,
      })),
    );
  }, [historyActs, historyFloor, historyPlaybackTarget]);
  const readCursors = historyMode ? historyCursors : liveReadCursors;
  const replayCursorIndex = historyMode ? (replayIndex ?? 0) : replayIndex;
  const replayCursor = replayCursorIndex === null ? null : (readCursors[replayCursorIndex] ?? null);
  const isReplaying = replayCursor !== null;
  const visibleActIndex = replayCursor?.actIndex ?? actIndex;
  const visiblePageIndex = replayCursor?.pageIndex ?? pageIndex;
  const visibleAct = (historyMode ? historyActs : acts)[visibleActIndex];
  const visibleBeat = visibleAct?.beats[visiblePageIndex];
  const rikoExpression = getRikoPortraitExpression(visibleBeat, visibleActIndex);
  const harunaExpression = rikoExpression ? null : getHarunaPortraitExpression(visibleBeat, visibleActIndex);
  const portraitRig = visibleBeat?.lalaExpression
    ? LALA_PORTRAIT_RIG
    : rikoExpression
      ? RIKO_PORTRAIT_RIG
      : harunaExpression
        ? HARUNA_PORTRAIT_RIG
        : null;
  const portraitExpression = visibleBeat?.lalaExpression ?? rikoExpression ?? harunaExpression;
  const isPortraitSpeaking =
    (portraitRig?.id === 'lala' && visibleBeat?.speaker === '菈菈') ||
    (portraitRig?.id === 'haruna' && visibleBeat?.speaker === '西连寺春菜') ||
    (portraitRig?.id === 'riko' && /^(?:夕崎梨子|梨子)$/u.test(visibleBeat?.speaker ?? ''));
  const nameplateSpeaker = visibleBeat?.speaker ?? (rikoExpression ? RIKO_PORTRAIT_RIG.displayName : null);
  const speakerNameplate = getSpeakerNameplateAsset(nameplateSpeaker);
  const assistantHistory = useMemo<RawStoryEntry[]>(
    () =>
      messageHistory
        .map((message, index) => ({ message, index }))
        .filter(
          ({ message }) => !message.is_user && message.extra.role === 'assistant' && message.extra.source === 'tavern',
        )
        .sort((left, right) => left.index - right.index),
    [messageHistory],
  );
  const contextFloorIds = useMemo(
    () =>
      storyArchives
        .filter(archive => archive.actIndex < actIndex && archive.activeFloorId !== null)
        .sort((left, right) => left.actIndex - right.actIndex)
        .map(archive => archive.activeFloorId as string),
    [actIndex, storyArchives],
  );

  const closeRawHistory = useCallback(() => {
    setIsRawHistoryOpen(false);
    globalThis.setTimeout(() => storyRef.current?.focus(), 0);
  }, []);
  const exitHistory = useCallback(() => onExitHistory?.(), [onExitHistory]);

  const requestGeneration = useCallback(async () => {
    if (!entryReason || !beginGeneration()) return;
    setIsRawHistoryOpen(false);
    const period = PERIODS[periodIndex] ?? PERIODS[0];
    const floorId = createLalaArrivalFloorId(actIndex);
    const request = {
      floorId,
      actIndex,
      entryReason,
      playerName,
      day,
      period: period.key,
      location: currentLocationId,
      contextFloorIds,
      chatHistory: messageHistory,
    };

    try {
      const generated = await generateLalaArrivalAct(request);
      if (!generated.ok) {
        console.warn('[ToLove Story] AI 返回未能转换成 GAL，已保留原文。', generated.error);
        failGeneration(generated.error, generated.messages, generated.floor);
        return;
      }
      setStoryActContent(generated.floor, generated.messages);
    } catch (error) {
      console.error('[ToLove Story] 第一集生成失败。', error);
      const message = getErrorMessage(error);
      const floor = createLalaArrivalFloor(request, null, 'tavern', [], 'request_error', message);
      failGeneration(message, [], floor);
    }
  }, [
    beginGeneration,
    actIndex,
    currentLocationId,
    contextFloorIds,
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

  useEffect(() => {
    setReplayIndex(historyMode ? 0 : null);
    setHistoryPlaybackTarget(null);
    setIsRawHistoryOpen(false);
  }, [activeEventId, actIndex, historyMode]);

  const finishCurrentAct = useCallback(() => {
    if (!isLastLiveAct) {
      advanceMainStoryAct();
      return;
    }
    if (completeMainStoryEvent()) spawnTargetsForPeriod(PERIODS[0].key);
  }, [advanceMainStoryAct, completeMainStoryEvent, isLastLiveAct, spawnTargetsForPeriod]);

  const useFallbackAct = useCallback(() => {
    if (!entryReason) return;
    const period = PERIODS[periodIndex] ?? PERIODS[0];
    const floorId = createLalaArrivalFloorId(actIndex);
    const fallbackAct = createLalaArrivalFallbackAct(entryReason, actIndex);
    const request = {
      floorId,
      actIndex,
      entryReason,
      playerName,
      day,
      period: period.key,
      location: currentLocationId,
      contextFloorIds,
      chatHistory: messageHistory,
    };
    const messages = createFallbackLalaArrivalMessages(request, actToPlainText(fallbackAct));
    const floor = createLalaArrivalFloor(request, fallbackAct, 'fallback', messages, 'accepted');
    setStoryActContent(floor, messages);
  }, [
    actIndex,
    contextFloorIds,
    currentLocationId,
    day,
    entryReason,
    messageHistory,
    periodIndex,
    playerName,
    setStoryActContent,
  ]);

  const playAllHistory = useCallback(() => {
    setHistoryPlaybackTarget({ kind: 'all' });
    setReplayIndex(0);
  }, []);

  const previewHistoryFloor = useCallback((floorId: string) => {
    setHistoryPlaybackTarget({ kind: 'floor', floorId });
    setReplayIndex(0);
  }, []);

  const returnToHistoryArchive = useCallback(() => {
    setHistoryPlaybackTarget(null);
    setReplayIndex(0);
  }, []);

  const goNext = useCallback(() => {
    if (historyMode) {
      const currentIndex = replayCursorIndex ?? 0;
      if (currentIndex >= readCursors.length - 1) returnToHistoryArchive();
      else setReplayIndex(currentIndex + 1);
      return;
    }
    if (replayIndex !== null) {
      if (replayIndex >= readCursors.length - 2) setReplayIndex(null);
      else setReplayIndex(replayIndex + 1);
      return;
    }
    if (!liveAct || !liveBeat) return;
    if (!isLastLivePage) {
      setStoryPosition(actIndex, pageIndex + 1);
      return;
    }
    finishCurrentAct();
  }, [
    actIndex,
    finishCurrentAct,
    isLastLivePage,
    liveAct,
    liveBeat,
    historyMode,
    pageIndex,
    readCursors.length,
    replayCursorIndex,
    replayIndex,
    returnToHistoryArchive,
    setStoryPosition,
  ]);

  const goPrevious = useCallback(() => {
    if (historyMode) {
      const currentIndex = replayCursorIndex ?? 0;
      if (currentIndex > 0) setReplayIndex(currentIndex - 1);
      return;
    }
    if (replayIndex !== null) {
      if (replayIndex > 0) setReplayIndex(replayIndex - 1);
      return;
    }
    if (readCursors.length <= 1) return;
    setReplayIndex(readCursors.length - 2);
  }, [historyMode, readCursors.length, replayCursorIndex, replayIndex]);

  useEffect(() => {
    const isReady = historyMode
      ? historyPlaybackTarget !== null && Boolean(visibleAct && visibleBeat)
      : activeEventId === LALA_ARRIVAL_EVENT_ID && generationStatus === 'ready';
    if (!isReady) return;
    storyRef.current?.focus();
  }, [activeEventId, generationStatus, historyMode, historyPlaybackTarget, visibleAct, visibleBeat]);

  useEffect(() => {
    const isReady = historyMode
      ? historyPlaybackTarget !== null && Boolean(visibleAct && visibleBeat)
      : activeEventId === LALA_ARRIVAL_EVENT_ID && generationStatus === 'ready';
    if (!isReady || isRawHistoryOpen) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      const target = event.target;
      if (
        target instanceof HTMLElement &&
        target.closest('button, a, input, textarea, select, .gal-main-story__raw-dialog')
      ) {
        return;
      }
      if (historyMode && event.key === 'Escape') {
        event.preventDefault();
        returnToHistoryArchive();
        return;
      }
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
  }, [
    activeEventId,
    generationStatus,
    goNext,
    goPrevious,
    historyMode,
    historyPlaybackTarget,
    isRawHistoryOpen,
    returnToHistoryArchive,
    visibleAct,
    visibleBeat,
  ]);

  const isLiveStoryActive = activeEventId === LALA_ARRIVAL_EVENT_ID;
  if (!isLiveStoryActive && !historyMode) return null;

  if (historyMode && historyPlaybackTarget === null) {
    return (
      <StoryHistoryArchive
        rawAssistantCount={assistantHistory.length}
        isRawHistoryOpen={isRawHistoryOpen}
        onExit={exitHistory}
        onOpenRawHistory={() => setIsRawHistoryOpen(true)}
        onPlayAll={playAllHistory}
        onPreviewFloor={previewHistoryFloor}
      >
        {isRawHistoryOpen && <RawStoryHistoryDialog entries={assistantHistory} onClose={closeRawHistory} />}
      </StoryHistoryArchive>
    );
  }

  if (!historyMode && (generationStatus !== 'ready' || !liveAct || !liveBeat)) {
    const isError = generationStatus === 'error';
    return (
      <section
        className="gal-main-story is-generating"
        ref={storyRef}
        role="dialog"
        aria-modal="true"
        aria-label={isError ? '第一集生成失败' : '第一集生成中'}
        tabIndex={-1}
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
              {assistantHistory.length > 0 && (
                <button type="button" onClick={() => setIsRawHistoryOpen(true)}>
                  查看 AI 原文
                </button>
              )}
              <button type="button" onClick={useFallbackAct}>
                使用保底版
              </button>
            </div>
          )}
        </div>
        {isRawHistoryOpen && <RawStoryHistoryDialog entries={assistantHistory} onClose={closeRawHistory} />}
      </section>
    );
  }

  if (!visibleAct || !visibleBeat) return null;

  const actMeta = LALA_ARRIVAL_STORY.acts[visibleActIndex];
  const background = LALA_ARRIVAL_STORY.backgrounds[visibleBeat.background];
  const previousDisabled = isReplaying ? replayCursorIndex === 0 : readCursors.length <= 1;
  const isLastHistoryPage = historyMode && replayCursorIndex !== null && replayCursorIndex >= readCursors.length - 1;
  const isLastReplayPage = !historyMode && isReplaying && replayIndex !== null && replayIndex >= readCursors.length - 2;
  const historyFloorArchive = historyFloor
    ? storyArchives.find(archive => archive.floors.some(floor => floor.floorId === historyFloor.floorId))
    : undefined;
  const historyFloorIndex =
    historyFloorArchive?.floors.findIndex(floor => floor.floorId === historyFloor?.floorId) ?? -1;
  const isHistoryFloorActive = Boolean(historyFloor && historyFloorArchive?.activeFloorId === historyFloor.floorId);
  const nextActionLabel = historyMode
    ? isLastHistoryPage
      ? '返回剧情目录'
      : '下一页'
    : isLastReplayPage
      ? '返回当前剧情'
      : isLastLiveAct && isLastLivePage
        ? '结束剧情'
        : isLastLivePage
          ? '回到自由行动'
          : '下一页';

  return (
    <section
      className="gal-main-story"
      ref={storyRef}
      role="dialog"
      aria-modal="true"
      aria-label={historyMode ? `已读主线回放：${LALA_ARRIVAL_STORY.title}` : `主线事件：${LALA_ARRIVAL_STORY.title}`}
      tabIndex={-1}
      data-event-id={historyMode ? 'history-replay' : activeEventId}
      data-act-id={visibleAct.id}
      data-page-index={visiblePageIndex}
      data-speaker={visibleBeat.speaker ?? 'narration'}
      data-speaker-ui={speakerNameplate ? 'galbox-nameplate' : visibleBeat.speaker ? 'generic-nameplate' : 'narration'}
      data-lala-expression={visibleBeat.lalaExpression ?? 'hidden'}
      data-haruna-expression={harunaExpression ?? 'hidden'}
      data-riko-expression={rikoExpression ?? 'hidden'}
      data-portrait-character={portraitRig?.id ?? 'hidden'}
      data-background={visibleBeat.background}
      data-effect={visibleBeat.effect}
      data-replay={isReplaying ? 'true' : 'false'}
      data-generation-source={historyFloor?.source ?? generationSource ?? 'unknown'}
      onClick={goNext}
    >
      <img
        key={`${visibleAct.id}-${visiblePageIndex}-${visibleBeat.background}`}
        className="gal-main-story__background"
        src={resolveAssetPath(background)}
        alt={STORY_BACKGROUND_ALT[visibleBeat.background]}
      />
      <div className="gal-main-story__shade" aria-hidden="true" />
      <div className="gal-main-story__act-label">
        {isReplaying && '回放中 · '}第 {visibleActIndex + 1} 幕 · {actMeta?.title ?? visibleAct.id}
        {historyFloorIndex >= 0 && ` · 楼层 ${historyFloorIndex + 1}`}
      </div>

      {portraitRig && portraitExpression && (
        <LayeredPortrait
          key={portraitRig.id}
          rig={portraitRig}
          expression={portraitExpression}
          isSpeaking={isPortraitSpeaking}
          beatKey={visibleActIndex * 100 + visiblePageIndex}
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
          <div className="gal-main-story__nameplate" role="img" aria-label={nameplateSpeaker ?? undefined}>
            <img src={resolveAssetPath(speakerNameplate)} alt="" aria-hidden="true" />
            <strong>{nameplateSpeaker}</strong>
          </div>
        ) : (
          visibleBeat.speaker && <strong className="gal-main-story__speaker">{visibleBeat.speaker}</strong>
        )}

        <div className="gal-main-story__copy" aria-live="polite" aria-atomic="true">
          <p className={visibleBeat.speaker ? '' : 'is-narration'}>{visibleBeat.text}</p>
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
            {isReplaying && '回放 '}
            {visibleActIndex + 1}-{visiblePageIndex + 1} / {LALA_ARRIVAL_STORY.acts.length}-{visibleAct.beats.length}
          </span>
          <button
            type="button"
            className="gal-main-story__skip"
            onClick={historyMode ? returnToHistoryArchive : isReplaying ? () => setReplayIndex(null) : finishCurrentAct}
            aria-label={historyMode ? '返回剧情目录' : isReplaying ? '返回当前剧情' : '跳过当前幕'}
          >
            {historyMode ? '返回目录' : isReplaying ? '返回当前' : '跳过'}
          </button>
          {historyMode ? (
            historyFloor ? (
              <button
                type="button"
                className="gal-main-story__raw-button"
                disabled={isHistoryFloorActive || historyFloor.act === null}
                onClick={() => selectStoryFloor(historyFloor.floorId)}
              >
                {isHistoryFloorActive ? '当前采用' : '采用此楼层'}
              </button>
            ) : (
              <button type="button" className="gal-main-story__raw-button" disabled>
                全部当前版
              </button>
            )
          ) : (
            <button
              type="button"
              className="gal-main-story__raw-button"
              disabled={assistantHistory.length === 0}
              aria-haspopup="dialog"
              aria-controls="gal-main-story-raw-dialog"
              aria-expanded={isRawHistoryOpen}
              onClick={() => setIsRawHistoryOpen(true)}
            >
              AI 原文
            </button>
          )}
          <button
            type="button"
            className="gal-main-story__icon-button is-primary"
            onClick={goNext}
            aria-label={nextActionLabel}
            title={nextActionLabel}
          >
            {isLastHistoryPage || isLastReplayPage ? '↩' : isLastLiveAct && isLastLivePage ? '✓' : '→'}
          </button>
        </nav>
      </div>
      {isRawHistoryOpen && <RawStoryHistoryDialog entries={assistantHistory} onClose={closeRawHistory} />}
    </section>
  );
}
