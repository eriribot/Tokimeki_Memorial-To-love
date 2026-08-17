import { PLAYER_RESOURCE_MAX, usePlayerStore } from '../stores/playerStore';
import { useCardStore } from '../stores/cardStore';
import { useGameStore } from '../stores/gameStore';
import { isCharacterAvailable } from '../data/characterAvailability';
import type { CharacterRelationshipDelta, CharacterStats, LocationId, PlayerActionSettlement } from '../types';
import { syncCharacterPresence } from './characterPresence';
import { normalizeCharacterRelationshipStats } from './characterRelationship';

export type PaidCharacterInteractionId = 'talk' | 'together' | 'closer';

export interface CharacterInteractionGate {
  available: boolean;
  reason: string | null;
}

export interface ExecuteCharacterInteractionRequest {
  actionId: PaidCharacterInteractionId;
  targetId: string;
  locationId: LocationId;
}

export type ExecuteCharacterInteractionResult =
  { ok: true; settlement: PlayerActionSettlement } | { ok: false; reason: string };

export const CHARACTER_INTERACTION_GATES = {
  together: { friendship: 20 },
  closer: { friendship: 40, romance: 15 },
} as const;

export const CHARACTER_INTERACTION_REWARDS: Readonly<Record<PaidCharacterInteractionId, CharacterRelationshipDelta>> = {
  talk: { friendship: 6, romance: 2 },
  together: { friendship: 7, romance: 3 },
  closer: { friendship: 3, romance: 7 },
};

const CHARACTER_INTERACTION_LOG_LABELS: Readonly<Record<PaidCharacterInteractionId, string>> = {
  talk: '聊了一个小话题',
  together: '一起处理了一件小事',
  closer: '度过了一段更亲近的时光',
};

export function getCharacterInteractionGate(
  character: Pick<CharacterStats, 'affection' | 'friendship' | 'romance'>,
  actionId: PaidCharacterInteractionId,
): CharacterInteractionGate {
  if (actionId === 'talk') return { available: true, reason: null };
  const relationship = normalizeCharacterRelationshipStats(character);

  if (actionId === 'together') {
    const required = CHARACTER_INTERACTION_GATES.together.friendship;
    return relationship.friendship >= required
      ? { available: true, reason: null }
      : { available: false, reason: `友情达到 ${required} 后开放` };
  }

  const { friendship, romance } = CHARACTER_INTERACTION_GATES.closer;
  return relationship.friendship >= friendship && relationship.romance >= romance
    ? { available: true, reason: null }
    : { available: false, reason: `友情 ${friendship}、恋爱 ${romance} 后开放` };
}

/**
 * Re-checks authoritative stores only when the final scene beat is accepted.
 * Opening a scene, browsing topics and reading the event never consumes AP.
 */
export function executeCharacterInteraction(
  request: ExecuteCharacterInteractionRequest,
): ExecuteCharacterInteractionResult {
  const game = useGameStore.getState();
  const player = usePlayerStore.getState();
  const cards = useCardStore.getState();
  const character = cards.targets.find(target => target.id === request.targetId);

  if (game.mainStory.run?.phase === 'playing') return { ok: false, reason: '主线剧情进行中，暂时无法结算互动。' };
  if (game.actionPointsRemaining <= 0) return { ok: false, reason: '今天的行动点已经用完了。' };
  if (player.stamina <= 0) return { ok: false, reason: '你太累了，现在只能休息。' };
  if (player.stress >= PLAYER_RESOURCE_MAX) return { ok: false, reason: '压力已经到达上限，现在只能休息。' };
  if (game.currentSceneId !== request.locationId || game.currentLocationId !== request.locationId) {
    return { ok: false, reason: '地点已经变化，这段互动不能继续结算。' };
  }
  if (!character || character.currentLocationId !== request.locationId) {
    return { ok: false, reason: '对方已经不在这里了。' };
  }
  if (!isCharacterAvailable(character.id, game.mainStory.completedEventIds)) {
    return { ok: false, reason: '这名角色尚未在主线中正式登场。' };
  }

  const gate = getCharacterInteractionGate(character, request.actionId);
  if (!gate.available) return { ok: false, reason: gate.reason ?? '当前关系尚未满足条件。' };

  const settlement = game.settlePlayerAction({
    kind: 'talk',
    message: `你和${character.name}${CHARACTER_INTERACTION_LOG_LABELS[request.actionId]}。`,
  });
  if (!settlement.accepted) return { ok: false, reason: '当前状态无法结算这次互动。' };

  useCardStore.getState().applyRelationshipDelta(request.targetId, CHARACTER_INTERACTION_REWARDS[request.actionId]);
  syncCharacterPresence();
  return { ok: true, settlement };
}
