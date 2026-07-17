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
  '.svg': 'image/svg+xml',
  '.ttf': 'font/ttf',
  '.otf': 'font/otf',
  '.mp3': 'audio/mpeg',
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

const browser = await chromium.launch({ headless: true });
try {
  const context = await browser.newContext({ viewport: { width: 1440, height: 1100 } });
  const page = await context.newPage();
  page.on('pageerror', error => console.error('PAGE ERROR:', error.message));
  await page.goto('http://localhost:5511/dist/webgame-ui/', { waitUntil: 'networkidle' });
  await page.locator('#start-restart').click();
  await page.waitForFunction(() => JSON.parse(window.render_game_to_text()).screen === 'game');
  const state = JSON.parse(await page.evaluate(() => window.render_game_to_text()));
  const haruna = state.visibleTargets.find(target => target.id === 'haruna');
  console.log('period:', state.period);
  console.log('haruna on map:', JSON.stringify(haruna, null, 2));
  console.log(
    'all targets:',
    state.visibleTargets.map(target => `${target.id}@${target.locationId}`).join(' '),
  );
  if (!haruna) throw new Error('haruna 没有出现在 visibleTargets');
  await page.screenshot({ path: path.join(outputDir, 'haruna-map-morning.png') });
} finally {
  await browser.close();
  server.close();
}
console.log('OK');
