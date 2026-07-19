import { useGameStore } from '../stores/gameStore';
import { usePlayerStore } from '../stores/playerStore';
import { useCardStore } from '../stores/cardStore';
import { gameSaveApi } from '../save';
import { syncCharacterPresence } from './characterPresence';

export function startNewSession() {
  useGameStore.getState().resetGameState();
  usePlayerStore.getState().resetPlayer();

  const cards = useCardStore.getState();
  cards.resetTargets();
  syncCharacterPresence();
}

export function resumeSession() {
  useGameStore.getState().resumeSession();
}

export function returnToStart() {
  const game = useGameStore.getState();
  if (game.hasSession && game.screen === 'game') {
    void gameSaveApi.save().catch(error => {
      console.error('[ToLove Save] 返回标题前的自动存档失败。', error);
    });
  }

  useGameStore.getState().returnToStart();
}
