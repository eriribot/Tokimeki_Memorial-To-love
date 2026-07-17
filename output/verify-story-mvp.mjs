import fs from 'node:fs';
import path from 'node:path';
import { chromium } from 'file:///C:/Users/eriri/.codex/skills/develop-web-game/node_modules/playwright/index.mjs';

const url = process.env.WEBGAME_URL ?? 'http://localhost:5511/dist/webgame-ui/';
const outputDir = process.env.STORY_MVP_OUTPUT_DIR
  ? path.resolve(process.env.STORY_MVP_OUTPUT_DIR)
  : path.join(import.meta.dirname, 'story-mvp-e2e');
fs.mkdirSync(outputDir, { recursive: true });

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function assertSelectedStoryLoreCall(call, expectedStageId, expectedReadCount, label) {
  assert(call.selectedStoryLoreCount === 1, `${label}没有且仅有一份关闭世界书剧情资料`);
  assert(call.selectedStoryStageId === expectedStageId, `${label}剧情资料的阶段标识错误`);
  assert(call.hasExpectedEpisodeLore, `${label}没有取得《从天而降的少女》正文`);
  assert(call.worldbookReadCount === expectedReadCount, `${label}世界书读取次数错误`);
  assert(call.lastWorldbookRead?.name === '出包王女', `${label}读取了错误的世界书`);
  assert(call.lastWorldbookRead?.entryEnabled === false, `${label}没有从关闭条目读取剧情资料`);
  assert(!call.userInputContainsSelectedLoreBlock, `${label}把剧情资料重复放进了 user_input`);
  assert(!call.hasNativeWorldbookScan, `${label}不应发送原生世界书扫描键`);
}

function isExpectedMissingTavernFileBridge(message) {
  const text = message.text();
  return (
    message.type() === 'error' &&
    text.includes('[ToLove Save] 自动存档失败。') &&
    text.includes('当前页面没有 Tavern Helper 事件接口')
  );
}

async function installTavernMock(page, mode) {
  await page.addInitScript(
    ({ entryEnabled, episodeLore, omitCompletionSentinel, shouldFail }) => {
      window.__storyCalls = [];
      window.__storyWorldbookReads = [];
      window.TavernHelper = {
        getWorldbookNames: () => ['出包王女'],
        getGlobalWorldbookNames: () => [],
        getCharWorldbookNames: () => ({ primary: null, additional: [] }),
        getChatWorldbookName: () => null,
        getWorldbook: async name => {
          window.__storyWorldbookReads.push({ name, entryEnabled });
          return [
            {
              uid: 2,
              name: '剧情第一集',
              enabled: entryEnabled,
              content: episodeLore,
            },
          ];
        },
        generate: async config => {
          const injects = config.injects ?? [];
          const inChat = injects.filter(inject => inject.position === 'in_chat');
          const history = inChat.find(inject => inject.content?.includes('<accepted_story_history>'))?.content ?? '';
          const outputProtocol =
            inChat.find(inject => inject.content?.includes('正文区域内每个非空行必须以半角 @ 开头'))?.content ?? '';
          const selectedStoryLoreInjects = inChat.filter(inject =>
            inject.content?.includes('<selected_story_lore source="disabled_worldbook_entry"'),
          );
          const selectedStoryLore = selectedStoryLoreInjects[0]?.content ?? '';
          const actNumber = Number(config.user_input.match(/第 (\d+) \/ \d+ 阶段/u)?.[1] ?? 1);
          const completionSentinel = config.user_input.match(/\[\[STAGE_COMPLETE:[^\r\n]+\]\]/u)?.[0] ?? '';
          const selectedStoryStageId = selectedStoryLore.match(/stage_id="([^"]+)"/u)?.[1] ?? '';
          const worldbookReads = [...window.__storyWorldbookReads];

          window.__storyCalls.push({
            actNumber,
            presetName: config.preset_name,
            hasJsonSchema: Boolean(config.json_schema),
            usesTaggedPlayableText:
              config.user_input.includes('游戏只读取 <content> 内的正文') &&
              config.user_input.includes('正文区域内每个非空行必须以半角 @ 开头'),
            preservesPresetStyle:
              outputProtocol.includes('不接管当前预设的文风') && outputProtocol.includes('不规定固定行数或字数'),
            hasEventCompletionContract:
              config.user_input.includes('所有本阶段必达节点和收束条件') &&
              config.user_input.includes('篇幅、字数、token 数和行数都不是完成标准') &&
              config.user_input.includes('下一次 AP、下一日期、下一时段或下一阶段'),
            hasSystemEventCompletionContract:
              outputProtocol.includes('所有本阶段必达节点和收束条件') &&
              outputProtocol.includes('篇幅、字数、token 数和行数都不是完成标准'),
            hasRuntimeStageScope:
              config.user_input.includes('当前运行时范围') &&
              config.user_input.includes('当前游戏日') &&
              config.user_input.includes('当前时段') &&
              config.user_input.includes('当前地点'),
            hasCompletionSentinelContract:
              completionSentinel.length > 0 &&
              outputProtocol.includes(completionSentinel) &&
              outputProtocol.includes('最后一个非空行'),
            selectedStoryLoreCount: selectedStoryLoreInjects.length,
            selectedStoryStageId,
            hasExpectedEpisodeLore:
              selectedStoryLore.includes('<To LOVE-Ru TV Episode 01>') &&
              selectedStoryLore.includes('标题:从天而降的少女') &&
              selectedStoryLore.includes('</To LOVE-Ru TV Episode 01>'),
            worldbookReadCount: worldbookReads.length,
            lastWorldbookRead: worldbookReads.at(-1) ?? null,
            userInputContainsSelectedLoreBlock: config.user_input.includes(
              '<selected_story_lore source="disabled_worldbook_entry"',
            ),
            hasNativeWorldbookScan: injects.some(inject => inject.position === 'none' || inject.should_scan === true),
            maxChatHistory: config.max_chat_history,
            hasAcceptedStoryHistory: history.includes('<accepted_story_history>'),
            hasOutputProtocol: outputProtocol.includes('@旁白：') && outputProtocol.includes('@角色名【情绪】：台词'),
          });

          await new Promise(resolve => setTimeout(resolve, 260));
          if (shouldFail) throw new Error('mock tavern unavailable');

          const finishResponse = content => (omitCompletionSentinel ? content : `${content}\n${completionSentinel}`);

          if (actNumber === 1) {
            return finishResponse(
              [
                '@旁白：放学后的风掠过旧校舍天台，夕阳把两人的影子拉得很长。',
                '@西连寺春菜【紧张】：那个……我有件事一直想告诉你。',
                '@你【紧张】：其实我也有话想说。',
                '@旁白：枯叶贴着栏杆滚过，短暂的安静被远处破空声撕开。',
                '@西连寺春菜【担心】：那是什么声音？',
                '@旁白：白光骤然坠下，风压把天台门撞得砰然作响。',
                '@你【认真】：春菜，先躲到我后面！',
                '@旁白：你护着春菜退向楼梯，警报声从教学楼深处接连响起。',
                '@猿山【慌张】：还愣着干什么，快撤啊！',
                '@旁白：骚动平息后，你送别春菜，没能说出口的话仍卡在喉咙里。',
                '@你【担心】：今天到底是怎么回事……',
                '@旁白：回到家后，你推开浴室门，刺眼白光先一步填满视线。',
              ].join('\n'),
            );
          }

          return finishResponse(
            [
              '@旁白：浴室里的白光突然收拢，水花和蒸汽遮住了混乱的中心。',
              '@菈菈【开心】：传送成功！我是菈菈！',
              '@你【错愕】：等一下，事情怎么又变成这样了？',
              '@旁白：你立刻转开视线，门外同时传来一串急促脚步。',
              '@菈菈【认真】：跳跳瓦普君只能传送生物，详细说明等会儿再说！',
              '@沛凯【无奈】：菈菈大人，我先处理衣服，传送误差的报告稍后再写。',
              '@旁白：远处紧跟着一声轰响，整齐脚步已经循着动静追到门外。',
              '@亲卫队【严肃】：发现菈菈殿下，请立刻随我们返回戴比路克！',
              '@你【认真】：先离开这里，我不会让他们替你决定人生。',
              '@菈菈【开心】：好，那我们一起跑！',
              '@旁白：你们翻过窗台冲向屋顶，萨斯丁的大剑擦着栏杆落下。',
              '@萨斯丁【坚定】：公主殿下，王位和相亲安排不能继续搁置。',
              '@菈菈【生气】：那是我的人生，我才不要别人替我决定！',
              '@你【认真】：她已经说得很清楚了。',
              '@菈菈【兴奋】：那就让GOGO真空君把大家都冷静下来！',
              '@旁白：机器吸起追兵和杂物后失控爆响，混乱一直持续到深夜。',
              '@旁白：次日早晨，你鼓起勇气对春菜补上昨天没说完的话，菈菈却正好抢到你面前。',
              '@菈菈【惊喜】：原来你喜欢我！太好了，那我们结婚吧！',
            ].join('\n'),
          );
        },
      };
    },
    {
      entryEnabled: mode === 'enabled-lore',
      episodeLore: `<To LOVE-Ru TV Episode 01>
基础信息:
标题:从天而降的少女
角色权威:
-User是玩家控制的主角。
两幕结构:
第一幕·放学后的坠落光:
1.坠落白光打断告白，结尾停在浴室门后的白光。
第二幕·浴室里的王女:
1.菈菈随机传送登场，事件收束到次日误告白与婚约宣言。
</To LOVE-Ru TV Episode 01>`,
      omitCompletionSentinel: mode === 'incomplete',
      shouldFail: mode === 'error',
    },
  );
}

async function readState(page) {
  return JSON.parse(await page.evaluate(() => window.render_game_to_text()));
}

async function startGame(page) {
  await page.goto(url, { waitUntil: 'networkidle' });
  await page.locator('#start-restart').click();
  await page.waitForFunction(() => JSON.parse(window.render_game_to_text()).screen === 'game');
}

async function waitForStoryStatus(page, expected) {
  await page.waitForFunction(
    status => JSON.parse(window.render_game_to_text()).activeMainStory?.generationStatus === status,
    expected,
  );
}

async function playCurrentAct(page, maxSteps = 260) {
  for (let index = 0; index < maxSteps; index += 1) {
    const state = await readState(page);
    if (!state.activeMainStory) return;
    if (state.activeMainStory.generationStatus === 'error') {
      throw new Error(`当前幕生成失败：${state.activeMainStory.generationError ?? 'unknown error'}`);
    }
    if (state.activeMainStory.generationStatus !== 'ready') {
      await page.waitForFunction(() => {
        const story = JSON.parse(window.render_game_to_text()).activeMainStory;
        return !story || story.generationStatus === 'ready' || story.generationStatus === 'error';
      });
      continue;
    }
    await page.keyboard.press('ArrowRight');
    await page.waitForTimeout(20);
  }
  throw new Error(`当前幕在 ${maxSteps} 次翻页后仍未结束`);
}

const browser = await chromium.launch({ headless: true });
const results = {
  direct: {},
  completionGuard: {},
  loreGuard: {},
  fallback: {},
  consoleErrors: [],
  pageErrors: [],
  requestFailures: [],
};

try {
  const context = await browser.newContext({ viewport: { width: 1440, height: 1100 } });
  const page = await context.newPage();
  page.on('console', message => {
    if (message.type() === 'error' && !isExpectedMissingTavernFileBridge(message)) {
      results.consoleErrors.push(`${message.text()} @ ${message.location().url}`);
    }
  });
  page.on('pageerror', error => results.pageErrors.push(error.message));
  page.on('requestfailed', request => {
    const failure = `${request.url()} ${request.failure()?.errorText}`;
    if (!failure.includes('/music/op.mp3 net::ERR_ABORTED')) results.requestFailures.push(failure);
  });
  await installTavernMock(page, 'success');
  await startGame(page);

  const initial = await readState(page);
  assert(
    initial.visibleTargets.some(target => target.id === 'riko' && target.name === '夕崎梨子'),
    '梨子未进入目标卡系统',
  );
  assert((await page.getByRole('button', { name: /推进时间|结束今日/u }).count()) === 0, '推进时间按钮仍然存在');

  await page.getByRole('button', { name: /夕崎梨子.*好感 0/u }).click();
  await page.waitForSelector('[data-generation-status="loading"]');
  await page.screenshot({ path: path.join(outputDir, 'direct-loading.png'), fullPage: true });
  await waitForStoryStatus(page, 'ready');

  let state = await readState(page);
  let calls = await page.evaluate(() => window.__storyCalls);
  assert(state.actionPointsRemaining === 1, '第一次行动后应剩余 1 点');
  assert(state.period === 'afterSchool', '第一次行动后应自动推进到放学后');
  assert(state.visibleTargets.find(target => target.id === 'riko')?.affection === 5, '与梨子交谈没有增加好感');
  assert(state.activeMainStory.entryReason === 'after_first_action', '第一幕入口原因错误');
  assert(state.activeMainStory.generationSource === 'tavern', '第一幕成功结果没有标记为 tavern');
  assert(state.activeMainStory.actCount === 1, '第一幕正文没有写入当前剧情');
  assert(state.activeMainStory.pageCount > 0, '第一幕正文没有完整进入内部剧情页');
  assert(calls.length === 1, '第一幕应只调用一次 generate');
  assert(calls[0].presetName === 'in_use' && !calls[0].hasJsonSchema, '第一幕未使用当前预设或仍要求 JSON');
  assert(calls[0].usesTaggedPlayableText && calls[0].maxChatHistory === 0, '第一幕正文协议或聊天历史边界错误');
  assert(calls[0].hasOutputProtocol, '第一幕缺少末端 @ 行协议 system 注入');
  assert(calls[0].preservesPresetStyle, '第一幕协议仍在接管预设文风或限制固定篇幅');
  assert(calls[0].hasEventCompletionContract, '第一幕缺少通用事件完成契约');
  assert(calls[0].hasSystemEventCompletionContract, '第一幕末端 system 缺少事件完成契约');
  assert(calls[0].hasRuntimeStageScope, '第一幕缺少运行时事件阶段范围');
  assert(calls[0].hasCompletionSentinelContract, '第一幕缺少通用阶段完成标记契约');
  assertSelectedStoryLoreCall(calls[0], 'ep01.act1-falling-star', 1, '第一幕');
  assert(!calls[0].hasAcceptedStoryHistory, '第一幕不应注入旧幕正文');
  await page.screenshot({ path: path.join(outputDir, 'direct-ready.png'), fullPage: true });

  await playCurrentAct(page);
  state = await readState(page);
  assert(state.activeMainStory === null, '第一幕结束后主线仍占用界面');
  assert(state.date.month === 4 && state.date.day === 7, '第一幕结束后不应提前跨日');
  assert(state.actionPointsRemaining === 1, '第一幕结束后 AP 应保持 1');

  await page.getByRole('button', { name: /学习/u }).click();
  await page.waitForSelector('[data-generation-status="loading"]');
  await waitForStoryStatus(page, 'ready');
  state = await readState(page);
  calls = await page.evaluate(() => window.__storyCalls);
  assert(state.actionPointsRemaining === 0, '第二次行动后 AP 应为 0');
  assert(state.period === 'evening', '第二次行动后应进入 evening');
  assert(state.activeMainStory.entryReason === 'after_second_action', '第二幕入口原因错误');
  assert(state.activeMainStory.actCount === 2, '第二幕正文没有追加到当前剧情');
  assert(calls.length === 2, '两幕正文应分别调用两次 generate');
  assert(calls[1].presetName === 'in_use' && !calls[1].hasJsonSchema, '第二幕未使用当前预设或仍要求 JSON');
  assert(calls[1].usesTaggedPlayableText && calls[1].maxChatHistory === 0, '第二幕正文协议或聊天历史边界错误');
  assert(calls[1].hasOutputProtocol, '第二幕缺少末端 @ 行协议 system 注入');
  assert(calls[1].preservesPresetStyle, '第二幕协议仍在接管预设文风或限制固定篇幅');
  assert(calls[1].hasEventCompletionContract, '第二幕缺少通用事件完成契约');
  assert(calls[1].hasSystemEventCompletionContract, '第二幕末端 system 缺少事件完成契约');
  assert(calls[1].hasRuntimeStageScope, '第二幕缺少运行时事件阶段范围');
  assert(calls[1].hasCompletionSentinelContract, '第二幕缺少通用阶段完成标记契约');
  assertSelectedStoryLoreCall(calls[1], 'ep01.act2-bathroom', 2, '第二幕');
  assert(calls[1].hasAcceptedStoryHistory, '第二幕没有注入已接受的第一幕连续性正文');

  await playCurrentAct(page);
  state = await readState(page);
  assert(state.activeMainStory === null, '两幕播放后主线仍未结束');
  assert(state.date.month === 4 && state.date.day === 8, '完成第一集后没有进入 4 月 8 日');
  assert(state.actionPointsRemaining === 2, '次日行动点没有恢复');
  assert(state.completedMainStoryEventIds.length === 1, '完成标记没有唯一写入');
  results.direct = {
    initial,
    calls,
    final: state,
    savePersistence: '真实 SillyTavern 文件存读档仍由人工审查，不由该浏览器 mock 代替',
  };
  await context.close();

  const completionGuardContext = await browser.newContext({ viewport: { width: 1180, height: 820 } });
  const completionGuardPage = await completionGuardContext.newPage();
  completionGuardPage.on('console', message => {
    if (
      message.type() === 'error' &&
      !message.text().includes('[ToLove Story]') &&
      !isExpectedMissingTavernFileBridge(message)
    ) {
      results.consoleErrors.push(`${message.text()} @ ${message.location().url}`);
    }
  });
  completionGuardPage.on('pageerror', error => results.pageErrors.push(error.message));
  completionGuardPage.on('requestfailed', request => {
    const failure = `${request.url()} ${request.failure()?.errorText}`;
    if (!failure.includes('/music/op.mp3 net::ERR_ABORTED')) results.requestFailures.push(failure);
  });
  await installTavernMock(completionGuardPage, 'incomplete');
  await startGame(completionGuardPage);
  await completionGuardPage.getByRole('button', { name: /学习/u }).click();
  await waitForStoryStatus(completionGuardPage, 'error');
  state = await readState(completionGuardPage);
  assert(state.actionPointsRemaining === 1, '缺少完成标记时 AP 应保持已结算的 1');
  assert(state.activeMainStory.generationStatus === 'error', '缺少完成标记的正文没有进入可见错误态');
  assert(state.activeMainStory.generationError.includes('阶段完成标记'), '缺少完成标记时错误原因不明确');
  calls = await completionGuardPage.evaluate(() => window.__storyCalls);
  assert(calls.length === 1, '缺少完成标记时应只生成一次');
  assertSelectedStoryLoreCall(calls[0], 'ep01.act1-falling-star', 1, '缺标记路径第一幕');
  await completionGuardPage.screenshot({ path: path.join(outputDir, 'completion-guard.png'), fullPage: true });
  results.completionGuard = {
    generationStatus: state.activeMainStory.generationStatus,
    generationError: state.activeMainStory.generationError,
    actionPointsRemaining: state.actionPointsRemaining,
  };
  await completionGuardContext.close();

  const loreGuardContext = await browser.newContext({ viewport: { width: 1180, height: 820 } });
  const loreGuardPage = await loreGuardContext.newPage();
  loreGuardPage.on('console', message => {
    if (
      message.type() === 'error' &&
      !message.text().includes('[ToLove Story]') &&
      !isExpectedMissingTavernFileBridge(message)
    ) {
      results.consoleErrors.push(`${message.text()} @ ${message.location().url}`);
    }
  });
  loreGuardPage.on('pageerror', error => results.pageErrors.push(error.message));
  loreGuardPage.on('requestfailed', request => {
    const failure = `${request.url()} ${request.failure()?.errorText}`;
    if (!failure.includes('/music/op.mp3 net::ERR_ABORTED')) results.requestFailures.push(failure);
  });
  await installTavernMock(loreGuardPage, 'enabled-lore');
  await startGame(loreGuardPage);
  await loreGuardPage.getByRole('button', { name: /学习/u }).click();
  await waitForStoryStatus(loreGuardPage, 'error');
  state = await readState(loreGuardPage);
  calls = await loreGuardPage.evaluate(() => window.__storyCalls);
  const loreGuardReads = await loreGuardPage.evaluate(() => window.__storyWorldbookReads);
  assert(state.actionPointsRemaining === 1, '剧情条目误开启时 AP 应保持已结算的 1');
  assert(state.activeMainStory.generationError.includes('必须保持关闭'), '剧情条目误开启时错误原因不明确');
  assert(calls.length === 0, '剧情条目误开启时不应调用 generate');
  assert(loreGuardReads.length === 1 && loreGuardReads[0].entryEnabled === true, '没有识别误开启的剧情条目');
  await loreGuardPage.screenshot({ path: path.join(outputDir, 'lore-guard.png'), fullPage: true });
  results.loreGuard = {
    generationStatus: state.activeMainStory.generationStatus,
    generationError: state.activeMainStory.generationError,
    actionPointsRemaining: state.actionPointsRemaining,
    worldbookReads: loreGuardReads,
    generateCalls: calls.length,
  };
  await loreGuardContext.close();

  const fallbackContext = await browser.newContext({ viewport: { width: 844, height: 390 } });
  const fallbackPage = await fallbackContext.newPage();
  fallbackPage.on('console', message => {
    if (
      message.type() === 'error' &&
      !message.text().includes('[ToLove Story]') &&
      !isExpectedMissingTavernFileBridge(message)
    ) {
      results.consoleErrors.push(`${message.text()} @ ${message.location().url}`);
    }
  });
  fallbackPage.on('pageerror', error => results.pageErrors.push(error.message));
  fallbackPage.on('requestfailed', request => {
    const failure = `${request.url()} ${request.failure()?.errorText}`;
    if (!failure.includes('/music/op.mp3 net::ERR_ABORTED')) results.requestFailures.push(failure);
  });
  await installTavernMock(fallbackPage, 'error');
  await startGame(fallbackPage);

  await fallbackPage.getByRole('button', { name: /学习/u }).click();
  await waitForStoryStatus(fallbackPage, 'error');
  state = await readState(fallbackPage);
  assert(state.actionPointsRemaining === 1, '第一幕请求失败后 AP 应保持已结算的 1');
  assert(state.activeMainStory.entryReason === 'after_first_action', '失败路径第一幕入口原因错误');
  await fallbackPage.getByRole('button', { name: '使用保底版' }).click();
  state = await readState(fallbackPage);
  assert(state.activeMainStory.generationSource === 'fallback', '第一幕保底没有标记来源');
  assert(state.activeMainStory.actCount === 1, '第一幕保底正文未写入');
  await playCurrentAct(fallbackPage, 120);

  await fallbackPage.getByRole('button', { name: /运动/u }).click();
  await waitForStoryStatus(fallbackPage, 'error');
  state = await readState(fallbackPage);
  assert(state.actionPointsRemaining === 0, '第二幕请求失败后 AP 应保持已结算的 0');
  assert(state.activeMainStory.entryReason === 'after_second_action', '失败路径第二幕入口原因错误');
  await fallbackPage.getByRole('button', { name: '使用保底版' }).click();
  state = await readState(fallbackPage);
  assert(state.activeMainStory.generationSource === 'fallback', '第二幕保底没有标记来源');
  assert(state.activeMainStory.actCount === 2, '第二幕保底正文未写入');
  await fallbackPage.screenshot({ path: path.join(outputDir, 'fallback-mobile.png'), fullPage: true });
  await playCurrentAct(fallbackPage, 120);

  state = await readState(fallbackPage);
  assert(state.date.day === 8 && state.actionPointsRemaining === 2, '两幕保底结束后跨日状态错误');
  assert(state.completedMainStoryEventIds.length === 1, '两幕保底完成标记不唯一');
  calls = await fallbackPage.evaluate(() => window.__storyCalls);
  assert(calls.length === 2, '请求失败路径两幕应各调用一次 generate');
  assertSelectedStoryLoreCall(calls[0], 'ep01.act1-falling-star', 1, '失败路径第一幕');
  assertSelectedStoryLoreCall(calls[1], 'ep01.act2-bathroom', 2, '失败路径第二幕');
  results.fallback = { calls, final: state };
  await fallbackContext.close();
} finally {
  await browser.close();
}

fs.writeFileSync(path.join(outputDir, 'results.json'), JSON.stringify(results, null, 2));
assert(results.consoleErrors.length === 0, `出现控制台错误：${results.consoleErrors.join(' | ')}`);
assert(results.pageErrors.length === 0, `出现页面异常：${results.pageErrors.join(' | ')}`);
assert(results.requestFailures.length === 0, `出现资源请求失败：${results.requestFailures.join(' | ')}`);
console.log(JSON.stringify(results, null, 2));
