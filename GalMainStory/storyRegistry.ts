import { LALA_ARRIVAL_STORY } from './episodes/episode01';

export const MAIN_STORY_EPISODES = [LALA_ARRIVAL_STORY] as const;

export type MainStoryEpisodeDefinition = (typeof MAIN_STORY_EPISODES)[number];

export function getMainStoryEpisode(eventId: string | null | undefined): MainStoryEpisodeDefinition | null {
  if (!eventId) return null;
  return MAIN_STORY_EPISODES.find(episode => episode.id === eventId) ?? null;
}
