import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const styles = readFileSync('src/renderer/styles.css', 'utf8');
const desktopHostSource = readFileSync('scripts/RaflumeDesktopHost.cs', 'utf8');

test('clips the native desktop widget without a black transparent margin', () => {
  assert.match(styles, /\.desktop-widget-root\s*\{[^}]*padding:0;[^}]*overflow:hidden;/s);
  assert.doesNotMatch(styles, /\.desktop-widget-root\s*\{[^}]*padding:(?:5|8|10)px;/s);
  assert.match(desktopHostSource, /CreateRoundRectRgn/);
  assert.match(desktopHostSource, /SetWindowRgn/);
  assert.match(desktopHostSource, /GetDpiForWindow/);
});
