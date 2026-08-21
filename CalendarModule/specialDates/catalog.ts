import { MAIN_STORY_EPISODES } from '../../GalMainStory/storyRegistry';
import type { StoryEpisodeTemplate } from '../../GalMainStory/episodeTemplate';
import { GAME_START_DATE } from '../date';
import { projectBirthdaySpecialDates } from './birthdays';
import { sortSpecialDates } from './selectors';
import { projectMainStoryBlockedSpecialDates } from './mainStoryProjection';
import type { SpecialDateDefinition } from './types';

const STATIC_SPECIAL_DATES: readonly SpecialDateDefinition[] = [];
const BIRTHDAY_YEARS: readonly number[] = [GAME_START_DATE.year, GAME_START_DATE.year + 1];

const REGISTERED_HOLIDAYS = [
  { month: 4, day: 29, label: '昭和日' },
  { month: 5, day: 3, label: '宪法纪念日' },
  { month: 5, day: 4, label: '绿之日' },
  { month: 5, day: 5, label: '儿童节' },
] as const;

export function projectRegisteredHolidaySpecialDates(years: readonly number[]): SpecialDateDefinition[] {
  return years.flatMap(year =>
    REGISTERED_HOLIDAYS.map(holiday => ({
      id: `holiday-${year}-${holiday.month}-${holiday.day}`,
      date: { year, month: holiday.month, day: holiday.day },
      category: 'holiday' as const,
      label: holiday.label,
      marker: 'holiday' as const,
    })),
  );
}

export function buildCalendarSpecialDateCatalog(
  episodes: readonly StoryEpisodeTemplate[] = MAIN_STORY_EPISODES,
  manualSpecialDates: readonly SpecialDateDefinition[] = STATIC_SPECIAL_DATES,
  birthdayYears: readonly number[] = BIRTHDAY_YEARS,
  holidayYears: readonly number[] = birthdayYears,
): SpecialDateDefinition[] {
  return sortSpecialDates([
    ...manualSpecialDates,
    ...projectBirthdaySpecialDates(birthdayYears),
    ...projectRegisteredHolidaySpecialDates(holidayYears),
    ...projectMainStoryBlockedSpecialDates(episodes),
  ]);
}
