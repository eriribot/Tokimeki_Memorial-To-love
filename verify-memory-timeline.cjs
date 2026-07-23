/* eslint-disable @typescript-eslint/no-require-imports, import-x/no-nodejs-modules -- Node-only pure contract check. */
const assert = require('node:assert/strict');

require('ts-node').register({
  transpileOnly: true,
  compilerOptions: {
    module: 'CommonJS',
    moduleResolution: 'Node',
    target: 'ES2022',
    esModuleInterop: true,
  },
});

const { EPISODE_01_EVENT_ID, EPISODE_01_STORY } = require('./GalMainStory/episodes/episode01');
const { EPISODE_02_EVENT_ID, EPISODE_02_STORY } = require('./GalMainStory/episodes/episode02');
const { restoreMainStoryState } = require('./GalMainStory/storyPersistence');
const { getCanonicalStoryTimeline } = require('./memory/storyTimeline');
const { createStoryMessagePair } = require('./services/tavernStoryGeneration');

const VALID_BEAT = {
  speaker: null,
  text: '测试正文',
  presentation: {
    sceneId: 'space',
    focusCharacterId: null,
    portraitId: null,
    expressionId: null,
    effect: 'none',
  },
};

function createFloor(eventId, actId, floorId, outcome = 'accepted', activeAct = true, contextFloorIds = []) {
  return {
    floorId,
    eventId,
    actId,
    source: 'fallback',
    createdAt: '2008-04-07T00:00:00.000Z',
    outcome,
    act: activeAct ? { id: actId, beats: [VALID_BEAT] } : null,
    context: { playerName: '测试玩家', day: 1, period: 'morning', location: 'classroom' },
    contextFloorIds,
    messageIds: outcome === 'accepted' ? [floorId + '-user', floorId + '-assistant'] : [],
  };
}

function createIncompleteFloor(eventId, actId, floorId) {
  return {
    ...createFloor(eventId, actId, floorId),
    messageIds: [floorId + '-assistant'],
  };
}

const [ep01Act01, ep01Act02] = EPISODE_01_STORY.acts;
const [ep02Act01, ep02Act02, ep02Act03] = EPISODE_02_STORY.acts;
const archives = [
  {
    eventId: EPISODE_02_EVENT_ID,
    actId: ep02Act03.id,
    activeFloorId: null,
    floors: [
      createFloor(EPISODE_02_EVENT_ID, ep02Act03.id, 'ep02-act3-draft', 'accepted', true, [
        'ep02-act1-active',
        'ep02-act2-active',
      ]),
    ],
  },
  {
    eventId: EPISODE_02_EVENT_ID,
    actId: ep02Act02.id,
    activeFloorId: 'ep02-act2-active',
    floors: [
      createFloor(EPISODE_02_EVENT_ID, ep02Act02.id, 'ep02-act2-old-candidate', 'accepted', true, ['ep02-act1-active']),
      createFloor(EPISODE_02_EVENT_ID, ep02Act02.id, 'ep02-act2-active', 'accepted', true, ['ep02-act1-active']),
    ],
  },
  {
    eventId: EPISODE_01_EVENT_ID,
    actId: ep01Act01.id,
    activeFloorId: 'ep01-act1-active',
    floors: [createFloor(EPISODE_01_EVENT_ID, ep01Act01.id, 'ep01-act1-active')],
  },
  {
    eventId: EPISODE_02_EVENT_ID,
    actId: ep02Act01.id,
    activeFloorId: 'ep02-act1-active',
    floors: [createFloor(EPISODE_02_EVENT_ID, ep02Act01.id, 'ep02-act1-active')],
  },
];

const malformedArchives = [
  {
    eventId: EPISODE_01_EVENT_ID,
    actId: ep01Act02.id,
    activeFloorId: 'ep01-act2-parse-error',
    floors: [
      createFloor(EPISODE_01_EVENT_ID, ep01Act02.id, 'ep01-act2-parse-error', 'parse_error', false, [
        'ep01-act1-active',
      ]),
    ],
  },
  {
    eventId: 'unknown-event',
    actId: 'unknown-act',
    activeFloorId: 'unknown-floor',
    floors: [createFloor('unknown-event', 'unknown-act', 'unknown-floor')],
  },
];

const before = JSON.stringify(archives);
const archivedMessages = archives.flatMap(archive =>
  archive.floors.flatMap(floor =>
    createStoryMessagePair({
      eventId: floor.eventId,
      actId: floor.actId,
      floorId: floor.floorId,
      playerName: floor.context.playerName,
      day: floor.context.day,
      period: floor.context.period,
      location: floor.context.location,
      contextFloorIds: floor.contextFloorIds,
      chatHistory: [],
      userInput: '测试请求',
      assistantText: '测试回复',
      source: floor.source,
    }),
  ),
);
assert.doesNotThrow(
  () => restoreMainStoryState({ run: null, completedEventIds: [], archives }, archivedMessages),
  '主合同 fixture 必须通过 schema-v2 严格恢复',
);
assert.deepEqual(
  getCanonicalStoryTimeline(archives).map(floor => floor.floorId),
  ['ep01-act1-active', 'ep02-act1-active', 'ep02-act2-active'],
  '全量时间线应按注册表跨集排序，只保留 active accepted floor',
);
assert.ok(
  getCanonicalStoryTimeline(archives).every(floor => floor.source === 'fallback'),
  '采用 fallback floor 时必须保留 source 标签',
);
const incompleteActiveArchives = archives.map(archive => {
  if (archive.eventId === EPISODE_02_EVENT_ID && archive.actId === ep02Act01.id) {
    const incompleteFloor = createIncompleteFloor(EPISODE_02_EVENT_ID, ep02Act01.id, 'ep02-act1-incomplete');
    return { ...archive, activeFloorId: incompleteFloor.floorId, floors: [...archive.floors, incompleteFloor] };
  }
  return archive;
});

assert.deepEqual(
  getCanonicalStoryTimeline(incompleteActiveArchives).map(floor => floor.floorId),
  ['ep01-act1-active', 'ep02-act2-active'],
  'active floor 缺少完整 User/Assistant 消息时不得进入规范时间线',
);

assert.deepEqual(
  getCanonicalStoryTimeline(archives, { eventId: EPISODE_02_EVENT_ID, actId: ep02Act02.id }).map(
    floor => floor.floorId,
  ),
  ['ep01-act1-active', 'ep02-act1-active'],
  'exclusive boundary 应排除当前幕及其后续内容',
);
assert.deepEqual(
  getCanonicalStoryTimeline(archives, { eventId: EPISODE_01_EVENT_ID, actId: ep01Act01.id }),
  [],
  '第一幕之前不应有规范前文',
);
assert.deepEqual(
  getCanonicalStoryTimeline(malformedArchives),
  [],
  'parse_error、未知事件和不完整档案不得进入规范时间线',
);
assert.throws(
  () => getCanonicalStoryTimeline(archives, { eventId: 'unknown-event', actId: 'unknown-act' }),
  /故事时间线边界未登记/u,
);
assert.equal(JSON.stringify(archives), before, '时间线投影不得修改 archive 输入');

console.log('memory timeline contract: passed');
