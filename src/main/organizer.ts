import path from 'node:path';
import fs from 'fs-extra';
import { randomUUID } from 'node:crypto';
import { CATEGORY_FOLDER_NAMES, getOrganizableCategory, isCategoryFolder, isProtectedSystemItem } from '../shared/file-categories';
import type {
  MoveTrigger,
  MovedItem,
  MovementRecord,
  OperationResult,
  OrganizableCategory,
  OrganizableItemKind,
  OrganizationPreview,
  OrganizationPreviewItem,
  OrganizationRules,
  WatchLocation,
} from '../shared/types';
import log from './logger';
import { moveFileToResolvedPath, resolveAvailablePath, restoreFileSafely } from './file-move-engine';

export interface OrganizeLocation {
  source: Exclude<WatchLocation, 'clipboard'>;
  path: string;
  destinationRoot?: string;
}

interface OrganizeBatchResult extends OperationResult {
  movedCount: number;
  skippedCount: number;
  failedCount: number;
  movedItems: MovedItem[];
}

export interface MovementHistoryRepository {
  append: (record: MovementRecord) => void;
  updateStatus: (recordId: string, status: MovementRecord['status'], errorMessage?: string) => void;
  getAll: () => MovementRecord[];
  getLastUndoableBatch: () => MovementRecord[];
  markUndone: (recordIds: string[]) => void;
}

interface ResolvedOrganizableItem {
  itemKind: OrganizableItemKind;
  category: OrganizableCategory;
}

export class FileOrganizer {
  public constructor(private readonly historyStore: MovementHistoryRepository) {}

  public async previewFolders(locations: OrganizeLocation[], rules: OrganizationRules): Promise<OrganizationPreview> {
    const items: OrganizationPreviewItem[] = [];
    let untouchedCount = 0;

    try {
      for (const location of locations) {
        try {
          const entries = await fs.readdir(location.path, { withFileTypes: true });
          for (const entry of entries) {
            const resolved = this.resolveEntry(entry.name, entry.isFile(), entry.isDirectory(), rules);
            if (!resolved) {
              untouchedCount += 1;
              continue;
            }

            const sourcePath = path.join(location.path, entry.name);
            const destinationDirectory = path.join(location.destinationRoot ?? location.path, CATEGORY_FOLDER_NAMES[resolved.category]);
            const proposedTargetPath = await resolveAvailablePath(destinationDirectory, entry.name);
            items.push({
              id: randomUUID(),
              source: location.source,
              sourcePath,
              fileName: entry.name,
              category: resolved.category,
              itemKind: resolved.itemKind,
              destinationDirectory,
              proposedTargetPath,
              collisionRenamed: path.basename(proposedTargetPath) !== entry.name,
            });
          }
        } catch (error) {
          log.error('Could not scan folder for organization preview', { location, error });
          untouchedCount += 1;
        }
      }

      return {
        generatedAt: new Date().toISOString(),
        scannedFolderCount: locations.length,
        movableCount: items.length,
        untouchedCount,
        items,
      };
    } catch (error) {
      log.error('Organization preview failed', error);
      throw error;
    }
  }

  public async organizeFolders(locations: OrganizeLocation[], trigger: MoveTrigger, rules: OrganizationRules): Promise<OrganizeBatchResult> {
    const batchId = randomUUID();
    let movedCount = 0;
    let skippedCount = 0;
    let failedCount = 0;
    const movedItems: MovedItem[] = [];

    try {
      for (const location of locations) {
        try {
          const entries = await fs.readdir(location.path, { withFileTypes: true });
          for (const entry of entries) {
            const resolved = this.resolveEntry(entry.name, entry.isFile(), entry.isDirectory(), rules);
            if (!resolved) {
              skippedCount += 1;
              continue;
            }
            const result = await this.organizeItem(
              path.join(location.path, entry.name),
              location.source,
              trigger,
              resolved.itemKind,
              rules,
              batchId,
              location.destinationRoot,
            );
            if (result.success && result.movedCount === 1) {
              movedCount += 1;
              movedItems.push(...(result.movedItems ?? []));
            } else if (!result.success) {
              failedCount += 1;
            } else {
              skippedCount += 1;
            }
          }
        } catch (error) {
          log.error('Could not scan folder for organization', { location, error });
          failedCount += 1;
        }
      }

      return {
        success: failedCount === 0,
        message: failedCount > 0
          ? `${movedCount} item(s) organized, ${failedCount} failed.`
          : movedCount > 0 ? `${movedCount} item(s) organized.` : 'No matching items found.',
        movedCount,
        skippedCount,
        failedCount,
        batchId,
        movedItems,
      };
    } catch (error) {
      log.error('Batch organization failed', error);
      return { success: false, message: 'Organization failed.', movedCount, skippedCount, failedCount: failedCount + 1, batchId, movedItems };
    }
  }

  public async organizeFile(
    filePath: string,
    source: Exclude<WatchLocation, 'clipboard'>,
    trigger: MoveTrigger,
    rules: OrganizationRules,
    requestedBatchId?: string,
    destinationRoot?: string,
  ): Promise<OperationResult> {
    return await this.organizeItem(filePath, source, trigger, 'file', rules, requestedBatchId, destinationRoot);
  }

  public async organizeDirectory(
    directoryPath: string,
    source: Exclude<WatchLocation, 'clipboard'>,
    trigger: MoveTrigger,
    rules: OrganizationRules,
    requestedBatchId?: string,
    destinationRoot?: string,
  ): Promise<OperationResult> {
    return await this.organizeItem(directoryPath, source, trigger, 'directory', rules, requestedBatchId, destinationRoot);
  }

  public async organizeItem(
    itemPath: string,
    source: Exclude<WatchLocation, 'clipboard'>,
    trigger: MoveTrigger,
    itemKind: OrganizableItemKind,
    rules: OrganizationRules,
    requestedBatchId?: string,
    destinationRoot?: string,
  ): Promise<OperationResult> {
    const itemName = path.basename(itemPath);
    const rawCategory = getOrganizableCategory(itemName, itemKind, rules);
    const batchId = requestedBatchId ?? randomUUID();

    if (rawCategory === 'other') {
      return { success: true, message: 'Item category is not enabled or supported.', movedCount: 0, skippedCount: 1, failedCount: 0, batchId, movedItems: [] };
    }
    const category: OrganizableCategory = rawCategory;

    if (isCategoryFolder(path.basename(path.dirname(itemPath))) || isCategoryFolder(itemName)) {
      return { success: true, message: 'Item is already organized or is a protected shelf.', movedCount: 0, skippedCount: 1, failedCount: 0, batchId, movedItems: [] };
    }

    const destinationDirectory = path.join(destinationRoot ?? path.dirname(itemPath), CATEGORY_FOLDER_NAMES[category]);

    try {
      const exists = await fs.pathExists(itemPath);
      if (!exists) return { success: false, message: 'The source item no longer exists.', movedCount: 0, failedCount: 1, batchId, movedItems: [] };

      const stats = await fs.lstat(itemPath);
      if (itemKind === 'file' && !stats.isFile()) {
        return { success: true, message: 'The item is no longer a file.', movedCount: 0, skippedCount: 1, failedCount: 0, batchId, movedItems: [] };
      }
      if (itemKind === 'directory' && !stats.isDirectory()) {
        return { success: true, message: 'The item is no longer a directory.', movedCount: 0, skippedCount: 1, failedCount: 0, batchId, movedItems: [] };
      }

      const targetPath = await resolveAvailablePath(destinationDirectory, itemName);
      const recordId = randomUUID();
      const record: MovementRecord = {
        id: recordId,
        batchId,
        sourcePath: itemPath,
        targetPath,
        fileName: itemName,
        category,
        itemKind,
        movedAt: new Date().toISOString(),
        status: 'pending',
        trigger,
      };
      this.historyStore.append(record);
      await moveFileToResolvedPath(itemPath, targetPath);
      this.historyStore.updateStatus(recordId, 'completed');
      log.info('Item organized', { sourcePath: itemPath, targetPath, trigger, batchId, itemKind, category });
      return {
        success: true,
        message: 'Item organized.',
        movedCount: 1,
        skippedCount: 0,
        failedCount: 0,
        batchId,
        movedItems: [{ recordId, batchId, source, sourcePath: itemPath, targetPath, fileName: itemName, category, itemKind }],
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown item move error';
      const pendingRecord = this.historyStore.getAll().find((record) => record.batchId === batchId && record.sourcePath === itemPath && record.status === 'pending');
      if (pendingRecord) {
        this.historyStore.updateStatus(pendingRecord.id, 'failed', message);
      } else {
        this.historyStore.append({
          id: randomUUID(),
          batchId,
          sourcePath: itemPath,
          targetPath: destinationDirectory,
          fileName: itemName,
          category,
          itemKind,
          movedAt: new Date().toISOString(),
          status: 'failed',
          trigger,
          errorMessage: message,
        });
      }
      log.error('Could not organize item', { itemPath, error, batchId, itemKind, category });
      return { success: false, message: `Item could not be moved: ${message}`, movedCount: 0, failedCount: 1, batchId, movedItems: [] };
    }
  }

  public async undoLastBatch(): Promise<OperationResult> {
    const records = this.historyStore.getLastUndoableBatch();
    if (records.length === 0) return { success: false, message: 'There is no move to undo.' };

    const restoredIds: string[] = [];
    let failedCount = 0;

    for (const record of records) {
      try {
        await restoreFileSafely(record.targetPath, record.sourcePath);
        restoredIds.push(record.id);
        log.info('Item move undone', { batchId: record.batchId, sourcePath: record.targetPath, targetPath: record.sourcePath });
      } catch (error) {
        failedCount += 1;
        log.error('Could not undo item in batch', { recordId: record.id, batchId: record.batchId, error });
      }
    }

    if (restoredIds.length > 0) this.historyStore.markUndone(restoredIds);
    const success = failedCount === 0 && restoredIds.length > 0;
    return {
      success,
      message: success ? 'Last organization batch undone.' : `${restoredIds.length} restored, ${failedCount} failed.`,
      movedCount: restoredIds.length,
      undoneCount: restoredIds.length,
      skippedCount: failedCount,
      failedCount,
      batchId: records[0]?.batchId ?? records[0]?.id,
    };
  }

  private resolveEntry(name: string, isFile: boolean, isDirectory: boolean, rules: OrganizationRules): ResolvedOrganizableItem | null {
    if (isCategoryFolder(name) || isProtectedSystemItem(name)) return null;
    const itemKind: OrganizableItemKind | null = isFile ? 'file' : isDirectory ? 'directory' : null;
    if (!itemKind) return null;
    const category = getOrganizableCategory(name, itemKind, rules);
    if (category === 'other') return null;
    return { itemKind, category };
  }
}
