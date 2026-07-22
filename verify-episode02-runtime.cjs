/* eslint-disable @typescript-eslint/no-require-imports, import-x/no-nodejs-modules -- Node-only store contract check. */
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

const { getActiveStoryAct } = require('./GalMainStory/storyArchive');
const { EPISODE_01_EVENT_ID } = require('./GalMainStory/episodes/episode01');
const { EPISODE_02_EVENT_ID, EPISODE_02_STORY } = require('./GalMainStory/episodes/episode02');
const { createMainStoryFallbackAct } = require('./GalMainStory/storyRegistry');
const { isCharacterAvailable } = require('./data/characterAvailability');
const { createGameSnapshot, restoreGameSnapshot } = require('./save/snapshot');
const { actToPlainText, createFallbackStoryMessages, createStoryFloor } = require('./services/tavernStoryGeneration');
const { useGameStore } = require('./stores/gameStore');

const store = useGameStore;
const [ACT_01, ACT_02, ACT_03] = EPISODE_02_STORY.acts;
store.getState().resetGameState();
store.setState({
  day: 3,
  date: { year: 2008, month: 4, day: 9 },
  actionPointsRemaining: 2,
  periodIndex: 0,
  mainStory: {
    run: null,
    generation: { status: 'idle', requestId: null, source: null, error: null },
    completedEventIds: [EPISODE_01_EVENT_ID],
    archives: [],
    messages: [],
  },
});

const act = message => store.getState().settlePlayerAction({ kind: 'activity', message });
const acceptedFloorIds = [];

function acceptCurrentFallback(floorId) {
  const state = store.getState();
  const run = state.mainStory.run;
  assert.equal(run?.phase, 'playing');
  assert.equal(run?.eventId, EPISODE_02_EVENT_ID);
  assert.equal(state.beginMainStoryGeneration(floorId), true);

  const fallback = createMainStoryFallbackAct(run.eventId, run.actId);
  const request = {
    eventId: run.eventId,
    actId: run.actId,
    floorId,
    playerName: '测试玩家',
    day: state.day,
    period: ['morning', 'afterSchool', 'evening'][state.periodIndex],
    location: state.currentLocationId,
    contextFloorIds: [...acceptedFloorIds],
    chatHistory: store.getState().mainStory.messages,
  };
  const messages = createFallbackStoryMessages(request, actToPlainText(fallback));
  const floor = createStoryFloor(request, fallback, 'fallback', messages, 'accepted');
  store.getState().setMainStoryActContent(floor, messages);
  acceptedFloorIds.push(floorId);
}

assert.equal(isCharacterAvailable('sakura', store.getState().mainStory.completedEventIds), false);

assert.deepEqual(act('4 月 9 日第一次行动'), {
  accepted: true,
  startsMainStory: true,
  dayAdvanced: false,
  periodKey: 'afterSchool',
});
assert.deepEqual(store.getState().mainStory.run, {
  eventId: EPISODE_02_EVENT_ID,
  actId: ACT_01.id,
  phase: 'playing',
  pageIndex: 0,
});
assert.equal(store.getState().actionPointsRemaining, 1);
acceptCurrentFallback('runtime-ep02-act1');

assert.equal(store.getState().finishMainStoryAct(), true);
assert.deepEqual(store.getState().mainStory.run, {
  eventId: EPISODE_02_EVENT_ID,
  actId: ACT_02.id,
  phase: 'waiting',
  pageIndex: 0,
});
assert.deepEqual(store.getState().date, { year: 2008, month: 4, day: 9 });

assert.equal(act('4 月 9 日第二次行动').startsMainStory, true);
assert.equal(store.getState().mainStory.run?.actId, ACT_02.id);
assert.equal(store.getState().actionPointsRemaining, 0);
acceptCurrentFallback('runtime-ep02-act2');

assert.equal(store.getState().finishMainStoryAct(), true);
assert.deepEqual(store.getState().mainStory.run, {
  eventId: EPISODE_02_EVENT_ID,
  actId: ACT_03.id,
  phase: 'waiting',
  pageIndex: 0,
});
assert.deepEqual(store.getState().date, { year: 2008, month: 4, day: 10 });
assert.equal(store.getState().actionPointsRemaining, 2);

assert.equal(act('4 月 10 日第一次行动').startsMainStory, false);
assert.equal(store.getState().actionPointsRemaining, 1);
assert.equal(act('4 月 10 日第二次行动').startsMainStory, true);
assert.equal(store.getState().mainStory.run?.actId, ACT_03.id);
acceptCurrentFallback('runtime-ep02-act3');

const snapshot = createGameSnapshot();
const archivedMessages = store.getState().mainStory.messages;
assert.equal(snapshot.schemaVersion, 2);
assert.equal(snapshot.game.mainStory.run?.actId, ACT_03.id);
assert.equal(snapshot.game.mainStory.archives.length, 3);
assert.ok(snapshot.game.mainStory.archives.every(archive => !Object.hasOwn(archive, 'actIndex')));
store.getState().resetGameState();
restoreGameSnapshot(snapshot, archivedMessages);
assert.equal(store.getState().mainStory.run?.phase, 'playing');
assert.equal(store.getState().mainStory.run?.actId, ACT_03.id);
assert.ok(getActiveStoryAct(store.getState().mainStory.archives, EPISODE_02_EVENT_ID, ACT_03.id));

assert.equal(store.getState().finishMainStoryAct(), true);
assert.deepEqual(store.getState().date, { year: 2008, month: 4, day: 11 });
assert.equal(store.getState().mainStory.run, null);
assert.ok(store.getState().mainStory.completedEventIds.includes(EPISODE_02_EVENT_ID));
assert.equal(isCharacterAvailable('sakura', store.getState().mainStory.completedEventIds), true);

console.log('Episode 02 runtime contract passed: triggers, act gates, rollover, restore, and completion.');
