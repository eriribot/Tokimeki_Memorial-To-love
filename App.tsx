import { type CSSProperties, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import SaveSlotModal, { type SaveSlotMode } from './savesolt/SaveSlotModal';
import { CalendarCard, DateModule, DayTransition } from './CalendarModule';
import { buildCalendarSpecialDateCatalog } from './CalendarModule/specialDates';
import ClassroomScene from './components/ClassroomScene';
import Controls from './components/Controls';
import EventLog from './components/EventLog';
import DictionaryPanel from './components/DictionaryPanel';
import MapMenu from './components/MapMenu';
import SchoolMap from './components/SchoolMap';
import CharacterProfileModal from './components/CharacterProfileModal';
import CharacterArchivePanel from './components/CharacterArchivePanel';
import SpecialSkillPanel from './components/SpecialSkillPanel';
import ContextPreviewModal from './components/ContextPreviewModal';
import MemorySummaryProgress from './components/MemorySummaryProgress';
import { queueMemorySummaryAfterAutosave } from './memory/summaryRuntime';
import SystemSettingsModal from './components/SystemSettingsModal';
import StartScreen from './components/StartScreen';
import PlayerRegistration from './start/PlayerRegistration';
import GalMainStory from './GalMainStory/GalMainStory';
import { gameSaveApi, startTavernAutosave } from './save';
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
import './components/SpecialSkillPanel.css';

function App() {
  const { width, height, cellSize } = useMapStore();
  const screen = useGameStore((state: { screen: string }) => state.screen);
  const currentSceneId = useGameStore((state: { currentSceneId: string | null }) => state.currentSceneId);
  const returnToStart = useGameStore(state => state.returnToStart);
  const mainStoryRun = useGameStore(state => state.mainStory.run);
  const storyArchives = useGameStore(state => state.mainStory.archives);
  const calendarDate = useGameStore(state => state.date);
  const actionPointsRemaining = useGameStore(state => state.actionPointsRemaining);
  const calendarSpecialDates = useMemo(() => buildCalendarSpecialDateCatalog(), []);
  const [isSkillPanelOpen, setIsSkillPanelOpen] = useState(false);
  const [isStoryHistoryOpen, setIsStoryHistoryOpen] = useState(false);
  const [saveSlotMode, setSaveSlotMode] = useState<SaveSlotMode | null>(null);
  const [isContextPreviewOpen, setIsContextPreviewOpen] = useState(false);
  const [isCharacterArchiveOpen, setIsCharacterArchiveOpen] = useState(false);
  const [isDictionaryOpen, setIsDictionaryOpen] = useState(false);
  const [isSystemSettingsOpen, setIsSystemSettingsOpen] = useState(false);
  const [isDateModuleOpen, setIsDateModuleOpen] = useState(false);
  const [hasPersistedSave, setHasPersistedSave] = useState(false);
  const [isCheckingSaves, setIsCheckingSaves] = useState(true);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [isNativePageMode, setIsNativePageMode] = useState(false);
  const [pageModeError, setPageModeError] = useState<string | null>(null);
  const [calendarTransition, setCalendarTransition] = useState<{
    from: CalendarDateValue;
    to: CalendarDateValue;
  } | null>(null);
  const appShellRef = useRef<HTMLDivElement | null>(null);
  const calendarLauncherRef = useRef<HTMLButtonElement | null>(null);
  const previousCalendarDateRef = useRef(calendarDate);
  const viewportSize = useViewportSize();
  const mapWidth = width * cellSize;
  const mapHeight = height * cellSize;
  const availableMapWidth = Math.max(320, viewportSize.width - 32);
  // The bottom stat block was removed; reclaim its space while keeping the map inside the app shell.
  const availableMapHeight = Math.max(240, viewportSize.height - 200);
  const mapScale = Math.min(1, availableMapWidth / mapWidth, availableMapHeight / mapHeight);
  const skillFrameWidth = Math.min(mapWidth, availableMapWidth);
  const skillFrameHeight = Math.min(mapHeight, Math.max(320, viewportSize.height - 124));
  const isPageMode = isNativePageMode;
  const isMainStoryActive = mainStoryRun?.phase === 'playing';
  const hasMainStoryHistory = storyArchives.some(
    archive =>
      archive.activeFloorId !== null &&
      archive.floors.some(floor => floor.floorId === archive.activeFloorId && floor.act !== null),
  );
  const isStoryHistoryMode = isStoryHistoryOpen && hasMainStoryHistory && !isMainStoryActive;
  const isStoryOverlayOpen = isMainStoryActive || isStoryHistoryMode;
  const isBlockingDialogOpen =
    isContextPreviewOpen || isCharacterArchiveOpen || isDictionaryOpen || isSystemSettingsOpen || isDateModuleOpen;
  const viewportStyle = {
    '--tolove-viewport-width': `${viewportSize.width}px`,
    '--tolove-viewport-height': `${viewportSize.height}px`,
  } as CSSProperties;

  const closeSaveSlots = useCallback(() => setSaveSlotMode(null), []);
  const closeDateModule = useCallback(() => {
    setIsDateModuleOpen(false);
    globalThis.requestAnimationFrame(() => calendarLauncherRef.current?.focus());
  }, []);
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
    if (isStoryOverlayOpen) {
      setIsSkillPanelOpen(false);
      setIsDateModuleOpen(false);
    }
  }, [isStoryOverlayOpen]);

  useEffect(() => {
    if (currentSceneId) setIsDateModuleOpen(false);
  }, [currentSceneId]);

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
        onSaved: (save, messages) => {
          setHasPersistedSave(true);
          setSaveError(null);
          queueMemorySummaryAfterAutosave(save, messages);
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
        className={`browser-page-mode-button ${isBlockingDialogOpen ? 'is-hidden-by-dialog' : ''}`}
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

      <div inert={isContextPreviewOpen ? true : undefined} aria-hidden={isContextPreviewOpen ? true : undefined}>
        {screen === 'start' ? (
          <StartScreen
            hasPersistedSave={hasPersistedSave}
            isCheckingSaves={isCheckingSaves}
            onContinue={handleContinue}
            saveError={saveError}
          />
        ) : screen === 'registration' ? (
          <PlayerRegistration onCancel={returnToStart} />
        ) : (
          <div className="app">
            <header className="game-header" aria-label="To LOVE-Ru">
              <img className="game-header-title" src={resolveAssetPath('/artsource/ui/title.png')} alt="To LOVE-Ru" />
            </header>

            <main className="game-layout">
              <section className="play-section">
                <div
                  className={`map-section ${isSkillPanelOpen ? 'is-skill-panel-open' : ''} ${
                    isCharacterArchiveOpen ? 'is-character-archive-open' : ''
                  }`}
                  style={{
                    width: isSkillPanelOpen ? skillFrameWidth : mapWidth * mapScale,
                    height: isSkillPanelOpen ? skillFrameHeight : mapHeight * mapScale,
                  }}
                >
                  <div
                    className="map-stage"
                    inert={
                      isStoryOverlayOpen ||
                      isSkillPanelOpen ||
                      isCharacterArchiveOpen ||
                      isDictionaryOpen ||
                      isSystemSettingsOpen ||
                      isDateModuleOpen
                        ? true
                        : undefined
                    }
                    aria-hidden={
                      isStoryOverlayOpen ||
                      isSkillPanelOpen ||
                      isCharacterArchiveOpen ||
                      isDictionaryOpen ||
                      isSystemSettingsOpen ||
                      isDateModuleOpen
                        ? true
                        : undefined
                    }
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
                  {!currentSceneId && <MemorySummaryProgress />}
                  {!currentSceneId &&
                    !isStoryOverlayOpen &&
                    !isSkillPanelOpen &&
                    !isCharacterArchiveOpen &&
                    !isDictionaryOpen &&
                    !isSystemSettingsOpen &&
                    !isDateModuleOpen && (
                      <>
                        <CalendarCard
                          className="game-calendar-card"
                          date={calendarDate}
                          actionsRemaining={actionPointsRemaining}
                          animateCorner={actionPointsRemaining === 1}
                          dayUnit="日"
                          showMonth
                        />
                        <button
                          ref={calendarLauncherRef}
                          type="button"
                          className="game-calendar-launcher"
                          aria-label={`打开日历，当前日期${calendarDate.year}年${calendarDate.month}月${calendarDate.day}日`}
                          title="打开日历"
                          onClick={() => setIsDateModuleOpen(true)}
                        />
                      </>
                    )}
                  {!isStoryOverlayOpen &&
                    !isSkillPanelOpen &&
                    !isCharacterArchiveOpen &&
                    !isDictionaryOpen &&
                    !isSystemSettingsOpen &&
                    !isDateModuleOpen && <CharacterProfileModal />}
                  {!currentSceneId &&
                    !isStoryOverlayOpen &&
                    !isSkillPanelOpen &&
                    !isCharacterArchiveOpen &&
                    !isDictionaryOpen &&
                    !isSystemSettingsOpen &&
                    !isDateModuleOpen && (
                      <MapMenu
                        onOpenSave={() => setSaveSlotMode('save')}
                        onOpenLoad={() => setSaveSlotMode('load')}
                        onOpenIndex={() => setIsContextPreviewOpen(true)}
                        onOpenData={() => setIsCharacterArchiveOpen(true)}
                        onOpenDictionary={() => setIsDictionaryOpen(true)}
                        onOpenSettings={() => setIsSystemSettingsOpen(true)}
                      />
                    )}
                  {!isStoryOverlayOpen && isSkillPanelOpen && (
                    <SpecialSkillPanel onClose={() => setIsSkillPanelOpen(false)} />
                  )}
                  <GalMainStory historyMode={isStoryHistoryMode} onExitHistory={() => setIsStoryHistoryOpen(false)} />
                  {isCharacterArchiveOpen && <CharacterArchivePanel onClose={() => setIsCharacterArchiveOpen(false)} />}
                  {isDictionaryOpen && <DictionaryPanel onClose={() => setIsDictionaryOpen(false)} />}
                  {isSystemSettingsOpen && <SystemSettingsModal onClose={() => setIsSystemSettingsOpen(false)} />}
                  {isDateModuleOpen && (
                    <DateModule date={calendarDate} specialDates={calendarSpecialDates} onClose={closeDateModule} />
                  )}
                </div>

                <div
                  className={`map-bottom-panel ${
                    isStoryOverlayOpen ||
                    isSkillPanelOpen ||
                    isCharacterArchiveOpen ||
                    isDictionaryOpen ||
                    isSystemSettingsOpen ||
                    isDateModuleOpen
                      ? 'is-story-locked'
                      : ''
                  }`}
                  inert={
                    isStoryOverlayOpen ||
                    isSkillPanelOpen ||
                    isCharacterArchiveOpen ||
                    isDictionaryOpen ||
                    isSystemSettingsOpen ||
                    isDateModuleOpen
                      ? true
                      : undefined
                  }
                  aria-hidden={
                    isStoryOverlayOpen ||
                    isSkillPanelOpen ||
                    isCharacterArchiveOpen ||
                    isDictionaryOpen ||
                    isSystemSettingsOpen ||
                    isDateModuleOpen
                      ? true
                      : undefined
                  }
                >
                  <Controls onOpenSkills={() => setIsSkillPanelOpen(true)} />
                </div>
              </section>
            </main>

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
      {isContextPreviewOpen && <ContextPreviewModal onClose={() => setIsContextPreviewOpen(false)} />}
    </div>
  );

  return interfaceContent;
}

export default App;
