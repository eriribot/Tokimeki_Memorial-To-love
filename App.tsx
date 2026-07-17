import { type CSSProperties, useCallback, useEffect, useRef, useState } from 'react';
import SaveSlotModal, { type SaveSlotMode } from './savesolt/SaveSlotModal';
import CardImporter from './components/CardImporter';
import { CalendarCard, DayTransition } from './CalendarModule';
import ClassroomScene from './components/ClassroomScene';
import Controls from './components/Controls';
import EventLog from './components/EventLog';
import MapMenu from './components/MapMenu';
import SchoolMap from './components/SchoolMap';
import CharacterProfileModal from './components/CharacterProfileModal';
import SpecialSkillPanel from './components/SpecialSkillPanel';
import StartScreen from './components/StartScreen';
import StatPanel from './components/StatPanel';
import GalMainStory from './GalMainStory/GalMainStory';
import { DEFAULT_SAVE_SLOT, gameSaveApi, startTavernAutosave } from './save';
import { resumeSession } from './services/gameSession';
import { useGameStore } from './stores/gameStore';
import { useMapStore } from './stores/mapStore';
import { useViewportSize } from './hooks/useViewportSize';
import { resolveAssetPath } from './utils/assetPath';
import screenfull from './vendor/screenfull';
import type { CalendarDateValue } from './types';
import './App.css';
import './enhancements.css';
import './map-enhancements.css';
import './browserPageMode.css';

function App() {
  const { width, height, cellSize } = useMapStore();
  const screen = useGameStore((state: { screen: string }) => state.screen);
  const currentSceneId = useGameStore((state: { currentSceneId: string | null }) => state.currentSceneId);
  const activeMainStoryEventId = useGameStore(state => state.activeMainStoryEventId);
  const mainStoryArchives = useGameStore(state => state.mainStoryArchives);
  const calendarDate = useGameStore(state => state.date);
  const actionPointsRemaining = useGameStore(state => state.actionPointsRemaining);
  const [isSkillPanelOpen, setIsSkillPanelOpen] = useState(false);
  const [isStoryHistoryOpen, setIsStoryHistoryOpen] = useState(false);
  const [saveSlotMode, setSaveSlotMode] = useState<SaveSlotMode | null>(null);
  const [hasPersistedSave, setHasPersistedSave] = useState(false);
  const [hasAutosave, setHasAutosave] = useState(false);
  const [isCheckingSaves, setIsCheckingSaves] = useState(true);
  const [isContinuing, setIsContinuing] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [isNativePageMode, setIsNativePageMode] = useState(false);
  const [pageModeError, setPageModeError] = useState<string | null>(null);
  const [calendarTransition, setCalendarTransition] = useState<{
    from: CalendarDateValue;
    to: CalendarDateValue;
  } | null>(null);
  const appShellRef = useRef<HTMLDivElement | null>(null);
  const previousCalendarDateRef = useRef(calendarDate);
  const viewportSize = useViewportSize();
  const mapWidth = width * cellSize;
  const mapHeight = height * cellSize;
  const availableMapWidth = Math.max(320, viewportSize.width - 32);
  const availableMapHeight = Math.max(240, viewportSize.height - 240);
  const mapScale = Math.min(1, availableMapWidth / mapWidth, availableMapHeight / mapHeight);
  const isPageMode = isNativePageMode;
  const isMainStoryActive = activeMainStoryEventId !== null;
  const hasMainStoryHistory = mainStoryArchives.some(
    archive =>
      archive.activeFloorId !== null &&
      archive.floors.some(floor => floor.floorId === archive.activeFloorId && floor.act !== null),
  );
  const isStoryHistoryMode = isStoryHistoryOpen && hasMainStoryHistory && !isMainStoryActive;
  const isStoryOverlayOpen = isMainStoryActive || isStoryHistoryMode;
  const viewportStyle = {
    '--tolove-viewport-width': `${viewportSize.width}px`,
    '--tolove-viewport-height': `${viewportSize.height}px`,
  } as CSSProperties;

  const closeSaveSlots = useCallback(() => setSaveSlotMode(null), []);
  const updateSaveAvailability = useCallback((hasSaves: boolean) => setHasPersistedSave(hasSaves), []);

  const exitPageMode = useCallback(async () => {
    setPageModeError(null);

    if (!screenfull.isFullscreen) {
      setIsNativePageMode(false);
      return;
    }

    try {
      // 复用 screenfull 的跨浏览器退出流程，旧 WebKit 也使用对应的方法和事件名。
      await screenfull.exit();
    } catch (error) {
      console.warn('[ToLove Fullscreen] 浏览器原生全屏退出失败。', error);
    }
  }, []);

  const enterPageMode = useCallback(async () => {
    if (screenfull.isFullscreen) return;
    setPageModeError(null);

    try {
      const fullscreenTarget = appShellRef.current;
      if (!fullscreenTarget || !screenfull.isEnabled) {
        throw new Error('当前浏览器不支持页面全屏接口');
      }

      // 只全屏现有应用节点，不创建 iframe、不复制样式，也不搬运 React 组件树。
      await screenfull.request(fullscreenTarget, { navigationUI: 'hide' });
      console.info('[ToLove Fullscreen] 已通过内置 screenfull 精简实现进入游戏全屏。');
    } catch (error) {
      const detail = error instanceof Error ? error.message : String(error);
      console.warn('[ToLove Fullscreen] 无法进入全屏模式。', error);
      setPageModeError(`无法进入全屏：${detail}`);
    }
  }, []);

  useEffect(() => {
    if (isMainStoryActive || !hasMainStoryHistory) setIsStoryHistoryOpen(false);
  }, [hasMainStoryHistory, isMainStoryActive]);

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsNativePageMode(screenfull.element === appShellRef.current);
    };
    const handleFullscreenError = () => setPageModeError('浏览器拒绝了全屏请求，请检查 iframe 全屏权限。');

    screenfull.on('change', handleFullscreenChange);
    screenfull.on('error', handleFullscreenError);
    return () => {
      screenfull.off('change', handleFullscreenChange);
      screenfull.off('error', handleFullscreenError);
    };
  }, []);

  useEffect(() => {
    const previousDate = previousCalendarDateRef.current;
    const dateChanged =
      previousDate.year !== calendarDate.year ||
      previousDate.month !== calendarDate.month ||
      previousDate.day !== calendarDate.day;

    if (dateChanged) {
      setCalendarTransition({ from: previousDate, to: calendarDate });
      previousCalendarDateRef.current = calendarDate;
    }
  }, [calendarDate]);

  useEffect(
    () =>
      startTavernAutosave({
        onSaved: () => {
          setHasAutosave(true);
          setHasPersistedSave(true);
          setSaveError(null);
        },
        onError: error => {
          console.error('[ToLove Save] 自动存档失败。', error);
          setSaveError(`酒馆本地自动存档失败：${error.message}`);
        },
      }),
    [],
  );

  useEffect(() => {
    if (screen !== 'start') return;

    let cancelled = false;
    setIsCheckingSaves(true);

    const checkSaves = async () => {
      try {
        await gameSaveApi.probe(true);
        const result = await gameSaveApi.list();
        if (!cancelled) {
          setHasAutosave(result.saves.some(save => save.slotId === DEFAULT_SAVE_SLOT));
          setHasPersistedSave(result.saves.length > 0);
          setSaveError(null);
        }
      } catch (error) {
        console.warn('[ToLove Save] 无法检查已有存档。', error);
        if (!cancelled) {
          const detail = error instanceof Error ? error.message : String(error);
          setSaveError(`无法读取酒馆本地文件存档：${detail}`);
        }
      } finally {
        if (!cancelled) setIsCheckingSaves(false);
      }
    };

    void checkSaves();
    return () => {
      cancelled = true;
    };
  }, [screen]);

  const handleContinue = () => {
    if (useGameStore.getState().hasSession) {
      resumeSession();
      return;
    }

    if (hasAutosave) {
      setIsContinuing(true);
      setSaveError(null);
      void gameSaveApi
        .load(DEFAULT_SAVE_SLOT)
        .catch(error => {
          const detail = error instanceof Error ? error.message : String(error);
          console.error('[ToLove Save] 自动存档读取失败。', error);
          setSaveError(`自动存档读取失败：${detail}`);
        })
        .finally(() => setIsContinuing(false));
      return;
    }

    if (hasPersistedSave) {
      setSaveSlotMode('load');
      return;
    }

    resumeSession();
  };

  const interfaceContent = (
    <div
      ref={appShellRef}
      className={`tolove-app-shell ${isPageMode ? 'is-page-mode' : 'is-embedded-mode'}`}
      style={viewportStyle}
    >
      <button
        type="button"
        className="browser-page-mode-button"
        aria-pressed={isPageMode}
        title={isPageMode ? '退出浏览器全屏（Esc）' : '进入浏览器原生全屏'}
        onClick={() => {
          void (isPageMode ? exitPageMode() : enterPageMode());
        }}
      >
        <span className="browser-page-mode-icon" aria-hidden="true">
          {isPageMode ? '×' : '⛶'}
        </span>
        <span className="browser-page-mode-label">{isPageMode ? '退出全屏' : '全屏游玩'}</span>
      </button>

      {pageModeError && (
        <p className="browser-page-mode-error" role="status">
          {pageModeError}
        </p>
      )}

      {screen === 'start' ? (
        <StartScreen
          hasPersistedSave={hasPersistedSave}
          isCheckingSaves={isCheckingSaves || isContinuing}
          onContinue={handleContinue}
          saveError={saveError}
        />
      ) : (
        <div className="app">
          <header className="game-header" aria-label="To LOVE-Ru">
            <img className="game-header-title" src={resolveAssetPath('/artsource/ui/title.png')} alt="To LOVE-Ru" />
          </header>

          <main className="game-layout">
            <section className="play-section">
              <div
                className="map-section"
                style={{
                  width: mapWidth * mapScale,
                  height: mapHeight * mapScale,
                }}
              >
                <div
                  className="map-stage"
                  inert={isStoryOverlayOpen ? true : undefined}
                  aria-hidden={isStoryOverlayOpen ? true : undefined}
                  style={{
                    width: mapWidth,
                    height: mapHeight,
                    transform: `scale(${mapScale})`,
                  }}
                >
                  {currentSceneId ? (
                    <ClassroomScene />
                  ) : (
                    <SchoolMap
                      hasStoryHistory={hasMainStoryHistory}
                      onOpenStoryHistory={() => setIsStoryHistoryOpen(true)}
                    />
                  )}
                </div>
                {!currentSceneId && !isStoryOverlayOpen && (
                  <CalendarCard
                    className="game-calendar-card"
                    date={calendarDate}
                    actionsRemaining={actionPointsRemaining}
                    animateCorner={actionPointsRemaining === 0}
                    dayUnit="日"
                    showMonth
                  />
                )}
                {!isStoryOverlayOpen && <CharacterProfileModal />}
                {!currentSceneId && !isStoryOverlayOpen && (
                  <MapMenu onOpenSave={() => setSaveSlotMode('save')} onOpenLoad={() => setSaveSlotMode('load')} />
                )}
                {!isStoryOverlayOpen && isSkillPanelOpen && (
                  <SpecialSkillPanel onClose={() => setIsSkillPanelOpen(false)} />
                )}
                <GalMainStory
                  historyMode={isStoryHistoryMode}
                  onExitHistory={() => setIsStoryHistoryOpen(false)}
                />
              </div>

              <div
                className={`map-bottom-panel ${isStoryOverlayOpen ? 'is-story-locked' : ''}`}
                inert={isStoryOverlayOpen ? true : undefined}
                aria-hidden={isStoryOverlayOpen ? true : undefined}
              >
                <StatPanel />
                <Controls onOpenSkills={() => setIsSkillPanelOpen(true)} />
              </div>
            </section>
          </main>

          <CardImporter />
          <EventLog />
          {calendarTransition && (
            <DayTransition
              open
              from={calendarTransition.from}
              to={calendarTransition.to}
              currentActionsRemaining={0}
              nextActionsRemaining={2}
              onComplete={() => setCalendarTransition(null)}
            />
          )}
        </div>
      )}

      {saveSlotMode && (
        <SaveSlotModal mode={saveSlotMode} onClose={closeSaveSlots} onSavesChanged={updateSaveAvailability} />
      )}
    </div>
  );

  return interfaceContent;
}

export default App;
