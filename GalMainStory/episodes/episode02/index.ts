import { defineStoryEpisode } from '../../episodeTemplate';
import { EPISODE_01_EVENT_ID } from '../episode01';
import { EPISODE_02_ACT_01 } from './acts/act01';
import { EPISODE_02_ACT_02 } from './acts/act02';
import { EPISODE_02_ACT_03 } from './acts/act03';

export const EPISODE_02_EVENT_ID = 'main.engagement-cancellation-2008-04-09';

export const EPISODE_02_STORY = defineStoryEpisode({
  id: EPISODE_02_EVENT_ID,
  episodeNumber: 2,
  title: '婚约解除!?',
  dateLabel: '2008 年 4 月 9 日—11 日',
  prerequisiteEventIds: [EPISODE_01_EVENT_ID],
  acts: [EPISODE_02_ACT_01, EPISODE_02_ACT_02, EPISODE_02_ACT_03],
});
