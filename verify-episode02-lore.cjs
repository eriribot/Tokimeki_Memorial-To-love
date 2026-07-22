/* eslint-disable @typescript-eslint/no-require-imports, import-x/no-nodejs-modules -- Node-only episode contract check. */
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
require('ts-node').register({
  transpileOnly: true,
  compilerOptions: {
    module: 'commonjs',
    moduleResolution: 'node',
    esModuleInterop: true,
    ignoreDeprecations: '6.0',
  },
});

const { EPISODE_01_EVENT_ID } = require('./GalMainStory/episodes/episode01');
const { EPISODE_02_EVENT_ID, EPISODE_02_STORY } = require('./GalMainStory/episodes/episode02');
const {
  getMainStoryEpisode,
  getMainStoryLoreReferences,
  getPendingMainStoryEntry,
} = require('./GalMainStory/storyRegistry');
const { getStoryScene } = require('./GalMainStory/scenes');

const loreDirectory = path.join(__dirname, 'data', 'lore-books');
const exportedWorldbook = JSON.parse(fs.readFileSync(path.join(__dirname, '出包王女 (2).json'), 'utf8'));
const exportedEntries = Object.values(exportedWorldbook.entries ?? {});
const acts = [
  {
    file: 'tolove-tv-episode-02-act01.txt',
    rootTag: 'To LOVE-Ru TV Episode 02 Act 01',
    markers: [/2008年4月7日20时43分/u, /2008年4月9日/u, /前天20时43分/u, /更衣室/u],
  },
  {
    file: 'tolove-tv-episode-02-act02.txt',
    rootTag: 'To LOVE-Ru TV Episode 02 Act 02',
    markers: [/婚约成立(?:后)?三日内/u, /2008年4月10日20时43分/u, /沛凯.{0,4}头/u, /最后一小时/u],
  },
  {
    file: 'tolove-tv-episode-02-act03.txt',
    rootTag: 'To LOVE-Ru TV Episode 02 Act 03',
    markers: [
      /2008年4月10日/u,
      /2008年4月11日/u,
      /河边/u,
      /转(?:校生|学生)/u,
      /(?:不要|不得|不)续写第三集|不展开下一集/u,
    ],
  },
];

const requiredSections = [
  '基础信息:',
  '剧情边界:',
  '角色要求:',
  '场景顺序:',
  '对白要求:',
  '还原权重:',
  '必须保留:',
  '结束状态:',
];
const disputedClaims = [/24\s*小时/u, /八字不合/u, /让(?:菈菈|她)讨厌/u, /沛凯.{0,8}(?:变成|伪装成).{0,4}胸/u];
const rejectionMarkers = /(?:不是|并非|不得|不要|不能|禁止|错误|误写|不写成|0，)/u;

for (const act of acts) {
  const filePath = path.join(loreDirectory, act.file);
  assert.ok(fs.existsSync(filePath), `缺少第二集恢复源：${act.file}`);
  const content = fs.readFileSync(filePath, 'utf8').replace(/\r\n?/gu, '\n').trim();
  assert.ok(content.startsWith(`<${act.rootTag}>\n`), `${act.file} 的根开标签无效`);
  assert.ok(content.endsWith(`\n</${act.rootTag}>`), `${act.file} 的根闭标签无效`);
  requiredSections.forEach(section => assert.ok(content.includes(section), `${act.file} 缺少“${section}”`));
  assert.doesNotMatch(content, /承接/u, `${act.file} 仍包含生硬的“承接”表述`);
  act.markers.forEach(marker => assert.match(content, marker, `${act.file} 缺少校对标记“${marker}”`));
  disputedClaims.forEach(pattern => {
    const matchingLines = content.split('\n').filter(line => pattern.test(line));
    matchingLines.forEach(line =>
      assert.match(line, rejectionMarkers, `${act.file} 把已推翻的剧情说法写成了肯定事实：${line}`),
    );
  });
}

const readme = fs.readFileSync(path.join(loreDirectory, 'README.md'), 'utf8');
for (const [index, act] of acts.entries()) {
  assert.ok(readme.includes(String(152 + index)), `README 缺少 order ${152 + index}`);
  assert.ok(readme.includes(act.file), `README 缺少 ${act.file}`);
}
assert.match(readme, /第二集.{0,80}(?:已经|已).{0,40}(?:登记|接入|接通)/su);
assert.match(readme, /保持关闭/u);
assert.match(readme, /不(?:会|进入).{0,20}(?:bundle|运行时包)/iu);

assert.equal(getMainStoryEpisode(EPISODE_02_EVENT_ID)?.acts.length, 3, '第二集没有登记为三幕');
assert.deepEqual(
  EPISODE_02_STORY.acts.map(act => act.plotLore.entryOrder),
  [152, 153, 154],
  '第二集世界书没有按 order 152/153/154 定位',
);
assert.ok(
  EPISODE_02_STORY.acts.every(act => act.plotLore.entryUid === undefined),
  '第二集剧情条目不应再依赖酒馆自动分配的 UID',
);
for (const act of EPISODE_02_STORY.acts) {
  assert.deepEqual(
    getMainStoryLoreReferences(EPISODE_02_EVENT_ID, act.id)[0],
    act.plotLore,
    `运行时没有先扫描模板登记的剧情世界书：${act.id}`,
  );
}
assert.deepEqual(
  exportedEntries
    .filter(entry => [152, 153, 154].includes(entry.order))
    .sort((left, right) => left.order - right.order)
    .map(entry => [entry.order, entry.comment]),
  [
    [152, '剧情第二集·第一幕'],
    [153, '剧情第二集·第二幕'],
    [154, '剧情第二集·第三幕'],
  ],
  '本地世界书导出中的第二集 order/名称与运行时登记不一致',
);
assert.deepEqual(
  EPISODE_02_STORY.acts.map(act => act.trigger),
  [
    { date: { year: 2008, month: 4, day: 9 }, actionNumber: 1 },
    { date: { year: 2008, month: 4, day: 9 }, actionNumber: 2 },
    { date: { year: 2008, month: 4, day: 10 }, actionNumber: 2 },
  ],
  '第二集三幕触发点与剧情日程不一致',
);
assert.equal(getStoryScene('changingRoom').asset, '/artsource/backgrounds/bg020_a.png');

const triggerBase = {
  completedEventIds: [EPISODE_01_EVENT_ID],
};
const [act01, act02, act03] = EPISODE_02_STORY.acts;
assert.deepEqual(
  getPendingMainStoryEntry({
    ...triggerBase,
    date: { year: 2008, month: 4, day: 9 },
    actionNumber: 1,
    run: null,
  }),
  { eventId: EPISODE_02_EVENT_ID, actId: act01.id },
);
assert.deepEqual(
  getPendingMainStoryEntry({
    ...triggerBase,
    date: { year: 2008, month: 4, day: 9 },
    actionNumber: 2,
    run: { eventId: EPISODE_02_EVENT_ID, actId: act02.id, phase: 'waiting', pageIndex: 0 },
  }),
  { eventId: EPISODE_02_EVENT_ID, actId: act02.id },
);
assert.deepEqual(
  getPendingMainStoryEntry({
    ...triggerBase,
    date: { year: 2008, month: 4, day: 10 },
    actionNumber: 2,
    run: { eventId: EPISODE_02_EVENT_ID, actId: act03.id, phase: 'waiting', pageIndex: 0 },
  }),
  { eventId: EPISODE_02_EVENT_ID, actId: act03.id },
);
assert.equal(
  getPendingMainStoryEntry({
    ...triggerBase,
    date: { year: 2008, month: 4, day: 9 },
    actionNumber: 1,
    run: { eventId: EPISODE_02_EVENT_ID, actId: act01.id, phase: 'playing', pageIndex: 0 },
  }),
  null,
);
assert.equal(
  getPendingMainStoryEntry({
    date: { year: 2008, month: 4, day: 9 },
    actionNumber: 1,
    run: null,
    completedEventIds: [],
  }),
  null,
);

console.log('Episode 02 contract passed: humanized lore, order lookup, three-act runtime, riverbank, changing room.');
