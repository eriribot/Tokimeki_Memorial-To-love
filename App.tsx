import { useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import SaveSlotModal, { type SaveSlotMode } from './savesolt/SaveSlotModal';
import CardImporter from './components/CardImporter';
import ClassroomScene from './components/ClassroomScene';
import Controls from './components/Controls';
import EventLog from './components/EventLog';
import MapMenu from './components/MapMenu';
import SchoolMap from './components/SchoolMap';
import Sidebar from './components/Sidebar';
import SpecialSkillPanel from './components/SpecialSkillPanel';
import StartScreen from './components/StartScreen';
import StatPanel from './components/StatPanel';
import { gameSaveApi } from './save';
import { resumeSession } from './services/gameSession';
import { useGameStore } from './stores/gameStore';
import { useMapStore } from './stores/mapStore';
import {
  createBrowserPageOverlay,
  type BrowserPageOverlay,
} from './utils/browserPageOverlay';
import { resolveAssetPath } from './utils/assetPath';
import './App.css';
import './enhancements.css';
import './map-enhancements.css';
import './browserPageMode.css';

function useMapScale(mapWidth: number, mapHeight: number, viewportWindow: Window) {
  const [scale, setScale] = useState(1);

  useEffect(() => {
    const updateScale = () => {
      const availableWidth = Math.max(320, viewportWindow.innerWidth - 32);
      const availableHeight = Math.max(240, viewportWindow.innerHeight - 240);
      setScale(Math.min(1, availableWidth / mapWidth, availableHeight / mapHeight));
    };

    updateScale();
    viewportWindow.addEventListener('resize', updateScale);
    return () => viewportWindow.removeEventListener('resize', updateScale);
  }, [mapWidth, mapHeight, viewportWindow]);

  return scale;
}

function App() {
  const { width, height, cellSize } = useMapStore();
  const screen = useGameStore((state: { screen: string }) => state.screen);
  const currentSceneId = useGameStore((state: { currentSceneId: string | null }) => state.currentSceneId);
  const [isSkillPanelOpen, setIsSkillPanelOpen] = useState(false);
  const [saveSlotMode, setSaveSlotMode] = useState<SaveSlotMode | null>(null);
  const [hasPersistedSave, setHasPersistedSave] = useState(false);
  const [isCheckingSaves, setIsCheckingSaves] = useState(true);
  const [pageOverlay, setPageOverlay] = useState<BrowserPageOverlay | null>(null);
  const [isNativePageMode, setIsNativePageMode] = useState(false);
  const [pageModeError, setPageModeError] = useState<string | null>(null);
  const pageOverlayRef = useRef<BrowserPageOverlay | null>(null);
  const mapWidth = width * cellSize;
  const mapHeight = height * cellSize;
  const viewportWindow = pageOverlay?.ownerDocument.defaultView ?? window;
  const mapScale = useMapScale(mapWidth, mapHeight, viewportWindow);
  const isPageMode = pageOverlay !== null || isNativePageMode;

  const closeSaveSlots = useCallback(() => setSaveSlotMode(null), []);
  const updateSaveAvailability = useCallback((hasSaves: boolean) => setHasPersistedSave(hasSaves), []);

  const exitPageMode = useCallback(async () => {
    setPageModeError(null);

    const activeOverlay = pageOverlayRef.current;
    const fullscreenDocument = activeOverlay?.hostDocument ?? document;
    if (activeOverlay) {
      pageOverlayRef.current = null;
      setPageOverlay(null);
    }

    if (fullscreenDocument.fullscreenElement) {
      try {
        await fullscreenDocument.exitFullscreen();
      } catch (error) {
        console.warn('[ToLove Fullscreen] 浏览器原生全屏退出失败。', error);
      }
    }

    if (activeOverlay) {
      window.setTimeout(() => activeOverlay.destroy(), 0);
    }

    setIsNativePageMode(false);
  }, []);

  const enterPageMode = useCallback(async () => {
    if (pageOverlayRef.current || document.fullscreenElement) return;
    setPageModeError(null);

    const overlay = createBrowserPageOverlay();
    if (overlay) {
      try {
        const fullscreenTarget = overlay.hostDocument.documentElement;
        if (!fullscreenTarget.requestFullscreen) {
          throw new Error('当前浏览器不支持 Fullscreen API');
        }

        await fullscreenTarget.requestFullscreen({ navigationUI: 'hide' });
        if (!overlay.hostDocument.fullscreenElement) {
          throw new Error('浏览器没有进入原生全屏状态');
        }

        pageOverlayRef.current = overlay;
        setPageOverlay(overlay);
        window.setTimeout(() => overlay.frame.focus(), 0);
        console.info('[ToLove Fullscreen] 已进入浏览器原生全屏，并挂载 SillyTavern 顶层游戏界面。');
      } catch (error) {
        overlay.destroy();
        const detail = error instanceof Error ? error.message : String(error);
        console.warn('[ToLove Fullscreen] 浏览器拒绝进入原生全屏。', error);
        setPageModeError(`浏览器未允许全屏：${detail}`);
      }
      return;
    }

    try {
      if (!document.documentElement.requestFullscreen) {
        throw new Error('当前浏览器不支持页面全屏接口');
      }

      await document.documentElement.requestFullscreen();
      setIsNativePageMode(true);
      console.info('[ToLove Fullscreen] 已进入当前界面的浏览器原生全屏。');
    } catch (error) {
      const detail = error instanceof Error ? error.message : String(error);
      console.warn('[ToLove Fullscreen] 无法进入全屏模式。', error);
      setPageModeError(`无法覆盖酒馆页面：${detail}`);
    }
  }, []);

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsNativePageMode(document.fullscreenElement === document.documentElement);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  useEffect(() => {
    if (!pageOverlay) return;

    const handleHostFullscreenChange = () => {
      if (pageOverlay.hostDocument.fullscreenElement) return;
      if (pageOverlayRef.current !== pageOverlay) return;

      pageOverlayRef.current = null;
      setPageOverlay(null);
      window.setTimeout(() => pageOverlay.destroy(), 0);
    };

    pageOverlay.hostDocument.addEventListener('fullscreenchange', handleHostFullscreenChange);
    return () => {
      pageOverlay.hostDocument.removeEventListener('fullscreenchange', handleHostFullscreenChange);
    };
  }, [pageOverlay]);

  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key !== 'Escape' || !isPageMode) return;
      event.preventDefault();
      void exitPageMode();
    };

    const documents = new Set<Document>([document]);
    if (pageOverlay) documents.add(pageOverlay.ownerDocument);
    documents.forEach(activeDocument => activeDocument.addEventListener('keydown', handleEscape));

    return () => {
      documents.forEach(activeDocument => activeDocument.removeEventListener('keydown', handleEscape));
    };
  }, [exitPageMode, isPageMode, pageOverlay]);

  useEffect(() => {
    const cleanup = () => {
      const activeOverlay = pageOverlayRef.current;
      if (activeOverlay?.hostDocument.fullscreenElement) {
        void activeOverlay.hostDocument.exitFullscreen().catch(() => undefined);
      }
      activeOverlay?.destroy();
      pageOverlayRef.current = null;
    };

    window.addEventListener('pagehide', cleanup);
    return () => {
      window.removeEventListener('pagehide', cleanup);
      cleanup();
    };
  }, []);

  useEffect(() => {
    if (screen !== 'start') return;

    let cancelled = false;
    setIsCheckingSaves(true);

    const checkSaves = async () => {
      try {
        await gameSaveApi.probe(true);
        const result = await gameSaveApi.list();
        if (!cancelled) setHasPersistedSave(result.saves.length > 0);
      } catch (error) {
        console.warn('[ToLove Save] 无法检查已有存档。', error);
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
    <div className={`tolove-app-shell ${isPageMode ? 'is-page-mode' : 'is-embedded-mode'}`}>
      <button
        type="button"
        className="browser-page-mode-button"
        aria-pressed={isPageMode}
        title={isPageMode ? '退出全屏页面（Esc）' : '覆盖整个酒馆浏览器页面'}
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
          isCheckingSaves={isCheckingSaves}
          onContinue={handleContinue}
        />
      ) : (
        <div className="app">
          <header className="game-header" aria-label="To LOVE-Ru">
            <img
              className="game-header-title"
              src={resolveAssetPath('/artsource/ui/title.png')}
              alt="To LOVE-Ru"
            />
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
                  style={{
                    width: mapWidth,
                    height: mapHeight,
                    transform: `scale(${mapScale})`,
                  }}
                >
                  {currentSceneId ? <ClassroomScene /> : <SchoolMap />}
                </div>
                <Sidebar />
                {!currentSceneId && (
                  <MapMenu onOpenSave={() => setSaveSlotMode('save')} onOpenLoad={() => setSaveSlotMode('load')} />
                )}
                {isSkillPanelOpen && <SpecialSkillPanel onClose={() => setIsSkillPanelOpen(false)} />}
              </div>

              <div className="map-bottom-panel">
                <StatPanel />
                <Controls onOpenSkills={() => setIsSkillPanelOpen(true)} />
              </div>
            </section>
          </main>

          <CardImporter />
          <EventLog />
        </div>
      )}

      {saveSlotMode && (
        <SaveSlotModal mode={saveSlotMode} onClose={closeSaveSlots} onSavesChanged={updateSaveAvailability} />
      )}
    </div>
  );

  return pageOverlay ? createPortal(interfaceContent, pageOverlay.mount, 'tolove-browser-page') : interfaceContent;
}

export default App;
