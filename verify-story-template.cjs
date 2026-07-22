/* eslint-disable @typescript-eslint/no-require-imports, import-x/no-nodejs-modules -- Node-only template contract check. */
const assert = require('node:assert/strict');

require('ts-node').register({
  transpileOnly: true,
  compilerOptions: {
    module: 'CommonJS',
    moduleResolution: 'Node',
    target: 'ES2022',
    esModuleInterop: true,
    ignoreDeprecations: '6.0',
  },
});

const { defineStoryEpisode, defineStoryEpisodes } = require('./GalMainStory/episodeTemplate');
const { findPendingMainStoryEntry, getMainStoryEpisode } = require('./GalMainStory/storyRegistry');

function createFixtureAct(id, title, day, actionNumber, order) {
  return {
    id,
    title,
    trigger: { date: { year: 2099, month: 1, day }, actionNumber },
    plotLore: {
      worldbookName: 'fixture-worldbook',
      entryOrder: order,
      entryName: title,
      rootTag: `Fixture ${id}`,
      kind: 'plot',
    },
    loreSection: title,
    characterLoreIds: [],
    presentation: { sceneIds: ['school'], cast: [] },
    generation: { minimumLineCount: 1, requiredSceneSequence: ['school'] },
    fallbackBeats: [
      {
        speaker: null,
        text: `${title}的保底正文。`,
        presentation: {
          sceneId: 'school',
          focusCharacterId: null,
          portraitId: null,
          expressionId: null,
          effect: 'none',
        },
      },
    ],
  };
}

const fixtureEpisode = defineStoryEpisode({
  id: 'fixture.future-episode',
  episodeNumber: 99,
  title: '未登记的未来剧集',
  dateLabel: '2099 年 1 月 2 日—3 日',
  acts: [createFixtureAct('fixture.act1', '第一幕', 2, 1, 990), createFixtureAct('fixture.act2', '第二幕', 3, 2, 991)],
});

assert.equal(getMainStoryEpisode(fixtureEpisode.id), null, 'fixture 不应污染生产剧集注册表');
assert.deepEqual(
  findPendingMainStoryEntry([fixtureEpisode], {
    date: { year: 2099, month: 1, day: 2 },
    actionNumber: 1,
    run: null,
    completedEventIds: [],
  }),
  { eventId: fixtureEpisode.id, actId: fixtureEpisode.acts[0].id },
);
assert.deepEqual(
  findPendingMainStoryEntry([fixtureEpisode], {
    date: { year: 2099, month: 1, day: 3 },
    actionNumber: 2,
    run: { eventId: fixtureEpisode.id, actId: fixtureEpisode.acts[1].id, phase: 'waiting', pageIndex: 0 },
    completedEventIds: [],
  }),
  { eventId: fixtureEpisode.id, actId: fixtureEpisode.acts[1].id },
);
assert.equal(
  findPendingMainStoryEntry([fixtureEpisode], {
    date: { year: 2099, month: 1, day: 3 },
    actionNumber: 2,
    run: { eventId: fixtureEpisode.id, actId: fixtureEpisode.acts[1].id, phase: 'playing', pageIndex: 0 },
    completedEventIds: [],
  }),
  null,
);
assert.equal(defineStoryEpisodes([fixtureEpisode])[0], fixtureEpisode);

console.log('Story template contract passed: an unregistered fixture episode is driven entirely by template data.');
