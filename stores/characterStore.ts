import { create } from 'zustand'
import { useCardStore } from './cardStore'

// 导入默认卡片JSON
import harukaCard from '../data/default-cards/haruka.json'
import miyukiCard from '../data/default-cards/miyuki.json'
import rinCard from '../data/default-cards/rin.json'
import sakuraCard from '../data/default-cards/sakura.json'

/**
 * characterStore - 兼容层
 * 保持向后兼容，内部使用 cardStore 的 targets[] 系统
 */
export const useCharacterStore = create((set, get) => {
  // 初始化时加载默认卡片到 cardStore
  const initializeDefaultCards = async () => {
    const cardStore = useCardStore.getState()

    // 只在首次初始化时加载
    if (cardStore.targets.length === 0) {
      for (const card of [harukaCard, miyukiCard, rinCard, sakuraCard]) {
        await cardStore.addCardFromJSON(card)
      }
    }
  }

  // 立即初始化
  initializeDefaultCards()

  return {
    characters: useCardStore.getState().targets,

    // Actions - 代理到 cardStore
    spawnForPeriod: (periodKey) => {
      useCardStore.getState().spawnTargetsForPeriod(periodKey)
    },

    addAffection: (id, amount) => {
      useCardStore.getState().addAffection(id, amount)
    },

    resetCharacters: () => {
      useCardStore.getState().resetTargets()
    },

    // 新增：直接访问 cardStore 的方法
    getCardStore: () => useCardStore.getState()
  }
})

// 订阅 cardStore 的变化，同步更新 characterStore
useCardStore.subscribe((state) => {
  // 触发 characterStore 的订阅者更新
  useCharacterStore.setState({ characters: state.targets })
})
