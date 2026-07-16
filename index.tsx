import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import './index.css';
import { PERIODS, useGameStore } from './stores/gameStore';
import { useCardStore } from './stores/cardStore';
import { worldbookReader } from './data/worldbook'; // 引入不会自动运行的酒馆世界书读取与扫描桥接层。
import { initializeAssetBase, installRuntimeFonts } from './utils/assetPath';
import { LALA_ARRIVAL_EVENT_ID, LALA_ARRIVAL_STORY } from './GalMainStory/lalaArrival';

window.__WEBGAME_ASSET_BASE__ = initializeAssetBase();
installRuntimeFonts();
window.advanceTime = () => undefined;
window.toloveWorldbook = worldbookReader; // 暴露显式调试入口，但不在页面加载时自动读取、注入或监听世界书。
window.toloveStoryMessages = (format = 'json') => {
  const messages = useGameStore.getState().mainStoryMessages;
  return format === 'jsonl' ? messages.map(message => JSON.stringify(message)).join('\n') : JSON.stringify(messages);
};
window.render_game_to_text = () => {
  const game = useGameStore.getState();
  const card = useCardStore.getState();

  const session = {
    screen: game.screen,
    canContinue: game.hasSession,
    isPlaying: game.isPlaying,
  };

  if (game.screen === 'start') {
    return JSON.stringify(session);
  }

  const period = PERIODS[game.periodIndex] ?? PERIODS[0];
  const currentStoryAct = game.mainStoryActs[game.mainStoryActIndex];
  const currentStoryBeat = currentStoryAct?.beats[game.mainStoryPageIndex];
  const activeMainStory =
    game.activeMainStoryEventId === LALA_ARRIVAL_EVENT_ID
      ? {
          id: LALA_ARRIVAL_STORY.id,
          title: LALA_ARRIVAL_STORY.title,
          entryReason: game.mainStoryEntryReason,
          generationStatus: game.mainStoryGenerationStatus,
          generationSource: game.mainStoryGenerationSource,
          generationError: game.mainStoryGenerationError,
          actIndex: game.mainStoryActIndex,
          actCount: game.mainStoryActs.length,
          messageCount: game.mainStoryMessages.length,
          actId: currentStoryAct?.id ?? null,
          pageIndex: game.mainStoryPageIndex,
          pageCount: currentStoryAct?.beats.length ?? 0,
          speaker: currentStoryBeat?.speaker ?? null,
          text: currentStoryBeat?.text ?? '',
        }
      : null;
  const visibleTargets = card.targets
    .filter(target => target.currentLocationId)
    .map(target => ({
      id: target.id,
      name: target.name,
      location: target.currentLocationId,
      affection: target.affection,
    }));

  return JSON.stringify({
    ...session,
    note: '坐标为学校地图格子坐标，左上角是(0,0)，x向右，y向下。',
    day: game.day,
    date: game.date,
    actionPointsRemaining: game.actionPointsRemaining,
    period: period.key,
    location: game.currentLocationId,
    scene: game.currentSceneId ?? 'school-map',
    activeTargetId: card.activeTargetId,
    activeMainStory,
    completedMainStoryEventIds: game.completedMainStoryEventIds,
    visibleTargets,
  });
};

const mount = () => {
  const root = document.getElementById('root');
  if (!root) {
    return;
  }

  createRoot(root).render(
    <StrictMode>
      <App />
    </StrictMode>,
  );
};

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', mount, { once: true });
} else {
  mount();
}
