import { normalizeCard, isValidCard } from '../data/cardSchema'

/**
 * 从JSON对象加载卡片
 */
export async function loadCardFromJSON(jsonData) {
  try {
    const card = normalizeCard(jsonData)
    return {
      success: true,
      card
    }
  } catch (error) {
    return {
      success: false,
      error: error.message
    }
  }
}

/**
 * 从文件加载卡片
 */
export async function loadCardFromFile(file) {
  try {
    // PNG图片中嵌入的卡片数据
    if (file.type === 'image/png') {
      const card = await extractCardFromPNG(file)
      return loadCardFromJSON(card)
    }

    // 纯JSON文件
    if (file.type === 'application/json' || file.name.endsWith('.json')) {
      const text = await file.text()
      const json = JSON.parse(text)
      return loadCardFromJSON(json)
    }

    return {
      success: false,
      error: 'Unsupported file format'
    }
  } catch (error) {
    return {
      success: false,
      error: error.message
    }
  }
}

/**
 * 从URL加载卡片
 */
export async function loadCardFromURL(url) {
  try {
    const response = await fetch(url)
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`)
    }

    const contentType = response.headers.get('content-type')

    if (contentType?.includes('image/png')) {
      const blob = await response.blob()
      const file = new File([blob], 'card.png', { type: 'image/png' })
      return loadCardFromFile(file)
    }

    const json = await response.json()
    return loadCardFromJSON(json)
  } catch (error) {
    return {
      success: false,
      error: error.message
    }
  }
}

/**
 * 从PNG图片的元数据中提取卡片JSON
 * SillyTavern使用PNG的tEXt chunk存储卡片数据
 */
async function extractCardFromPNG(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()

    reader.onload = (e) => {
      try {
        const buffer = e.target.result
        const uint8Array = new Uint8Array(buffer)

        // PNG文件格式: 8字节签名 + 多个chunk
        // 我们寻找 tEXt chunk，关键字为 "chara"
        let pos = 8 // 跳过PNG签名

        while (pos < uint8Array.length) {
          // 读取chunk长度（大端序）
          const length = (uint8Array[pos] << 24) |
                        (uint8Array[pos + 1] << 16) |
                        (uint8Array[pos + 2] << 8) |
                        uint8Array[pos + 3]
          pos += 4

          // 读取chunk类型（4字节ASCII）
          const type = String.fromCharCode(
            uint8Array[pos],
            uint8Array[pos + 1],
            uint8Array[pos + 2],
            uint8Array[pos + 3]
          )
          pos += 4

          // 如果是tEXt chunk
          if (type === 'tEXt') {
            // 读取数据
            const chunkData = uint8Array.slice(pos, pos + length)

            // tEXt格式: keyword\0text
            let nullPos = 0
            while (nullPos < chunkData.length && chunkData[nullPos] !== 0) {
              nullPos++
            }

            const keyword = new TextDecoder().decode(chunkData.slice(0, nullPos))

            if (keyword === 'chara') {
              // 找到了卡片数据
              const jsonText = new TextDecoder().decode(chunkData.slice(nullPos + 1))
              const jsonData = JSON.parse(jsonText)
              resolve(jsonData)
              return
            }
          }

          pos += length + 4 // 数据 + CRC

          // IEND chunk表示结束
          if (type === 'IEND') break
        }

        reject(new Error('No character card data found in PNG'))
      } catch (error) {
        reject(error)
      }
    }

    reader.onerror = () => reject(new Error('Failed to read file'))
    reader.readAsArrayBuffer(file)
  })
}

/**
 * 批量加载卡片
 */
export async function loadMultipleCards(sources) {
  const results = await Promise.allSettled(
    sources.map(source => {
      if (typeof source === 'string') {
        return loadCardFromURL(source)
      } else if (source instanceof File) {
        return loadCardFromFile(source)
      } else {
        return loadCardFromJSON(source)
      }
    })
  )

  return results.map((result, index) => ({
    index,
    success: result.status === 'fulfilled' && result.value.success,
    card: result.status === 'fulfilled' ? result.value.card : null,
    error: result.status === 'rejected' ? result.reason :
           (result.value.success ? null : result.value.error)
  }))
}

/**
 * 将卡片转换为游戏角色对象
 */
export function cardToCharacter(card, existingCharacters = []) {
  const data = card.data
  const gameData = data.extensions?.game_data || {}

  // 生成唯一ID
  let id = gameData.id || data.name.toLowerCase().replace(/\s+/g, '_')

  // 确保ID唯一
  let counter = 1
  const baseId = id
  while (existingCharacters.some(c => c.id === id)) {
    id = `${baseId}_${counter}`
    counter++
  }

  return {
    id,
    name: data.name,
    color: gameData.color || '#ff8fab',
    type: gameData.type || (data.tags?.[0]) || '未知系',
    favoriteLocations: gameData.favoriteLocations || ['classroom'],
    greeting: data.first_mes || `你好，我是${data.name}。`,
    portrait: gameData.portrait_image || '/artsource/characters/_placeholder.svg',
    chibi: gameData.chibi_image || '/artsource/chibis/_placeholder.svg',
    tachie: gameData.tachie_image || null,
    affection: gameData.stats?.affection || 0,
    friendship: gameData.stats?.friendship || 0,
    romance: gameData.stats?.romance || 0,
    currentLocationId: gameData.favoriteLocations?.[0] || 'classroom',

    // 保留原始卡片数据以供高级功能使用
    _cardData: card
  }
}
