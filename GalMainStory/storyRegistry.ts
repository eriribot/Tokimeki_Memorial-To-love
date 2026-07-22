import type { DisabledWorldbookLoreReference } from '../data/storyLore';
import type { CalendarDateValue } from '../types';
import { getStoryCharacter, isStoryCharacterId } from './characters';
import type { StoryEpisodeActDefinition, StoryEpisodeTemplate } from './episodeTemplate';
import { MAIN_STORY_EPISODES } from './episodes';
import type { GalStoryAct, MainStoryRun, StoryPresentationCue } from './storyTypes';

export { MAIN_STORY_EPISODES } from './episodes';
export type MainStoryEpisodeDefinition = StoryEpisodeTemplate;

export function getMainStoryEpisode(eventId: string | null | undefined): StoryEpisodeTemplate | null {
  if (!eventId) return null;
  return MAIN_STORY_EPISODES.find(episode => episode.id === eventId) ?? null;
}

export function getMainStoryEpisodeOrThrow(eventId: string): StoryEpisodeTemplate {
  const episode = getMainStoryEpisode(eventId);
  if (!episode) throw new Error(`主线事件“${eventId}”尚未登记。`);
  return episode;
}

export function getMainStoryAct(eventId: string, actId: string): StoryEpisodeActDefinition | null {
  return getMainStoryEpisode(eventId)?.acts.find(act => act.id === actId) ?? null;
}

export function getMainStoryActOrThrow(eventId: string, actId: string): StoryEpisodeActDefinition {
  const act = getMainStoryAct(eventId, actId);
  if (!act) throw new Error(`主线事件“${eventId}”没有登记幕“${actId}”。`);
  return act;
}

export function getMainStoryActIndex(eventId: string, actId: string): number {
  return getMainStoryEpisode(eventId)?.acts.findIndex(act => act.id === actId) ?? -1;
}

export function getMainStoryLoreReferences(eventId: string, actId: string): DisabledWorldbookLoreReference[] {
  const act = getMainStoryActOrThrow(eventId, actId);
  return [
    act.plotLore,
    ...act.characterLoreIds.flatMap(characterId => {
      if (!isStoryCharacterId(characterId)) throw new Error(`主线幕“${act.id}”引用了未登记角色“${characterId}”。`);
      return getStoryCharacter(characterId).loreReferences;
    }),
  ];
}

export function createMainStoryFallbackAct(eventId: string, actId: string): GalStoryAct {
  const act = getMainStoryActOrThrow(eventId, actId);
  return {
    id: act.id,
    beats: act.fallbackBeats.map(beat => ({
      ...beat,
      presentation: { ...beat.presentation },
    })),
  };
}

export function resolveMainStoryPortraitId(
  eventId: string,
  actId: string | undefined,
  presentation: StoryPresentationCue | undefined,
): string | null {
  const requestedPortraitId = presentation?.portraitId ?? null;
  if (!presentation || !actId) return requestedPortraitId;
  const portraitRules = getMainStoryAct(eventId, actId)?.presentation.portraitRules ?? [];
  const matchingRule = portraitRules.find(
    rule => rule.sceneId === presentation.sceneId && rule.characterId === presentation.focusCharacterId,
  );
  if (matchingRule) return matchingRule.portraitId;
  const outsideSceneRule = portraitRules.find(
    rule =>
      rule.characterId === presentation.focusCharacterId &&
      rule.portraitId === requestedPortraitId &&
      rule.outsideScenePortraitId,
  );
  return outsideSceneRule?.outsideScenePortraitId ?? requestedPortraitId;
}

export interface MainStoryTriggerState {
  date: CalendarDateValue;
  actionNumber: number;
  run: MainStoryRun | null;
  completedEventIds: readonly string[];
}

export interface PendingMainStoryEntry {
  eventId: string;
  actId: string;
}

function datesMatch(left: CalendarDateValue, right: CalendarDateValue): boolean {
  return left.year === right.year && left.month === right.month && left.day === right.day;
}

function canStartEpisode(episode: StoryEpisodeTemplate, completedEventIds: readonly string[]): boolean {
  return (
    !completedEventIds.includes(episode.id) &&
    (episode.prerequisiteEventIds ?? []).every(eventId => completedEventIds.includes(eventId))
  );
}

function matchesTrigger(
  episode: StoryEpisodeTemplate,
  act: StoryEpisodeActDefinition,
  state: MainStoryTriggerState,
): PendingMainStoryEntry | null {
  if (!datesMatch(state.date, act.trigger.date) || state.actionNumber !== act.trigger.actionNumber) return null;
  return { eventId: episode.id, actId: act.id };
}

export function findPendingMainStoryEntry(
  episodes: readonly StoryEpisodeTemplate[],
  state: MainStoryTriggerState,
): PendingMainStoryEntry | null {
  if (state.run?.phase === 'playing') return null;

  if (state.run) {
    const episode = episodes.find(candidate => candidate.id === state.run?.eventId) ?? null;
    const act = episode?.acts.find(candidate => candidate.id === state.run?.actId);
    if (!episode || !act || !canStartEpisode(episode, state.completedEventIds)) return null;
    return matchesTrigger(episode, act, state);
  }

  for (const episode of episodes) {
    if (!canStartEpisode(episode, state.completedEventIds)) continue;
    const firstAct = episode.acts[0];
    if (!firstAct) continue;
    const pending = matchesTrigger(episode, firstAct, state);
    if (pending) return pending;
  }
  return null;
}

export function getPendingMainStoryEntry(state: MainStoryTriggerState): PendingMainStoryEntry | null {
  return findPendingMainStoryEntry(MAIN_STORY_EPISODES, state);
}
