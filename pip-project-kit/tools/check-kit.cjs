const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const root = path.resolve(__dirname, '..');
const manifestPath = path.join(root, 'MANIFEST.json');

function excluded(relative) {
  return relative.split('/').some(part => ['node_modules', '.git'].includes(part)) || relative.startsWith('preview/checks') || relative.startsWith('evidence/codex-probe/scratch') || relative.endsWith('codex-result.local.json') || relative === 'MANIFEST.json' || relative === 'tools/pnpm-lock.yaml';
}
function walk(directory = root) {
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap(entry => {
    const full = path.join(directory, entry.name);
    const relative = path.relative(root, full).split(path.sep).join('/');
    if (excluded(relative)) return [];
    assert(!entry.isSymbolicLink(), 'Kit must not depend on symlinks: ' + relative);
    return entry.isDirectory() ? walk(full) : [relative];
  }).sort();
}
function inventory(files) {
  return files.map(file => {
    const data = fs.readFileSync(path.join(root, file));
    return { path: file, bytes: data.length, sha256: crypto.createHash('sha256').update(data).digest('hex') };
  });
}

const files = walk();
for (const file of ['README.md', 'PRD.md', 'DEVELOPMENT_PLAN.md', 'ARCHITECTURE.md', 'AI_INTEGRATION.md', 'ASSETS.md', 'HANDOFF.md', 'VALIDATION.md', 'preview/pip.html', 'preview/fragment.html']) assert(files.includes(file), 'Missing ' + file);
for (const file of files.filter(file => /\.(md|txt|cjs|mjs|html|json)$/.test(file))) {
  const text = fs.readFileSync(path.join(root, file), 'utf8');
  assert(!/[A-Za-z]:[\\/](?:Users|dev)[\\/]/i.test(text), 'Machine-specific path in ' + file);
  if (file.endsWith('.md')) for (const match of text.matchAll(/\[[^\]]*\]\(([^)]+)\)/g)) {
    const link = match[1].split('#')[0];
    if (!link || /^(https?:|mailto:)/.test(link)) continue;
    const target = path.resolve(path.dirname(path.join(root, file)), decodeURIComponent(link));
    assert(target === root || target.startsWith(root + path.sep), 'Link escapes the kit: ' + link);
    assert(fs.existsSync(target) || (target === manifestPath && process.argv.includes('--write-manifest')), `${file}: broken link ${link}`);
  }
}
const assets = JSON.parse(fs.readFileSync(path.join(root, 'assets/animation/assets.json'), 'utf8'));
for (const name of ['idle', 'capture', 'think', 'celebrate', 'rest']) {
  assert.equal(assets[name].anchors.length, 12);
  assert.equal(assets[name].alignment.length, 12);
  assert(assets[name].alignment.flat().every(Number.isFinite));
  const png = fs.readFileSync(path.join(root, 'assets/animation', name + '.png'));
  assert.equal(png.readUInt32BE(16), 1448);
  assert.equal(png.readUInt32BE(20), 1086);
  assert(Buffer.from(assets[name].src.split(',')[1], 'base64').equals(fs.readFileSync(path.join(root, 'assets/animation', name + '.webp'))));
}
const fragment = fs.readFileSync(path.join(root, 'preview/fragment.html'), 'utf8');
assert(Buffer.byteLength(fragment) < 1_000_000);
assert(!fragment.includes('PIP_ANIMATION_ASSETS'));
assert(fs.readFileSync(path.join(root, 'preview/pip.html'), 'utf8').startsWith('<!doctype html>'));
const entries = inventory(files);
if (process.argv.includes('--write-manifest')) {
  fs.writeFileSync(manifestPath, JSON.stringify({ preparedDate: '2026-10-06', files: entries }, null, 2) + '\n');
  console.log(`Wrote ${entries.length} file hashes.`);
} else {
  const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
  assert.deepEqual(entries, manifest.files, 'Kit changed; inspect changes and run the manifest command intentionally.');
  console.log(`PASS: ${entries.length} files, hashes, local document links, sprite metadata and portable paths.`);
}
