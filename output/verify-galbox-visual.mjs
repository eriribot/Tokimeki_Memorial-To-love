import fs from 'node:fs';
import http from 'node:http';
import path from 'node:path';
import { chromium } from 'file:///C:/Users/eriri/.codex/skills/develop-web-game/node_modules/playwright/index.mjs';

const repoRoot = path.resolve('../..');
const outputDir = path.resolve('output/galbox-visual');
fs.mkdirSync(outputDir, { recursive: true });

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.ttf': 'font/ttf',
  '.otf': 'font/otf',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.mp3': 'audio/mpeg',
  '.wav': 'audio/wav',
};

const server = http.createServer((req, res) => {
  const urlPath = decodeURIComponent(new URL(req.url, 'http://x').pathname);
  let filePath = path.join(repoRoot, urlPath);
  if (urlPath.endsWith('/')) filePath = path.join(filePath, 'index.html');
  if (!filePath.startsWith(repoRoot)) {
    res.writeHead(403).end();
    return;
  }
  fs.readFile(filePath, (err, data) => {
    if (err) {
      res.writeHead(404).end('not found: ' + urlPath);
      return;
    }
    res.writeHead(200, { 'content-type': MIME[path.extname(filePath).toLowerCase()] ?? 'application/octet-stream' });
    res.end(data);
  });
});
await new Promise(resolve => server.listen(5511, resolve));

const longSentence =
  '夕阳把教室的桌椅染成蜂蜜一样的颜色，粉笔灰在斜射进来的光柱里慢慢打转，走廊尽头的鞋柜旁有人在低声说笑，' +
  '水龙头没有关紧的声音一滴一滴敲在瓷砖上，黑板角落里还留着值日生没擦干净的字迹，窗边的窗帘被风鼓起又落下，' +
  '操场上社团活动的哨声远远近近地飘过来，教学楼顶的风把云影一层一层推过窗玻璃，而你站在原地，手心里还残留着刚才那一瞬间的余温，' +
  '忽然意识到从今天起，这个熟悉得不能再熟悉的放学后的校园，好像要变得完全不一样了。';
if (longSentence.length <= 180) throw new Error('长句测试样本不足 180 字: ' + longSentence.length);

const storyLines = [
  '@旁白：视线恢复的时候，风吹得人打激灵。',
  '@菈菈【担心】：没事吧？你脸色看起来不太好哦！',
  `@旁白：${longSentence}`,
  '@西连寺春菜【紧张】：那个……你们两个，在这里做什么呀？',
  '@旁白：走廊尽头又响起急促的脚步声。',
  '@你【慌张】：先离开这里再解释！',
  '@菈菈【开心】：好呀，出发！',
  '@旁白：门被风猛地推开，夕阳一下灌满整条走廊。',
].join('\n');

async function installMock(page) {
  await page.addInitScript(story => {
    window.TavernHelper = {
      generate: async () => {
        await new Promise(resolve => setTimeout(resolve, 120));
        return story;
      },
    };
  }, storyLines);
}

async function startStory(page) {
  await page.goto('http://localhost:5511/dist/webgame-ui/', { waitUntil: 'networkidle' });
  console.log('page loaded');
  await page.locator('#start-restart').click();
  console.log('start clicked');
  await page.waitForFunction(() => JSON.parse(window.render_game_to_text()).screen === 'game');
  console.log('game screen');
  await page.getByRole('button', { name: /夕崎梨子.*好感 0/u }).click();
  console.log('riko clicked');
  await page.waitForFunction(
    () => JSON.parse(window.render_game_to_text()).activeMainStory?.generationStatus === 'ready',
  );
  console.log('story ready');
}

const browser = await chromium.launch({ headless: true });
try {
  // Desktop
  const desktop = await browser.newContext({ viewport: { width: 1440, height: 1100 } });
  const page = await desktop.newPage();
  page.on('pageerror', error => console.error('PAGE ERROR:', error.message));
  await installMock(page);
  await startStory(page);
  await page.screenshot({ path: path.join(outputDir, 'desktop-1-narration-short.png') });
  await page.keyboard.press('ArrowRight');
  await page.waitForTimeout(150);
  await page.screenshot({ path: path.join(outputDir, 'desktop-2-lala-nameplate.png') });
  await page.keyboard.press('ArrowRight');
  await page.waitForTimeout(150);
  await page.screenshot({ path: path.join(outputDir, 'desktop-3-long-paragraph.png') });
  await page.keyboard.press('ArrowRight');
  await page.waitForTimeout(150);
  await page.screenshot({ path: path.join(outputDir, 'desktop-4-long-paragraph-continuation.png') });
  await page.keyboard.press('ArrowRight');
  await page.waitForTimeout(150);
  await page.screenshot({ path: path.join(outputDir, 'desktop-5-generic-speaker.png') });
  await desktop.close();

  // Phone landscape
  const mobile = await browser.newContext({ viewport: { width: 844, height: 390 } });
  const mpage = await mobile.newPage();
  mpage.on('pageerror', error => console.error('PAGE ERROR:', error.message));
  await installMock(mpage);
  await startStory(mpage);
  await mpage.keyboard.press('ArrowRight');
  await mpage.waitForTimeout(150);
  await mpage.screenshot({ path: path.join(outputDir, 'mobile-2-lala-nameplate.png') });
  await mpage.keyboard.press('ArrowRight');
  await mpage.waitForTimeout(150);
  await mpage.screenshot({ path: path.join(outputDir, 'mobile-3-long-paragraph.png') });
  await mpage.keyboard.press('ArrowRight');
  await mpage.waitForTimeout(150);
  await mpage.keyboard.press('ArrowRight');
  await mpage.waitForTimeout(150);
  await mpage.screenshot({ path: path.join(outputDir, 'mobile-5-generic-speaker.png') });
  await mobile.close();
} finally {
  await browser.close();
  server.close();
}
console.log('screenshots written to', outputDir);
