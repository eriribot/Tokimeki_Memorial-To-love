/**
 * SillyTavern Character Card V2 Schema
 * 参考: https://github.com/SillyTavern/SillyTavern
 */

export const CARD_SPEC_VERSION = '2.0'

/**
 * 完整的卡片数据结构
 */
export const createCardTemplate = () => ({
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
      entries: []
    },
    tags: [],
    creator: '',
    character_version: '',
    extensions: {
      // 游戏特定扩展数据
      game_data: {
        id: '',
        color: '#ff8fab',
        type: '未知系',
        favoriteLocations: ['classroom'],
        stats: {
          affection: 0,
          friendship: 0,
          romance: 0
        },
        events: [],
        chibi_image: null,
        portrait_image: null,
        tachie_image: null
      }
    }
  }
})

/**
 * Worldbook条目结构
 */
export const createWorldbookEntry = () => ({
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
  position: 'after_char'
})

/**
 * 验证卡片是否符合基本结构
 */
export function isValidCard(card) {
  if (!card || typeof card !== 'object') return false

  // 检查基本字段
  if (!card.spec || !card.data) return false

  // V2格式
  if (card.spec === 'chara_card_v2') {
    return !!(card.data.name)
  }

  // V1格式（向后兼容）
  if (card.name) {
    return true
  }

  return false
}

/**
 * 将V1格式升级到V2格式
 */
export function upgradeCardV1toV2(v1Card) {
  return {
    spec: 'chara_card_v2',
    spec_version: CARD_SPEC_VERSION,
    data: {
      name: v1Card.name || '',
      description: v1Card.description || '',
      personality: v1Card.personality || '',
      scenario: v1Card.scenario || '',
      first_mes: v1Card.first_mes || '',
      mes_example: v1Card.mes_example || '',
      creator_notes: v1Card.creator_notes || '',
      system_prompt: '',
      post_history_instructions: '',
      alternate_greetings: v1Card.alternate_greetings || [],
      character_book: v1Card.character_book || {
        entries: []
      },
      tags: v1Card.tags || [],
      creator: v1Card.creator || '',
      character_version: v1Card.character_version || '',
      extensions: v1Card.extensions || {
        game_data: {
          id: '',
          color: '#ff8fab',
          type: '未知系',
          favoriteLocations: ['classroom'],
          stats: { affection: 0, friendship: 0, romance: 0 },
          events: []
        }
      }
    }
  }
}

/**
 * 标准化卡片格式
 */
export function normalizeCard(rawCard) {
  if (!isValidCard(rawCard)) {
    throw new Error('Invalid card format')
  }

  // 如果是V1格式，升级到V2
  if (!rawCard.spec && rawCard.name) {
    rawCard = upgradeCardV1toV2(rawCard)
  }

  // 确保extensions.game_data存在
  if (!rawCard.data.extensions) {
    rawCard.data.extensions = {}
  }
  if (!rawCard.data.extensions.game_data) {
    rawCard.data.extensions.game_data = {
      id: '',
      color: '#ff8fab',
      type: '未知系',
      favoriteLocations: ['classroom'],
      stats: { affection: 0, friendship: 0, romance: 0 },
      events: []
    }
  }

  return rawCard
}
