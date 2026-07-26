import { normalizeCard } from '../data/cardSchema';
import type { CardLoadResult, CharacterCard, GameCharacter, LocationId } from '../types';

function getErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

function isLocationId(value: string): value is LocationId {
  return ['gate', 'classroom', 'library', 'cafeteria', 'gym', 'musicRoom', 'rooftop', 'courtyard'].includes(value);
}

export async function loadCardFromJSON(jsonData: unknown): Promise<CardLoadResult> {
  try {
    return { success: true, card: normalizeCard(jsonData) };
  } catch (error) {
    return { success: false, error: getErrorMessage(error) };
  }
}

export function cardToCharacter(card: CharacterCard, existingCharacters: readonly GameCharacter[] = []): GameCharacter {
  const data = card.data;
  const gameData = data.extensions.game_data;
  let id = gameData.id || data.name.toLowerCase().replace(/\s+/g, '_');
  const baseId = id;
  let counter = 1;

  while (existingCharacters.some(character => character.id === id)) {
    id = `${baseId}_${counter}`;
    counter += 1;
  }

  const favoriteLocations = gameData.favoriteLocations.filter(isLocationId);
  const primaryLocation = favoriteLocations[0] ?? 'classroom';

  return {
    id,
    name: data.name,
    color: gameData.color,
    type: gameData.type || data.tags[0] || '未知系',
    favoriteLocations: favoriteLocations.length > 0 ? favoriteLocations : ['classroom'],
    greeting: data.first_mes || `你好，我是 ${data.name}。`,
    portrait: gameData.portrait_image ?? '/artsource/characters/_placeholder.svg',
    chibi: gameData.chibi_image ?? '/artsource/chibis/_placeholder.svg',
    tachie: gameData.tachie_image,
    affection: gameData.stats.affection,
    friendship: gameData.stats.friendship,
    romance: gameData.stats.romance,
    currentLocationId: primaryLocation,
    _cardData: card,
  };
}
