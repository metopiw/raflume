import test from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import os from 'node:os';
import fs from 'fs-extra';
import type { MovementRecord, OrganizationRules } from '../src/shared/types';
import { getLastUndoableBatch } from '../src/shared/history-utils';
import { FileOrganizer, type MovementHistoryRepository } from '../src/main/organizer';

class MemoryHistory implements MovementHistoryRepository {
  public records: MovementRecord[] = [];

  public append(record: MovementRecord): void {
    this.records = [record, ...this.records];
  }

  public updateStatus(recordId: string, status: MovementRecord['status'], errorMessage?: string): void {
    this.records = this.records.map((record) => record.id === recordId ? { ...record, status, errorMessage } : record);
  }

  public getAll(): MovementRecord[] {
    return [...this.records].sort((left, right) => right.movedAt.localeCompare(left.movedAt));
  }

  public getLastUndoableBatch(): MovementRecord[] {
    return getLastUndoableBatch(this.getAll());
  }

  public markUndone(recordIds: string[]): void {
    const ids = new Set(recordIds);
    this.records = this.records.map((record) => ids.has(record.id) ? { ...record, status: 'undone' } : record);
  }
}

const FILE_ONLY_RULES: OrganizationRules = { scanExistingOnAutomaticEnable: true, includeFolders: false, includeShortcuts: false };

test('previews, organizes, journals, and batch-undoes real files', async () => {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), 'archive-organizer-'));
  try {
    await fs.writeFile(path.join(root, 'brief.pdf'), 'pdf', 'utf8');
    await fs.writeFile(path.join(root, 'photo.png'), 'png', 'utf8');
    await fs.writeFile(path.join(root, 'unknown.json'), '{}', 'utf8');
    await fs.ensureDir(path.join(root, 'Belgeler'));
    await fs.writeFile(path.join(root, 'Belgeler', 'brief.pdf'), 'existing', 'utf8');

    const history = new MemoryHistory();
    const organizer = new FileOrganizer(history);
    const locations = [{ source: 'desktop' as const, path: root }];

    const preview = await organizer.previewFolders(locations, FILE_ONLY_RULES);
    assert.equal(preview.movableCount, 2);
    assert.equal(preview.untouchedCount, 2);
    assert.equal(preview.items.find((item) => item.fileName === 'brief.pdf')?.collisionRenamed, true);

    const result = await organizer.organizeFolders(locations, 'manual', FILE_ONLY_RULES);
    assert.equal(result.success, true);
    assert.equal(result.movedCount, 2);
    assert.equal(result.failedCount, 0);
    assert.equal(result.movedItems.length, 2);
    assert.equal(new Set(result.movedItems.map((item) => item.batchId)).size, 1);
    assert.equal(history.records.filter((record) => record.status === 'completed').length, 2);
    assert.equal(await fs.pathExists(path.join(root, 'brief.pdf')), false);
    assert.equal(await fs.pathExists(path.join(root, 'Belgeler', 'brief (1).pdf')), true);
    assert.equal(await fs.pathExists(path.join(root, 'Görseller', 'photo.png')), true);
    assert.equal(await fs.pathExists(path.join(root, 'unknown.json')), true);

    const undo = await organizer.undoLastBatch();
    assert.equal(undo.success, true);
    assert.equal(undo.undoneCount, 2);
    assert.equal(await fs.pathExists(path.join(root, 'brief.pdf')), true);
    assert.equal(await fs.pathExists(path.join(root, 'photo.png')), true);
    assert.equal(await fs.pathExists(path.join(root, 'Belgeler', 'brief.pdf')), true);
    assert.equal(await fs.pathExists(path.join(root, 'Belgeler', 'brief (1).pdf')), false);
  } finally {
    await fs.remove(root);
  }
});

test('organizes shortcuts and folders only when their rules are enabled', async () => {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), 'raflume-rules-'));
  try {
    await fs.writeFile(path.join(root, 'Browser.lnk'), 'shortcut', 'utf8');
    await fs.ensureDir(path.join(root, 'Project Notes'));
    await fs.writeFile(path.join(root, 'Project Notes', 'note.txt'), 'inside folder', 'utf8');
    await fs.ensureDir(path.join(root, 'Belgeler'));

    const history = new MemoryHistory();
    const organizer = new FileOrganizer(history);
    const locations = [{ source: 'desktop' as const, path: root }];

    const disabledPreview = await organizer.previewFolders(locations, FILE_ONLY_RULES);
    assert.equal(disabledPreview.movableCount, 0);

    const enabledRules: OrganizationRules = {
      scanExistingOnAutomaticEnable: true,
      includeFolders: true,
      includeShortcuts: true,
    };
    const preview = await organizer.previewFolders(locations, enabledRules);
    assert.equal(preview.movableCount, 2);
    assert.equal(preview.items.find((item) => item.fileName === 'Browser.lnk')?.category, 'shortcuts');
    assert.equal(preview.items.find((item) => item.fileName === 'Project Notes')?.category, 'folders');
    assert.equal(preview.items.find((item) => item.fileName === 'Project Notes')?.itemKind, 'directory');

    const result = await organizer.organizeFolders(locations, 'automatic', enabledRules);
    assert.equal(result.success, true);
    assert.equal(result.movedCount, 2);
    assert.equal(await fs.pathExists(path.join(root, 'Kısayollar', 'Browser.lnk')), true);
    assert.equal(await fs.pathExists(path.join(root, 'Klasörler', 'Project Notes', 'note.txt')), true);
    assert.equal(await fs.pathExists(path.join(root, 'Belgeler')), true);

    const undo = await organizer.undoLastBatch();
    assert.equal(undo.success, true);
    assert.equal(undo.undoneCount, 2);
    assert.equal(await fs.pathExists(path.join(root, 'Browser.lnk')), true);
    assert.equal(await fs.pathExists(path.join(root, 'Project Notes', 'note.txt')), true);
  } finally {
    await fs.remove(root);
  }
});

test('moves shared-desktop items into the primary desktop shelves', async () => {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), 'raflume-shared-desktop-'));
  const primaryDesktop = path.join(root, 'UserDesktop');
  const sharedDesktop = path.join(root, 'PublicDesktop');

  try {
    await fs.ensureDir(primaryDesktop);
    await fs.ensureDir(sharedDesktop);
    await fs.writeFile(path.join(sharedDesktop, 'HLDS.lnk'), 'shortcut', 'utf8');

    const history = new MemoryHistory();
    const organizer = new FileOrganizer(history);
    const rules: OrganizationRules = {
      scanExistingOnAutomaticEnable: true,
      includeFolders: true,
      includeShortcuts: true,
    };
    const locations = [{ source: 'desktop' as const, path: sharedDesktop, destinationRoot: primaryDesktop }];

    const preview = await organizer.previewFolders(locations, rules);
    assert.equal(preview.movableCount, 1);
    assert.equal(preview.items[0]?.destinationDirectory, path.join(primaryDesktop, 'Kısayollar'));

    const result = await organizer.organizeFolders(locations, 'automatic', rules);
    assert.equal(result.success, true);
    assert.equal(result.movedCount, 1);
    assert.equal(await fs.pathExists(path.join(sharedDesktop, 'HLDS.lnk')), false);
    assert.equal(await fs.pathExists(path.join(primaryDesktop, 'Kısayollar', 'HLDS.lnk')), true);

    const undo = await organizer.undoLastBatch();
    assert.equal(undo.success, true);
    assert.equal(await fs.pathExists(path.join(sharedDesktop, 'HLDS.lnk')), true);
  } finally {
    await fs.remove(root);
  }
});

test('excluded files, shortcuts, and folders are skipped in preview and organization', async () => {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), 'raflume-exclusions-'));
  try {
    await fs.writeFile(path.join(root, 'keep.pdf'), 'pdf', 'utf8');
    await fs.writeFile(path.join(root, 'move.pdf'), 'pdf', 'utf8');
    await fs.writeFile(path.join(root, 'Browser.lnk'), 'shortcut', 'utf8');
    await fs.ensureDir(path.join(root, 'Project'));
    await fs.writeFile(path.join(root, 'Project', 'note.txt'), 'inside', 'utf8');
    await fs.ensureDir(path.join(root, 'Belgeler'));

    const history = new MemoryHistory();
    const organizer = new FileOrganizer(history);
    const rules: OrganizationRules = {
      scanExistingOnAutomaticEnable: true,
      includeFolders: true,
      includeShortcuts: true,
    };
    const locations = [{ source: 'desktop' as const, path: root }];
    const exclusions = [
      { path: path.join(root, 'keep.pdf'), name: 'keep.pdf', kind: 'file' as const },
      { path: path.join(root, 'Browser.lnk'), name: 'Browser.lnk', kind: 'file' as const },
      { path: path.join(root, 'Project'), name: 'Project', kind: 'directory' as const },
    ];

    const preview = await organizer.previewFolders(locations, rules, exclusions);
    assert.equal(preview.movableCount, 1);
    assert.equal(preview.items[0]?.fileName, 'move.pdf');
    assert.equal(preview.items.some((item) => item.fileName === 'keep.pdf'), false);
    assert.equal(preview.items.some((item) => item.fileName === 'Browser.lnk'), false);
    assert.equal(preview.items.some((item) => item.fileName === 'Project'), false);

    const result = await organizer.organizeFolders(locations, 'manual', rules, exclusions);
    assert.equal(result.success, true);
    assert.equal(result.movedCount, 1);
    assert.equal(await fs.pathExists(path.join(root, 'move.pdf')), false);
    assert.equal(await fs.pathExists(path.join(root, 'Belgeler', 'move.pdf')), true);
    assert.equal(await fs.pathExists(path.join(root, 'keep.pdf')), true);
    assert.equal(await fs.pathExists(path.join(root, 'Browser.lnk')), true);
    assert.equal(await fs.pathExists(path.join(root, 'Project', 'note.txt')), true);
    assert.equal(history.records.filter((record) => record.status === 'completed').length, 1);
  } finally {
    await fs.remove(root);
  }
});

test('excluded items are skipped even when triggered directly', async () => {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), 'raflume-exclusion-direct-'));
  try {
    await fs.writeFile(path.join(root, 'keep.pdf'), 'pdf', 'utf8');

    const history = new MemoryHistory();
    const organizer = new FileOrganizer(history);
    const rules: OrganizationRules = {
      scanExistingOnAutomaticEnable: true,
      includeFolders: false,
      includeShortcuts: false,
    };
    const exclusions = [{ path: path.join(root, 'keep.pdf'), name: 'keep.pdf', kind: 'file' as const }];

    const result = await organizer.organizeFile(path.join(root, 'keep.pdf'), 'desktop', 'automatic', rules, undefined, undefined, exclusions);
    assert.equal(result.success, true);
    assert.equal(result.movedCount, 0);
    assert.equal(result.skippedCount, 1);
    assert.equal(await fs.pathExists(path.join(root, 'keep.pdf')), true);
    assert.equal(history.records.length, 0);
  } finally {
    await fs.remove(root);
  }
});
