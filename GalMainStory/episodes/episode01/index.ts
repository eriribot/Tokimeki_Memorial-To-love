import type { CalendarDateValue } from '../../../types';
import type { DisabledWorldbookLoreReference } from '../../../data/storyLore';
import { HARUNA_STORY_CHARACTER, LALA_STORY_CHARACTER, RIKO_STORY_CHARACTER } from '../../characters';
import { STORY_SCENE_ASSETS } from '../../scenes';
import type { GalStoryAct, MainStoryEntryReason } from '../../storyTypes';
import { LALA_ARRIVAL_ACT_01 } from './acts/act01';
import { LALA_ARRIVAL_ACT_02 } from './acts/act02';

export const LALA_ARRIVAL_EVENT_ID = 'main.lala-arrival-2008-04-07';

export const LALA_ARRIVAL_PLOT_LORE_REFERENCE = {
  worldbookName: '出包王女',
  entryUid: 2,
  entryName: '剧情第一集',
  rootTag: 'To LOVE-Ru TV Episode 01',
  requiredContentMarker: '标题:从天而降的少女',
  kind: 'plot',
} as const satisfies DisabledWorldbookLoreReference;

const LALA_CHARACTER_LORE_REFERENCE = {
  worldbookName: '出包王女',
  entryUid: 1,
  entryName: '菈菈.萨塔琳.戴比路克',
  rootTag: 'Lala Satalin Deviluke',
  requiredContentMarker: '姓名:菈菈·萨塔琳·戴比路克',
  kind: 'character',
} as const satisfies DisabledWorldbookLoreReference;

export const LALA_ARRIVAL_ACTS = [LALA_ARRIVAL_ACT_01, LALA_ARRIVAL_ACT_02] as const;

const LALA_ARRIVAL_CHARACTER_LORE_REFERENCES = {
  菈菈: LALA_CHARACTER_LORE_REFERENCE,
} as const;

export function getLalaArrivalLoreReferences(actIndex: number): DisabledWorldbookLoreReference[] {
  const act = LALA_ARRIVAL_ACTS[actIndex];
  if (!act) throw new Error('第一集幕编号无效。');

  return [
    LALA_ARRIVAL_PLOT_LORE_REFERENCE,
    ...act.charactersWithLore.flatMap(characterName => {
      const reference =
        LALA_ARRIVAL_CHARACTER_LORE_REFERENCES[characterName as keyof typeof LALA_ARRIVAL_CHARACTER_LORE_REFERENCES];
      return reference ? [reference] : [];
    }),
  ];
}

export const LALA_ARRIVAL_ACT_IDS = LALA_ARRIVAL_ACTS.map(act => act.id);

export const LALA_ARRIVAL_ALLOWED_SPEAKERS = [
  '你',
  LALA_STORY_CHARACTER.displayName,
  HARUNA_STORY_CHARACTER.displayName,
  RIKO_STORY_CHARACTER.displayName,
  '猿山',
  '沛凯',
  '萨斯丁',
  '亲卫队',
] as const;

export const LALA_ARRIVAL_SPEAKER_ALIAS_GROUPS = [
  { speaker: '你', aliases: ['你', 'User', '玩家', '主角', '主人公', '男主角', '男主'] },
  { speaker: LALA_STORY_CHARACTER.displayName, aliases: LALA_STORY_CHARACTER.speakerAliases },
  { speaker: HARUNA_STORY_CHARACTER.displayName, aliases: HARUNA_STORY_CHARACTER.speakerAliases },
  { speaker: RIKO_STORY_CHARACTER.displayName, aliases: RIKO_STORY_CHARACTER.speakerAliases },
  { speaker: '猿山', aliases: ['猿山'] },
  { speaker: '沛凯', aliases: ['沛凯', '佩凯', 'Peke', 'ペケ'] },
  { speaker: '萨斯丁', aliases: ['萨斯丁', '萨斯汀', '扎斯丁', 'Zastin', 'ザスティン'] },
  { speaker: '亲卫队', aliases: ['亲卫队', '親衛隊', '戴比路克亲卫队', '戴比路克親衛隊'] },
] as const;

export const LALA_ARRIVAL_STORY = {
  id: LALA_ARRIVAL_EVENT_ID,
  episodeNumber: 1,
  title: '从天而降的少女',
  dateLabel: '2008 年 4 月 7 日',
  backgrounds: STORY_SCENE_ASSETS,
  acts: LALA_ARRIVAL_ACTS,
} as const;

interface LalaArrivalTriggerState {
  date: CalendarDateValue;
  actionPointsRemaining: number;
  activeMainStoryEventId: string | null;
  completedMainStoryEventIds: readonly string[];
  mainStoryActIndex: number;
}

function isLalaArrivalDate(date: CalendarDateValue): boolean {
  return date.year === 2008 && date.month === 4 && date.day === 7;
}

export function getPendingLalaArrivalActIndex(state: LalaArrivalTriggerState): number | null {
  if (
    !isLalaArrivalDate(state.date) ||
    state.activeMainStoryEventId !== null ||
    state.completedMainStoryEventIds.includes(LALA_ARRIVAL_EVENT_ID)
  ) {
    return null;
  }

  const actIndex = Math.min(LALA_ARRIVAL_ACTS.length - 1, Math.max(0, Math.trunc(state.mainStoryActIndex)));
  const act = LALA_ARRIVAL_ACTS[actIndex];
  return state.actionPointsRemaining <= act.actionPointsRemaining ? actIndex : null;
}

export function shouldTriggerLalaArrival(state: LalaArrivalTriggerState): boolean {
  return getPendingLalaArrivalActIndex(state) !== null;
}

export function getLalaArrivalEntryReason(actIndex: number): MainStoryEntryReason {
  return actIndex <= 0 ? 'after_first_action' : 'after_second_action';
}

export function createLalaArrivalFallbackAct(entryReason: MainStoryEntryReason, actIndex: number): GalStoryAct {
  const acts = createLalaArrivalFallback(entryReason);
  return acts[Math.min(acts.length - 1, Math.max(0, Math.trunc(actIndex)))] ?? acts[0];
}

export function createLalaArrivalFallback(_entryReason: MainStoryEntryReason): GalStoryAct[] {
  return LALA_ARRIVAL_ACTS.map(act => ({
    id: act.id,
    beats: act.fallbackBeats.map(beat => ({ ...beat })),
  }));
}
