import assert from 'node:assert/strict';
import test from 'node:test';
import { APPLICATION_FONT_OPTIONS, WIDGET_FONT_OPTIONS } from '../src/renderer/lib/appearance';

test('offers five distinct widget fonts without Bahnschrift or Trebuchet', () => {
  assert.equal(WIDGET_FONT_OPTIONS.length, 5);
  assert.equal(new Set(WIDGET_FONT_OPTIONS.map((option) => option.id)).size, 5);
  assert.deepEqual(WIDGET_FONT_OPTIONS.map((option) => option.id), [
    'segoe-variable',
    'tahoma',
    'verdana',
    'arial',
    'georgia',
  ]);
});

test('keeps one application layout and five readable application fonts', () => {
  assert.deepEqual(APPLICATION_FONT_OPTIONS.map((option) => option.id), [
    'segoe-variable',
    'verdana',
    'tahoma',
    'arial',
    'georgia',
  ]);
});
