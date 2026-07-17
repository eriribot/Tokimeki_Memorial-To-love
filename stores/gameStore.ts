import { create } from 'zustand';
import { GAME_START_DATE, getNextCalendarDate } from '../CalendarModule/date';
import {
  getLalaArrivalEntryReason,
  getPendingLalaArrivalActIndex,
  LALA_ARRIVAL_EVENT_ID,
  LALA_ARRIVAL_STORY,
} from '../GalMainStory/lalaArrival';
import type { GalStoryActArchive, GalStoryFloor } from '../GalMainStory/storyTypes';
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

function mergeStoryMessages<T extends { id: string }>(current: readonly T[], incoming: readonly T[]): T[] {
  if (incoming.length === 0) return [...current];
  const knownIds = new Set(current.map(message => message.id));
  const merged = [...current];
  for (const message of incoming) {
    if (knownIds.has(message.id)) continue;
    knownIds.add(message.id);
    merged.push(message);
  }
  return merged;
}

function upsertStoryFloor(
  archives: readonly GalStoryActArchive[],
  floor: GalStoryFloor,
  activate: boolean,
): GalStoryActArchive[] {
  const archiveIndex = archives.findIndex(
    archive => archive.eventId === floor.eventId && archive.actIndex === floor.actIndex && archive.actId === floor.actId,
  );
  const current =
    archiveIndex >= 0
      ? archives[archiveIndex]
      : {
          eventId: floor.eventId,
          actIndex: floor.actIndex,
          actId: floor.actId,
          activeFloorId: null,
          floors: [],
        };
  const floors = current.floors.some(savedFloor => savedFloor.floorId === floor.floorId)
    ? current.floors
    : [...current.floors, floor];
  const canActivate = activate && floor.outcome === 'accepted' && floor.act !== null;
  const nextArchive: GalStoryActArchive = {
    ...current,
    floors,
    activeFloorId: canActivate ? floor.floorId : current.activeFloorId,
  };

  if (archiveIndex < 0) return [...archives, nextArchive].sort((left, right) => left.actIndex - right.actIndex);
  return archives.map((archive, index) => (index === archiveIndex ? nextArchive : archive));
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
  mainStoryArchives: [],
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

  setMainStoryActContent: (floor, messages) =>
    set(state => {
      const mainStoryMessages = mergeStoryMessages(state.mainStoryMessages, messages);
      const existingFloor = state.mainStoryArchives
        .flatMap(archive => archive.floors)
        .find(savedFloor => savedFloor.floorId === floor.floorId);
      if (existingFloor) return { mainStoryMessages };

      const expectedAct = LALA_ARRIVAL_STORY.acts[state.mainStoryActIndex];
      const isValidAcceptedFloor =
        floor.floorId.trim().length > 0 &&
        floor.eventId === LALA_ARRIVAL_EVENT_ID &&
        floor.outcome === 'accepted' &&
        floor.act !== null &&
        floor.act.id === floor.actId;
      if (!isValidAcceptedFloor) return { mainStoryMessages };

      const mainStoryArchives = upsertStoryFloor(
        state.mainStoryArchives,
        floor,
        state.activeMainStoryEventId === LALA_ARRIVAL_EVENT_ID &&
          Boolean(expectedAct) &&
          floor.actIndex === state.mainStoryActIndex &&
          floor.actId === expectedAct?.id,
      );
      if (
        state.activeMainStoryEventId !== LALA_ARRIVAL_EVENT_ID ||
        !expectedAct ||
        floor.actIndex !== state.mainStoryActIndex ||
        floor.actId !== expectedAct.id
      ) {
        return { mainStoryArchives, mainStoryMessages };
      }
      const mainStoryActs = [...state.mainStoryActs];
      mainStoryActs[state.mainStoryActIndex] = floor.act;
      return {
        mainStoryActs,
        mainStoryArchives,
        mainStoryMessages,
        mainStoryPageIndex: 0,
        mainStoryGenerationStatus: 'ready',
        mainStoryGenerationSource:
          state.mainStoryGenerationSource === 'fallback' || floor.source === 'fallback' ? 'fallback' : 'tavern',
        mainStoryGenerationError: null,
      };
    }),

  failMainStoryGeneration: (message, messages = [], floor) =>
    set(state => {
      const persisted = {
        mainStoryArchives: floor
          ? upsertStoryFloor(state.mainStoryArchives, floor, false)
          : state.mainStoryArchives,
        mainStoryMessages: mergeStoryMessages(state.mainStoryMessages, messages),
      };
      const appliesToActiveAct =
        state.activeMainStoryEventId === LALA_ARRIVAL_EVENT_ID &&
        (!floor || (floor.eventId === LALA_ARRIVAL_EVENT_ID && floor.actIndex === state.mainStoryActIndex));
      if (!appliesToActiveAct) return persisted;
      return {
        ...persisted,
        mainStoryGenerationStatus: 'error',
        mainStoryGenerationError: message,
      };
    }),

  addMainStoryFloor: (floor, messages = []) =>
    set(state => ({
      mainStoryArchives: upsertStoryFloor(state.mainStoryArchives, floor, false),
      mainStoryMessages: mergeStoryMessages(state.mainStoryMessages, messages),
    })),

  selectMainStoryFloor: floorId => {
    let selected = false;
    set(state => {
      const archiveIndex = state.mainStoryArchives.findIndex(archive =>
        archive.floors.some(floor => floor.floorId === floorId),
      );
      if (archiveIndex < 0) return state;
      const archive = state.mainStoryArchives[archiveIndex];
      const floor = archive.floors.find(candidate => candidate.floorId === floorId);
      if (!floor || floor.outcome !== 'accepted' || floor.act === null) return state;

      selected = true;
      const mainStoryArchives = state.mainStoryArchives.map((savedArchive, index) =>
        index === archiveIndex ? { ...savedArchive, activeFloorId: floorId } : savedArchive,
      );
      const mainStoryActs = [...state.mainStoryActs];
      mainStoryActs[floor.actIndex] = floor.act;
      return { mainStoryArchives, mainStoryActs };
    });
    return selected;
  },

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
        log: [
          ...state.log.slice(-19),
          `主线事件「${LALA_ARRIVAL_STORY.title}」第 ${state.mainStoryActIndex + 1} 幕暂告一段落。`,
        ],
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
      mainStoryArchives: [],
      mainStoryMessages: [],
      mainStoryGenerationStatus: 'idle',
      mainStoryGenerationSource: null,
      mainStoryGenerationError: null,
    }),
}));
