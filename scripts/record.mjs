// 自演录制：无头 Edge 打开 ?auto=1，逐帧截屏到 shots/rec/
import puppeteer from 'puppeteer-core';
import fs from 'node:fs';
import path from 'node:path';

const EDGE = 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe';
const OUT = path.resolve('shots/rec');
const URL = 'http://localhost:5199/?auto=1';
const MAX_MS = 272_000;     // 硬上限，留出 bash 余量
const SHOT_MS = 500;

fs.rmSync(OUT, { recursive: true, force: true });
fs.mkdirSync(OUT, { recursive: true });

const browser = await puppeteer.launch({
  executablePath: EDGE,
  headless: 'new',
  args: ['--no-sandbox', '--disable-gpu', '--mute-audio'],
});
const page = await browser.newPage();
await page.setViewport({ width: 1600, height: 900 });
page.on('pageerror', e => console.log('PAGEERROR:', e.message));
page.on('console', m => { if (m.type() === 'error') console.log('CONSOLE:', m.text()); });

const t0 = Date.now();
await page.goto(URL, { waitUntil: 'networkidle2', timeout: 30000 });
console.log('loaded', ((Date.now() - t0) / 1000).toFixed(1) + 's');

// 点标题页开始按钮
await page.waitForSelector('.t-start', { timeout: 15000 });
await new Promise(r => setTimeout(r, 1200));
await page.click('.t-start');
console.log('started');

let n = 0, lastLog = 0;
while (Date.now() - t0 < MAX_MS) {
  const done = await page.$('.ep-end');
  if (done) {
    // 结尾画面多拍几秒
    for (let i = 0; i < 8; i++) {
      await page.screenshot({ path: path.join(OUT, `f${String(n++).padStart(4, '0')}.jpg`), type: 'jpeg', quality: 70 });
      await new Promise(r => setTimeout(r, SHOT_MS));
    }
    console.log('EPILOGUE END reached at', ((Date.now() - t0) / 1000).toFixed(1) + 's');
    break;
  }
  await page.screenshot({ path: path.join(OUT, `f${String(n++).padStart(4, '0')}.jpg`), type: 'jpeg', quality: 70 });
  if (Date.now() - lastLog > 15000) {
    lastLog = Date.now();
    const stage = await page.evaluate(() => document.body.innerText.slice(0, 80).replace(/\n/g, ' '));
    console.log(`t=${((Date.now() - t0) / 1000).toFixed(0)}s frames=${n} :: ${stage}`);
  }
  await new Promise(r => setTimeout(r, SHOT_MS));
}
console.log('capture done, frames =', n, 'elapsed =', ((Date.now() - t0) / 1000).toFixed(1) + 's');
await browser.close();
