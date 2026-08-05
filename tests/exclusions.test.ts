import test from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import {
  buildExclusionAdditions,
  isPathExcluded,
  isWatchedRootExcluded,
  normalizeExclusionPath,
  normalizeExclusions,
} from '../src/shared/exclusions';
import type { ExclusionItem } from '../src/shared/types';

const FILE = (p: string): ExclusionItem => ({ path: p, name: path.basename(p), kind: 'file' });
const DIR = (p: string): ExclusionItem => ({ path: p, name: path.basename(p), kind: 'directory' });

test('normalizes separators, trailing slashes, and case on Windows', () => {
  assert.equal(normalizeExclusionPath('C:\\Users\\X\\Desktop\\'), 'c:\\users\\x\\desktop');
  assert.equal(normalizeExclusionPath('C:/Users/X/Desktop/'), 'c:\\users\\x\\desktop');
  assert.equal(normalizeExclusionPath('C:\\Users\\X\\Desktop'), 'c:\\users\\x\\desktop');
  assert.equal(normalizeExclusionPath('c:\\users\\x\\desktop'), 'c:\\users\\x\\desktop');
});

test('excluded files match only their own path', () => {
  const exclusions = [FILE('C:\\Users\\X\\Desktop\\keep.pdf')];
  assert.equal(isPathExcluded('C:\\Users\\X\\Desktop\\keep.pdf', exclusions), true);
  assert.equal(isPathExcluded('C:\\Users\\X\\Desktop\\keep.PDF', exclusions), true);
  assert.equal(isPathExcluded('C:\\Users\\X\\Desktop\\keep.pdf\\extra', exclusions), false);
  assert.equal(isPathExcluded('C:\\Users\\X\\Desktop\\keep2.pdf', exclusions), false);
});

test('excluded directories cover themselves and every subpath', () => {
  const exclusions = [DIR('C:\\Users\\X\\Desktop\\Project')];
  assert.equal(isPathExcluded('C:\\Users\\X\\Desktop\\Project', exclusions), true);
  assert.equal(isPathExcluded('C:\\Users\\X\\Desktop\\Project\\notes.txt', exclusions), true);
  assert.equal(isPathExcluded('C:\\Users\\X\\Desktop\\Project\\sub\\deep\\file.pdf', exclusions), true);
  assert.equal(isPathExcluded('C:\\Users\\X\\Desktop\\Project2\\notes.txt', exclusions), false);
  assert.equal(isPathExcluded('C:\\Users\\X\\Desktop\\Project-2\\notes.txt', exclusions), false);
});

test('does not confuse C:\\test with C:\\test-2', () => {
  const exclusions = [DIR('C:\\test')];
  assert.equal(isPathExcluded('C:\\test\\a.txt', exclusions), true);
  assert.equal(isPathExcluded('C:\\test-2\\a.txt', exclusions), false);
  assert.equal(isPathExcluded('C:\\test2\\a.txt', exclusions), false);
  assert.equal(isPathExcluded('C:\\test\\', exclusions), true);
});

test('buildExclusionAdditions skips duplicates and watched roots', () => {
  const existing = [FILE('C:\\Users\\X\\Desktop\\keep.pdf')];
  const watchedRoots = ['C:\\Users\\X\\Desktop', 'C:\\Users\\X\\Downloads'];

  const added = buildExclusionAdditions(
    ['C:\\Users\\X\\Desktop\\keep.pdf', 'C:\\Users\\X\\Desktop\\keep.pdf', 'C:\\Users\\X\\Desktop\\other.pdf'],
    existing,
    watchedRoots,
    'file',
  );
  assert.equal(added.length, 1);
  assert.equal(added[0]?.path, 'C:\\Users\\X\\Desktop\\other.pdf');
  assert.equal(added[0]?.kind, 'file');
  assert.equal(added[0]?.name, 'other.pdf');

  const roots = buildExclusionAdditions(
    ['C:\\Users\\X\\Desktop', 'C:\\Users\\X\\Downloads', 'C:\\Users\\X\\Desktop\\'],
    [],
    watchedRoots,
    'directory',
  );
  assert.equal(roots.length, 0);

  const folders = buildExclusionAdditions(['C:\\Users\\X\\Desktop\\Project'], [], watchedRoots, 'directory');
  assert.equal(folders.length, 1);
  assert.equal(folders[0]?.kind, 'directory');
});

test('isWatchedRootExcluded matches roots case-insensitively', () => {
  assert.equal(isWatchedRootExcluded('C:\\Users\\X\\Desktop', ['c:\\users\\x\\desktop']), true);
  assert.equal(isWatchedRootExcluded('C:\\Users\\X\\Desktop\\', ['c:\\users\\x\\desktop']), true);
  assert.equal(isWatchedRootExcluded('C:\\Users\\X\\Desktop2', ['c:\\users\\x\\desktop']), false);
});

test('normalizeExclusions tolerates missing or malformed persisted values', () => {
  assert.deepEqual(normalizeExclusions(undefined), []);
  assert.deepEqual(normalizeExclusions(null), []);
  assert.deepEqual(normalizeExclusions('nope'), []);
  assert.deepEqual(normalizeExclusions([42, { path: '' }, null]), []);
  assert.deepEqual(normalizeExclusions([{ path: 'C:\\a\\b.txt' }]), [{ path: 'C:\\a\\b.txt', name: 'b.txt', kind: 'file' }]);
  assert.deepEqual(normalizeExclusions([{ path: 'C:\\a\\dir', kind: 'directory', name: 'dir' }]), [{ path: 'C:\\a\\dir', name: 'dir', kind: 'directory' }]);
});
