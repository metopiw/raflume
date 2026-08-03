import test from 'node:test';
import assert from 'node:assert/strict';
import { buildCollisionName, pathsEqual } from '../src/shared/path-utils';

test('creates collision-safe names without losing the extension', () => {
  assert.equal(buildCollisionName('report.pdf', 1), 'report (1).pdf');
  assert.equal(buildCollisionName('archive.tar.gz', 12), 'archive.tar (12).gz');
});

test('normalizes equivalent paths', () => {
  assert.equal(pathsEqual('/tmp/folder/../file.txt', '/tmp/file.txt'), true);
});
