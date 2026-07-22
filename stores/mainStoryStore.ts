import type { StoreApi } from 'zustand';
import { getNextCalendarDate } from '../CalendarModule/date';
import {
  getActiveStoryAct,
  getStoryArchive,
  hasCurrentStoryContext,
  mergeStoryMessages,
  upsertStoryFloor,
} from '../GalMainStory/storyArchive';
import {
  getMainStoryActIndex,
  getMainStoryEpisode,
  getMainStoryEpisodeOrThrow,
  getPendingMainStoryEntry,
  type PendingMainStoryEntry,
} from '../GalMainStory/storyRegistry';
import type { GalStoryActArchive, MainStoryGenerationState, MainStoryState } from '../GalMainStory/storyTypes';
import type { GameActions, GameEvent, GameState, GameStore } from '../types';

type MainStoryStoreActions = Pick<
  GameActions,
  | 'reconcilePendingMainStoryEntry'
  | 'beginMainStoryGeneration'
  | 'setMainStoryActContent'
  | 'failMainStoryGeneration'
  | 'addMainStoryFloor'
  | 'selectMainStoryFloor'
  | 'deleteMainStoryFloor'
  | 'setMainStoryPosition'
  | 'finishMainStoryAct'
>;

interface MainStoryStoreDependencies {
  maxDailyActionPoints: number;
  spawnEvents: (day: number) => GameEvent[];
}

function createIdleGeneration(): MainStoryGenerationState {
  return { status: 'idle', requestId: null, source: null, error: null };
}

export function createInitialMainStoryState(): MainStoryState {
  return {
    run: null,
    generation: createIdleGeneration(),
    completedEventIds: [],
    archives: [],
    messages: [],
  };
}

export function createMainStoryEntryPatch(
  state: GameState,
  pending: PendingMainStoryEntry,
  log: readonly string[] = state.log,
): Partial<GameState> {
  const episode = getMainStoryEpisodeOrThrow(pending.eventId);
  const actIndex = getMainStoryActIndex(pending.eventId, pending.actId);
  return {
    mainStory: {
      ...state.mainStory,
      run: { eventId: pending.eventId, actId: pending.actId, phase: 'playing', pageIndex: 0 },
      generation: createIdleGeneration(),
    },
    currentSceneId: null,
    log: [...log, `主线事件「${episode.title}」第 ${actIndex + 1} 幕开始。`].slice(-20),
  };
}

export function createMainStoryStoreActions(
  set: StoreApi<GameStore>['setState'],
  get: StoreApi<GameStore>['getState'],
  dependencies: MainStoryStoreDependencies,
): MainStoryStoreActions {
  const getActionNumber = (actionPointsRemaining: number): number =>
    dependencies.maxDailyActionPoints - actionPointsRemaining;

  return {
    reconcilePendingMainStoryEntry: () => {
      let started = false;
      set(state => {
        if (!state.hasSession || state.screen !== 'game' || state.mainStory.run?.phase === 'playing') return state;
        const pendingMainStory = getPendingMainStoryEntry({
          date: state.date,
          actionNumber: getActionNumber(state.actionPointsRemaining),
          run: state.mainStory.run,
          completedEventIds: state.mainStory.completedEventIds,
        });
        if (!pendingMainStory) return state;
        started = true;
        return createMainStoryEntryPatch(state, pendingMainStory);
      });
      return started;
    },

    beginMainStoryGeneration: requestId => {
      let started = false;
      set(state => {
        if (
          !requestId.trim() ||
          state.mainStory.run?.phase !== 'playing' ||
          state.mainStory.generation.status === 'loading' ||
          state.mainStory.generation.status === 'ready'
        ) {
          return state;
        }
        started = true;
        return {
          mainStory: {
            ...state.mainStory,
            generation: { status: 'loading', requestId, source: null, error: null },
          },
        };
      });
      return started;
    },

    setMainStoryActContent: (floor, messages) =>
      set(state => {
        const run = state.mainStory.run;
        if (
          run?.phase !== 'playing' ||
          state.mainStory.generation.requestId !== floor.floorId ||
          run.eventId !== floor.eventId ||
          run.actId !== floor.actId ||
          !hasCurrentStoryContext(state.mainStory.archives, floor) ||
          floor.outcome !== 'accepted' ||
          floor.act?.id !== floor.actId
        ) {
          return state;
        }
        const archives = upsertStoryFloor(state.mainStory.archives, floor, true);
        return {
          mainStory: {
            ...state.mainStory,
            run: { ...run, pageIndex: 0 },
            archives,
            messages: mergeStoryMessages(state.mainStory.messages, messages),
            generation: { status: 'ready', requestId: null, source: floor.source, error: null },
          },
        };
      }),

    failMainStoryGeneration: (message, messages = [], floor) =>
      set(state => {
        const run = state.mainStory.run;
        if (
          run?.phase !== 'playing' ||
          !floor ||
          state.mainStory.generation.requestId !== floor.floorId ||
          run.eventId !== floor.eventId ||
          run.actId !== floor.actId ||
          !hasCurrentStoryContext(state.mainStory.archives, floor)
        ) {
          return state;
        }
        return {
          mainStory: {
            ...state.mainStory,
            archives: upsertStoryFloor(state.mainStory.archives, floor, false),
            messages: mergeStoryMessages(state.mainStory.messages, messages),
            generation: { status: 'error', requestId: null, source: null, error: message },
          },
        };
      }),

    addMainStoryFloor: (floor, messages, basedOnFloorId) => {
      let added = false;
      set(state => {
        const archive = getStoryArchive(state.mainStory.archives, floor.eventId, floor.actId);
        if (
          !archive?.floors.some(savedFloor => savedFloor.floorId === basedOnFloorId) ||
          !hasCurrentStoryContext(state.mainStory.archives, floor)
        ) {
          return state;
        }
        added = true;
        return {
          mainStory: {
            ...state.mainStory,
            archives: upsertStoryFloor(state.mainStory.archives, floor, false),
            messages: mergeStoryMessages(state.mainStory.messages, messages),
          },
        };
      });
      return added;
    },

    selectMainStoryFloor: floorId => {
      let selected = false;
      set(state => {
        const archiveIndex = state.mainStory.archives.findIndex(archive =>
          archive.floors.some(floor => floor.floorId === floorId),
        );
        if (archiveIndex < 0) return state;
        const archive = state.mainStory.archives[archiveIndex];
        const floor = archive.floors.find(candidate => candidate.floorId === floorId);
        if (!floor || floor.outcome !== 'accepted' || floor.act === null) return state;

        selected = true;
        const archives = state.mainStory.archives.map((savedArchive, index) =>
          index === archiveIndex ? { ...savedArchive, activeFloorId: floorId } : savedArchive,
        );
        const run = state.mainStory.run;
        const appliesToRun = run?.phase === 'playing' && run.eventId === floor.eventId && run.actId === floor.actId;
        return {
          mainStory: {
            ...state.mainStory,
            archives,
            ...(appliesToRun && run
              ? {
                  run: { ...run, pageIndex: 0 },
                  generation: { status: 'ready', requestId: null, source: floor.source, error: null },
                }
              : {}),
          },
        };
      });
      return selected;
    },

    deleteMainStoryFloor: floorId => {
      let deleted = false;
      set(state => {
        const archiveIndex = state.mainStory.archives.findIndex(archive =>
          archive.floors.some(floor => floor.floorId === floorId),
        );
        if (archiveIndex < 0) return state;

        const archive = state.mainStory.archives[archiveIndex];
        const deletedFloor = archive.floors.find(floor => floor.floorId === floorId);
        if (!deletedFloor) return state;
        const isReferenced = state.mainStory.archives.some(savedArchive =>
          savedArchive.floors.some(floor => floor.floorId !== floorId && floor.contextFloorIds.includes(floorId)),
        );
        if (isReferenced) return state;
        deleted = true;

        const remainingFloors = archive.floors.filter(floor => floor.floorId !== floorId);
        const deletedActiveFloor = archive.activeFloorId === floorId;
        const replacementFloor = deletedActiveFloor
          ? ([...remainingFloors].reverse().find(floor => floor.outcome === 'accepted' && floor.act !== null) ?? null)
          : null;
        const nextArchive: GalStoryActArchive = {
          ...archive,
          activeFloorId: deletedActiveFloor ? (replacementFloor?.floorId ?? null) : archive.activeFloorId,
          floors: remainingFloors,
        };
        const archives =
          remainingFloors.length === 0
            ? state.mainStory.archives.filter((_, index) => index !== archiveIndex)
            : state.mainStory.archives.map((savedArchive, index) =>
                index === archiveIndex ? nextArchive : savedArchive,
              );
        const deletedMessageIds = new Set(deletedFloor.messageIds);
        const messages = state.mainStory.messages.filter(
          message => !deletedMessageIds.has(message.id) && message.extra.floorId !== deletedFloor.floorId,
        );
        const run = state.mainStory.run;
        const appliesToRun =
          deletedActiveFloor &&
          run?.phase === 'playing' &&
          run.eventId === deletedFloor.eventId &&
          run.actId === deletedFloor.actId;

        return {
          mainStory: {
            ...state.mainStory,
            archives,
            messages,
            ...(appliesToRun && run
              ? {
                  run: { ...run, pageIndex: 0 },
                  generation: replacementFloor?.act
                    ? { status: 'ready' as const, requestId: null, source: replacementFloor.source, error: null }
                    : createIdleGeneration(),
                }
              : {}),
          },
        };
      });
      return deleted;
    },

    setMainStoryPosition: (actId, pageIndex) =>
      set(state => {
        const run = state.mainStory.run;
        if (run?.phase !== 'playing' || run.actId !== actId) return state;
        const act = getActiveStoryAct(state.mainStory.archives, run.eventId, run.actId);
        if (!act) return state;
        const safePageIndex = Math.min(act.beats.length - 1, Math.max(0, Math.trunc(pageIndex)));
        return { mainStory: { ...state.mainStory, run: { ...run, pageIndex: safePageIndex } } };
      }),

    finishMainStoryAct: () => {
      let finished = false;
      set(state => {
        const run = state.mainStory.run;
        if (run?.phase !== 'playing') return state;
        const episode = getMainStoryEpisode(run.eventId);
        const actIndex = episode?.acts.findIndex(act => act.id === run.actId) ?? -1;
        const activeAct = getActiveStoryAct(state.mainStory.archives, run.eventId, run.actId);
        if (!episode || actIndex < 0 || !activeAct) return state;

        finished = true;
        const isLastAct = actIndex === episode.acts.length - 1;
        const nextAct = episode.acts[actIndex + 1];
        const advancesDay = state.actionPointsRemaining === 0;
        const nextDay = advancesDay ? state.day + 1 : state.day;
        const nextRun =
          !isLastAct && nextAct
            ? { eventId: episode.id, actId: nextAct.id, phase: 'waiting' as const, pageIndex: 0 }
            : null;
        const completedEventIds = isLastAct
          ? [...new Set([...state.mainStory.completedEventIds, episode.id])]
          : state.mainStory.completedEventIds;

        return {
          ...(advancesDay
            ? {
                day: nextDay,
                date: getNextCalendarDate(state.date),
                actionPointsRemaining: dependencies.maxDailyActionPoints,
                periodIndex: 0,
                events: dependencies.spawnEvents(nextDay),
              }
            : {}),
          currentSceneId: null,
          mainStory: {
            ...state.mainStory,
            run: nextRun,
            completedEventIds,
            generation: createIdleGeneration(),
          },
          log: [
            ...state.log.slice(advancesDay ? -18 : -19),
            isLastAct
              ? `主线事件「${episode.title}」结束。`
              : `主线事件「${episode.title}」第 ${actIndex + 1} 幕暂告一段落。`,
            ...(advancesDay ? [`第 ${state.day} 天结束，第 ${nextDay} 天的早晨到了。`] : []),
          ],
        };
      });
      if (finished) get().reconcilePendingMainStoryEntry();
      return finished;
    },
  };
}
