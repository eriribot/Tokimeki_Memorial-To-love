import { normalizeCard } from '../data/cardSchema';
import type { CardLoadResult, CharacterCard, GameCharacter, LocationId } from '../types';

export type CardSource = string | File | unknown;

export interface MultipleCardLoadResult {
  index: number;
  success: boolean;
  card: CharacterCard | null;
  error: string | null;
}

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

export async function loadCardFromFile(file: File): Promise<CardLoadResult> {
  try {
    if (file.type === 'image/png') {
      return loadCardFromJSON(await extractCardFromPNG(file));
    }

    if (file.type === 'application/json' || file.name.endsWith('.json')) {
      return loadCardFromJSON(JSON.parse(await file.text()) as unknown);
    }

    return { success: false, error: 'Unsupported file format' };
  } catch (error) {
    return { success: false, error: getErrorMessage(error) };
  }
}

export async function loadCardFromURL(url: string): Promise<CardLoadResult> {
  try {
    const response = await fetch(url);
    if (!response.ok) throw new Error(`HTTP ${response.status}: ${response.statusText}`);

    const contentType = response.headers.get('content-type');
    if (contentType?.includes('image/png')) {
      const blob = await response.blob();
      return loadCardFromFile(new File([blob], 'card.png', { type: 'image/png' }));
    }

    return loadCardFromJSON((await response.json()) as unknown);
  } catch (error) {
    return { success: false, error: getErrorMessage(error) };
  }
}

async function extractCardFromPNG(file: File): Promise<unknown> {
  const buffer = await file.arrayBuffer();
  const bytes = new Uint8Array(buffer);
  let position = 8;

  while (position + 12 <= bytes.length) {
    const view = new DataView(bytes.buffer, bytes.byteOffset + position, 4);
    const length = view.getUint32(0, false);
    position += 4;

    if (position + 4 + length + 4 > bytes.length) break;
    const type = new TextDecoder('ascii').decode(bytes.subarray(position, position + 4));
    position += 4;

    if (type === 'tEXt') {
      const chunk = bytes.subarray(position, position + length);
      const separator = chunk.indexOf(0);
      if (separator >= 0) {
        const keyword = new TextDecoder('latin1').decode(chunk.subarray(0, separator));
        if (keyword === 'chara') {
          const jsonText = new TextDecoder().decode(chunk.subarray(separator + 1));
          return JSON.parse(jsonText) as unknown;
        }
      }
    }

    position += length + 4;
    if (type === 'IEND') break;
  }

  throw new Error('No character card data found in PNG');
}

export async function loadMultipleCards(sources: readonly CardSource[]): Promise<MultipleCardLoadResult[]> {
  const results = await Promise.allSettled(
    sources.map(source => {
      if (typeof source === 'string') return loadCardFromURL(source);
      if (source instanceof File) return loadCardFromFile(source);
      return loadCardFromJSON(source);
    }),
  );

  return results.map((result, index) => {
    if (result.status === 'rejected') {
      return { index, success: false, card: null, error: getErrorMessage(result.reason) };
    }
    if (!result.value.success) {
      return { index, success: false, card: null, error: result.value.error };
    }
    return { index, success: true, card: result.value.card, error: null };
  });
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
