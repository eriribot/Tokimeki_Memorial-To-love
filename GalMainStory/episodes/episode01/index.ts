import type { CalendarDateValue } from '../../../types';
import type { DisabledWorldbookLoreReference } from '../../../data/storyLore';
import { getStoryCharacter, isStoryCharacterId } from '../../characters';
import { STORY_SCENE_ASSETS } from '../../scenes';
import type {
  GalStoryAct,
  MainStoryEntryReason,
  StoryActDefinition,
  StoryPresentationCue,
} from '../../storyTypes';
import { EPISODE_01_ACT_01 } from './acts/act01';
import { EPISODE_01_ACT_02 } from './acts/act02';

export const EPISODE_01_EVENT_ID = 'main.lala-arrival-2008-04-07';

export const EPISODE_01_PLOT_LORE_REFERENCES = [
  {
    worldbookName: '出包王女',
    entryUid: 101,
    entryName: '剧情第一集·第一幕',
    rootTag: 'To LOVE-Ru TV Episode 01 Act 01',
    kind: 'plot',
  },
  {
    worldbookName: '出包王女',
    entryUid: 102,
    entryName: '剧情第一集·第二幕',
    rootTag: 'To LOVE-Ru TV Episode 01 Act 02',
    kind: 'plot',
  },
] as const satisfies readonly DisabledWorldbookLoreReference[];

export const EPISODE_01_ACTS = [EPISODE_01_ACT_01, EPISODE_01_ACT_02] as const;

export function getEpisode01LoreReferences(actIndex: number): DisabledWorldbookLoreReference[] {
  const act = EPISODE_01_ACTS[actIndex];
  const plotLoreReference = EPISODE_01_PLOT_LORE_REFERENCES[actIndex];
  if (!act || !plotLoreReference) throw new Error('第一集幕编号无效。');

  return [
    plotLoreReference,
    ...act.characterLoreIds.flatMap(characterId => {
      if (!isStoryCharacterId(characterId)) throw new Error(`第一集引用了未登记角色“${characterId}”。`);
      return getStoryCharacter(characterId).loreReferences;
    }),
  ];
}

export const EPISODE_01_ACT_IDS = EPISODE_01_ACTS.map(act => act.id);

export function resolveEpisode01PortraitId(
  actId: string | undefined,
  presentation: StoryPresentationCue | undefined,
): string | null {
  const requestedPortraitId = presentation?.portraitId ?? null;
  if (!presentation) return requestedPortraitId;
  const act: StoryActDefinition | undefined = EPISODE_01_ACTS.find(candidate => candidate.id === actId);
  const portraitRules = act?.presentation.portraitRules ?? [];
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

export const EPISODE_01_STORY = {
  id: EPISODE_01_EVENT_ID,
  episodeNumber: 1,
  title: '从天而降的少女',
  dateLabel: '2008 年 4 月 7 日',
  backgrounds: STORY_SCENE_ASSETS,
  acts: EPISODE_01_ACTS,
} as const;

interface Episode01TriggerState {
  date: CalendarDateValue;
  actionPointsRemaining: number;
  activeMainStoryEventId: string | null;
  completedMainStoryEventIds: readonly string[];
  mainStoryActIndex: number;
}

function isEpisode01Date(date: CalendarDateValue): boolean {
  return date.year === 2008 && date.month === 4 && date.day === 7;
}

export function getPendingEpisode01ActIndex(state: Episode01TriggerState): number | null {
  if (
    !isEpisode01Date(state.date) ||
    state.activeMainStoryEventId !== null ||
    state.completedMainStoryEventIds.includes(EPISODE_01_EVENT_ID)
  ) {
    return null;
  }

  const actIndex = Math.min(EPISODE_01_ACTS.length - 1, Math.max(0, Math.trunc(state.mainStoryActIndex)));
  const act = EPISODE_01_ACTS[actIndex];
  return state.actionPointsRemaining <= act.actionPointsRemaining ? actIndex : null;
}

export function shouldTriggerEpisode01(state: Episode01TriggerState): boolean {
  return getPendingEpisode01ActIndex(state) !== null;
}

export function getEpisode01EntryReason(actIndex: number): MainStoryEntryReason {
  return actIndex <= 0 ? 'after_first_action' : 'after_second_action';
}

export function createEpisode01FallbackAct(_entryReason: MainStoryEntryReason, actIndex: number): GalStoryAct {
  const act = EPISODE_01_ACTS[Math.min(EPISODE_01_ACTS.length - 1, Math.max(0, Math.trunc(actIndex)))];
  if (!act) throw new Error('第一集幕编号无效。');
  return {
    id: act.id,
    beats: act.fallbackBeats.map(beat => ({
      ...beat,
      presentation: { ...beat.presentation },
    })),
  };
}
