import { MAIN_STORY_EPISODES } from '../../GalMainStory/storyRegistry';
import type { StoryEpisodeTemplate } from '../../GalMainStory/episodeTemplate';
import { sortSpecialDates } from './selectors';
import { projectMainStoryBlockedSpecialDates } from './mainStoryProjection';
import type { SpecialDateDefinition } from './types';

const STATIC_SPECIAL_DATES: readonly SpecialDateDefinition[] = [];

export function buildCalendarSpecialDateCatalog(
  episodes: readonly StoryEpisodeTemplate[] = MAIN_STORY_EPISODES,
  manualSpecialDates: readonly SpecialDateDefinition[] = STATIC_SPECIAL_DATES,
): SpecialDateDefinition[] {
  return sortSpecialDates([...manualSpecialDates, ...projectMainStoryBlockedSpecialDates(episodes)]);
}
