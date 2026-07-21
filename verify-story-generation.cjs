/* eslint-disable @typescript-eslint/no-require-imports, import-x/no-nodejs-modules -- Node-only contract check loads TypeScript source through ts-node. */
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

const { getStoryCharacter, getStoryPortraitRig } = require('./GalMainStory/characters');
const { EPISODE_01_ACT_01 } = require('./GalMainStory/episodes/episode01/acts/act01');
const { EPISODE_01_ACT_02 } = require('./GalMainStory/episodes/episode01/acts/act02');
const { parseStoryLine } = require('./GalMainStory/storyPresentation');
const { extractPlayableText } = require('./GalMainStory/storyTextExtraction');
const { buildStoryGenerationPrompt, buildStoryOutputProtocol } = require('./services/storyGenerationPrompt');

function createPromptContext(act) {
  return {
    eventTitle: '剧情生成合同检查',
    loreSection: act.loreSection,
    sceneIds: act.presentation.sceneIds,
    minimumLineCount: act.generation.minimumLineCount,
    requiredSceneSequence: act.generation.requiredSceneSequence,
    portraitOptions: act.presentation.cast.flatMap(member =>
      member.portraitIds.map(portraitId => ({
        characterId: member.characterId,
        displayName: getStoryCharacter(member.characterId).displayName,
        portraitId,
        expressionIds: Object.keys(getStoryPortraitRig(member.characterId, portraitId).expressions),
      })),
    ),
    portraitRules: act.presentation.portraitRules ?? [],
  };
}

const act01Context = createPromptContext(EPISODE_01_ACT_01);
const act02Context = createPromptContext(EPISODE_01_ACT_02);
const act01Prompt = buildStoryGenerationPrompt(act01Context);
const act02Prompt = buildStoryGenerationPrompt(act02Context);

for (const prompt of [act01Prompt, act02Prompt]) {
  assert.match(prompt, /<content>[\s\S]*<\/content>/u);
  assert.ok(prompt.includes('<正文>...</正文>'));
  assert.ok(prompt.includes('<story_scene>...</story_scene>'));
  assert.ok(prompt.includes('<story_scence>...</story_scence>'));
  assert.ok(!prompt.includes('panc'));
  assert.equal((prompt.match(/场景首次推进必须完整覆盖/gu) ?? []).length, 1);
}
assert.ok(act01Prompt.includes('space → school → schoolGate → home → washroom'));
assert.ok(act02Prompt.includes('washroom → home → bedroom → rooftop → nightStreet → park → schoolRoad'));
assert.ok(act02Prompt.includes('@旁白【scene=washroom;focus=lala;portrait=washroom-swimsuit'));
assert.ok(!act02Prompt.includes('@旁白【scene=washroom;focus=lala;portrait=arrival-default'));
assert.ok(act02Prompt.includes('IF scene=washroom AND focus=lala, THEN portrait=washroom-swimsuit'));
assert.ok(
  act02Prompt.includes(
    'IF scene=home|bedroom|rooftop|nightStreet|park|schoolRoad AND focus=lala, THEN portrait=arrival-default',
  ),
);

function parseAct02(line) {
  return parseStoryLine(line, { playerName: 'User', presentation: EPISODE_01_ACT_02.presentation });
}

assert.throws(
  () =>
    parseAct02(
      '@旁白【scene=washroom;focus=lala;portrait=arrival-default;expression=neutral;effect=none】：错误浴室立绘',
    ),
  /必须使用立绘“washroom-swimsuit”/u,
);
assert.equal(
  parseAct02(
    '@旁白【scene=washroom;focus=lala;portrait=washroom-swimsuit;expression=neutral;effect=none】：正确浴室立绘',
  ).presentation.portraitId,
  'washroom-swimsuit',
);
assert.throws(
  () =>
    parseAct02(
      '@旁白【scene=bedroom;focus=lala;portrait=washroom-swimsuit;expression=neutral;effect=none】：错误场景外立绘',
    ),
  /必须使用立绘“arrival-default”/u,
);
assert.equal(
  parseAct02(
    '@旁白【scene=bedroom;focus=lala;portrait=arrival-default;expression=neutral;effect=none】：正确场景外立绘',
  ).presentation.portraitId,
  'arrival-default',
);

const playableLine = '@旁白【scene=washroom;focus=none;portrait=none;expression=none;effect=none】：正文';
const requiredWrapperOptions = { requirePlayableWrapper: true };

for (const wrapperTag of [
  'story_scene',
  'story_scence',
  'gal_scene',
  'story',
  'scene',
  '正文',
  '剧情',
  'narrative',
  'dialogue',
  'script',
  'content',
  'context',
  'body',
  'text',
  'final',
  'answer',
  'output',
  'response',
]) {
  assert.equal(
    extractPlayableText(`<${wrapperTag}>${playableLine}</${wrapperTag}>`, requiredWrapperOptions),
    playableLine,
  );
}
assert.match(
  extractPlayableText(`<analysis>非正文</analysis><content>${playableLine}</content>`, requiredWrapperOptions),
  /^@旁白/u,
);
assert.throws(() => extractPlayableText('裸正文', requiredWrapperOptions), /未包含受支持的正文容器/u);
assert.throws(() => extractPlayableText('<content>未闭合', requiredWrapperOptions), /没有用 <\/content> 闭合/u);
assert.equal(
  extractPlayableText(
    '<thinking>规划\n</konatan_planning~>\n\n<content>\n@旁白【scene=washroom;focus=none;portrait=none;expression=none;effect=none】：正文\n</content>',
    requiredWrapperOptions,
  ),
  playableLine,
);
assert.throws(
  () => extractPlayableText('<thinking>规划\n</konatan_planning~>\n<story_scence>未闭合', requiredWrapperOptions),
  /没有用 <\/story_scence> 闭合/u,
);
assert.throws(
  () => extractPlayableText('<content>第一段</content><content>第二段</content>', requiredWrapperOptions),
  /只能包含一个受支持的正文容器/u,
);
assert.throws(
  () => extractPlayableText('<正文>第一段</正文><story_scene>第二段</story_scene>', requiredWrapperOptions),
  /只能包含一个受支持的正文容器/u,
);
assert.throws(() => extractPlayableText('<正文>正文</story_scene>', requiredWrapperOptions), /没有用 <\/正文> 闭合/u);
assert.equal(
  extractPlayableText(
    '<content><unexpected~>@旁白【scene=washroom;focus=none;portrait=none;expression=none;effect=none】：正文</unexpected~></content>',
    requiredWrapperOptions,
  ),
  playableLine,
);
assert.ok(
  !buildStoryOutputProtocol({ ...act02Context, requiredSceneSequence: [] }).includes('场景首次推进必须完整覆盖'),
);
assert.throws(
  () =>
    buildStoryOutputProtocol({
      ...act02Context,
      portraitRules: [...EPISODE_01_ACT_02.presentation.portraitRules, EPISODE_01_ACT_02.presentation.portraitRules[0]],
    }),
  /重复立绘规则/u,
);

console.log('story generation contract: passed');
