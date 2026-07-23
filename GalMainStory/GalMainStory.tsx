import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  actToPlainText,
  createFallbackStoryMessages,
  createStoryFloor,
  createStoryFloorId,
  generateStoryAct,
} from '../services/tavernStoryGeneration';
import { PERIODS, useGameStore } from '../stores/gameStore';
import { usePlayerStore } from '../stores/playerStore';
import { syncCharacterPresence } from '../services/characterPresence';
import { getCanonicalStoryTimeline } from '../memory/storyTimeline';
import { resolveAssetPath } from '../utils/assetPath';
import {
  getSpeakerNameplateAsset,
  getStoryCharacter,
  getStoryPortraitRig,
  isStoryCharacterId,
  isStoryCharacterSpeaking,
} from './characters';
import { GALBOX_ASSETS } from './galAssets';
import LayeredPortrait from './LayeredPortrait';
import { getEpisodeStoryActs, getPreviousActiveStoryFloors } from './storyArchive';
import {
  createMainStoryFallbackAct,
  getMainStoryActIndex,
  getMainStoryEpisode,
  resolveMainStoryPortraitId,
} from './storyRegistry';
import RawStoryHistoryDialog from './RawStoryHistoryDialog';
import { getStoryScene } from './scenes';
import StoryHistoryArchive from './StoryHistoryArchive';
import { buildRawStoryArchive } from './storyRawArchive';
import type { GalStoryFloor } from './storyTypes';
import './GalMainStory.css';

interface StoryCursor {
  actIndex: number;
  pageIndex: number;
}

interface GalMainStoryProps {
  historyMode?: boolean;
  onExitHistory?: () => void;
}

type HistoryPlaybackTarget =
  { kind: 'all'; eventId: string } | { kind: 'floor'; eventId: string; floorId: string } | null;
type RawHistoryTarget = { floorId: string | null } | null;

function getErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

export default function GalMainStory({ historyMode = false, onExitHistory }: GalMainStoryProps) {
  const storyRun = useGameStore(state => state.mainStory.run);
  const storyArchives = useGameStore(state => state.mainStory.archives);
  const generation = useGameStore(state => state.mainStory.generation);
  const messageHistory = useGameStore(state => state.mainStory.messages);
  const day = useGameStore(state => state.day);
  const periodIndex = useGameStore(state => state.periodIndex);
  const currentLocationId = useGameStore(state => state.currentLocationId);
  const beginGeneration = useGameStore(state => state.beginMainStoryGeneration);
  const setStoryActContent = useGameStore(state => state.setMainStoryActContent);
  const failGeneration = useGameStore(state => state.failMainStoryGeneration);
  const setStoryPosition = useGameStore(state => state.setMainStoryPosition);
  const selectStoryFloor = useGameStore(state => state.selectMainStoryFloor);
  const finishMainStoryAct = useGameStore(state => state.finishMainStoryAct);
  const playerName = usePlayerStore(state => state.name);
  const storyRef = useRef<HTMLElement | null>(null);
  const [replayIndex, setReplayIndex] = useState<number | null>(null);
  const [historyPlaybackTarget, setHistoryPlaybackTarget] = useState<HistoryPlaybackTarget>(null);
  const [rawHistoryTarget, setRawHistoryTarget] = useState<RawHistoryTarget>(null);
  const isRawHistoryOpen = rawHistoryTarget !== null;
  const activeEventId = storyRun?.phase === 'playing' ? storyRun.eventId : null;
  const activeActId = storyRun?.phase === 'playing' ? storyRun.actId : null;
  const activeEpisode = getMainStoryEpisode(activeEventId);
  const actIndex = activeEventId && activeActId ? getMainStoryActIndex(activeEventId, activeActId) : 0;
  const pageIndex = storyRun?.phase === 'playing' ? storyRun.pageIndex : 0;
  const acts = useMemo(
    () =>
      activeEpisode
        ? getEpisodeStoryActs(
            storyArchives,
            activeEpisode.id,
            activeEpisode.acts.map(act => act.id),
          )
        : [],
    [activeEpisode, storyArchives],
  );
  const generationStatus = generation.status;
  const generationSource = generation.source;
  const generationError = generation.error;

  const liveAct = acts[actIndex];
  const liveBeat = liveAct?.beats[pageIndex];
  const isLastLivePage = Boolean(liveAct && pageIndex === liveAct.beats.length - 1);
  const isLastLiveAct = Boolean(activeEpisode && actIndex === activeEpisode.acts.length - 1);
  const liveReadCursors = useMemo<StoryCursor[]>(
    () =>
      acts.flatMap((savedAct, savedActIndex) => {
        if (!savedAct) return [];
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
      if (archive.eventId !== historyPlaybackTarget.eventId) continue;
      const floor = archive.floors.find(candidate => candidate.floorId === historyPlaybackTarget.floorId);
      if (floor) return floor;
    }
    return null;
  }, [historyPlaybackTarget, storyArchives]);
  const historyActs = useMemo(() => {
    const eventId = historyPlaybackTarget?.eventId;
    if (!eventId) return [];
    const episode = getMainStoryEpisode(eventId);
    if (!episode) return [];
    const previewActs = getEpisodeStoryActs(
      storyArchives,
      eventId,
      episode.acts.map(act => act.id),
    );
    if (!historyFloor?.act) return previewActs;
    const historyActIndex = getMainStoryActIndex(historyFloor.eventId, historyFloor.actId);
    if (historyActIndex >= 0) previewActs[historyActIndex] = historyFloor.act;
    return previewActs;
  }, [historyFloor, historyPlaybackTarget, storyArchives]);
  const historyCursors = useMemo<StoryCursor[]>(() => {
    if (!historyPlaybackTarget) return [];
    if (historyPlaybackTarget.kind === 'floor' && historyFloor?.act) {
      const historyActIndex = getMainStoryActIndex(historyFloor.eventId, historyFloor.actId);
      if (historyActIndex < 0) return [];
      return historyFloor.act.beats.map((_, savedPageIndex) => ({
        actIndex: historyActIndex,
        pageIndex: savedPageIndex,
      }));
    }
    return historyActs.flatMap((savedAct, savedActIndex) =>
      savedAct
        ? savedAct.beats.map((_, savedPageIndex) => ({
            actIndex: savedActIndex,
            pageIndex: savedPageIndex,
          }))
        : [],
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
  const presentation = visibleBeat?.presentation;
  const focusCharacterId =
    presentation?.focusCharacterId && isStoryCharacterId(presentation.focusCharacterId)
      ? presentation.focusCharacterId
      : null;
  const portraitCharacter = focusCharacterId ? getStoryCharacter(focusCharacterId) : null;
  const visibleEventId = historyPlaybackTarget?.eventId ?? activeEventId;
  const visibleEpisode = getMainStoryEpisode(visibleEventId);
  const resolvedPortraitId = visibleEventId
    ? resolveMainStoryPortraitId(visibleEventId, visibleAct?.id, presentation)
    : (presentation?.portraitId ?? null);
  const portraitRig = focusCharacterId ? getStoryPortraitRig(focusCharacterId, resolvedPortraitId) : null;
  const portraitExpressionId = presentation?.expressionId ?? null;
  const isPortraitSpeaking = isStoryCharacterSpeaking(portraitCharacter, visibleBeat?.speaker);
  const nameplateSpeaker = visibleBeat?.speaker ?? null;
  const speakerNameplate = getSpeakerNameplateAsset(nameplateSpeaker);
  const rawStoryArchive = useMemo(
    () => buildRawStoryArchive(storyArchives, messageHistory),
    [messageHistory, storyArchives],
  );
  const hasRawStoryHistory = rawStoryArchive.some(act => act.versions.length > 0);
  const currentRawAct = rawStoryArchive.find(act => act.eventId === activeEventId && act.actIndex === actIndex);
  const activeCurrentFloorId =
    storyArchives.find(archive => archive.eventId === activeEventId && archive.actId === activeActId)?.activeFloorId ??
    null;
  const activeRawVersion = currentRawAct?.versions.find(version => version.floor.floorId === activeCurrentFloorId);
  const currentRawFloorId =
    activeRawVersion?.floor.floorId ??
    (currentRawAct && currentRawAct.versions.length > 0
      ? (currentRawAct.versions[currentRawAct.versions.length - 1]?.floor.floorId ?? null)
      : null);
  const contextFloorIds = useMemo(
    () =>
      activeEventId && activeActId
        ? getPreviousActiveStoryFloors(storyArchives, activeEventId, activeActId).map(floor => floor.floorId)
        : [],
    [activeActId, activeEventId, storyArchives],
  );
  const historyFloorIds = useMemo(
    () =>
      activeEventId && activeActId
        ? getCanonicalStoryTimeline(storyArchives, { eventId: activeEventId, actId: activeActId }).map(
            floor => floor.floorId,
          )
        : [],
    [activeActId, activeEventId, storyArchives],
  );

  const closeRawHistory = useCallback(() => {
    setRawHistoryTarget(null);
    globalThis.setTimeout(() => storyRef.current?.focus(), 0);
  }, []);
  const openRawHistory = useCallback((floorId: string | null) => setRawHistoryTarget({ floorId }), []);
  const exitHistory = useCallback(() => onExitHistory?.(), [onExitHistory]);

  const requestGeneration = useCallback(async () => {
    if (!activeEventId || !activeActId) return;
    const floorId = createStoryFloorId(activeEventId, activeActId);
    if (!beginGeneration(floorId)) return;
    setRawHistoryTarget(null);
    const period = PERIODS[periodIndex] ?? PERIODS[0];
    const request = {
      eventId: activeEventId,
      actId: activeActId,
      floorId,
      playerName,
      day,
      period: period.key,
      location: currentLocationId,
      contextFloorIds,
      historyFloorIds,
      chatHistory: messageHistory,
    };

    try {
      const generated = await generateStoryAct(request);
      if (!generated.ok) {
        console.warn('[ToLove Story] AI 返回未能转换成 GAL，已保留原文。', generated.error);
        failGeneration(generated.error, generated.messages, generated.floor);
        return;
      }
      setStoryActContent(generated.floor, generated.messages);
    } catch (error) {
      console.error('[ToLove Story] 主线生成失败。', error);
      const message = getErrorMessage(error);
      const floor = createStoryFloor(request, null, 'tavern', [], 'request_error', message);
      failGeneration(message, [], floor);
    }
  }, [
    beginGeneration,
    activeActId,
    activeEventId,
    currentLocationId,
    contextFloorIds,
    day,
    failGeneration,
    historyFloorIds,
    messageHistory,
    periodIndex,
    playerName,
    setStoryActContent,
  ]);

  useEffect(() => {
    if (activeEpisode && generationStatus === 'idle') {
      void requestGeneration();
    }
  }, [activeEpisode, generationStatus, requestGeneration]);

  useEffect(() => {
    setReplayIndex(historyMode ? 0 : null);
    setHistoryPlaybackTarget(null);
    setRawHistoryTarget(null);
  }, [activeEventId, actIndex, historyMode]);

  const finishCurrentAct = useCallback(() => {
    if (finishMainStoryAct()) syncCharacterPresence();
  }, [finishMainStoryAct]);

  const useFallbackAct = useCallback(() => {
    if (!activeEventId || !activeActId) return;
    const period = PERIODS[periodIndex] ?? PERIODS[0];
    const floorId = createStoryFloorId(activeEventId, activeActId);
    if (!beginGeneration(floorId)) return;
    const fallbackAct = createMainStoryFallbackAct(activeEventId, activeActId);
    const request = {
      eventId: activeEventId,
      actId: activeActId,
      floorId,
      playerName,
      day,
      period: period.key,
      location: currentLocationId,
      contextFloorIds,
      historyFloorIds,
      chatHistory: messageHistory,
    };
    const messages = createFallbackStoryMessages(request, actToPlainText(fallbackAct));
    const floor = createStoryFloor(request, fallbackAct, 'fallback', messages, 'accepted');
    setStoryActContent(floor, messages);
  }, [
    activeActId,
    activeEventId,
    beginGeneration,
    contextFloorIds,
    currentLocationId,
    day,
    historyFloorIds,
    messageHistory,
    periodIndex,
    playerName,
    setStoryActContent,
  ]);

  const playAllHistory = useCallback((eventId: string) => {
    setHistoryPlaybackTarget({ kind: 'all', eventId });
    setReplayIndex(0);
  }, []);

  const previewHistoryFloor = useCallback(
    (floorId: string) => {
      const floor = storyArchives.flatMap(archive => archive.floors).find(candidate => candidate.floorId === floorId);
      if (!floor) return;
      setHistoryPlaybackTarget({ kind: 'floor', eventId: floor.eventId, floorId });
      setReplayIndex(0);
    },
    [storyArchives],
  );

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
      if (activeActId) setStoryPosition(activeActId, pageIndex + 1);
      return;
    }
    finishCurrentAct();
  }, [
    activeActId,
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
      : activeEpisode !== null && generationStatus === 'ready';
    if (!isReady) return;
    storyRef.current?.focus();
  }, [activeEpisode, generationStatus, historyMode, historyPlaybackTarget, visibleAct, visibleBeat]);

  useEffect(() => {
    const isReady = historyMode
      ? historyPlaybackTarget !== null && Boolean(visibleAct && visibleBeat)
      : activeEpisode !== null && generationStatus === 'ready';
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
    activeEpisode,
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

  const isLiveStoryActive = activeEpisode !== null;
  if (!isLiveStoryActive && !historyMode) return null;

  if (historyMode && historyPlaybackTarget === null) {
    return (
      <StoryHistoryArchive
        isRawHistoryOpen={isRawHistoryOpen}
        onExit={exitHistory}
        onOpenRawHistory={openRawHistory}
        onPlayAll={playAllHistory}
        onPreviewFloor={previewHistoryFloor}
      >
        {rawHistoryTarget && (
          <RawStoryHistoryDialog
            acts={rawStoryArchive}
            initialFloorId={rawHistoryTarget.floorId}
            onClose={closeRawHistory}
          />
        )}
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
        aria-label={isError ? `${activeEpisode?.title ?? '主线'}生成失败` : `${activeEpisode?.title ?? '主线'}生成中`}
        tabIndex={-1}
        data-generation-status={generationStatus}
      >
        <img
          className="gal-main-story__background"
          src={resolveAssetPath(getStoryScene('night').asset)}
          alt={getStoryScene('night').alt}
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
              {hasRawStoryHistory && (
                <button type="button" onClick={() => openRawHistory(currentRawFloorId)}>
                  查看 AI 原文
                </button>
              )}
              <button type="button" onClick={useFallbackAct}>
                使用保底版
              </button>
            </div>
          )}
        </div>
        {rawHistoryTarget && (
          <RawStoryHistoryDialog
            acts={rawStoryArchive}
            initialFloorId={rawHistoryTarget.floorId}
            onClose={closeRawHistory}
          />
        )}
      </section>
    );
  }

  if (!visibleAct || !visibleBeat) return null;

  const actMeta = visibleEpisode?.acts[visibleActIndex];
  const scene = getStoryScene(visibleBeat.presentation.sceneId);
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
      aria-label={
        historyMode
          ? `已读主线回放：${visibleEpisode?.title ?? '未知主线'}`
          : `主线事件：${activeEpisode?.title ?? '未知主线'}`
      }
      tabIndex={-1}
      data-event-id={historyMode ? 'history-replay' : activeEventId}
      data-act-id={visibleAct.id}
      data-page-index={visiblePageIndex}
      data-speaker={visibleBeat.speaker ?? 'narration'}
      data-speaker-ui={speakerNameplate ? 'galbox-nameplate' : visibleBeat.speaker ? 'generic-nameplate' : 'narration'}
      data-focus-character={focusCharacterId ?? 'hidden'}
      data-portrait-id={portraitRig?.id ?? 'hidden'}
      data-expression-id={portraitExpressionId ?? 'hidden'}
      data-background={visibleBeat.presentation.sceneId}
      data-effect={visibleBeat.presentation.effect}
      data-replay={isReplaying ? 'true' : 'false'}
      data-generation-source={historyFloor?.source ?? generationSource ?? 'unknown'}
      onClick={goNext}
    >
      <img
        key={`${visibleAct.id}-${visiblePageIndex}-${visibleBeat.presentation.sceneId}`}
        className="gal-main-story__background"
        src={resolveAssetPath(scene.asset)}
        alt={scene.alt}
      />
      <div className="gal-main-story__shade" aria-hidden="true" />
      <div className="gal-main-story__act-label">
        {isReplaying && '回放中 · '}第 {visibleActIndex + 1} 幕 · {actMeta?.title ?? visibleAct.id}
        {historyFloorIndex >= 0 && ` · 楼层 ${historyFloorIndex + 1}`}
      </div>

      {portraitRig && portraitExpressionId && (
        <LayeredPortrait
          key={`${portraitRig.characterId}-${portraitRig.id}`}
          rig={portraitRig}
          expressionId={portraitExpressionId}
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
            {visibleActIndex + 1}-{visiblePageIndex + 1} / {visibleEpisode?.acts.length ?? historyActs.length}-
            {visibleAct.beats.length}
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
              disabled={!hasRawStoryHistory}
              aria-haspopup="dialog"
              aria-controls="gal-main-story-raw-dialog"
              aria-expanded={isRawHistoryOpen}
              onClick={() => openRawHistory(currentRawFloorId)}
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
      {rawHistoryTarget && (
        <RawStoryHistoryDialog
          acts={rawStoryArchive}
          initialFloorId={rawHistoryTarget.floorId}
          onClose={closeRawHistory}
        />
      )}
    </section>
  );
}
