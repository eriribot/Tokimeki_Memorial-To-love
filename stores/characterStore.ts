import { create } from 'zustand';
import harukaCard from '../data/default-cards/haruka.json';
import miyukiCard from '../data/default-cards/miyuki.json';
import rinCard from '../data/default-cards/rin.json';
import rikoCard from '../data/default-cards/riko.json';
import sakuraCard from '../data/default-cards/sakura.json';
import type { CharacterStore } from '../types';
import { useCardStore } from './cardStore';

const DEFAULT_CARDS: readonly unknown[] = [rikoCard, sakuraCard, harukaCard, miyukiCard, rinCard];

async function initializeDefaultCards(): Promise<void> {
  const cardStore = useCardStore.getState();
  if (cardStore.targets.length > 0) return;

  for (const card of DEFAULT_CARDS) {
    await useCardStore.getState().addCardFromJSON(card);
  }
}

export const useCharacterStore = create<CharacterStore>(() => ({
  characters: useCardStore.getState().targets,
  spawnForPeriod: periodKey => useCardStore.getState().spawnTargetsForPeriod(periodKey),
  addAffection: (id, amount) => useCardStore.getState().addAffection(id, amount),
  resetCharacters: () => useCardStore.getState().resetTargets(),
  getCardStore: () => useCardStore.getState(),
}));

useCardStore.subscribe(state => {
  useCharacterStore.setState({ characters: state.targets });
});

void initializeDefaultCards();
