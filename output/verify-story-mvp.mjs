import fs from 'node:fs';
import path from 'node:path';
import { chromium } from 'file:///C:/Users/eriri/.codex/skills/develop-web-game/node_modules/playwright/index.mjs';

const url = process.env.WEBGAME_URL ?? 'http://localhost:5511/dist/webgame-ui/';
const outputDir = path.resolve(process.env.STORY_MVP_OUTPUT_DIR ?? 'output/story-mvp-e2e');
fs.mkdirSync(outputDir, { recursive: true });

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

async function installTavernMock(page, mode) {
  await page.addInitScript(
    ({ shouldFail }) => {
      window.__storyCalls = [];
      window.TavernHelper = {
        generate: async config => {
          const lore = config.injects?.find(inject => inject.position === 'in_chat')?.content ?? '';
          const scan = config.injects?.find(inject => inject.position === 'none')?.content ?? '';
          window.__storyCalls.push({
            presetName: config.preset_name,
            hasJsonSchema: Boolean(config.json_schema),
            asksForPlainText: config.user_input.includes('不要JSON'),
            maxChatHistory: config.max_chat_history,
            hasEpisodeLore: lore.includes('<To LOVE-Ru TV Episode 01>'),
            hasLalaLore: lore.includes('<Lala Satalin Deviluke>'),
            hasRikoLore: lore.includes('<Riko Yuzaki>'),
            scansRiko: scan.includes('tolove.character=riko'),
            scansLala: scan.includes('tolove.character=lala'),
          });
          await new Promise(resolve => setTimeout(resolve, 260));
          if (shouldFail) throw new Error('mock tavern unavailable');
          const actNumber = Number(config.user_input.match(/第(\d)幕/u)?.[1] ?? 1);
          if (actNumber === 1) {
            return Array.from(
              { length: 113 },
              (_, index) => `镜头${index + 1}切过校园，第${actNumber}幕的风声与脚步声追着画面向前。`,
            ).join('\n');
          }
          return [
            `镜头切进第${actNumber}幕，风声掠过画面，远处忽然传来一声轰响。`,
            `菈菈：第${actNumber}幕也会有办法的！`,
            '你：等一下，事情怎么又变成这样了？',
            '白光一闪，散落的东西被气浪卷向两边。',
            '菈菈：先往前跑，解释可以等停下来再说！',
          ].join('\n');
        },
      };
    },
    { shouldFail: mode === 'error' },
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

const browser = await chromium.launch({ headless: true });
const results = { direct: {}, fallback: {}, consoleErrors: [], pageErrors: [], requestFailures: [] };

try {
  const context = await browser.newContext({ viewport: { width: 1440, height: 1100 } });
  const page = await context.newPage();
  page.on('console', message => {
    if (message.type() === 'error') results.consoleErrors.push(`${message.text()} @ ${message.location().url}`);
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
  let state = await readState(page);
  assert(state.actionPointsRemaining === 1, '第一次行动后应剩余 1 点');
  assert(state.period === 'afterSchool', '第一次行动后应自动推进到放学后');
  assert(state.visibleTargets.find(target => target.id === 'riko')?.affection === 5, '与梨子交谈没有增加好感');
  await page.getByRole('button', { name: /尝试向春菜告白/u }).click();
  await page.waitForSelector('[data-generation-status="loading"]');
  await page.screenshot({ path: path.join(outputDir, 'direct-loading.png'), fullPage: true });
  await page.waitForFunction(
    () => JSON.parse(window.render_game_to_text()).activeMainStory?.generationStatus === 'ready',
  );
  state = await readState(page);
  const calls = await page.evaluate(() => window.__storyCalls);
  assert(calls.length === 1, '第一幕应只调用一次 generate');
  assert(calls[0].presetName === 'in_use' && !calls[0].hasJsonSchema, '未使用当前预设或仍在要求JSON');
  assert(calls[0].asksForPlainText, '提示词没有明确要求直接正文');
  assert(calls[0].hasEpisodeLore && calls[0].hasLalaLore && calls[0].hasRikoLore, '三本本地世界书未完整注入');
  assert(calls[0].scansRiko && calls[0].scansLala, '人物扫描键未进入原生扫描材料');
  assert(state.activeMainStory.entryReason === 'confession_interrupted', '主动入口原因错误');
  assert(state.activeMainStory.generationSource === 'tavern', '成功结果没有标记为 tavern');
  assert(state.activeMainStory.actCount === 1, '第一幕正文没有写入当前剧情');
  assert(state.activeMainStory.pageCount === 113, '酒馆返回的113页纯文本没有完整转成内部剧情页');
  await page.screenshot({ path: path.join(outputDir, 'direct-ready.png'), fullPage: true });

  for (let index = 0; index < 240; index += 1) {
    state = await readState(page);
    if (!state.activeMainStory) break;
    if (state.activeMainStory.generationStatus !== 'ready') {
      await page.waitForFunction(() => {
        const story = JSON.parse(window.render_game_to_text()).activeMainStory;
        return !story || story.generationStatus === 'ready' || story.generationStatus === 'error';
      });
      state = await readState(page);
      assert(state.activeMainStory?.generationStatus !== 'error', '后续幕正文生成失败');
      continue;
    }
    await page.keyboard.press('ArrowRight');
    await page.waitForTimeout(30);
  }
  state = await readState(page);
  assert(state.activeMainStory === null, '四幕播放后主线仍未结束');
  assert(state.date.month === 4 && state.date.day === 8, '完成第一集后没有进入 4 月 8 日');
  assert(state.actionPointsRemaining === 2, '次日行动点没有恢复');
  assert(state.completedMainStoryEventIds.length === 1, '完成标记没有唯一写入');
  const finalCalls = await page.evaluate(() => window.__storyCalls);
  assert(finalCalls.length === 4, '四幕正文应分别调用四次 generate');
  assert(
    finalCalls.every(call => !call.hasJsonSchema && call.asksForPlainText),
    '后续幕仍存在JSON请求',
  );
  results.direct = {
    initial,
    calls: finalCalls,
    final: state,
    savePersistence: '仅在真实 SillyTavern 中人工审查，不由自动脚本代替玩家存读档',
  };
  await context.close();

  const fallbackContext = await browser.newContext({ viewport: { width: 844, height: 390 } });
  const fallbackPage = await fallbackContext.newPage();
  fallbackPage.on('console', message => {
    if (message.type() === 'error' && !message.text().includes('[ToLove Story]')) {
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
  await fallbackPage.getByRole('button', { name: /运动/u }).click();
  await fallbackPage.waitForSelector('[data-generation-status="error"]');
  state = await readState(fallbackPage);
  assert(state.actionPointsRemaining === 0, '日终入口应在两次行动后保持 0 点直到剧情完成');
  assert(state.activeMainStory.entryReason === 'ap_depleted', '日终入口原因错误');
  assert(state.activeMainStory.generationStatus === 'error', 'API 失败没有进入可见错误态');
  await fallbackPage.getByRole('button', { name: '使用保底版' }).click();
  state = await readState(fallbackPage);
  assert(state.activeMainStory.generationSource === 'fallback', '保底正文没有显式标记来源');
  assert(state.activeMainStory.actCount === 4, '保底正文不是四幕');
  await fallbackPage.screenshot({ path: path.join(outputDir, 'fallback-mobile.png'), fullPage: true });
  for (let index = 0; index < 30; index += 1) {
    state = await readState(fallbackPage);
    if (!state.activeMainStory) break;
    await fallbackPage.keyboard.press('ArrowRight');
    await fallbackPage.waitForTimeout(20);
  }
  state = await readState(fallbackPage);
  assert(state.date.day === 8 && state.actionPointsRemaining === 2, '跳过保底剧情后跨日状态错误');
  results.fallback = { final: state };
  await fallbackContext.close();
} finally {
  await browser.close();
}

fs.writeFileSync(path.join(outputDir, 'results.json'), JSON.stringify(results, null, 2));
assert(results.consoleErrors.length === 0, `出现控制台错误：${results.consoleErrors.join(' | ')}`);
assert(results.pageErrors.length === 0, `出现页面异常：${results.pageErrors.join(' | ')}`);
assert(results.requestFailures.length === 0, `出现资源请求失败：${results.requestFailures.join(' | ')}`);
console.log(JSON.stringify(results, null, 2));
