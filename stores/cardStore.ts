import { create } from 'zustand';
import { allocateCharacterLocations } from '../services/characterLocationAllocation';
import type { CardAddResult, CardLoadResult, CardStore } from '../types';
import { cardToCharacter, loadCardFromJSON } from '../utils/cardLoader';

function getErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

export { getTargetLocationForContext, getTargetLocationForPeriod } from '../services/characterLocationAllocation';

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
    syncTargetLocations: context =>
      set(state => {
        const assignments = allocateCharacterLocations(state.targets, context);
        const targets = state.targets.map(target => ({
          ...target,
          currentLocationId: assignments.get(target.id) ?? null,
        }));
        const activeTargetId = targets.some(
          target => target.id === state.activeTargetId && target.currentLocationId !== null,
        )
          ? state.activeTargetId
          : (targets.find(target => target.currentLocationId !== null)?.id ?? null);
        return { targets, activeTargetId };
      }),
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
          currentLocationId: null,
        })),
        activeTargetId: null,
        error: null,
      })),
  };
});
