import { create } from 'zustand';
import harunaCard from '../data/default-cards/haruna.json';
import lalaCard from '../data/default-cards/lala.json';
import momoCard from '../data/default-cards/momo.json';
import rikoCard from '../data/default-cards/riko.json';
import yamiCard from '../data/default-cards/yami.json';
import yuiCard from '../data/default-cards/yui.json';
import { syncCharacterPresence } from '../services/characterPresence';
import type { CharacterCard, CharacterStore, GameCharacter } from '../types';
import { useCardStore } from './cardStore';

const DEFAULT_CARDS: readonly unknown[] = [rikoCard, lalaCard, harunaCard, momoCard, yuiCard, yamiCard];
const RIKO_LEGACY_PORTRAITS = new Set(['/artsource/characters/miyuki.png']);
const RIKO_PORTRAIT = '/artsource/characters/riko.png';

const LEGACY_BUNDLED_CHARACTER_IDS: Readonly<Record<string, { id: string; name: string }>> = {
  haruka: { id: 'momo', name: '梦梦·贝莉雅·戴比路克' },
  rin: { id: 'yami', name: '伊芙' },
  sakura: { id: 'lala', name: '菈菈·薩塔琳·戴比路克' },
  miyuki: { id: 'yui', name: '古手川唯' },
};

function readDefaultCardId(card: unknown): string | null {
  const gameData = (card as { data?: { extensions?: { game_data?: { id?: unknown } } } })?.data?.extensions
    ?.game_data;
  return typeof gameData?.id === 'string' && gameData.id.trim().length > 0 ? gameData.id : null;
}

function resolveBundledCharacterId(id: string, name: string): string {
  const migration = LEGACY_BUNDLED_CHARACTER_IDS[id];
  return migration?.name === name ? migration.id : id;
}

function migrateBundledCard(card: CharacterCard): CharacterCard {
  const gameData = card.data.extensions.game_data;
  const id = resolveBundledCharacterId(gameData.id, card.data.name);
  const portraitImage =
    id === 'riko' && gameData.portrait_image && RIKO_LEGACY_PORTRAITS.has(gameData.portrait_image)
      ? RIKO_PORTRAIT
      : gameData.portrait_image;

  if (id === gameData.id && portraitImage === gameData.portrait_image) return card;

  return {
    ...card,
    data: {
      ...card.data,
      extensions: {
        ...card.data.extensions,
        game_data: {
          ...gameData,
          id,
          portrait_image: portraitImage,
        },
      },
    },
  };
}

function migrateBundledCharacters(): void {
  const state = useCardStore.getState();
  let changed = false;
  const migratedTargetIds = new Map<string, string>();

  const targets = state.targets.map((target): GameCharacter => {
    const id = resolveBundledCharacterId(target.id, target.name);
    const portrait =
      id === 'riko' && RIKO_LEGACY_PORTRAITS.has(target.portrait) ? RIKO_PORTRAIT : target.portrait;
    const card = migrateBundledCard(target._cardData);
    if (id === target.id && portrait === target.portrait && card === target._cardData) return target;

    changed = true;
    if (id !== target.id) migratedTargetIds.set(target.id, id);
    return {
      ...target,
      id,
      portrait,
      _cardData: card,
    };
  });
  const loadedCards = state.loadedCards.map(card => {
    const migrated = migrateBundledCard(card);
    if (migrated !== card) changed = true;
    return migrated;
  });
  const activeTargetId = state.activeTargetId
    ? (migratedTargetIds.get(state.activeTargetId) ?? state.activeTargetId)
    : null;

  if (changed) useCardStore.setState({ targets, loadedCards, activeTargetId });
}

/** Seeds bundled default cards that are missing from targets — notably saves
    written before a new character shipped — and migrates known stale bundled
    identity/asset fields without overwriting unrelated imported cards. */
export async function syncDefaultCards(): Promise<void> {
  migrateBundledCharacters();
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
