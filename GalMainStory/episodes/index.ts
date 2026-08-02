import { defineStoryEpisodes } from '../episodeTemplate';
import { EPISODE_01_STORY } from './episode01';
import { EPISODE_02_STORY } from './episode02';
import { EPISODE_03_STORY } from './episode03';
import { EPISODE_04_STORY } from './episode04';

/** Adding an episode only requires importing its template and registering it here. */
export const MAIN_STORY_EPISODES = defineStoryEpisodes([
  EPISODE_01_STORY,
  EPISODE_02_STORY,
  EPISODE_03_STORY,
  EPISODE_04_STORY,
] as const);
