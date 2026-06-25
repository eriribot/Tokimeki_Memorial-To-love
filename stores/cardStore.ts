import { create } from 'zustand'
import { loadCardFromJSON, loadCardFromFile, loadCardFromURL, cardToCharacter } from '../utils/cardLoader'

const PERIOD_LOCATION_RULES = {
  morning: (favoriteLocations) => favoriteLocations[0] || 'classroom',
  class1: () => 'classroom',
  lunch: (favoriteLocations) => favoriteLocations[1] || favoriteLocations[0] || 'cafeteria',
  class2: () => 'classroom',
  afterSchool: (favoriteLocations) => {
    const firstChoice = favoriteLocations[0] || 'courtyard'
    return firstChoice === 'classroom' ? (favoriteLocations[1] || 'courtyard') : firstChoice
  },
  evening: () => null,
}

export function getTargetLocationForPeriod(target, periodKey) {
  const favoriteLocations = target.favoriteLocations || ['classroom']
  const resolveLocation = PERIOD_LOCATION_RULES[periodKey]

  return resolveLocation ? resolveLocation(favoriteLocations) : target.currentLocationId
}

/**
 * 卡片和目标（targets）管理
 * 遵循 islandmilfcode 的设计原则：
 * - 使用 targets[] 数组管理所有可交互角色
 * - 禁止硬编码角色名
 * - 支持动态加载和卸载
 */
export const useCardStore = create((set, get) => ({
  // State
  targets: [], // 当前游戏中的所有角色（从卡片加载）
  activeTargetId: null, // 当前活跃的角色ID（用于交互）
  loadedCards: [], // 已加载的原始卡片数据
  isLoading: false,
  error: null,

  // Actions

  /**
   * 从JSON对象添加卡片
   */
  addCardFromJSON: async (jsonData) => {
    set({ isLoading: true, error: null })

    try {
      const result = await loadCardFromJSON(jsonData)

      if (!result.success) {
        set({ error: result.error, isLoading: false })
        return { success: false, error: result.error }
      }

      let character
      set((state) => {
        character = cardToCharacter(result.card, state.targets)
        return {
          targets: [...state.targets, character],
          loadedCards: [...state.loadedCards, result.card],
          activeTargetId: state.targets.length === 0 ? character.id : state.activeTargetId,
          isLoading: false
        }
      })

      return { success: true, character }
    } catch (error) {
      set({ error: error.message, isLoading: false })
      return { success: false, error: error.message }
    }
  },

  /**
   * 从文件添加卡片
   */
  addCardFromFile: async (file) => {
    set({ isLoading: true, error: null })

    try {
      const result = await loadCardFromFile(file)

      if (!result.success) {
        set({ error: result.error, isLoading: false })
        return { success: false, error: result.error }
      }

      let character
      set((state) => {
        character = cardToCharacter(result.card, state.targets)
        return {
          targets: [...state.targets, character],
          loadedCards: [...state.loadedCards, result.card],
          activeTargetId: state.targets.length === 0 ? character.id : state.activeTargetId,
          isLoading: false
        }
      })

      return { success: true, character }
    } catch (error) {
      set({ error: error.message, isLoading: false })
      return { success: false, error: error.message }
    }
  },

  /**
   * 从URL添加卡片
   */
  addCardFromURL: async (url) => {
    set({ isLoading: true, error: null })

    try {
      const result = await loadCardFromURL(url)

      if (!result.success) {
        set({ error: result.error, isLoading: false })
        return { success: false, error: result.error }
      }

      let character
      set((state) => {
        character = cardToCharacter(result.card, state.targets)
        return {
          targets: [...state.targets, character],
          loadedCards: [...state.loadedCards, result.card],
          activeTargetId: state.targets.length === 0 ? character.id : state.activeTargetId,
          isLoading: false
        }
      })

      return { success: true, character }
    } catch (error) {
      set({ error: error.message, isLoading: false })
      return { success: false, error: error.message }
    }
  },

  /**
   * 移除目标
   */
  removeTarget: (targetId) => {
    set((state) => {
      const newTargets = state.targets.filter(t => t.id !== targetId)
      const newActiveId = state.activeTargetId === targetId
        ? (newTargets[0]?.id || null)
        : state.activeTargetId

      return {
        targets: newTargets,
        activeTargetId: newActiveId
      }
    })
  },

  /**
   * 设置活跃目标
   */
  setActiveTarget: (targetId) => {
    const target = get().targets.find(t => t.id === targetId)
    if (target) {
      set({ activeTargetId: targetId })
    }
  },

  /**
   * 获取活跃目标
   */
  getActiveTarget: () => {
    const { targets, activeTargetId } = get()
    return targets.find(t => t.id === activeTargetId) || null
  },

  /**
   * 根据位置获取目标
   */
  getTargetsByLocation: (locationId) => {
    return get().targets.filter(t => t.currentLocationId === locationId)
  },

  /**
   * 更新目标数据
   */
  updateTarget: (targetId, updates) => {
    set((state) => ({
      targets: state.targets.map(t =>
        t.id === targetId ? { ...t, ...updates } : t
      )
    }))
  },

  /**
   * 增加好感度
   */
  addAffection: (targetId, amount) => {
    set((state) => ({
      targets: state.targets.map(t =>
        t.id === targetId
          ? { ...t, affection: Math.min(100, t.affection + amount) }
          : t
      )
    }))
  },

  /**
   * 为时间段重新分配目标位置
   */
  spawnTargetsForPeriod: (periodKey) => {
    set((state) => ({
      targets: state.targets.map(t => ({
        ...t,
        // 按一天中的时段安排角色去向，让玩家推进时间后能看见人移动。
        currentLocationId: getTargetLocationForPeriod(t, periodKey)
      }))
    }))
  },

  /**
   * 清空所有目标
   */
  clearTargets: () => {
    set({
      targets: [],
      activeTargetId: null,
      loadedCards: [],
      error: null
    })
  },

  /**
   * 重置所有目标状态（保留角色但重置数据）
   */
  resetTargets: () => {
    set((state) => ({
      targets: state.targets.map(t => ({
        ...t,
        affection: 0,
        friendship: 0,
        romance: 0,
        currentLocationId: t.favoriteLocations[0]
      }))
    }))
  }
}))
