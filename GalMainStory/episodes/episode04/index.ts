import { defineStoryEpisode } from '../../episodeTemplate';
import { EPISODE_03_EVENT_ID } from '../episode03';
import { EPISODE_04_ACT_01 } from './acts/act01';
import { EPISODE_04_ACT_02 } from './acts/act02';
import { EPISODE_04_ACT_03 } from './acts/act03';

export const EPISODE_04_EVENT_ID = 'main.love-apron-user-2008-04-15';

export const EPISODE_04_STORY = defineStoryEpisode({
  id: EPISODE_04_EVENT_ID,
  episodeNumber: 4,
  title: '宇宙的 LOVE 围裙',
  dateLabel: '2008 年 4 月 15 日—16 日',
  prerequisiteEventIds: [EPISODE_03_EVENT_ID],
  acts: [EPISODE_04_ACT_01, EPISODE_04_ACT_02, EPISODE_04_ACT_03],
});
