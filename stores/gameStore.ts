import { create } from 'zustand';
import { GAME_START_DATE, getNextCalendarDate } from '../CalendarModule/date';
import {
  getLalaArrivalEntryReason,
  getPendingLalaArrivalActIndex,
  LALA_ARRIVAL_EVENT_ID,
  LALA_ARRIVAL_STORY,
} from '../GalMainStory/lalaArrival';
import type { GameEvent, GameStore, LocationId, PeriodDefinition, PlayerActionSettlement } from '../types';

export const PERIODS = [
  { key: 'morning', label: '早' },
  { key: 'afterSchool', label: '放学' },
  { key: 'evening', label: '晚上' },
] as const satisfies readonly PeriodDefinition[];

export const MAX_DAILY_ACTION_POINTS = 2;

const AFTER_SCHOOL_PERIOD_INDEX = PERIODS.findIndex(period => period.key === 'afterSchool');
const EVENING_PERIOD_INDEX = PERIODS.findIndex(period => period.key === 'evening');

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
  activeMainStoryEventId: null,
  completedMainStoryEventIds: [],
  mainStoryEntryReason: null,
  mainStoryActIndex: 0,
  mainStoryPageIndex: 0,
  mainStoryActs: [],
  mainStoryMessages: [],
  mainStoryGenerationStatus: 'idle',
  mainStoryGenerationSource: null,
  mainStoryGenerationError: null,

  startGame: () => set({ isPlaying: true }),
  pauseGame: () => set({ isPlaying: false }),
  resumeSession: () => set(state => (state.hasSession ? { screen: 'game', isPlaying: true } : {})),
  returnToStart: () => set({ screen: 'start', isPlaying: false }),
  setLocation: id => set({ currentLocationId: id, currentSceneId: null }),
  enterScene: id => set({ currentSceneId: id }),
  exitScene: () => set({ currentSceneId: null }),

  settlePlayerAction: request => {
    let settlement: PlayerActionSettlement = {
      accepted: false,
      startsMainStory: false,
      dayAdvanced: false,
      periodKey: 'morning',
    };

    set(state => {
      const currentPeriod = PERIODS[state.periodIndex] ?? PERIODS[0];
      settlement = { ...settlement, periodKey: currentPeriod.key };
      if (state.actionPointsRemaining <= 0 || state.activeMainStoryEventId) return state;

      const actionPointsRemaining = state.actionPointsRemaining - 1;
      const periodIndex = actionPointsRemaining > 0 ? AFTER_SCHOOL_PERIOD_INDEX : EVENING_PERIOD_INDEX;
      const period = PERIODS[periodIndex] ?? PERIODS[0];
      const nextMainStoryActIndex = getPendingLalaArrivalActIndex({ ...state, actionPointsRemaining });
      const startsLalaArrival = nextMainStoryActIndex !== null;
      const log = [...state.log, request.message];

      settlement = {
        accepted: true,
        startsMainStory: startsLalaArrival,
        dayAdvanced: false,
        periodKey: period.key,
      };

      if (startsLalaArrival) {
        log.push(`主线事件「${LALA_ARRIVAL_STORY.title}」第 ${nextMainStoryActIndex + 1} 幕开始。`);
        return {
          actionPointsRemaining,
          periodIndex,
          currentSceneId: null,
          activeMainStoryEventId: LALA_ARRIVAL_EVENT_ID,
          mainStoryEntryReason: getLalaArrivalEntryReason(nextMainStoryActIndex),
          mainStoryActIndex: nextMainStoryActIndex,
          mainStoryPageIndex: 0,
          mainStoryActs: state.mainStoryActs.slice(0, nextMainStoryActIndex),
          mainStoryMessages: state.mainStoryMessages,
          mainStoryGenerationStatus: 'idle',
          mainStoryGenerationSource: null,
          mainStoryGenerationError: null,
          log: log.slice(-20),
        };
      }

      if (actionPointsRemaining === 0) {
        const nextDay = state.day + 1;
        settlement = { ...settlement, dayAdvanced: true, periodKey: PERIODS[0].key };
        log.push(`第 ${state.day} 天结束，第 ${nextDay} 天的早晨到了。`);
        return {
          day: nextDay,
          date: getNextCalendarDate(state.date),
          actionPointsRemaining: MAX_DAILY_ACTION_POINTS,
          periodIndex: 0,
          currentSceneId: null,
          events: spawnRandomEvents(nextDay),
          log: log.slice(-20),
        };
      }

      return {
        actionPointsRemaining,
        periodIndex,
        currentSceneId: null,
        log: log.slice(-20),
      };
    });

    return settlement;
  },

  addLog: message => set(state => ({ log: [...state.log.slice(-19), message] })),
  spawnEvents: () => set(state => ({ events: spawnRandomEvents(state.day) })),
  resolveEvent: eventId =>
    set(state => ({
      events: state.events.filter(event => event.id !== eventId),
      log: [...state.log.slice(-19), state.events.find(event => event.id === eventId)?.message ?? '事件结束了。'],
    })),

  beginMainStoryGeneration: () => {
    let started = false;
    set(state => {
      if (
        state.activeMainStoryEventId !== LALA_ARRIVAL_EVENT_ID ||
        state.mainStoryGenerationStatus === 'loading' ||
        state.mainStoryGenerationStatus === 'ready'
      ) {
        return state;
      }
      started = true;
      return { mainStoryGenerationStatus: 'loading', mainStoryGenerationError: null };
    });
    return started;
  },

  setMainStoryContent: (acts, source, messages = []) =>
    set(state =>
      state.activeMainStoryEventId === LALA_ARRIVAL_EVENT_ID
        ? {
            mainStoryActs: acts,
            mainStoryMessages: messages,
            mainStoryActIndex: Math.min(state.mainStoryActIndex, Math.max(0, acts.length - 1)),
            mainStoryPageIndex: 0,
            mainStoryGenerationStatus: 'ready',
            mainStoryGenerationSource: source,
            mainStoryGenerationError: null,
          }
        : state,
    ),

  setMainStoryActContent: (act, source, messages = []) =>
    set(state => {
      const expectedAct = LALA_ARRIVAL_STORY.acts[state.mainStoryActIndex];
      if (state.activeMainStoryEventId !== LALA_ARRIVAL_EVENT_ID || !expectedAct || act.id !== expectedAct.id) {
        return state;
      }
      const mainStoryActs = [...state.mainStoryActs];
      mainStoryActs[state.mainStoryActIndex] = act;
      const mainStoryMessages = messages.length > 0
        ? [
            ...state.mainStoryMessages.filter(
              message =>
                message.extra.eventId !== LALA_ARRIVAL_EVENT_ID || message.extra.actIndex !== state.mainStoryActIndex,
            ),
            ...messages,
          ]
        : state.mainStoryMessages;
      return {
        mainStoryActs,
        mainStoryMessages,
        mainStoryPageIndex: 0,
        mainStoryGenerationStatus: 'ready',
        mainStoryGenerationSource:
          state.mainStoryGenerationSource === 'fallback' || source === 'fallback' ? 'fallback' : 'tavern',
        mainStoryGenerationError: null,
      };
    }),

  failMainStoryGeneration: message =>
    set(state =>
      state.activeMainStoryEventId === LALA_ARRIVAL_EVENT_ID
        ? { mainStoryGenerationStatus: 'error', mainStoryGenerationError: message }
        : state,
    ),

  setMainStoryPosition: (actIndex, pageIndex) =>
    set(state => {
      const safeActIndex = Math.min(LALA_ARRIVAL_STORY.acts.length - 1, Math.max(0, Math.trunc(actIndex)));
      const act = state.mainStoryActs[safeActIndex];
      if (!act && safeActIndex === state.mainStoryActs.length) {
        return {
          mainStoryActIndex: safeActIndex,
          mainStoryPageIndex: 0,
          mainStoryGenerationStatus: 'idle',
          mainStoryGenerationError: null,
        };
      }
      if (!act) return state;
      const safePageIndex = Math.min(act.beats.length - 1, Math.max(0, Math.trunc(pageIndex)));
      return {
        mainStoryActIndex: safeActIndex,
        mainStoryPageIndex: safePageIndex,
        mainStoryGenerationStatus: 'ready',
        mainStoryGenerationError: null,
      };
    }),

  advanceMainStoryAct: () => {
    let advanced = false;
    set(state => {
      if (state.activeMainStoryEventId !== LALA_ARRIVAL_EVENT_ID) return state;
      const nextActIndex = state.mainStoryActIndex + 1;
      if (nextActIndex >= LALA_ARRIVAL_STORY.acts.length) return state;
      advanced = true;
      return {
        activeMainStoryEventId: null,
        mainStoryEntryReason: null,
        mainStoryActIndex: nextActIndex,
        mainStoryPageIndex: 0,
        mainStoryGenerationStatus: 'idle',
        mainStoryGenerationSource: null,
        mainStoryGenerationError: null,
        currentSceneId: null,
        log: [...state.log.slice(-19), `主线事件「${LALA_ARRIVAL_STORY.title}」第 ${state.mainStoryActIndex + 1} 幕暂告一段落。`],
      };
    });
    return advanced;
  },

  completeMainStoryEvent: () => {
    let completed = false;
    set(state => {
      const eventId = state.activeMainStoryEventId;
      if (!eventId) return state;

      completed = true;
      const nextDay = state.day + 1;
      return {
        day: nextDay,
        date: getNextCalendarDate(state.date),
        actionPointsRemaining: MAX_DAILY_ACTION_POINTS,
        periodIndex: 0,
        currentSceneId: null,
        events: spawnRandomEvents(nextDay),
        activeMainStoryEventId: null,
        completedMainStoryEventIds: [...new Set([...state.completedMainStoryEventIds, eventId])],
        mainStoryEntryReason: null,
        mainStoryActIndex: 0,
        mainStoryPageIndex: 0,
        mainStoryActs: [],
        mainStoryGenerationStatus: 'idle',
        mainStoryGenerationSource: null,
        mainStoryGenerationError: null,
        log: [
          ...state.log.slice(-18),
          `主线事件「${LALA_ARRIVAL_STORY.title}」结束。`,
          `第 ${state.day} 天结束，第 ${nextDay} 天的早晨到了。`,
        ],
      };
    });
    return completed;
  },

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
      activeMainStoryEventId: null,
      completedMainStoryEventIds: [],
      mainStoryEntryReason: null,
      mainStoryActIndex: 0,
      mainStoryPageIndex: 0,
      mainStoryActs: [],
      mainStoryMessages: [],
      mainStoryGenerationStatus: 'idle',
      mainStoryGenerationSource: null,
      mainStoryGenerationError: null,
    }),
}));