import test from 'node:test';
import assert from 'node:assert/strict';
import { groupShelvesBySource } from '../src/shared/shelf-utils';
import type { DestinationShelf } from '../src/shared/types';

const shelves: DestinationShelf[] = [
  { id: 'desktop:documents', source: 'desktop', category: 'documents', directoryPath: 'C:/Desktop/Belgeler', fileCount: 2, latestFileName: 'a.pdf', latestItemPath: 'C:/Desktop/Belgeler/a.pdf' },
  { id: 'downloads:images', source: 'downloads', category: 'images', directoryPath: 'C:/Downloads/Görseller', fileCount: 3, latestFileName: 'b.png', latestItemPath: 'C:/Downloads/Görseller/b.png' },
  { id: 'desktop:archives', source: 'desktop', category: 'archives', directoryPath: 'C:/Desktop/Arşivler', fileCount: 1, latestFileName: 'c.zip', latestItemPath: 'C:/Desktop/Arşivler/c.zip' },
];

test('groups destination shelves without dropping Downloads', () => {
  const grouped = groupShelvesBySource(shelves);
  assert.deepEqual(grouped.desktop.map((shelf) => shelf.id), ['desktop:documents', 'desktop:archives']);
  assert.deepEqual(grouped.downloads.map((shelf) => shelf.id), ['downloads:images']);
});
