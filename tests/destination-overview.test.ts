import test from 'node:test';
import assert from 'node:assert/strict';
import os from 'node:os';
import path from 'node:path';
import fs from 'fs-extra';
import { scanDestinationShelves } from '../src/main/destination-overview';

test('destination shelves expose the full path of their latest item', async () => {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), 'raflume-shelves-'));
  const desktop = path.join(root, 'Desktop');
  const downloads = path.join(root, 'Downloads');
  const images = path.join(downloads, 'Görseller');

  try {
    await fs.ensureDir(desktop);
    await fs.ensureDir(images);
    const olderPath = path.join(images, 'older.png');
    const latestPath = path.join(images, 'latest.png');
    await fs.writeFile(olderPath, 'older', 'utf8');
    await fs.writeFile(latestPath, 'latest', 'utf8');
    await fs.utimes(olderPath, new Date('2025-01-01T00:00:00Z'), new Date('2025-01-01T00:00:00Z'));
    await fs.utimes(latestPath, new Date('2026-01-01T00:00:00Z'), new Date('2026-01-01T00:00:00Z'));

    const shelves = await scanDestinationShelves({ desktop, downloads });
    const imageShelf = shelves.find((shelf) => shelf.id === 'downloads:images');

    assert.equal(imageShelf?.fileCount, 2);
    assert.equal(imageShelf?.latestFileName, 'latest.png');
    assert.equal(imageShelf?.latestItemPath, latestPath);
  } finally {
    await fs.remove(root);
  }
});
