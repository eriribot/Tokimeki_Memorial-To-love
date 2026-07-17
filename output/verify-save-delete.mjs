import fs from 'node:fs';
import path from 'node:path';
import { chromium } from 'file:///C:/Users/eriri/.codex/skills/develop-web-game/node_modules/playwright/index.mjs';

const url = process.env.WEBGAME_URL ?? 'http://127.0.0.1:5512/dist/webgame-ui/';
const outputDir = path.join(import.meta.dirname, 'save-delete-e2e');
fs.mkdirSync(outputDir, { recursive: true });

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function createDiagnostics(page) {
  const diagnostics = { consoleErrors: [], pageErrors: [], requestFailures: [] };
  page.on('console', message => {
    if (message.type() === 'error') diagnostics.consoleErrors.push(message.text());
  });
  page.on('pageerror', error => diagnostics.pageErrors.push(error.message));
  page.on('requestfailed', request => {
    const failure = `${request.url()} ${request.failure()?.errorText}`;
    if (!failure.includes('/music/op.mp3 net::ERR_ABORTED')) diagnostics.requestFailures.push(failure);
  });
  return diagnostics;
}

async function installSaveBridge(page, failureMode = 'none', initialSlot = 'manual') {
  await page.addInitScript(
    ({ mode, slotMode }) => {
      const listeners = new Map();
      const saveSummary = {
        schemaVersion: 1,
        saveUuid: 'save-slot-01-test-uuid',
        slotId: 'slot-01',
        chatId: 'save-delete-test-chat',
        createdAt: '2026-07-17T10:00:00.000Z',
        updatedAt: '2026-07-17T10:30:00.000Z',
        revision: 3,
        preview: {
          playerName: '测试主角',
          day: 1,
          date: { year: 2008, month: 4, day: 7 },
          periodIndex: 0,
          locationId: 'classroom',
          sceneId: null,
        },
      };
      const autosaveSummary = {
        ...saveSummary,
        saveUuid: 'save-autosave-test-uuid',
        slotId: 'autosave',
      };
      let saves = [slotMode === 'autosave' ? autosaveSummary : saveSummary];
      let archives = saves.map(save => ({ slotId: save.slotId, saveUuid: save.saveUuid }));
      window.__saveBridgeCalls = [];

      const emitResponse = (eventName, payload) => {
        queueMicrotask(() => {
          for (const listener of listeners.get(eventName) ?? []) listener(payload);
        });
      };

      window.eventOn = (eventName, listener) => {
        const eventListeners = listeners.get(eventName) ?? new Set();
        eventListeners.add(listener);
        listeners.set(eventName, eventListeners);
        return { stop: () => eventListeners.delete(listener) };
      };

      window.eventEmit = async (eventName, request) => {
        const isSave = eventName === 'tolove:save:request:v1';
        const isMessage = eventName === 'tolove:message:request:v1';
        if (!isSave && !isMessage) return;

        const channel = isSave ? 'save' : 'message';
        const responseEvent = isSave ? 'tolove:save:response:v1' : 'tolove:message:response:v1';
        window.__saveBridgeCalls.push({
          channel,
          action: request.action,
          slotId: request.slotId ?? request.archive?.slotId ?? null,
          saveUuid: request.saveUuid ?? request.archive?.saveUuid ?? null,
        });

        let ok = true;
        let result;
        let error;

        if (isSave) {
          if (request.action === 'probe') {
            result = {
              backend: 'tavern-file',
              persistent: true,
              sharedAcrossDevices: false,
              chatId: 'save-delete-test-chat',
              storagePath: 'user/files/tokimeki-to-love-save-*.json',
              saveCount: saves.length,
              shujukuAvailable: false,
              uuidMode: 'crypto.randomUUID',
            };
          } else if (request.action === 'list') {
            result = { saves: saves.map(save => ({ ...save })) };
          } else if (request.action === 'write') {
            const existing = saves.find(save => save.slotId === request.slotId);
            const now = new Date().toISOString();
            const save = {
              schemaVersion: 1,
              saveUuid: request.saveUuid ?? existing?.saveUuid ?? `${request.slotId}-generated-test-uuid`,
              slotId: request.slotId,
              chatId: 'save-delete-test-chat',
              createdAt: existing?.createdAt ?? now,
              updatedAt: now,
              revision: (existing?.revision ?? 0) + 1,
              preview: request.preview,
              data: request.data,
            };
            saves = [save, ...saves.filter(current => current.slotId !== save.slotId)];
            result = { save };
          } else if (request.action === 'delete') {
            if (mode === 'save-delete') {
              ok = false;
              error = { code: 'SAVE_FILE_OPERATION_FAILED', message: '模拟主存档删除失败' };
            } else {
              const match = saves.find(
                save => save.slotId === request.slotId && (!request.saveUuid || save.saveUuid === request.saveUuid),
              );
              saves = match ? saves.filter(save => save !== match) : saves;
              result = { deleted: Boolean(match), saveUuid: match?.saveUuid ?? null };
            }
          }
        } else if (request.action === 'probe') {
          result = {
            backend: 'tavern-file',
            persistent: true,
            storagePath: 'user/files/tokimeki-to-love-messages-*.json',
            archiveCount: archives.length,
          };
        } else if (request.action === 'write') {
          const archive = request.archive;
          archives = [archive, ...archives.filter(current => current.slotId !== archive.slotId)];
          result = { archive };
        } else if (request.action === 'delete') {
          if (mode === 'message-delete') {
            ok = false;
            error = { code: 'MESSAGE_FILE_OPERATION_FAILED', message: '模拟对话档删除失败' };
          } else {
            const match = archives.find(
              archive =>
                archive.slotId === request.slotId && (!request.saveUuid || archive.saveUuid === request.saveUuid),
            );
            archives = match ? archives.filter(archive => archive !== match) : archives;
            result = { deleted: Boolean(match), saveUuid: match?.saveUuid ?? null };
          }
        }

        emitResponse(responseEvent, {
          protocolVersion: 1,
          requestId: request.requestId,
          action: request.action,
          backend: 'tavern-file',
          ok,
          ...(ok ? { result } : { error }),
        });
      };
    },
    { mode: failureMode, slotMode: initialSlot },
  );
}

async function waitForContinue(page, enabled) {
  await page.waitForFunction(
    expected => document.querySelector('#start-continue')?.getAttribute('aria-disabled') === String(!expected),
    enabled,
  );
}

async function openLoadModal(page, expectedSlotId = 'slot-01') {
  await page.goto(url, { waitUntil: 'networkidle' });
  await waitForContinue(page, true);
  await page.locator('#start-continue').click();
  await page.getByRole('dialog', { name: '读取数据' }).waitFor();
  await page.locator(`[data-save-slot="${expectedSlotId}"].has-data`).waitFor();
  await page.waitForTimeout(220);
}

function deleteCalls(calls, channel) {
  return calls.filter(call => call.channel === channel && call.action === 'delete');
}

function writeCalls(calls, channel) {
  return calls.filter(call => call.channel === channel && call.action === 'write');
}

async function waitForWriteCount(page, channel, expectedCount) {
  await page.waitForFunction(
    ({ expectedChannel, count }) =>
      window.__saveBridgeCalls.filter(call => call.channel === expectedChannel && call.action === 'write').length >=
      count,
    { expectedChannel: channel, count: expectedCount },
  );
}

async function openInGameLoadModal(page, expectedSlotId = 'autosave') {
  await page.locator('#map-menu-toggle').click();
  await page.locator('#map-menu-load').click();
  await page.getByRole('dialog', { name: '读取数据' }).waitFor();
  await page.locator(`[data-save-slot="${expectedSlotId}"].has-data`).waitFor();
}

async function readLayout(page) {
  return page.evaluate(() => {
    const toRect = element => {
      const rect = element?.getBoundingClientRect();
      return rect
        ? {
            left: rect.left,
            right: rect.right,
            top: rect.top,
            bottom: rect.bottom,
            width: rect.width,
            height: rect.height,
          }
        : null;
    };

    const shell = document.querySelector('.tolove-app-shell');
    const overlay = document.querySelector('.save-slot-overlay');
    const dialog = document.querySelector('.save-slot-window');
    const overlayStyle = overlay ? getComputedStyle(overlay) : null;
    const dialogStyle = dialog ? getComputedStyle(dialog) : null;

    return {
      innerWidth: window.innerWidth,
      innerHeight: window.innerHeight,
      scrollX: window.scrollX,
      documentScrollWidth: document.documentElement.scrollWidth,
      bodyScrollWidth: document.body.scrollWidth,
      overlayScrollLeft: overlay?.scrollLeft ?? null,
      overlayScrollTop: overlay?.scrollTop ?? null,
      shell: toRect(shell),
      overlay: toRect(overlay),
      dialog: toRect(dialog),
      overlayStyle: overlayStyle
        ? {
            display: overlayStyle.display,
            placeItems: overlayStyle.placeItems,
            gridTemplateColumns: overlayStyle.gridTemplateColumns,
            gridTemplateRows: overlayStyle.gridTemplateRows,
          }
        : null,
      dialogStyle: dialogStyle
        ? {
            position: dialogStyle.position,
            left: dialogStyle.left,
            top: dialogStyle.top,
            transform: dialogStyle.transform,
            animationName: dialogStyle.animationName,
            animationDuration: dialogStyle.animationDuration,
            justifySelf: dialogStyle.justifySelf,
            alignSelf: dialogStyle.alignSelf,
            margin: dialogStyle.margin,
            minWidth: dialogStyle.minWidth,
            maxWidth: dialogStyle.maxWidth,
            minHeight: dialogStyle.minHeight,
            maxHeight: dialogStyle.maxHeight,
            offsetLeft: dialog.offsetLeft,
            offsetTop: dialog.offsetTop,
          }
        : null,
    };
  });
}

function assertDialogContained(layout, label) {
  assert(layout.overlayScrollLeft === 0 && layout.overlayScrollTop === 0, `${label}遮罩发生了内部滚动`);
  assert(
    layout.dialog &&
      layout.dialog.left >= -1 &&
      layout.dialog.right <= layout.innerWidth + 1 &&
      layout.dialog.top >= -1 &&
      layout.dialog.bottom <= layout.innerHeight + 1,
    `${label}弹窗超出视口：${JSON.stringify(layout.dialog)}`,
  );
}

async function checkSuccess(browser) {
  const page = await browser.newPage({ viewport: { width: 1280, height: 820 } });
  const diagnostics = createDiagnostics(page);
  await installSaveBridge(page);
  await openLoadModal(page);

  const deleteButton = page.locator('[data-delete-save-slot="slot-01"]');
  assert(await deleteButton.isVisible(), '已有手动槽没有删除按钮');

  await deleteButton.click();
  const confirmation = page.getByRole('alertdialog');
  await confirmation.waitFor();
  await page.waitForTimeout(170);
  assert((await confirmation.getByRole('heading').textContent()) === '删除槽位 01？', '删除确认标题错误');
  assert(
    await confirmation.getByText('主存档和对应的对话记录会永久删除，此操作无法撤销。').isVisible(),
    '删除确认没有说明级联和不可撤销',
  );
  assert(
    await confirmation.getByRole('button', { name: '取消' }).evaluate(element => element === document.activeElement),
    '危险确认没有默认聚焦取消',
  );
  await page.screenshot({ path: path.join(outputDir, 'delete-confirm-desktop.png'), fullPage: false });

  await confirmation.getByRole('button', { name: '取消' }).click();
  assert(
    (await page.evaluate(() => window.__saveBridgeCalls.filter(call => call.action === 'delete').length)) === 0,
    '取消删除仍发送了请求',
  );
  assert(await page.locator('[data-save-slot="slot-01"].has-data').isVisible(), '取消删除后槽位消失');

  await deleteButton.click();
  await page.getByRole('alertdialog').getByRole('button', { name: '确认删除' }).click();
  await page.getByText('已删除槽位 01').waitFor();
  await page.locator('[data-save-slot="slot-01"].is-empty').waitFor();
  assert((await page.locator('[data-delete-save-slot="slot-01"]').count()) === 0, '删除后按钮仍存在');
  assert(await page.getByText('0 个存档').isVisible(), '删除后顶部数量没有刷新');
  const successLayout = await readLayout(page);
  assertDialogContained(successLayout, '删除成功后');

  const calls = await page.evaluate(() => window.__saveBridgeCalls);
  const saveDeletes = deleteCalls(calls, 'save');
  const messageDeletes = deleteCalls(calls, 'message');
  assert(saveDeletes.length === 1, '主存档删除请求次数错误');
  assert(messageDeletes.length === 1, '对话档删除请求次数错误');
  assert(saveDeletes[0].saveUuid === 'save-slot-01-test-uuid', '主存档删除没有携带精确 UUID');
  assert(messageDeletes[0].saveUuid === 'save-slot-01-test-uuid', '对话档删除没有携带精确 UUID');
  await page.screenshot({ path: path.join(outputDir, 'delete-success-desktop.png'), fullPage: false });

  await page.getByRole('button', { name: '关闭存档界面' }).click();
  await waitForContinue(page, false);
  assert((await page.locator('#start-continue').getAttribute('tabindex')) === '-1', '删除最后存档后继续游戏仍可聚焦');
  const state = JSON.parse(await page.evaluate(() => window.render_game_to_text()));
  assert(state.screen === 'start' && state.canContinue === false, '删除后标题状态不一致');
  await page.close();
  return { diagnostics, saveDeletes, messageDeletes, finalState: state, successLayout };
}

async function checkAutosave(browser) {
  const page = await browser.newPage({ viewport: { width: 1280, height: 820 } });
  const diagnostics = createDiagnostics(page);
  await installSaveBridge(page, 'none', 'autosave');
  await openLoadModal(page, 'autosave');

  const startState = JSON.parse(await page.evaluate(() => window.render_game_to_text()));
  assert(startState.screen === 'start', '开始页继续游戏仍然直接读取了自动档');
  const deleteButton = page.locator('[data-delete-save-slot="autosave"]');
  assert(await deleteButton.isVisible(), '自动档没有删除按钮');
  await page.screenshot({ path: path.join(outputDir, 'autosave-delete-entry-desktop.png'), fullPage: false });

  await deleteButton.click();
  let confirmation = page.getByRole('alertdialog');
  await confirmation.waitFor();
  await page.waitForTimeout(170);
  assert((await confirmation.getByRole('heading').textContent()) === '删除自动存档？', '自动档删除确认标题错误');
  assert(
    await confirmation
      .getByText('当前自动存档和对应的对话记录会永久删除。继续游玩或返回标题后，系统会重新建立自动存档。')
      .isVisible(),
    '自动档确认没有说明重建时机',
  );
  await page.screenshot({ path: path.join(outputDir, 'autosave-delete-confirm-desktop.png'), fullPage: false });
  await confirmation.getByRole('button', { name: '确认删除' }).click();
  await page.getByText('已删除自动存档').waitFor();
  await page.locator('[data-save-slot="autosave"].is-empty').waitFor();
  await page.waitForTimeout(800);

  let calls = await page.evaluate(() => window.__saveBridgeCalls);
  let saveWrites = writeCalls(calls, 'save');
  let messageWrites = writeCalls(calls, 'message');
  let saveDeletes = deleteCalls(calls, 'save');
  let messageDeletes = deleteCalls(calls, 'message');
  assert(saveWrites.length === 0 && messageWrites.length === 0, '开始页删除自动档后发生了无状态变化写回');
  assert(saveDeletes.length === 1 && messageDeletes.length === 1, '开始页自动档没有完成双文件删除');
  assert(saveDeletes[0].saveUuid === 'save-autosave-test-uuid', '开始页自动档删除没有携带精确 UUID');
  assert(messageDeletes[0].saveUuid === 'save-autosave-test-uuid', '开始页对话档删除没有携带精确 UUID');
  await page.screenshot({ path: path.join(outputDir, 'autosave-delete-success-desktop.png'), fullPage: false });

  await page.getByRole('button', { name: '关闭存档界面' }).click();
  await waitForContinue(page, false);
  await page.locator('#start-restart').click();
  await page.locator('#map-menu-toggle').waitFor();
  await waitForWriteCount(page, 'save', 1);
  await waitForWriteCount(page, 'message', 1);
  await page.waitForTimeout(1200);
  calls = await page.evaluate(() => window.__saveBridgeCalls);
  const baselineSaveWriteCount = writeCalls(calls, 'save').length;
  const baselineMessageWriteCount = writeCalls(calls, 'message').length;
  assert(baselineSaveWriteCount === baselineMessageWriteCount, '新游戏启动时主档与对话档写入次数不一致');

  await openInGameLoadModal(page, 'autosave');
  await page.evaluate(() => document.querySelector('.controls > .control-group .buttons > button')?.click());
  const pausedState = JSON.parse(await page.evaluate(() => window.render_game_to_text()));
  assert(pausedState.screen === 'game' && pausedState.isPlaying === false, '没有建立待写自动保存状态');
  await page.locator('[data-delete-save-slot="autosave"]').click();
  confirmation = page.getByRole('alertdialog');
  await confirmation.waitFor();
  await confirmation.getByRole('button', { name: '确认删除' }).click();
  await page.getByText('已删除自动存档').waitFor();
  await page.waitForTimeout(800);

  calls = await page.evaluate(() => window.__saveBridgeCalls);
  saveWrites = writeCalls(calls, 'save');
  messageWrites = writeCalls(calls, 'message');
  saveDeletes = deleteCalls(calls, 'save');
  messageDeletes = deleteCalls(calls, 'message');
  assert(
    saveWrites.length === baselineSaveWriteCount && messageWrites.length === baselineMessageWriteCount,
    `删除没有取消 600ms 待写自动保存：save=${saveWrites.length}, message=${messageWrites.length}, calls=${JSON.stringify(calls)}`,
  );
  assert(saveDeletes.length === 2 && messageDeletes.length === 2, '游戏内自动档没有完成第二次双文件删除');
  assert(saveDeletes[1].saveUuid === 'autosave-generated-test-uuid', '游戏内自动档删除没有携带新 UUID');
  assert(messageDeletes[1].saveUuid === 'autosave-generated-test-uuid', '游戏内对话档删除没有携带新 UUID');

  await page.getByRole('button', { name: '关闭存档界面' }).click();
  await page.locator('.controls > .control-group').first().locator('.buttons > button').first().click();
  await waitForWriteCount(page, 'save', baselineSaveWriteCount + 1);
  await waitForWriteCount(page, 'message', baselineMessageWriteCount + 1);
  calls = await page.evaluate(() => window.__saveBridgeCalls);
  saveWrites = writeCalls(calls, 'save');
  messageWrites = writeCalls(calls, 'message');
  assert(
    saveWrites.length === baselineSaveWriteCount + 1 && messageWrites.length === baselineMessageWriteCount + 1,
    '新状态变化没有恰好重建一次自动档',
  );

  await page.close();
  return { diagnostics, startState, saveDeletes, messageDeletes, saveWrites, messageWrites };
}

async function checkFailure(browser, failureMode) {
  const page = await browser.newPage({ viewport: { width: 1180, height: 820 } });
  const diagnostics = createDiagnostics(page);
  await installSaveBridge(page, failureMode);
  await openLoadModal(page);

  await page.locator('[data-delete-save-slot="slot-01"]').click();
  await page.getByRole('alertdialog').getByRole('button', { name: '确认删除' }).click();
  const expectedError = failureMode === 'save-delete' ? '模拟主存档删除失败' : '模拟对话档删除失败';
  await page.getByText(expectedError).waitFor();
  const layout = await readLayout(page);
  assertDialogContained(layout, `${failureMode}失败后`);

  const calls = await page.evaluate(() => window.__saveBridgeCalls);
  const saveDeletes = deleteCalls(calls, 'save');
  const messageDeletes = deleteCalls(calls, 'message');
  assert(saveDeletes.length === 1, `${failureMode} 主存档删除次数错误`);

  if (failureMode === 'save-delete') {
    assert(messageDeletes.length === 0, '主存档删除失败后不应删除对话档');
    assert(await page.locator('[data-save-slot="slot-01"].has-data').isVisible(), '主存档删除失败后槽位没有保留');
    assert(await page.locator('[data-delete-save-slot="slot-01"]').isEnabled(), '失败后删除按钮没有解除忙碌状态');
  } else {
    assert(messageDeletes.length === 1, '对话档删除失败路径没有发出级联请求');
    assert(await page.locator('[data-save-slot="slot-01"].is-empty').isVisible(), '主存档已删除后界面没有重新对账');
    assert(await page.getByText('0 个存档').isVisible(), '部分失败后顶部数量没有重新对账');
  }

  await page.screenshot({ path: path.join(outputDir, `${failureMode}-desktop.png`), fullPage: false });
  await page.close();
  return { diagnostics, calls, expectedError, layout };
}

async function checkMobile(browser) {
  const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
  const diagnostics = createDiagnostics(page);
  await installSaveBridge(page, 'none', 'autosave');
  await openLoadModal(page, 'autosave');

  const deleteRect = await page.locator('[data-delete-save-slot="autosave"]').boundingBox();
  assert(
    deleteRect && deleteRect.width >= 44 && deleteRect.height >= 44,
    `手机删除按钮触控区不足 44px（实测 ${deleteRect?.width ?? 0} × ${deleteRect?.height ?? 0}px）`,
  );
  await page.locator('[data-delete-save-slot="autosave"]').click();
  const confirmation = page.getByRole('alertdialog');
  await confirmation.waitFor();
  await page.waitForTimeout(170);
  const layout = await readLayout(page);
  assertDialogContained(layout, '手机删除确认');
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth);
  assert(!overflow, '手机删除确认产生横向溢出');
  for (const button of await confirmation.getByRole('button').all()) {
    const box = await button.boundingBox();
    assert(box && box.x >= 0 && box.x + box.width <= 390, '手机确认按钮超出视口');
  }
  await page.screenshot({ path: path.join(outputDir, 'autosave-delete-confirm-mobile.png'), fullPage: false });
  await confirmation.getByRole('button', { name: '取消' }).click();
  await page.close();
  return { diagnostics, deleteRect, overflow, layout };
}

const requestedScenario = process.env.SAVE_DELETE_SCENARIO ?? 'all';
const browser = await chromium.launch({ headless: true });
let results;
try {
  results = {};
  if (requestedScenario === 'all' || requestedScenario === 'success') results.success = await checkSuccess(browser);
  if (requestedScenario === 'all' || requestedScenario === 'autosave') {
    results.autosave = await checkAutosave(browser);
  }
  if (requestedScenario === 'all' || requestedScenario === 'save-delete') {
    results.saveDeleteFailure = await checkFailure(browser, 'save-delete');
  }
  if (requestedScenario === 'all' || requestedScenario === 'message-delete') {
    results.messageDeleteFailure = await checkFailure(browser, 'message-delete');
  }
  if (requestedScenario === 'all' || requestedScenario === 'mobile') results.mobile = await checkMobile(browser);
  assert(Object.keys(results).length > 0, `未知删除回归场景：${requestedScenario}`);
} finally {
  await browser.close();
}

const diagnostics = Object.values(results).flatMap(result => [
  ...result.diagnostics.consoleErrors,
  ...result.diagnostics.pageErrors,
  ...result.diagnostics.requestFailures,
]);
fs.writeFileSync(path.join(outputDir, 'results.json'), JSON.stringify(results, null, 2));
assert(diagnostics.length === 0, `出现浏览器错误：${diagnostics.join(' | ')}`);
console.log(JSON.stringify(results, null, 2));
