/* Node-side verification: restoring an OLD save (targets without haruna)
   must re-seed the missing bundled characters via syncDefaultCards. */
import { useCardStore } from '../stores/cardStore';
import { useGameStore } from '../stores/gameStore';
import { createGameSnapshot, restoreGameSnapshot } from '../save/snapshot';
import { startNewSession } from '../services/gameSession';

function assert(condition: boolean, message: string) {
  if (!condition) throw new Error(message);
  console.log('PASS:', message);
}

async function flushMicrotasks(rounds = 20) {
  for (let index = 0; index < rounds; index += 1) {
    await new Promise(resolve => setTimeout(resolve, 10));
  }
}

async function main() {
  startNewSession();
  await flushMicrotasks();

  const seeded = useCardStore.getState().targets.map(target => target.id);
  assert(seeded.includes('haruna'), `新开局应包含 haruna，实际：${seeded.join(',')}`);
  assert(seeded.length === 6, `默认角色应为 6 人，实际 ${seeded.length}`);

  // Simulate an old save written before haruna shipped.
  const oldSnapshot = createGameSnapshot();
  oldSnapshot.cards.targets = oldSnapshot.cards.targets.filter(target => target.id !== 'haruna');
  oldSnapshot.cards.loadedCards = oldSnapshot.cards.loadedCards.filter(
    card => card.data.extensions.game_data.id !== 'haruna',
  );
  assert(oldSnapshot.cards.targets.length === 5, '旧存档快照应只有 5 个目标');

  restoreGameSnapshot(JSON.parse(JSON.stringify(oldSnapshot)));
  assert(
    !useCardStore.getState().targets.some(target => target.id === 'haruna'),
    '恢复覆盖后 haruna 应暂时缺席（验证旧存档确实没有她）',
  );

  await flushMicrotasks();
  const restored = useCardStore.getState().targets;
  const haruna = restored.find(target => target.id === 'haruna');
  assert(Boolean(haruna), `旧存档恢复后应补种 haruna，实际：${restored.map(target => target.id).join(',')}`);
  assert(restored.length === 6, `恢复后目标应为 6 人，实际 ${restored.length}`);
  const period = useGameStore.getState().periodIndex;
  console.log('当前 periodIndex:', period, 'haruna.currentLocationId:', haruna?.currentLocationId);
  assert(haruna?.currentLocationId === 'classroom', '早晨补种后 haruna 应出现在教室');

  // Restoring a save that already has haruna must not duplicate her.
  const newSnapshot = createGameSnapshot();
  restoreGameSnapshot(JSON.parse(JSON.stringify(newSnapshot)));
  await flushMicrotasks();
  const count = useCardStore.getState().targets.filter(target => target.id === 'haruna').length;
  assert(count === 1, `重复恢复不应产生重复 haruna，实际 ${count}`);

  console.log('ALL OK');
}

main().catch(error => {
  console.error('FAIL:', error);
  process.exit(1);
});
