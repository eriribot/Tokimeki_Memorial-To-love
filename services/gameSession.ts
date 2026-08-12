import { useGameStore } from '../stores/gameStore';
import { createPlayerProfile, usePlayerStore } from '../stores/playerStore';
import { useCardStore } from '../stores/cardStore';
import { beginNewTavernAutosaveIdentity, gameSaveApi } from '../save';
import { syncCharacterPresence } from './characterPresence';
import { useSkillStore } from '../skilllogic';
import { beginMemorySummaryContextTransition, invalidateMemorySummaryContext } from '../memory/summaryRuntime';
import { captureGameMessages } from '../message';
import type { PlayerProfile, PlayerRegistrationInput } from '../types';

export function startNewSession() {
  const existingProfile = usePlayerStore.getState().profile;
  beginNewTavernAutosaveIdentity();
  invalidateMemorySummaryContext('新游戏已经开始。');
  useGameStore.getState().resetGameState();
  usePlayerStore.getState().resetPlayer();
  useSkillStore.getState().reset();

  const cards = useCardStore.getState();
  cards.resetTargets();
  syncCharacterPresence();

  // 已有玩家资料时直接重开游戏，不再回到新生登记界面。
  if (existingProfile) {
    usePlayerStore.getState().completeRegistration(existingProfile);
    useGameStore.getState().completeRegistration();
    void gameSaveApi.save().catch(error => {
      console.error('[ToLove Save] 重新开始后的首次存档失败。', error);
    });
  }
}

export function resumeSession() {
  useGameStore.getState().resumeSession();
}

export function completeNewSessionRegistration(input: PlayerRegistrationInput): PlayerProfile {
  if (useGameStore.getState().screen !== 'registration') {
    throw new Error('当前不在新生登记阶段，不能提交玩家资料。');
  }
  const profile = createPlayerProfile(input);
  const player = usePlayerStore.getState();
  if (!player.completeRegistration(profile)) {
    throw new Error('玩家资料已经登记，当前新游戏不能再次改名。');
  }
  useGameStore.getState().completeRegistration();
  syncCharacterPresence();
  void gameSaveApi.save().catch(error => {
    console.error('[ToLove Save] 新生登记完成后的首次存档失败。', error);
  });
  return profile;
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
