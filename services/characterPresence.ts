import { useCardStore } from '../stores/cardStore';
import { PERIODS, useGameStore } from '../stores/gameStore';

export function syncCharacterPresence(): void {
  const game = useGameStore.getState();
  const period = PERIODS[game.periodIndex] ?? PERIODS[0];
  useCardStore.getState().syncTargetLocations({
    periodKey: period.key,
    completedMainStoryEventIds: game.completedMainStoryEventIds,
  });
}
