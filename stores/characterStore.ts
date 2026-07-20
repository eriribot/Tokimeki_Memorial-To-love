import { create } from 'zustand';
import harukaCard from '../data/default-cards/haruka.json';
import harunaCard from '../data/default-cards/haruna.json';
import miyukiCard from '../data/default-cards/miyuki.json';
import rinCard from '../data/default-cards/rin.json';
import rikoCard from '../data/default-cards/riko.json';
import sakuraCard from '../data/default-cards/sakura.json';
import { syncCharacterPresence } from '../services/characterPresence';
import type { CharacterCard, CharacterStore, GameCharacter } from '../types';
import { useCardStore } from './cardStore';

const DEFAULT_CARDS: readonly unknown[] = [rikoCard, sakuraCard, harunaCard, harukaCard, miyukiCard, rinCard];
const RIKO_LEGACY_CHIBIS = new Set(['/artsource/characters/miyuki.png', '/artsource/chibis/riko.png']);
const RIKO_CHIBI = '/artsource/chibis/riko.png';

function readDefaultCardId(card: unknown): string | null {
  const gameData = (card as { data?: { extensions?: { game_data?: { id?: unknown } } } })?.data?.extensions
    ?.game_data;
  return typeof gameData?.id === 'string' && gameData.id.trim().length > 0 ? gameData.id : null;
}

function migrateRikoCardChibi(card: CharacterCard): CharacterCard {
  const gameData = card.data.extensions.game_data;
  if (gameData.id !== 'riko' || !gameData.chibi_image || !RIKO_LEGACY_CHIBIS.has(gameData.chibi_image)) return card;

  return {
    ...card,
    data: {
      ...card.data,
      extensions: {
        ...card.data.extensions,
        game_data: {
          ...gameData,
          chibi_image: RIKO_CHIBI,
        },
      },
    },
  };
}

function migrateBundledCharacterAssets(): void {
  const state = useCardStore.getState();
  let changed = false;

  const targets = state.targets.map((target): GameCharacter => {
    if (target.id !== 'riko' || !RIKO_LEGACY_CHIBIS.has(target.chibi)) return target;
    changed = true;
    return {
      ...target,
      chibi: RIKO_CHIBI,
      _cardData: migrateRikoCardChibi(target._cardData),
    };
  });
  const loadedCards = state.loadedCards.map(card => {
    const migrated = migrateRikoCardChibi(card);
    if (migrated !== card) changed = true;
    return migrated;
  });

  if (changed) useCardStore.setState({ targets, loadedCards });
}

/** Seeds bundled default cards that are missing from targets — notably saves
    written before a new character shipped — and migrates known stale bundled
    asset paths without overwriting imported/custom character cards. */
export async function syncDefaultCards(): Promise<void> {
  migrateBundledCharacterAssets();
  for (const card of DEFAULT_CARDS) {
    const id = readDefaultCardId(card);
    if (!id) continue;
    if (useCardStore.getState().targets.some(target => target.id === id)) continue;
    await useCardStore.getState().addCardFromJSON(card);
  }
  syncCharacterPresence();
}

async function initializeDefaultCards(): Promise<void> {
  await syncDefaultCards();
}

export const useCharacterStore = create<CharacterStore>(() => ({
  characters: useCardStore.getState().targets,
  syncPresence: syncCharacterPresence,
  addAffection: (id, amount) => useCardStore.getState().addAffection(id, amount),
  resetCharacters: () => useCardStore.getState().resetTargets(),
  getCardStore: () => useCardStore.getState(),
}));

useCardStore.subscribe(state => {
  useCharacterStore.setState({ characters: state.targets });
});

void initializeDefaultCards();
