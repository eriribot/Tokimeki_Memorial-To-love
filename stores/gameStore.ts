import { create } from 'zustand'

export const PERIODS = [
  { key: 'morning', label: '早晨', time: '07:00' },
  { key: 'class1', label: '上午课程', time: '08:30' },
  { key: 'lunch', label: '午休', time: '12:00' },
  { key: 'class2', label: '下午课程', time: '14:00' },
  { key: 'afterSchool', label: '放学后', time: '16:30' },
  { key: 'evening', label: '夜晚', time: '19:00' },
]

const LOCATION_IDS = [
  'classroom',
  'library',
  'cafeteria',
  'gym',
  'musicRoom',
  'rooftop',
  'courtyard',
]

const EVENTS = [
  { id: 'lost_item', label: '失物', message: '地上有个钱包，交给老师后心情变好了。' },
  { id: 'study_group', label: '学习会', message: '偶遇学习会，学力提升了。' },
  { id: 'rain', label: '下雨', message: '突然下起雨，要撑伞吗？' },
  { id: 'rumor', label: '传闻', message: '听到了关于某人的传闻。' },
]

function spawnRandomEvents(day) {
  const count = Math.floor(Math.random() * 2) + 1
  return Array.from({ length: count }, (_, i) => {
    const ev = EVENTS[Math.floor(Math.random() * EVENTS.length)]
    return {
      ...ev,
      id: `${ev.id}-${day}-${i}`,
      locationId: LOCATION_IDS[Math.floor(Math.random() * LOCATION_IDS.length)],
    }
  })
}

export const useGameStore = create((set) => ({
  // State
  day: 1,
  periodIndex: 0,
  currentLocationId: 'classroom',
  currentSceneId: null,
  isPlaying: false,
  log: ['新学期开始了，你站在校门口。'],
  events: [],

  // Actions
  startGame: () => set({ isPlaying: true }),
  pauseGame: () => set({ isPlaying: false }),
  setLocation: (id) => set({ currentLocationId: id, currentSceneId: null }),
  enterScene: (id) => set({ currentSceneId: id }),
  exitScene: () => set({ currentSceneId: null }),
  nextPeriod: () =>
    set((state) => {
      const next = state.periodIndex + 1
      if (next >= PERIODS.length) {
        const newDay = state.day + 1
        const newEvents = spawnRandomEvents(newDay)
        return {
          day: newDay,
          periodIndex: 0,
          currentSceneId: null,
          events: newEvents,
          log: [
            ...state.log.slice(-19),
            `第 ${state.day} 天结束，第 ${newDay} 天的早晨到了。`,
          ],
        }
      }
      return {
        periodIndex: next,
        currentSceneId: null,
        log: [...state.log.slice(-19), `时间推进 → ${PERIODS[next].label}`],
      }
    }),
  addLog: (message) =>
    set((state) => ({ log: [...state.log.slice(-19), message] })),
  spawnEvents: () =>
    set((state) => ({ events: spawnRandomEvents(state.day) })),
  resolveEvent: (eventId) =>
    set((state) => ({
      events: state.events.filter((e) => e.id !== eventId),
      log: [
        ...state.log.slice(-19),
        state.events.find((e) => e.id === eventId)?.message ?? '事件结束了。',
      ],
    })),
  resetGame: () =>
    set({
      day: 1,
      periodIndex: 0,
      currentLocationId: 'classroom',
      currentSceneId: null,
      isPlaying: false,
      log: ['新学期开始了，你站在校门口。'],
      events: [],
    }),
}))
