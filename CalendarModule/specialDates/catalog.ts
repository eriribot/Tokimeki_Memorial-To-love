import { MAIN_STORY_EPISODES } from '../../GalMainStory/storyRegistry';
import type { StoryEpisodeTemplate } from '../../GalMainStory/episodeTemplate';
import { GAME_START_DATE } from '../date';
import { projectBirthdaySpecialDates } from './birthdays';
import { sortSpecialDates } from './selectors';
import { projectMainStoryBlockedSpecialDates } from './mainStoryProjection';
import type { SpecialDateDefinition } from './types';

const STATIC_SPECIAL_DATES: readonly SpecialDateDefinition[] = [];
const BIRTHDAY_YEARS: readonly number[] = [GAME_START_DATE.year, GAME_START_DATE.year + 1];

export function buildCalendarSpecialDateCatalog(
  episodes: readonly StoryEpisodeTemplate[] = MAIN_STORY_EPISODES,
  manualSpecialDates: readonly SpecialDateDefinition[] = STATIC_SPECIAL_DATES,
  birthdayYears: readonly number[] = BIRTHDAY_YEARS,
): SpecialDateDefinition[] {
  return sortSpecialDates([
    ...manualSpecialDates,
    ...projectBirthdaySpecialDates(birthdayYears),
    ...projectMainStoryBlockedSpecialDates(episodes),
  ]);
}
