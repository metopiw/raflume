import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const dashboard = readFileSync('src/renderer/pages/dashboard-page.tsx', 'utf8');
const history = readFileSync('src/renderer/pages/history-page.tsx', 'utf8');
const styles = readFileSync('src/renderer/styles.css', 'utf8');

test('scales dashboard and history typography by twenty percent', () => {
  assert.match(dashboard, /dashboard-page readability-scale-120/);
  assert.match(history, /history-page readability-scale-120/);
  assert.match(styles, /readability-scale-120 \.text-sm \{ font-size: 1\.05rem/);
  assert.match(styles, /dashboard-page\.readability-scale-120 \.dashboard-title/);
  assert.match(styles, /history-page\.readability-scale-120 \.page-title/);
});

test('keeps secondary text opaque and brighter', () => {
  assert.match(styles, /--text-secondary:\s*#c5c8d0/);
  assert.match(styles, /--text-muted:\s*#a3a7b1/);
});
