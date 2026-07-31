import type { StoryEpisodeTemplate } from '../../GalMainStory/episodeTemplate';
import { getCalendarWeekdayIndex, calendarDateKey } from './selectors';
import type { SpecialDateDefinition } from './types';

const MAIN_STORY_BLOCKED_LABEL = '已有重要日程';

function isWeekend(date: SpecialDateDefinition['date']): boolean {
  const weekday = getCalendarWeekdayIndex(date);
  return weekday === 0 || weekday === 6;
}

export function projectMainStoryBlockedSpecialDates(
  episodes: readonly StoryEpisodeTemplate[],
): SpecialDateDefinition[] {
  const blockedDates = new Map<string, SpecialDateDefinition>();

  for (const episode of episodes) {
    for (const act of episode.acts) {
      if (act.timeCost !== 'whole-day') continue;
      if (!isWeekend(act.trigger.date)) continue;

      const key = calendarDateKey(act.trigger.date);
      if (blockedDates.has(key)) continue;

      blockedDates.set(key, {
        id: `main-story-blocked-${key}`,
        date: { ...act.trigger.date },
        category: 'mainStoryBlocked',
        label: MAIN_STORY_BLOCKED_LABEL,
        marker: 'blocked',
      });
    }
  }

  return [...blockedDates.values()];
}
