import test from 'node:test';
import assert from 'node:assert/strict';
import { clampWidgetOpacity, clampWidgetSize } from '../src/shared/widget-size';

test('clamps desktop widget size to usable limits', () => {
  assert.deepEqual(clampWidgetSize(120, 200), { width: 320, height: 380 });
  assert.deepEqual(clampWidgetSize(900, 1200), { width: 760, height: 900 });
  assert.deepEqual(clampWidgetSize(421.6, 559.8), { width: 422, height: 560 });
});

test('clamps widget opacity without hiding content', () => {
  assert.equal(clampWidgetOpacity(.2), .52);
  assert.equal(clampWidgetOpacity(.74), .74);
  assert.equal(clampWidgetOpacity(1), .92);
});
