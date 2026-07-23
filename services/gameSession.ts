import { useGameStore } from '../stores/gameStore';
import { usePlayerStore } from '../stores/playerStore';
import { useCardStore } from '../stores/cardStore';
import { beginNewTavernAutosaveIdentity, gameSaveApi } from '../save';
import { syncCharacterPresence } from './characterPresence';
import { useSkillStore } from '../skilllogic';
import {
  beginMemorySummaryContextTransition,
  invalidateMemorySummaryContext,
} from '../memory/summaryRuntime';
import { captureGameMessages } from '../message';

export function startNewSession() {
  beginNewTavernAutosaveIdentity();
  invalidateMemorySummaryContext('新游戏已经开始。');
  useGameStore.getState().resetGameState();
  usePlayerStore.getState().resetPlayer();
  useSkillStore.getState().reset();

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
    const messages = captureGameMessages();
    const transition = beginMemorySummaryContextTransition('正在保存返回标题前的权威状态。');
    void gameSaveApi
      .save()
      .then(({ save }) => {
        transition.adopt(save, messages, false);
      })
      .catch(error => {
        transition.commitInvalidated();
        console.error('[ToLove Save] 返回标题前的自动存档失败。', error);
      });
  } else {
    invalidateMemorySummaryContext('已经返回标题画面。');
  }

  useGameStore.getState().returnToStart();
}
