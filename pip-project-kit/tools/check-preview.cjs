// Run after installing the dependencies in tools/package.json.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require('playwright');
const { pathToFileURL } = require('node:url');
const root = path.resolve(__dirname, '..');
const standalone = process.argv.includes('--standalone');
const source = path.join(root, 'preview', 'fragment.html');
const outputDir = path.join(root, 'preview', 'checks');
fs.mkdirSync(outputDir, { recursive: true });

(async () => {
  const html = fs.readFileSync(source, 'utf8');
  assert(Buffer.byteLength(html) < 1_000_000);
  assert(!html.includes('PIP_SPRITE_DATA'));
  assert(!html.includes('PIP_ANIMATION_ASSETS'));
  assert(!/transform:|@keyframes/.test(html), 'Frame playback must not deform or rotate the character');
  const browser = await chromium.launch({ channel: process.env.PIP_BROWSER_CHANNEL || 'msedge', headless: true, args: ['--mute-audio'] });
  try {
    const page = await browser.newPage({ viewport: { width: 736, height: 520 } });
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    if (standalone) {
      await page.route(/^https?:/, route => route.abort());
      await page.goto(pathToFileURL(path.join(root, 'preview', 'pip.html')).href);
      const preview = page.frameLocator('#codex-visualization');
      await preview.locator('#pip-motion[data-ready="true"]').waitFor();
      await preview.locator('[data-pose="celebrate"]').click();
      assert.equal(await preview.locator('#pip-motion').getAttribute('data-state'), 'celebrate');
      await preview.locator('#pip-frame').evaluate(el => { el.value = '5'; el.dispatchEvent(new Event('input', { bubbles: true })); });
      assert.equal(await preview.locator('.pip-sprite').getAttribute('data-frame'), '5');
      assert.equal(await preview.locator('[data-control="sound"]').isChecked(), false);
      assert.deepEqual(errors, []);
      await page.screenshot({ path: path.join(outputDir, 'standalone.png'), fullPage: true });
      console.log('PASS: standalone file loads and interacts with internet requests blocked.');
      return;
    }
    await page.setContent('<style>body{margin:16px;color-scheme:light}</style>' + html);
    await page.waitForSelector('#pip-motion[data-ready="true"]');
    await page.evaluate(() => {
      window.startedNotes = 0;
      const start = OscillatorNode.prototype.start;
      OscillatorNode.prototype.start = function (...args) { window.startedNotes++; return start.apply(this, args); };
    });
    assert.equal(await page.locator('[data-control="sound"]').isChecked(), false);
    assert.equal(await page.evaluate(() => window.startedNotes), 0);
    for (const pose of ['idle', 'capture', 'think', 'celebrate', 'rest']) {
      await page.locator(`[data-pose="${pose}"]`).click();
      assert.equal(await page.locator('#pip-motion').getAttribute('data-state'), pose);
      assert.equal(await page.locator('[aria-pressed="true"]').count(), 1);
      const uniqueFrames = new Set();
      for (let frame = 0; frame < 12; frame++) {
        await page.locator('#pip-frame').evaluate((el, value) => { el.value = String(value); el.dispatchEvent(new Event('input', { bubbles: true })); }, frame);
        assert.equal(await page.locator('.pip-sprite').getAttribute('data-frame'), String(frame));
        uniqueFrames.add(await page.locator('.pip-sprite').evaluate(el => el.toDataURL()));
      }
      assert.equal(uniqueFrames.size, 12, `${pose}: twelve distinct drawn frames required`);
      assert.equal(await page.locator('[data-control="motion"]').isChecked(), false, 'Scrubbing pauses playback');
    }
    assert.equal(await page.evaluate(() => window.startedNotes), 0, 'Muted transitions must stay silent');
    await page.locator('[data-control="sound"]').check();
    assert.equal(await page.evaluate(() => window.startedNotes), 0, 'Enabling sound must not autoplay');
    await page.locator('[data-control="chirp"]').click();
    await page.waitForFunction(() => window.startedNotes === 2);
    await page.locator('[data-pose="capture"]').click();
    await page.waitForFunction(() => window.startedNotes === 3);
    await page.locator('[data-pose="celebrate"]').click();
    await page.waitForFunction(() => window.startedNotes === 6);
    await page.locator('[data-control="sound"]').uncheck();
    await page.locator('[data-control="motion"]').check();
    await page.locator('[data-pose="capture"]').click();
    const before = await page.locator('.pip-sprite').evaluate(el => el.toDataURL());
    const bounds = await page.locator('.pip-sprite').boundingBox();
    await page.waitForFunction(() => +document.querySelector('.pip-sprite').dataset.frame >= 4);
    assert.notEqual(await page.locator('.pip-sprite').evaluate(el => el.toDataURL()), before, 'Playback must change the drawn image');
    assert.deepEqual(await page.locator('.pip-sprite').boundingBox(), bounds, 'Canvas must remain stationary');
    assert.equal(await page.locator('.pip-sprite').evaluate(el => getComputedStyle(el).transform), 'none');
    await page.waitForFunction(() => document.querySelector('.pip-sprite').dataset.frame === '11');
    await page.waitForTimeout(250);
    assert.equal(await page.locator('.pip-sprite').getAttribute('data-frame'), '11', 'Capture holds the tucked-note pose');
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.waitForFunction(() => document.querySelector('[data-control="motion"]').disabled);
    assert.equal(await page.locator('.pip-sprite').evaluate(el => getComputedStyle(el).animationName), 'none');
    assert.equal(await page.locator('[data-control="motion"]').isChecked(), false);
    assert.equal(await page.locator('[data-control="motion"]').isDisabled(), true);
    const reducedFrame = await page.locator('.pip-sprite').getAttribute('data-frame');
    await page.waitForTimeout(250);
    assert.equal(await page.locator('.pip-sprite').getAttribute('data-frame'), reducedFrame, 'Reduced motion stops frame advancement');
    await page.emulateMedia({ reducedMotion: 'no-preference' });
    await page.waitForFunction(() => !document.querySelector('[data-control="motion"]').disabled);
    await page.locator('[data-control="motion"]').uncheck();
    assert.equal(await page.locator('.pip-sprite').evaluate(el => getComputedStyle(el).animationName), 'none');
    for (const width of [320, 736]) {
      await page.setViewportSize({ width, height: 540 });
      for (const theme of ['light', 'dark']) {
        await page.evaluate(theme => { document.body.style.colorScheme = theme; document.body.style.background = theme === 'dark' ? '#191919' : '#ffffff'; }, theme);
        assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), `${width}px ${theme}: overflow`);
        await page.locator('[data-pose="capture"]').click();
        await page.screenshot({ path: path.join(outputDir, `preview-${width}-${theme}.png`), fullPage: true });
      }
    }
    assert.deepEqual(errors, []);
    await page.setViewportSize({ width: 736, height: 540 });
    await page.locator('[data-pose="celebrate"]').click();
    const review = [];
    for (const frame of [0, 3, 5, 8, 11]) {
      await page.locator('#pip-frame').evaluate((el, value) => { el.value = String(value); el.dispatchEvent(new Event('input', { bubbles: true })); }, frame);
      review.push(await page.locator('.pip-sprite').evaluate(el => el.toDataURL()));
    }
    await page.setContent('<body style="background:#2a2725;margin:0;display:flex;flex-wrap:wrap">' + review.map(src => `<img src="${src}" width="256" height="256">`).join(''));
    await page.screenshot({ path: path.join(outputDir, 'celebrate-review.png'), fullPage: true });
    console.log('PASS: 60 distinct frames; stationary canvas; scrub, pause and one-shot hold; three chirps; reduced motion; responsive light/dark layouts.');
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
