import { create } from 'zustand';
import type { CardAddResult, CardLoadResult, CardStore, GameCharacter, LocationId, PeriodKey } from '../types';
import { cardToCharacter, loadCardFromFile, loadCardFromJSON, loadCardFromURL } from '../utils/cardLoader';

type LocationResolver = (favoriteLocations: readonly LocationId[]) => LocationId | null;

const PERIOD_LOCATION_RULES: Record<PeriodKey, LocationResolver> = {
  morning: favorites => favorites[0] ?? 'classroom',
  afterSchool: favorites => {
    const firstChoice = favorites[0] ?? 'courtyard';
    return firstChoice === 'classroom' ? (favorites[1] ?? 'courtyard') : firstChoice;
  },
  evening: () => null,
};

function getErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

export function getTargetLocationForPeriod(target: GameCharacter, periodKey: PeriodKey): LocationId | null {
  return PERIOD_LOCATION_RULES[periodKey](target.favoriteLocations);
}

export const useCardStore = create<CardStore>((set, get) => {
  const addLoadedCard = async (load: () => Promise<CardLoadResult>): Promise<CardAddResult> => {
    set({ isLoading: true, error: null });

    try {
      const result = await load();
      if (!result.success) {
        set({ error: result.error, isLoading: false });
        return result;
      }

      const character = cardToCharacter(result.card, get().targets);
      set(state => ({
        targets: [...state.targets, character],
        loadedCards: [...state.loadedCards, result.card],
        activeTargetId: state.activeTargetId ?? character.id,
        isLoading: false,
      }));
      return { success: true, character };
    } catch (error) {
      const message = getErrorMessage(error);
      set({ error: message, isLoading: false });
      return { success: false, error: message };
    }
  };

  return {
    targets: [],
    activeTargetId: null,
    loadedCards: [],
    isLoading: false,
    error: null,

    addCardFromJSON: jsonData => addLoadedCard(() => loadCardFromJSON(jsonData)),
    addCardFromFile: file => addLoadedCard(() => loadCardFromFile(file)),
    addCardFromURL: url => addLoadedCard(() => loadCardFromURL(url)),

    removeTarget: targetId =>
      set(state => {
        const targets = state.targets.filter(target => target.id !== targetId);
        return {
          targets,
          activeTargetId: state.activeTargetId === targetId ? (targets[0]?.id ?? null) : state.activeTargetId,
        };
      }),
    setActiveTarget: targetId => {
      if (get().targets.some(target => target.id === targetId)) set({ activeTargetId: targetId });
    },
    getActiveTarget: () => {
      const { targets, activeTargetId } = get();
      return targets.find(target => target.id === activeTargetId) ?? null;
    },
    getTargetsByLocation: locationId => get().targets.filter(target => target.currentLocationId === locationId),
    updateTarget: (targetId, updates) =>
      set(state => ({
        targets: state.targets.map(target => (target.id === targetId ? { ...target, ...updates } : target)),
      })),
    addAffection: (targetId, amount) =>
      set(state => ({
        targets: state.targets.map(target =>
          target.id === targetId
            ? { ...target, affection: Math.min(100, Math.max(0, target.affection + amount)) }
            : target,
        ),
      })),
    spawnTargetsForPeriod: periodKey =>
      set(state => ({
        targets: state.targets.map(target => ({
          ...target,
          currentLocationId: getTargetLocationForPeriod(target, periodKey),
        })),
      })),
    clearTargets: () =>
      set({
        targets: [],
        activeTargetId: null,
        loadedCards: [],
        error: null,
      }),
    resetTargets: () =>
      set(state => ({
        targets: state.targets.map(target => ({
          ...target,
          affection: 0,
          friendship: 0,
          romance: 0,
          currentLocationId: target.favoriteLocations[0] ?? 'classroom',
        })),
        activeTargetId: state.targets[0]?.id ?? null,
        error: null,
      })),
  };
});
