const test = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');

const manifest = JSON.parse(
  fs.readFileSync(path.join(__dirname, '..', 'manifest.json'), 'utf8')
);

test('manifest is MV3 with only the Meet host permission', () => {
  assert.strictEqual(manifest.manifest_version, 3);
  assert.deepStrictEqual(manifest.host_permissions, ['https://meet.google.com/*']);
  assert.strictEqual(manifest.permissions, undefined);
});

test('page hook runs in the main world at document_start, main frame only', () => {
  const [cs] = manifest.content_scripts;
  assert.strictEqual(manifest.content_scripts.length, 1);
  assert.strictEqual(cs.world, 'MAIN');
  assert.strictEqual(cs.run_at, 'document_start');
  assert.strictEqual(cs.all_frames, false);
  assert.deepStrictEqual(cs.matches, ['https://meet.google.com/*']);
});

test('every listed content script file exists', () => {
  for (const f of manifest.content_scripts.flatMap((c) => c.js)) {
    assert.ok(fs.existsSync(path.join(__dirname, '..', f)), f);
  }
});
