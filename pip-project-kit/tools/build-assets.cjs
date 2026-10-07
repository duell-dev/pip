// Register the generated frames against one body, then encode the original art.
const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const sharp = require('sharp');
const root = path.resolve(__dirname, '..');
const assetDir = path.join(root, 'assets', 'animation');
const previewDir = path.join(root, 'preview');

function sample(pixels, x, y, channel) {
  const ix = Math.floor(x), iy = Math.floor(y), fx = x - ix, fy = y - iy;
  const at = (px, py) => px < 0 || py < 0 || px >= 96 || py >= 96 ? 0 : pixels[(py * 96 + px) * 4 + channel];
  return (at(ix, iy) * (1 - fx) + at(ix + 1, iy) * fx) * (1 - fy) + (at(ix, iy + 1) * (1 - fx) + at(ix + 1, iy + 1) * fx) * fy;
}

function register(reference, current, initial) {
  // Keep raised wings and the note outside the registration mask.
  const points = [];
  for (let y = 4; y < 96; y += 2) for (let x = 8; x < 90; x += 2) {
    if ((y < 34 && x >= 28 && x <= 74) || (y >= 78 && y < 85 && x >= 40 && x <= 70) || (y >= 88 && x >= 24 && x <= 82)) {
      points.push([x, y, ...reference.subarray((y * 96 + x) * 4, (y * 96 + x) * 4 + 4)]);
    }
  }
  function error([dx, dy, scale, angle]) {
    const c = Math.cos(angle) * scale, s = Math.sin(angle) * scale;
    let sum = 0;
    for (const [x, y, ...rgba] of points) {
      const sx = c * (x - 48) - s * (y - 48) + 48 + dx;
      const sy = s * (x - 48) + c * (y - 48) + 48 + dy;
      for (let channel = 0; channel < 4; channel++) {
        const delta = sample(current, sx, sy, channel) - rgba[channel];
        sum += delta * delta;
      }
    }
    return sum / points.length / 4;
  }
  let fit = [...initial], best = error(fit);
  const before = best;
  for (const step of [2, 1, .5, .25, .125]) {
    const increments = [step, step, step * .01, step * Math.PI / 180];
    for (let pass = 0; pass < 6; pass++) {
      let improved = false;
      for (let axis = 0; axis < 4; axis++) for (const direction of [-1, 1]) {
        const candidate = [...fit];
        candidate[axis] += increments[axis] * direction;
        if (Math.abs(candidate[0] - initial[0]) > 8 || Math.abs(candidate[1] - initial[1]) > 8 || candidate[2] < .9 || candidate[2] > 1.1 || Math.abs(candidate[3]) > Math.PI / 36) continue;
        const loss = error(candidate);
        if (loss < best) { fit = candidate; best = loss; improved = true; }
      }
      if (!improved) break;
    }
  }
  assert(best <= before + 1e-6, 'Registration must improve the static body match');
  return { fit: [fit[0] * 2, fit[1] * 2, fit[2], fit[3]], before, after: best };
}

(async () => {
  const assets = {};
  const frames = {};
  for (const name of ['idle', 'capture', 'think', 'celebrate', 'rest']) {
    const file = path.join(assetDir, name + '.png');
    const { data, info } = await sharp(file).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
    assert.equal(info.width / 4, info.height / 3, `${name}: square cells required`);
    const cell = info.width / 4;
    const anchors = [];
    frames[name] = [];
    for (let frame = 0; frame < 12; frame++) {
      const left = frame % 4 * cell;
      const top = Math.floor(frame / 4) * cell;
      function isFoot(x, y) {
        const p = ((top + y) * info.width + left + x) * 4;
        const [r, g, b, a] = data.subarray(p, p + 4);
        return a > 220 && r > 110 && g > 70 && r > g * 1.05 && g > b * 1.4 && b < r * .6;
      }
      let bottom = -1;
      for (let y = cell - 1; y >= 0 && bottom < 0; y--) {
        let count = 0;
        for (let x = 0; x < cell; x++) {
          if (isFoot(x, y)) count++;
        }
        if (count >= cell * .025) bottom = y;
      }
      assert(bottom > cell * .7, `${name}/${frame}: missing feet`);
      let footLeft = cell, footRight = -1;
      for (let y = bottom - 16; y <= bottom; y++) {
        for (let x = 0; x < cell; x++) {
          if (isFoot(x, y)) {
            footLeft = Math.min(footLeft, x);
            footRight = Math.max(footRight, x);
          }
        }
      }
      anchors.push([+((footLeft + footRight) / 2 / cell * 192).toFixed(2), +(bottom / cell * 192).toFixed(2)]);
      const pixels = await sharp(file).extract({ left, top, width: cell, height: cell }).resize(96, 96).ensureAlpha().raw().toBuffer();
      const linear = Float32Array.from(pixels);
      for (let p = 0; p < linear.length; p += 4) {
        for (let channel = 0; channel < 3; channel++) linear[p + channel] *= linear[p + 3] / 255;
      }
      frames[name].push(linear);
    }
    const webp = await sharp(file).resize(768, 576).webp({ quality: 82, alphaQuality: 100 }).toBuffer();
    fs.writeFileSync(path.join(assetDir, name + '.webp'), webp);
    assets[name] = { anchors, src: 'data:image/webp;base64,' + webp.toString('base64') };
    console.log(name, webp.length, 'bytes');
  }
  const report = {};
  const reference = frames.idle[0], anchor = assets.idle.anchors[0];
  for (const name of Object.keys(assets)) {
    const firstAnchor = assets[name].anchors[0];
    const base = register(reference, frames[name][0], [(firstAnchor[0] - anchor[0]) / 2, (firstAnchor[1] - anchor[1]) / 2, 1, 0]).fit;
    report[name] = frames[name].map((frame, i) => register(frames[name][0], frame, [(assets[name].anchors[i][0] - firstAnchor[0]) / 2, (assets[name].anchors[i][1] - firstAnchor[1]) / 2, 1, 0]));
    assets[name].alignment = report[name].map(({ fit: [dx, dy, scale, angle] }) => {
      const c = Math.cos(angle) * scale, s = Math.sin(angle) * scale;
      return [c * base[0] - s * base[1] + dx, s * base[0] + c * base[1] + dy, scale * base[2], angle + base[3]];
    });
  }
  const baseline = Object.values(report).flat().reduce((sum, row) => sum + row.before, 0);
  const corrected = Object.values(report).flat().reduce((sum, row) => sum + row.after, 0);
  assert(corrected < baseline * .7, 'Body registration must reduce static-region error by at least 30%');
  console.log(`Static body registration error reduced ${((1 - corrected / baseline) * 100).toFixed(1)}%`);
  fs.writeFileSync(path.join(assetDir, 'registration.json'), JSON.stringify(report, null, 2));
  fs.writeFileSync(path.join(assetDir, 'assets.json'), JSON.stringify(assets));
  const template = fs.readFileSync(path.join(previewDir, 'template.html'), 'utf8');
  const html = template.replace('PIP_ANIMATION_ASSETS', JSON.stringify(assets));
  assert(Buffer.byteLength(html) < 1_000_000, 'Inline preview must stay under 1 MB');
  fs.writeFileSync(path.join(previewDir, 'fragment.html'), html);
  const shell = fs.readFileSync(path.join(previewDir, 'standalone-template.html'), 'utf8');
  const escape = text => text.replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#x27;' })[char]);
  assert(shell.includes('PIP_FRAGMENT_HTML'), 'Missing standalone preview slot');
  fs.writeFileSync(path.join(previewDir, 'pip.html'), shell.replace('PIP_FRAGMENT_HTML', escape(html)));
})().catch(error => { console.error(error); process.exitCode = 1; });
