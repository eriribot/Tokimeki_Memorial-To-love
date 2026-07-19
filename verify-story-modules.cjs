/* eslint-disable @typescript-eslint/no-require-imports, import-x/no-nodejs-modules -- Node-only contract check loads TypeScript source through ts-node. */
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

require('ts-node').register({
  transpileOnly: true,
  compilerOptions: {
    module: 'CommonJS',
    moduleResolution: 'Node',
    target: 'ES2022',
    esModuleInterop: true,
  },
});

const episode = require('./GalMainStory/episodes/episode01');
const director = require('./GalMainStory/episodes/episode01/director');
const registry = require('./GalMainStory/storyRegistry');
const scenes = require('./GalMainStory/scenes');
const characters = require('./GalMainStory/characters');
const legacyEpisode = require('./GalMainStory/lalaArrival');
const legacyAssets = require('./GalMainStory/galAssets');

function assertAssetExists(asset) {
  assert.ok(asset.startsWith('/'), `资源路径必须以 / 开头：${asset}`);
  const localPath = path.join(__dirname, ...decodeURIComponent(asset.slice(1)).split('/'));
  assert.ok(fs.existsSync(localPath), `资源不存在：${asset}`);
}

assert.equal(episode.LALA_ARRIVAL_EVENT_ID, 'main.lala-arrival-2008-04-07');
assert.deepEqual(episode.LALA_ARRIVAL_ACT_IDS, ['ep01.act1-falling-star', 'ep01.act2-bathroom']);
assert.equal(registry.getMainStoryEpisode(episode.LALA_ARRIVAL_EVENT_ID), episode.LALA_ARRIVAL_STORY);
assert.equal(new Set(registry.MAIN_STORY_EPISODES.map(story => story.id)).size, registry.MAIN_STORY_EPISODES.length);
assert.equal(legacyEpisode.LALA_ARRIVAL_STORY, episode.LALA_ARRIVAL_STORY);
assert.equal(legacyAssets.LALA_PORTRAIT_RIG, characters.LALA_STORY_CHARACTER.rig);
assert.equal(legacyAssets.HARUNA_PORTRAIT_RIG, characters.HARUNA_STORY_CHARACTER.rig);
assert.equal(legacyAssets.RIKO_PORTRAIT_RIG, characters.RIKO_STORY_CHARACTER.rig);

const triggerState = {
  date: { year: 2008, month: 4, day: 7 },
  activeMainStoryEventId: null,
  completedMainStoryEventIds: [],
};
assert.equal(
  episode.getPendingLalaArrivalActIndex({ ...triggerState, actionPointsRemaining: 1, mainStoryActIndex: 0 }),
  0,
);
assert.equal(
  episode.getPendingLalaArrivalActIndex({ ...triggerState, actionPointsRemaining: 0, mainStoryActIndex: 1 }),
  1,
);
assert.equal(
  episode.getPendingLalaArrivalActIndex({ ...triggerState, actionPointsRemaining: 2, mainStoryActIndex: 0 }),
  null,
);

const fallback = episode.createLalaArrivalFallback('after_first_action');
assert.deepEqual(
  fallback.map(act => act.id),
  episode.LALA_ARRIVAL_ACT_IDS,
);
assert.deepEqual(
  episode.getLalaArrivalLoreReferences(0).map(reference => [reference.entryUid, reference.entryName]),
  [[2, '剧情第一集']],
);
assert.deepEqual(
  episode.getLalaArrivalLoreReferences(1).map(reference => [reference.entryUid, reference.entryName]),
  [
    [2, '剧情第一集'],
    [1, '菈菈.萨塔琳.戴比路克'],
  ],
);
for (const scene of Object.values(scenes.STORY_SCENES)) assertAssetExists(scene.asset);
for (const act of fallback) {
  assert.ok(act.beats.length > 0, `${act.id} 缺少保底页`);
  for (const beat of act.beats) assert.ok(scenes.STORY_SCENES[beat.background], `未登记场景：${beat.background}`);
}

for (const character of Object.values(characters.STORY_PORTRAIT_CHARACTERS)) {
  assertAssetExists(character.nameplate);
  assertAssetExists(character.rig.body);
  assertAssetExists(character.rig.mask);
  for (const expression of character.expressions) {
    const face = characters.getPortraitFaceAssets(character.rig, expression);
    assertAssetExists(face.eyes);
    assertAssetExists(face.mouth);
  }
}

const cues = [
  director.getLalaArrivalPortraitCue(fallback[0].beats[1], 0),
  director.getLalaArrivalPortraitCue(fallback[0].beats[2], 0),
  director.getLalaArrivalPortraitCue(fallback[1].beats[0], 1),
];
assert.deepEqual(
  cues.map(cue => cue?.characterId),
  ['haruna', 'riko', 'lala'],
);
for (const cue of cues) {
  assert.ok(cue, '导演没有返回角色提示');
  assert.ok(characters.getStoryPortraitCharacter(cue.characterId).expressions.includes(cue.expression));
}

assert.equal(director.getLalaArrivalBackground(0, 0, 10), 'school');
assert.equal(director.getLalaArrivalBackground(0, 9, 10), 'washroom');
assert.equal(director.getLalaArrivalEffect('白光炸开'), 'flash');

console.log('story module contract: passed');
