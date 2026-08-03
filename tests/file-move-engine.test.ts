import test from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import os from 'node:os';
import fs from 'fs-extra';
import { moveFileCollisionSafe, moveFileToResolvedPath, restoreFileSafely } from '../src/main/file-move-engine';

test('moves files without overwriting a same-name destination', async () => {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), 'archive-move-'));
  try {
    const sourceDirectory = path.join(root, 'source');
    const destinationDirectory = path.join(root, 'destination');
    await fs.ensureDir(sourceDirectory);
    await fs.ensureDir(destinationDirectory);

    const sourcePath = path.join(sourceDirectory, 'report.pdf');
    await fs.writeFile(sourcePath, 'new report', 'utf8');
    await fs.writeFile(path.join(destinationDirectory, 'report.pdf'), 'existing report', 'utf8');

    const targetPath = await moveFileCollisionSafe(sourcePath, destinationDirectory);
    assert.equal(path.basename(targetPath), 'report (1).pdf');
    assert.equal(await fs.pathExists(sourcePath), false);
    assert.equal(await fs.readFile(targetPath, 'utf8'), 'new report');
    assert.equal(await fs.readFile(path.join(destinationDirectory, 'report.pdf'), 'utf8'), 'existing report');
  } finally {
    await fs.remove(root);
  }
});

test('undo refuses to overwrite the original location', async () => {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), 'archive-undo-'));
  try {
    const originalPath = path.join(root, 'original.txt');
    const currentPath = path.join(root, 'moved.txt');
    await fs.writeFile(currentPath, 'moved file', 'utf8');
    await fs.writeFile(originalPath, 'occupying file', 'utf8');

    await assert.rejects(
      restoreFileSafely(currentPath, originalPath),
      /another file exists at the original location/,
    );
    assert.equal(await fs.readFile(currentPath, 'utf8'), 'moved file');
    assert.equal(await fs.readFile(originalPath, 'utf8'), 'occupying file');

    await fs.remove(originalPath);
    await restoreFileSafely(currentPath, originalPath);
    assert.equal(await fs.readFile(originalPath, 'utf8'), 'moved file');
  } finally {
    await fs.remove(root);
  }
});


test('refuses a resolved target that becomes occupied before moving', async () => {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), 'archive-race-'));
  try {
    const sourcePath = path.join(root, 'source.txt');
    const targetPath = path.join(root, 'target.txt');
    await fs.writeFile(sourcePath, 'source', 'utf8');
    await fs.writeFile(targetPath, 'occupied', 'utf8');

    await assert.rejects(moveFileToResolvedPath(sourcePath, targetPath), /became occupied/);
    assert.equal(await fs.readFile(sourcePath, 'utf8'), 'source');
    assert.equal(await fs.readFile(targetPath, 'utf8'), 'occupied');
  } finally {
    await fs.remove(root);
  }
});
