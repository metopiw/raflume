import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const styles = readFileSync('src/renderer/styles.css', 'utf8');

test('keeps theme atmosphere visible without tinting neutral text', () => {
  assert.match(styles, /--text-primary:\s*#f5f5f7/);
  assert.match(styles, /--text-secondary:\s*#c5c8d0/);
  assert.match(styles, /\.text-zinc-400\s*\{\s*color:\s*var\(--text-secondary\)\s*!important;/);
  assert.match(styles, /\.glass-sidebar\s*\{[\s\S]*var\(--accent-deep\)/);
  assert.match(styles, /\.app-ambient\s*\{\s*opacity:\s*\.42;[\s\S]*var\(--accent-glow\)/);
});
