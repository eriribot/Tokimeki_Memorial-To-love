/* eslint-disable @typescript-eslint/no-require-imports, import-x/no-nodejs-modules */

const fs = require('node:fs');
const path = require('node:path');

process.env.TS_NODE_PROJECT = path.join(__dirname, 'tsconfig.json');
process.env.TS_NODE_COMPILER_OPTIONS = JSON.stringify({
  module: 'Node16',
  moduleResolution: 'Node16',
  target: 'ES2022',
});
require('ts-node/register/transpile-only');

const { createMainStoryFallbackAct } = require('./GalMainStory/storyRegistry');
const { createMainStorySaveState, restoreMainStoryState } = require('./GalMainStory/storyPersistence');
const { EPISODE_01_EVENT_ID } = require('./GalMainStory/episodes/episode01');
const { EPISODE_02_EVENT_ID } = require('./GalMainStory/episodes/episode02');
const { EPISODE_03_EVENT_ID } = require('./GalMainStory/episodes/episode03');
const { EPISODE_04_EVENT_ID, EPISODE_04_STORY } = require('./GalMainStory/episodes/episode04');
const { actToPlainText, createFallbackStoryMessages, createStoryFloor } = require('./services/tavernStoryGeneration');
const { createStoryGenerationContextProjection } = require('./services/storyGenerationContext');

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

const act1 = EPISODE_04_STORY.acts[0];
const act2 = EPISODE_04_STORY.acts[1];
const decision = { choiceId: act1.choice.id, optionId: act1.choice.options[0].id };
const previousChoiceDecisions = [{ actId: act1.id, decision }];
const fallbackAct1 = createMainStoryFallbackAct(EPISODE_04_EVENT_ID, act1.id);
const fallbackAct2 = createMainStoryFallbackAct(EPISODE_04_EVENT_ID, act2.id, previousChoiceDecisions);
const alternateAct2 = createMainStoryFallbackAct(EPISODE_04_EVENT_ID, act2.id, [
  { actId: act1.id, decision: { choiceId: act1.choice.id, optionId: act1.choice.options[1].id } },
]);

assert(EPISODE_04_STORY.acts.length === 3, '第四集必须登记三幕。');
assert(
  EPISODE_04_STORY.acts.map(act => act.plotLore.entryOrder).join(',') === '159,160,161',
  '第四集必须避开废弃 order 158，并使用 159-161。',
);
assert(act1.choice.options.length === 2, '第一幕必须保留两个收束式选择。');
assert(fallbackAct2.beats[0].text.includes('追到街口'), '追赶选择没有改变第二幕 fallback 开场。');
assert(alternateAct2.beats[0].text.includes('道歉便签'), '便签选择没有改变第二幕 fallback 开场。');

const request = {
  eventId: EPISODE_04_EVENT_ID,
  actId: act2.id,
  floorId: 'episode04-contract-act2',
  playerName: '测试主角',
  day: 10,
  period: 'morning',
  location: 'classroom',
  contextFloorIds: [],
  historyFloorIds: [],
  chatHistory: [],
  previousChoiceDecisions,
};
const projection = createStoryGenerationContextProjection(request);
assert(projection.userInput.includes(act1.choice.options[0].label), '下一幕 prompt 缺少已结算选项。');
assert(projection.userInput.includes(act1.choice.options[0].continuityHint), '下一幕 prompt 缺少微差分边界。');
assert(!projection.userInput.includes(act1.choice.options[1].continuityHint), '下一幕 prompt 混入了未选择分支。');
assert(projection.userInput.includes('不得据此另开路线'), '下一幕 prompt 没有锁住收束式选择。');

const act1Request = { ...request, actId: act1.id, floorId: 'episode04-contract-act1', previousChoiceDecisions: [] };
const messages = createFallbackStoryMessages(act1Request, actToPlainText(fallbackAct1));
const floor = createStoryFloor(act1Request, fallbackAct1, 'fallback', messages, 'accepted');
const state = {
  run: { eventId: EPISODE_04_EVENT_ID, actId: act1.id, phase: 'playing', pageIndex: fallbackAct1.beats.length - 1 },
  generation: { status: 'ready', requestId: null, source: 'fallback', error: null },
  completedEventIds: [EPISODE_01_EVENT_ID, EPISODE_02_EVENT_ID, EPISODE_03_EVENT_ID],
  archives: [
    {
      eventId: EPISODE_04_EVENT_ID,
      actId: act1.id,
      activeFloorId: floor.floorId,
      choiceDecision: decision,
      floors: [floor],
    },
  ],
  messages,
};
const restored = restoreMainStoryState(createMainStorySaveState(state), messages);
assert(restored.archives[0].choiceDecision.optionId === decision.optionId, '读档没有保留玩家选择。');

for (const asset of ['midashi01.png', 'midashi02.png', 'choice_window_blue.png', 'choice_window_pink.png']) {
  assert(fs.existsSync(path.join(__dirname, 'artsource', 'galbox', asset)), `缺少 GAL 选择素材 ${asset}。`);
}
const css = fs.readFileSync(path.join(__dirname, 'GalMainStory', 'GalMainStory.css'), 'utf8');
const choiceCss = css.slice(css.indexOf('.gal-main-story__choice {'), css.indexOf('.gal-main-story__push'));
assert(!/backdrop-filter:\s*(?!none)/u.test(choiceCss), '选择层重新引入了 backdrop blur。');
assert(choiceCss.includes('background: #75dec5'), '选择层缺少实体青绿色光标条。');
assert(choiceCss.includes('--gal-choice-height: 15.5cqi'), '选择窗没有保持参考图约 15.5% 画面宽度的高度。');
assert(choiceCss.includes('width: 100%'), '选择窗没有横贯整个 GAL 画面。');
assert(choiceCss.includes('font-size: var(--gal-choice-font)'), '选择项没有使用参考图级别的独立大字号。');
assert(choiceCss.includes('padding: calc(var(--gal-choice-height) * 0.137) 0'), '选择项没有避开原纹理上下色带。');
assert(/button:disabled\s*\{\s*opacity:\s*1;/u.test(choiceCss), '选中后未选项不应被淡化。');
const mainStorySource = fs.readFileSync(path.join(__dirname, 'GalMainStory', 'GalMainStory.tsx'), 'utf8');
assert(mainStorySource.includes('disabled={hasPendingLiveChoice}'), '存在未结算选择的整幕都必须禁用跳过按钮。');
assert(mainStorySource.includes('disabled={isVisibleChoicePending}'), '选项显示且未选择时必须禁用结束按钮。');
const pageSource = fs.readFileSync(path.join(__dirname, 'GalMainStory', 'GalStoryPage.tsx'), 'utf8');
const choiceBranchStart = pageSource.indexOf('{choice ? (');
const dialogueBranchStart = pageSource.indexOf('<div className="gal-main-story__dialogue">', choiceBranchStart);
assert(choiceBranchStart >= 0 && dialogueBranchStart > choiceBranchStart, '选择层必须与普通正文窗口分支渲染。');
const dialogueCss = css.slice(css.indexOf('.gal-main-story__dialogue::before'), css.indexOf('.gal-main-story__window'));
assert(
  dialogueCss.includes('content: none') && dialogueCss.includes('display: none'),
  '普通正文必须直接显示原纹理素材。',
);

console.log('Episode 04 choice, fallback, prompt, persistence and no-glass asset contract passed.');
