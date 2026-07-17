import { create } from 'zustand';
import harukaCard from '../data/default-cards/haruka.json';
import harunaCard from '../data/default-cards/haruna.json';
import miyukiCard from '../data/default-cards/miyuki.json';
import rinCard from '../data/default-cards/rin.json';
import rikoCard from '../data/default-cards/riko.json';
import sakuraCard from '../data/default-cards/sakura.json';
import type { CharacterStore } from '../types';
import { useCardStore } from './cardStore';
import { PERIODS, useGameStore } from './gameStore';

const DEFAULT_CARDS: readonly unknown[] = [rikoCard, sakuraCard, harunaCard, harukaCard, miyukiCard, rinCard];

function readDefaultCardId(card: unknown): string | null {
  const gameData = (card as { data?: { extensions?: { game_data?: { id?: unknown } } } })?.data?.extensions
    ?.game_data;
  return typeof gameData?.id === 'string' && gameData.id.trim().length > 0 ? gameData.id : null;
}

/** Seeds bundled default cards that are missing from targets — notably saves
    written before a new character shipped — then re-places everyone for the
    current period so the newcomer lands on the map immediately. */
export async function syncDefaultCards(): Promise<void> {
  let added = false;
  for (const card of DEFAULT_CARDS) {
    const id = readDefaultCardId(card);
    if (!id) continue;
    if (useCardStore.getState().targets.some(target => target.id === id)) continue;
    await useCardStore.getState().addCardFromJSON(card);
    added = true;
  }
  if (added) {
    const periodIndex = useGameStore.getState().periodIndex;
    const period = PERIODS[periodIndex] ?? PERIODS[0];
    useCardStore.getState().spawnTargetsForPeriod(period.key);
  }
}

async function initializeDefaultCards(): Promise<void> {
  const cardStore = useCardStore.getState();
  if (cardStore.targets.length > 0) return;

  await syncDefaultCards();
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
