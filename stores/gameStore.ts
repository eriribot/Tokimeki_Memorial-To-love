import { create } from 'zustand';
import { GAME_START_DATE, getNextCalendarDate } from '../CalendarModule/date';
import { getPendingMainStoryEntry } from '../GalMainStory/storyRegistry';
import { getSkillExperienceReward, useSkillStore } from '../skilllogic';
import type {
  DateAdvanceSource,
  GameEvent,
  GameStore,
  LocationId,
  PeriodDefinition,
  PlayerActionSettlement,
  WholeDayActivitySettlement,
} from '../types';
import { createInitialMainStoryState, createMainStoryEntryPatch, createMainStoryStoreActions } from './mainStoryStore';

export const ACTION_PERIODS = [
  { key: 'morning', label: '阶段一' },
  { key: 'afterSchool', label: '阶段二' },
] as const satisfies readonly PeriodDefinition[];

export const PERIODS = [
  ...ACTION_PERIODS,
  { key: 'evening', label: '日终结算' },
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

const INITIAL_LOG = '新学期开始了，你站在校门口。';

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

function getActionNumber(actionPointsRemaining: number): number {
  return MAX_DAILY_ACTION_POINTS - actionPointsRemaining;
}

export const useGameStore = create<GameStore>((set, get) => ({
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
  mainStory: createInitialMainStoryState(),
  wholeDayActivity: null,
  lastDateAdvanceSource: null,

  startGame: () => set({ isPlaying: true }),
  pauseGame: () => set({ isPlaying: false }),
  resumeSession: () => {
    set(state => (state.hasSession ? { screen: 'game', isPlaying: true } : {}));
    get().reconcilePendingMainStoryEntry();
  },
  returnToStart: () => set({ screen: 'start', isPlaying: false, wholeDayActivity: null }),
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
      if (state.actionPointsRemaining <= 0 || state.mainStory.run?.phase === 'playing' || state.wholeDayActivity !== null) return state;

      const actionPointsRemaining = state.actionPointsRemaining - 1;
      const periodIndex = actionPointsRemaining > 0 ? AFTER_SCHOOL_PERIOD_INDEX : EVENING_PERIOD_INDEX;
      const period = PERIODS[periodIndex] ?? PERIODS[0];
      const pendingMainStory = getPendingMainStoryEntry({
        date: state.date,
        actionNumber: getActionNumber(actionPointsRemaining),
        run: state.mainStory.run,
        completedEventIds: state.mainStory.completedEventIds,
      });
      const startsMainStory = pendingMainStory !== null;
      const log = [...state.log, request.message];

      settlement = {
        accepted: true,
        startsMainStory,
        dayAdvanced: false,
        periodKey: period.key,
      };

      if (pendingMainStory) {
        return {
          actionPointsRemaining,
          periodIndex,
          ...createMainStoryEntryPatch(state, pendingMainStory, log),
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
          lastDateAdvanceSource: 'whole-day',
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

    if (settlement.accepted) {
      const experienceResult = useSkillStore.getState().gainExperience(getSkillExperienceReward(request.kind));
      if (!experienceResult.ok) {
        console.error('[ToLove Skills] 已结算行动的特技 EXP 写入失败。', experienceResult.error);
      }
    }

    return settlement;
  },

  consumeActionPoint: message => get().settlePlayerAction({ kind: 'talk', message }),

  beginWholeDayActivity: (kind = 'dating'): WholeDayActivitySettlement => {
    let settlement: WholeDayActivitySettlement = { accepted: false, dayAdvanced: false, reason: null };
    set(state => {
      if (state.wholeDayActivity !== null) {
        settlement = { accepted: false, dayAdvanced: false, reason: '当天已经有整天活动正在进行。' };
        return state;
      }
      if (state.mainStory.run?.phase === 'playing') {
        settlement = { accepted: false, dayAdvanced: false, reason: '主线剧情进行中，暂时无法开始整天活动。' };
        return state;
      }
      if (state.actionPointsRemaining !== MAX_DAILY_ACTION_POINTS) {
        settlement = { accepted: false, dayAdvanced: false, reason: '整天活动只能由当天第一次有效行动启动。' };
        return state;
      }
      settlement = { accepted: true, dayAdvanced: false, reason: null };
      return {
        actionPointsRemaining: MAX_DAILY_ACTION_POINTS - 1,
        periodIndex: AFTER_SCHOOL_PERIOD_INDEX,
        currentSceneId: null,
        wholeDayActivity: kind,
        log: [...state.log, '今天的整天约会开始了。'].slice(-20),
      };
    });
    return settlement;
  },

  finishWholeDayActivity: (options: { source?: DateAdvanceSource } = {}) => {
    let finished = false;
    set(state => {
      if (state.wholeDayActivity === null) return state;
      const nextDay = state.day + 1;
      finished = true;
      return {
        day: nextDay,
        date: getNextCalendarDate(state.date),
        actionPointsRemaining: MAX_DAILY_ACTION_POINTS,
        periodIndex: 0,
        currentSceneId: null,
        wholeDayActivity: null,
        events: spawnRandomEvents(nextDay),
        lastDateAdvanceSource: options.source ?? 'whole-day',
        log: [...state.log, `第 ${state.day} 天结束，第 ${nextDay} 天的早晨到了。`].slice(-20),
      };
    });
    return finished;
  },

  acknowledgeDateAdvance: () => {
    if (get().lastDateAdvanceSource !== null) set({ lastDateAdvanceSource: null });
  },

  markDatingSettlementPending: () => {
    let marked = false;
    set(state => {
      if (state.wholeDayActivity !== 'dating') return state;
      marked = true;
      return { wholeDayActivity: 'dating-completing' };
    });
    return marked;
  },

  addLog: message => set(state => ({ log: [...state.log.slice(-19), message] })),
  spawnEvents: () => set(state => ({ events: spawnRandomEvents(state.day) })),
  resolveEvent: eventId =>
    set(state => ({
      events: state.events.filter(event => event.id !== eventId),
      log: [...state.log.slice(-19), state.events.find(event => event.id === eventId)?.message ?? '事件结束了。'],
    })),

  ...createMainStoryStoreActions(set, get, {
    maxDailyActionPoints: MAX_DAILY_ACTION_POINTS,
    afterSchoolPeriodIndex: AFTER_SCHOOL_PERIOD_INDEX,
    eveningPeriodIndex: EVENING_PERIOD_INDEX,
    spawnEvents: spawnRandomEvents,
  }),

  completeRegistration: () =>
    set(state =>
      state.screen === 'registration'
        ? {
            screen: 'game',
            hasSession: true,
            isPlaying: true,
          }
        : state,
    ),

  resetGameState: () =>
    set({
      screen: 'registration',
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
      mainStory: createInitialMainStoryState(),
      wholeDayActivity: null,
      lastDateAdvanceSource: 'new-game',
    }),
}));
