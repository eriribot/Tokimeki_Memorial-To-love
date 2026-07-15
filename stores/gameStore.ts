import { create } from 'zustand';
import { GAME_START_DATE, getNextCalendarDate } from '../CalendarModule/date';
import type { GameEvent, GameStore, LocationId, PeriodDefinition } from '../types';

export const PERIODS = [
  { key: 'morning', label: '早晨', time: '07:00' },
  { key: 'class1', label: '上午课程', time: '08:30' },
  { key: 'lunch', label: '午休', time: '12:00' },
  { key: 'class2', label: '下午课程', time: '14:00' },
  { key: 'afterSchool', label: '放学后', time: '16:30' },
  { key: 'evening', label: '夜晚', time: '19:00' },
] as const satisfies readonly PeriodDefinition[];

export const MAX_DAILY_ACTION_POINTS = 2;

const EVENT_LOCATION_IDS: readonly LocationId[] = [
  'classroom',
  'library',
  'cafeteria',
  'gym',
  'musicRoom',
  'rooftop',
  'courtyard',
];

const EVENT_TEMPLATES = [
  { id: 'lost_item', label: '失物', message: '地上有个钱包，交给老师后心情变好了。' },
  { id: 'study_group', label: '学习会', message: '偶遇学习会，学力提升了。' },
  { id: 'rain', label: '下雨', message: '突然下起雨，要撑伞吗？' },
  { id: 'rumor', label: '传闻', message: '听到了关于某人的传闻。' },
] as const;

function randomItem<T>(items: readonly T[]): T {
  const item = items[Math.floor(Math.random() * items.length)];
  if (item === undefined) throw new Error('Cannot choose from an empty list');
  return item;
}

function spawnRandomEvents(day: number): GameEvent[] {
  const count = Math.floor(Math.random() * 2) + 1;
  return Array.from({ length: count }, (_, index) => {
    const event = randomItem(EVENT_TEMPLATES);
    return {
      ...event,
      id: `${event.id}-${day}-${index}`,
      locationId: randomItem(EVENT_LOCATION_IDS),
    };
  });
}

const INITIAL_LOG = '新学期开始了，你站在校门口。';

export const useGameStore = create<GameStore>(set => ({
  screen: 'start',
  hasSession: false,
  day: 1,
  date: { ...GAME_START_DATE },
  actionPointsRemaining: MAX_DAILY_ACTION_POINTS,
  periodIndex: 0,
  currentLocationId: 'classroom',
  currentSceneId: null,
  isPlaying: false,
  log: [INITIAL_LOG],
  events: [],

  startGame: () => set({ isPlaying: true }),
  pauseGame: () => set({ isPlaying: false }),
  resumeSession: () => set(state => (state.hasSession ? { screen: 'game', isPlaying: true } : {})),
  returnToStart: () => set({ screen: 'start', isPlaying: false }),
  setLocation: id => set({ currentLocationId: id, currentSceneId: null }),
  enterScene: id => set({ currentSceneId: id }),
  exitScene: () => set({ currentSceneId: null }),
  nextPeriod: () =>
    set(state => {
      const nextIndex = state.periodIndex + 1;
      if (nextIndex >= PERIODS.length) {
        const nextDay = state.day + 1;
        return {
          day: nextDay,
          date: getNextCalendarDate(state.date),
          actionPointsRemaining: MAX_DAILY_ACTION_POINTS,
          periodIndex: 0,
          currentSceneId: null,
          events: spawnRandomEvents(nextDay),
          log: [...state.log.slice(-19), `第 ${state.day} 天结束，第 ${nextDay} 天的早晨到了。`],
        };
      }

      const nextPeriod = PERIODS[nextIndex];
      return {
        periodIndex: nextIndex,
        currentSceneId: null,
        log: [...state.log.slice(-19), `时间推进 → ${nextPeriod.label}`],
      };
    }),
  endDay: () =>
    set(state => {
      const nextDay = state.day + 1;
      return {
        day: nextDay,
        date: getNextCalendarDate(state.date),
        actionPointsRemaining: MAX_DAILY_ACTION_POINTS,
        periodIndex: 0,
        currentSceneId: null,
        events: spawnRandomEvents(nextDay),
        log: [...state.log.slice(-19), `行动点已用完。第 ${nextDay} 天的早晨到了。`],
      };
    }),
  spendActionPoint: () => set(state => ({ actionPointsRemaining: Math.max(0, state.actionPointsRemaining - 1) })),
  addLog: message => set(state => ({ log: [...state.log.slice(-19), message] })),
  spawnEvents: () => set(state => ({ events: spawnRandomEvents(state.day) })),
  resolveEvent: eventId =>
    set(state => ({
      events: state.events.filter(event => event.id !== eventId),
      log: [...state.log.slice(-19), state.events.find(event => event.id === eventId)?.message ?? '事件结束了。'],
    })),
  resetGameState: () =>
    set({
      screen: 'game',
      hasSession: true,
      day: 1,
      date: { ...GAME_START_DATE },
      actionPointsRemaining: MAX_DAILY_ACTION_POINTS,
      periodIndex: 0,
      currentLocationId: 'classroom',
      currentSceneId: null,
      isPlaying: true,
      log: [INITIAL_LOG],
      events: [],
    }),
}));
