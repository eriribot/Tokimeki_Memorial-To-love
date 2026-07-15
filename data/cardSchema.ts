import type {
  CharacterBookEntry,
  CharacterCard,
  CharacterCardData,
  CharacterGameData,
  LegacyCharacterCard,
} from '../types';

export const CARD_SPEC_VERSION = '2.0';

const DEFAULT_GAME_DATA: CharacterGameData = {
  id: '',
  color: '#ff8fab',
  type: '未知系',
  favoriteLocations: ['classroom'],
  stats: { affection: 0, friendship: 0, romance: 0 },
  events: [],
  chibi_image: null,
  portrait_image: null,
  tachie_image: null,
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function toStringArray(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === 'string') : [];
}

export function createCardTemplate(): CharacterCard {
  return {
    spec: 'chara_card_v2',
    spec_version: CARD_SPEC_VERSION,
    data: {
      name: '',
      description: '',
      personality: '',
      scenario: '',
      first_mes: '',
      mes_example: '',
      creator_notes: '',
      system_prompt: '',
      post_history_instructions: '',
      alternate_greetings: [],
      character_book: {
        name: '',
        description: '',
        scan_depth: 2,
        token_budget: 512,
        recursive_scanning: false,
        extensions: {},
        entries: [],
      },
      tags: [],
      creator: '',
      character_version: '',
      extensions: { game_data: { ...DEFAULT_GAME_DATA, stats: { ...DEFAULT_GAME_DATA.stats } } },
    },
  };
}

export function createWorldbookEntry(): CharacterBookEntry {
  return {
    id: 0,
    keys: [],
    content: '',
    extensions: {},
    enabled: true,
    insertion_order: 100,
    case_sensitive: false,
    name: '',
    priority: 10,
    comment: '',
    selective: true,
    secondary_keys: [],
    constant: false,
    position: 'after_char',
  };
}

export function isValidCard(card: unknown): card is CharacterCard | LegacyCharacterCard {
  if (!isRecord(card)) return false;

  if (card.spec === 'chara_card_v2') {
    return isRecord(card.data) && typeof card.data.name === 'string' && card.data.name.length > 0;
  }

  return typeof card.name === 'string' && card.name.length > 0;
}

export function upgradeCardV1toV2(v1Card: LegacyCharacterCard): CharacterCard {
  const template = createCardTemplate();
  return {
    spec: 'chara_card_v2',
    spec_version: CARD_SPEC_VERSION,
    data: {
      ...template.data,
      name: v1Card.name,
      description: v1Card.description ?? '',
      personality: v1Card.personality ?? '',
      scenario: v1Card.scenario ?? '',
      first_mes: v1Card.first_mes ?? '',
      mes_example: v1Card.mes_example ?? '',
      creator_notes: v1Card.creator_notes ?? '',
      system_prompt: v1Card.system_prompt ?? '',
      post_history_instructions: v1Card.post_history_instructions ?? '',
      alternate_greetings: v1Card.alternate_greetings ?? [],
      character_book: v1Card.character_book ?? { entries: [] },
      tags: v1Card.tags ?? [],
      creator: v1Card.creator ?? '',
      character_version: v1Card.character_version ?? '',
      extensions: {
        ...v1Card.extensions,
        game_data: { ...DEFAULT_GAME_DATA, stats: { ...DEFAULT_GAME_DATA.stats } },
      },
    },
  };
}

function normalizeGameData(value: unknown): CharacterGameData {
  const source = isRecord(value) ? value : {};
  const rawStats = isRecord(source.stats) ? source.stats : {};
  const locations = toStringArray(source.favoriteLocations).filter(
    (location): location is CharacterGameData['favoriteLocations'][number] =>
      ['gate', 'classroom', 'library', 'cafeteria', 'gym', 'musicRoom', 'rooftop', 'courtyard'].includes(location),
  );

  return {
    id: typeof source.id === 'string' ? source.id : DEFAULT_GAME_DATA.id,
    color: typeof source.color === 'string' ? source.color : DEFAULT_GAME_DATA.color,
    type: typeof source.type === 'string' ? source.type : DEFAULT_GAME_DATA.type,
    favoriteLocations: locations.length > 0 ? locations : [...DEFAULT_GAME_DATA.favoriteLocations],
    stats: {
      affection: typeof rawStats.affection === 'number' ? rawStats.affection : 0,
      friendship: typeof rawStats.friendship === 'number' ? rawStats.friendship : 0,
      romance: typeof rawStats.romance === 'number' ? rawStats.romance : 0,
    },
    events: Array.isArray(source.events) ? source.events : [],
    chibi_image: typeof source.chibi_image === 'string' ? source.chibi_image : null,
    portrait_image: typeof source.portrait_image === 'string' ? source.portrait_image : null,
    tachie_image: typeof source.tachie_image === 'string' ? source.tachie_image : null,
  };
}

export function normalizeCard(rawCard: unknown): CharacterCard {
  if (!isValidCard(rawCard)) throw new Error('Invalid card format');

  const card: CharacterCard =
    rawCard.spec === 'chara_card_v2' ? (rawCard as CharacterCard) : upgradeCardV1toV2(rawCard as LegacyCharacterCard);
  const template = createCardTemplate();
  const rawData = card.data as CharacterCardData;
  const extensions: Record<string, unknown> = isRecord(rawData.extensions) ? rawData.extensions : {};

  return {
    ...card,
    spec: 'chara_card_v2',
    spec_version: typeof card.spec_version === 'string' ? card.spec_version : CARD_SPEC_VERSION,
    data: {
      ...template.data,
      ...rawData,
      alternate_greetings: toStringArray(rawData.alternate_greetings),
      tags: toStringArray(rawData.tags),
      character_book: rawData.character_book ?? { entries: [] },
      extensions: {
        ...extensions,
        game_data: normalizeGameData(extensions.game_data),
      },
    },
  };
}
