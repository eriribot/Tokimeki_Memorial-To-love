import { defineStoryEpisodes } from '../episodeTemplate';
import { EPISODE_01_STORY } from './episode01';
import { EPISODE_02_STORY } from './episode02';

/** Adding an episode only requires importing its template and registering it here. */
export const MAIN_STORY_EPISODES = defineStoryEpisodes([EPISODE_01_STORY, EPISODE_02_STORY] as const);
