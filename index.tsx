import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import './index.css';
import { PERIODS, useGameStore } from './stores/gameStore';
import { useCardStore } from './stores/cardStore';
import { worldbookReader } from './data/worldbook'; // 引入不会自动运行的酒馆世界书读取与扫描桥接层。
import { gameSaveApi } from './save';
import { initializeAssetBase, installRuntimeFonts } from './utils/assetPath';

window.__WEBGAME_ASSET_BASE__ = initializeAssetBase();
installRuntimeFonts();
window.advanceTime = () => undefined;
window.toloveSave = gameSaveApi;
window.toloveWorldbook = worldbookReader; // 暴露显式调试入口，但不在页面加载时自动读取、注入或监听世界书。
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
    time: period.time,
    location: game.currentLocationId,
    scene: game.currentSceneId ?? 'school-map',
    activeTargetId: card.activeTargetId,
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
