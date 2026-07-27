import { defineStoryEpisode } from '../../episodeTemplate';
import { EPISODE_02_EVENT_ID } from '../episode02';
import { EPISODE_03_ACT_01 } from './acts/act01';
import { EPISODE_03_ACT_02 } from './acts/act02';
import { EPISODE_03_ACT_03 } from './acts/act03';

export const EPISODE_03_EVENT_ID = 'main.love-triangle-user-2008-04-11';

export const EPISODE_03_STORY = defineStoryEpisode({
  id: EPISODE_03_EVENT_ID,
  episodeNumber: 3,
  title: '三角关系',
  dateLabel: '2008 年 4 月 11 日—14 日',
  prerequisiteEventIds: [EPISODE_02_EVENT_ID],
  acts: [EPISODE_03_ACT_01, EPISODE_03_ACT_02, EPISODE_03_ACT_03],
});
