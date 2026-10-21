'use strict';
const assert = require('node:assert/strict');
const { chromium } = require('playwright');
const fs = require('node:fs/promises');
const http = require('node:http');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const viewports = [
  [320,568],[360,800],[390,844],[430,932],[844,390],[600,960],
  [768,1024],[820,1180],[1180,820],[1280,800],[1366,768],
  [1440,900],[1920,1080],[2560,1440],[3840,2160],[4096,2160],
];
async function run() {
  const server = http.createServer(async (req, res) => {
    const raw = decodeURIComponent(new URL(req.url, 'http://localhost').pathname);
    const file = path.resolve(root, '.' + (raw === '/' ? '/index.html' : raw));
    if (!file.startsWith(root + path.sep)) return res.writeHead(403).end();
    if (file.endsWith('.js')) return res.writeHead(404).end();
    try {
      const data = await fs.readFile(file);
      const type = file.endsWith('.css') ? 'text/css' : file.endsWith('.svg')
        ? 'image/svg+xml' : 'text/html';
      res.writeHead(200, { 'Content-Type': type }); res.end(data);
    } catch { res.writeHead(404).end(); }
  });
  await new Promise(done => server.listen(0, '127.0.0.1', done));
  const url = 'http://127.0.0.1:' + server.address().port;
  let browser;
  let ok = 0;
  const errors = [];
  try {
    browser = await chromium.launch({ headless: true });
    for (const [width, height] of viewports) {
      const context = await browser.newContext({
        viewport: { width, height }, reducedMotion: 'reduce',
        hasTouch: width < 900,
      });
      await context.route('**/*', route =>
        route.request().url().startsWith(url + '/') ? route.continue() : route.abort());
      const page = await context.newPage();
      for (const route of ['/']) {
        try {
          await page.goto(url + route, { waitUntil: 'load' });
          assert.ok(await page.locator('main').count(), 'main ausente');
          assert.ok(await page.locator('h1').count(), 'h1 ausente');
          const size = await page.evaluate(() => ({
            doc: document.documentElement.scrollWidth,
            body: document.body.scrollWidth, window: innerWidth,
          }));
          assert.ok(Math.max(size.doc, size.body) <= size.window + 2,
            'overflow: ' + JSON.stringify(size));
          ok++;
        } catch (e) {
          errors.push(width + 'x' + height + ' ' + route + ': ' + e.message);
        }
      }
      await context.close();
    }
  } finally {
    if (browser) await browser.close();
    await new Promise(done => server.close(done));
  }
  console.log(ok + '/' + viewports.length + ' cenarios');
  assert.equal(errors.length, 0, errors.join('\n'));
}
run().catch(e => { console.error(e); process.exitCode = 1; });
