import { defineStoryEpisode } from '../../episodeTemplate';
import { EPISODE_01_ACT_01 } from './acts/act01';
import { EPISODE_01_ACT_02 } from './acts/act02';

export const EPISODE_01_EVENT_ID = 'main.lala-arrival-2008-04-07';

export const EPISODE_01_STORY = defineStoryEpisode({
  id: EPISODE_01_EVENT_ID,
  episodeNumber: 1,
  title: '从天而降的少女',
  dateLabel: '2008 年 4 月 7 日',
  acts: [EPISODE_01_ACT_01, EPISODE_01_ACT_02],
});
