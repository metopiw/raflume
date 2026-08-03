import test from 'node:test';
import assert from 'node:assert/strict';
import { calculateWidgetPosition } from '../src/shared/widget-position';

const workArea = { x: 100, y: 50, width: 1600, height: 900 };
const size = { width: 420, height: 610 };

test('places desktop widget in every supported corner', () => {
  assert.deepEqual(calculateWidgetPosition(workArea, size, 'top-left'), { x: 122, y: 72 });
  assert.deepEqual(calculateWidgetPosition(workArea, size, 'top-right'), { x: 1258, y: 72 });
  assert.deepEqual(calculateWidgetPosition(workArea, size, 'bottom-left'), { x: 122, y: 318 });
  assert.deepEqual(calculateWidgetPosition(workArea, size, 'bottom-right'), { x: 1258, y: 318 });
});
