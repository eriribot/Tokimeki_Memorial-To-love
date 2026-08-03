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

const { MAIN_STORY_EPISODES } = require('./GalMainStory/episodes');
const { STORY_CHARACTERS, findStoryCharacterBySpeaker } = require('./GalMainStory/characters');
const { STORY_SCENES } = require('./GalMainStory/scenes');

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function readProjectFile(...segments) {
  return fs.readFileSync(path.join(__dirname, ...segments), 'utf8');
}

function verifyRequiredSequence(act) {
  let cursor = 0;
  for (const beat of act.fallbackBeats) {
    if (beat.presentation.sceneId === act.generation.requiredSceneSequence[cursor]) cursor += 1;
  }
  assert(
    cursor === act.generation.requiredSceneSequence.length,
    `${act.id} 的 fallback 没有按顺序覆盖 requiredSceneSequence。`,
  );
}

function verifyPresentation(act) {
  const sceneIds = new Set(act.presentation.sceneIds);
  const cast = new Map(act.presentation.cast.map(entry => [entry.characterId, new Set(entry.portraitIds)]));

  for (const sceneId of act.presentation.sceneIds) {
    const scene = STORY_SCENES[sceneId];
    assert(scene, `${act.id} 使用了未登记场景 ${sceneId}。`);
    const assetPath = path.join(__dirname, scene.asset.replace(/^\//, ''));
    assert(fs.existsSync(assetPath), `${act.id} 的场景资源不存在：${scene.asset}`);
  }

  for (const [characterId, portraitIds] of cast) {
    const character = STORY_CHARACTERS[characterId];
    assert(character, `${act.id} 使用了未登记角色 ${characterId}。`);
    for (const portraitId of portraitIds) {
      assert(character.portraits[portraitId], `${act.id} 使用了未登记立绘 ${characterId}/${portraitId}。`);
    }
  }

  for (const beat of act.fallbackBeats) {
    const presentation = beat.presentation;
    assert(sceneIds.has(presentation.sceneId), `${act.id} 的 fallback 越过场景表：${presentation.sceneId}。`);
    if (presentation.focusCharacterId) {
      const portraitIds = cast.get(presentation.focusCharacterId);
      assert(portraitIds, `${act.id} 的 fallback 越过演员表：${presentation.focusCharacterId}。`);
      assert(
        portraitIds.has(presentation.portraitId),
        `${act.id} 的 fallback 越过立绘表：${presentation.focusCharacterId}/${presentation.portraitId}。`,
      );
      const rig = STORY_CHARACTERS[presentation.focusCharacterId].portraits[presentation.portraitId];
      assert(
        rig.expressions[presentation.expressionId],
        `${act.id} 的 fallback 使用了不存在的表情：${presentation.focusCharacterId}/${presentation.expressionId}。`,
      );
    }
    const registeredSpeaker = findStoryCharacterBySpeaker(beat.speaker);
    assert(
      !registeredSpeaker || cast.has(registeredSpeaker.id),
      `${act.id} 的已登记说话人不在演员表：${beat.speaker}。`,
    );
  }

  for (const sceneId of act.generation.requiredSceneSequence) {
    assert(sceneIds.has(sceneId), `${act.id} 的必经场景没有加入本幕场景表：${sceneId}。`);
  }
  assert(
    act.fallbackBeats.length >= act.generation.minimumLineCount,
    `${act.id} 的 fallback 行数少于 minimumLineCount。`,
  );
  verifyRequiredSequence(act);
}

function verifyLore(act) {
  const actNumber = act.id.match(/^ep03\.act(\d)-/)?.[1];
  assert(actNumber, `${act.id} 不是第三集稳定幕 ID。`);
  const lore = readProjectFile('data', 'lore-books', `tolove-tv-episode-03-act0${actNumber}.txt`);
  assert(lore.startsWith(`<${act.plotLore.rootTag}>`), `${act.id} 的世界书根标签不匹配。`);
  assert(lore.trimEnd().endsWith(`</${act.plotLore.rootTag}>`), `${act.id} 的世界书闭标签不匹配。`);
  assert(!lore.includes('养子'), `${act.id} 仍残留养子身份措辞。`);
  assert(!lore.includes('老哥'), `${act.id} 仍残留老哥称呼措辞。`);
  assert(!lore.includes('永久性转'), `${act.id} 仍含梨子永久性转脏映射。`);
  assert(!lore.includes('梨子继承主角'), `${act.id} 仍让梨子继承主角位。`);
  assert(!act.plotLore.requiredContentMarker, `${act.id} 仍保留已废弃的身份 marker 硬校验。`);
}

function verifyInvitationChain(act, lore) {
  const fallbackText = act.fallbackBeats.map(beat => `${beat.speaker ?? '旁白'}:${beat.text}`).join('\n');
  const mikanIndex = fallbackText.indexOf('春菜姐，明天要不要也和我们一起');
  const lalaIndex = fallbackText.indexOf('来嘛，春菜！我还没去过地球的水族馆');
  const harunaIndex = fallbackText.indexOf('好。那明天见。');
  assert(mikanIndex >= 0, '第二幕 fallback 缺少美柑先发起的翌日邀请。');
  assert(lalaIndex > mikanIndex, '第二幕 fallback 没有保持“美柑先邀请→菈菈撒娇提水族馆”。');
  assert(harunaIndex > lalaIndex, '第二幕 fallback 没有让春菜在菈菈提议后答应。');

  const loreMikanIndex = lore.indexOf('美柑先问春菜明天要不要');
  const loreLalaIndex = lore.indexOf('菈菈便撒娇劝她同行');
  const loreHarunaIndex = lore.indexOf('春菜答应');
  assert(loreMikanIndex >= 0, '第二幕恢复源缺少美柑先发起的邀请。');
  assert(loreLalaIndex > loreMikanIndex, '第二幕恢复源倒置了美柑与菈菈的邀请因果。');
  assert(loreHarunaIndex > loreLalaIndex, '第二幕恢复源没有保留春菜最后答应。');
}

const episode = MAIN_STORY_EPISODES.find(candidate => candidate.episodeNumber === 3);
assert(episode, '生产注册表没有第三集。');
assert(episode.id === 'main.love-triangle-user-2008-04-11', '第三集必须使用修订后的 event ID。');
assert(episode.acts.length === 3, '第三集必须保持三幕。');
assert(
  STORY_SCENES.aquarium.asset === '/artsource/backgrounds/bg029_a.png',
  '水族馆场景必须使用实际的 bg029_a.png，不能继续复用体育器材室 bg020_a.png。',
);
assert(
  episode.acts.map(act => act.plotLore.entryOrder).join(',') === '155,156,157',
  '第三集世界书 order 必须连续为 155—157。',
);
assert(
  episode.acts
    .map(
      act => `${act.trigger.date.year}-${act.trigger.date.month}-${act.trigger.date.day}#${act.trigger.actionNumber}`,
    )
    .join(',') === '2008-4-11#1,2008-4-12#1,2008-4-13#1',
  '第三集三幕日期或每日首行动触发点漂移。',
);
assert(
  episode.acts.every(act => act.timeCost === 'whole-day'),
  '第三集三幕都必须占用完整游戏日。',
);

const expectedLoreIds = ['lala,haruna,mikan,riko', 'lala,haruna,mikan', 'lala,haruna,mikan,riko'];
for (const [index, act] of episode.acts.entries()) {
  assert(act.characterLoreIds.join(',') === expectedLoreIds[index], `${act.id} 的人物世界书选择与本幕演员职责不一致。`);
  verifyPresentation(act);
  verifyLore(act);
}

const act02Lore = readProjectFile('data', 'lore-books', 'tolove-tv-episode-03-act02.txt');
verifyInvitationChain(episode.acts[1], act02Lore);

const act01Text = episode.acts[0].fallbackBeats.map(beat => beat.text).join('\n');
const act01LastBeat = episode.acts[0].fallbackBeats.at(-1);
const act01Lore = readProjectFile('data', 'lore-books', 'tolove-tv-episode-03-act01.txt');
assert(act01LastBeat?.speaker === '结城美柑', '第一幕必须严格停在美柑提出翌日出门。');
assert(act01LastBeat?.text.includes('明天'), '第一幕最后一句没有提出翌日出门。');
assert(!act01Text.includes('出去走走也好'), '第一幕 fallback 替 User 接受了翌日出游。');
assert(act01Lore.includes('不要写菈菈或User答应'), '第一幕恢复源没有保留玩家表态边界。');

const act03Text = episode.acts[2].fallbackBeats.map(beat => beat.text).join('\n');
const act03Lore = readProjectFile('data', 'lore-books', 'tolove-tv-episode-03-act03.txt');
assert(act03Text.includes('星期日'), '第三幕 fallback 没有明确水族馆发生在星期日。');
assert(act03Text.includes('四月十四日，星期一'), '第三幕 fallback 没有明确4月14日星期一尾声。');
assert(act03Text.includes('从初中起'), '第三幕 fallback 漏掉春菜从初中起就关注 User 的时间锚点。');
assert(act03Text.includes('没有谁拜托你'), '第三幕 fallback 漏掉 User 自发照料教室花草的关键细节。');
assert(act03Text.includes('可即使这样，我……'), '第三幕 fallback 没有让春菜把告白说到开头。');
assert(act03Text.includes('春菜，我也……'), '第三幕 fallback 没有让 User 开始回应春菜。');
assert(act03Text.includes('同时停在告白开头'), '第三幕 fallback 没有明确双方告白被菈菈的骚动打断。');
assert(act03Lore.includes('两个人的告白都停在开头'), '第三幕恢复源没有冻结双方未完成告白的边界。');
assert(act03Lore.includes('两人的关系没有被结算'), '第三幕恢复源擅自结算了 User 与春菜的关系变化。');
assert(act03Lore.includes('4月14日星期一'), '第三幕恢复源没有锁定4月14日星期一尾声。');

for (const act of episode.acts) {
  for (const beat of act.fallbackBeats) {
    assert(!(beat.speaker === '菈菈' && beat.text.includes('老哥')), `${act.id} 让菈菈错误地称User“老哥”。`);
  }
}

const characterLoreContracts = [
  ['tolove-character-lala.txt', '<Lala Satalin Deviluke>'],
  ['tolove-character-haruna.txt', '<Haruna Sairenji>'],
  ['tolove-character-mikan.txt', '<Mikan Yuuki>'],
  ['tolove-character-riko.txt', '<Riko Yusaki>'],
];
for (const [fileName, rootTag] of characterLoreContracts) {
  const lore = readProjectFile('data', 'lore-books', fileName);
  assert(lore.startsWith(rootTag), `${fileName} 的根标签不匹配。`);
  assert(!lore.includes('永久性转版本'), `${fileName} 仍含梨子主角脏映射。`);
}

const rikoLore = readProjectFile('data', 'lore-books', 'tolove-character-riko.txt');
assert(rikoLore.includes('不能读取隐藏好感'), '梨子人物世界书没有限制情报辅助的知识边界。');
assert(rikoLore.includes('不替他告白'), '梨子人物世界书没有限制青梅辅助抢走玩家行动。');

for (const earlierEpisodeNumber of [1, 2]) {
  const earlierEpisode = MAIN_STORY_EPISODES.find(candidate => candidate.episodeNumber === earlierEpisodeNumber);
  assert(earlierEpisode, `生产注册表没有第 ${earlierEpisodeNumber} 集。`);
  for (const [actIndex, act] of earlierEpisode.acts.entries()) {
    assert(!act.plotLore.requiredContentMarker, `${act.id} 仍保留已废弃的身份 marker 硬校验。`);
    assert(act.characterLoreIds.includes('riko'), `${act.id} 没有注入当前梨子青梅边界。`);
    const lore = readProjectFile(
      'data',
      'lore-books',
      `tolove-tv-episode-0${earlierEpisodeNumber}-act0${actIndex + 1}.txt`,
    );
    assert(!lore.includes('养子'), `${act.id} 的恢复源仍残留养子身份措辞。`);
    assert(!lore.includes('老哥'), `${act.id} 的恢复源仍残留老哥称呼措辞。`);
    assert(!lore.includes('永久性转'), `${act.id} 的恢复源仍含梨子主角脏映射。`);
  }
}

const defaultCards = {
  riko: JSON.parse(readProjectFile('data', 'default-cards', 'riko.json')),
  haruna: JSON.parse(readProjectFile('data', 'default-cards', 'haruna.json')),
  lala: JSON.parse(readProjectFile('data', 'default-cards', 'lala.json')),
};
assert(defaultCards.riko.data.system_prompt.includes('青梅竹马'), '梨子默认卡没有锁定青梅竹马身份。');
assert(!defaultCards.riko.data.system_prompt.includes('永久承接'), '梨子默认卡仍承接原作男主身份。');
assert(!defaultCards.riko.data.system_prompt.includes('养子'), '梨子默认卡仍残留养子身份措辞。');
assert(!defaultCards.riko.data.system_prompt.includes('老哥'), '梨子默认卡仍残留老哥称呼措辞。');
assert(!defaultCards.haruna.data.system_prompt.includes('养子'), '春菜默认卡仍残留养子身份措辞。');
assert(!defaultCards.haruna.data.system_prompt.includes('老哥'), '春菜默认卡仍残留老哥称呼措辞。');
assert(
  defaultCards.haruna.data.system_prompt.includes('第一集曾准备向她告白'),
  '春菜默认卡没有把既成告白动作与未来玩家感情分开。',
);
assert(
  defaultCards.haruna.data.system_prompt.includes('第三集水族馆里春菜与User都把告白说到开头'),
  '春菜默认卡没有同步第三集水族馆双方未完成的告白动作。',
);
assert(!defaultCards.lala.data.system_prompt.includes('老哥'), '菈菈默认卡仍残留老哥称呼措辞。');

const evidencePacket = JSON.parse(readProjectFile('剧情参考', '游戏开发知识库', '出包王女', '第三集改编证据.json'));
assert(
  evidencePacket.playerAuthority.fixed.some(item => item.includes('第一集曾准备向春菜告白')),
  '证据包没有登记第一集既成告白动作。',
);
assert(
  evidencePacket.playerAuthority.fixed.some(item => item.includes('第三集水族馆里')),
  '证据包没有登记第三集水族馆双方未完成的告白动作。',
);
assert(
  evidencePacket.playerAuthority.reserved.some(item => item.includes('当前和未来的感情判断')),
  '证据包没有保留既成动作之外的玩家感情权限。',
);

const staleActTs = path.join(__dirname, 'GalMainStory', 'episodes', 'episode03', 'acts', 'act04.ts');
const staleActLore = path.join(__dirname, 'data', 'lore-books', 'tolove-tv-episode-03-act04.txt');
assert(!fs.existsSync(staleActTs), '活动源码仍残留第三集第四幕。');
assert(!fs.existsSync(staleActLore), '恢复源仍残留第三集第四幕。');

console.log('Episode 01-03 role continuity and Episode 03 whole-day, invitation and presentation contracts passed.');
