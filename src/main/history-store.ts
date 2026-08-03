import Store from 'electron-store';
import fs from 'fs-extra';
import { getLastUndoableBatch } from '../shared/history-utils';
import { decidePendingRecovery } from '../shared/movement-recovery';
import type { MovementRecord, MovementStatus } from '../shared/types';
import log from './logger';

interface HistoryState {
  records: MovementRecord[];
}

export class HistoryStore {
  private readonly store = new Store<HistoryState>({
    name: 'movement-history',
    defaults: { records: [] },
  });

  public getAll(): MovementRecord[] {
    return [...this.store.get('records')].sort((left, right) => right.movedAt.localeCompare(left.movedAt));
  }

  public append(record: MovementRecord): void {
    try {
      const records = [record, ...this.getAll()].slice(0, 500);
      this.store.set('records', records);
      log.info('Movement history appended', { id: record.id, batchId: record.batchId, status: record.status, trigger: record.trigger });
    } catch (error) {
      log.error('Could not append movement history', error);
      throw error;
    }
  }

  public updateStatus(recordId: string, status: MovementStatus, errorMessage?: string): void {
    try {
      const records = this.getAll().map((record) => record.id === recordId ? { ...record, status, errorMessage } : record);
      this.store.set('records', records);
      log.info('Movement status updated', { recordId, status });
    } catch (error) {
      log.error('Could not update movement status', { recordId, status, error });
      throw error;
    }
  }

  public getLastUndoableBatch(): MovementRecord[] {
    return getLastUndoableBatch(this.getAll());
  }

  public markUndone(recordIds: string[]): void {
    try {
      const idSet = new Set(recordIds);
      const records = this.getAll().map((record) => idSet.has(record.id) ? { ...record, status: 'undone' as const } : record);
      this.store.set('records', records);
      log.info('Movement batch marked as undone', { recordIds });
    } catch (error) {
      log.error('Could not mark movement batch as undone', error);
      throw error;
    }
  }

  public async recoverPendingRecords(): Promise<void> {
    const pendingRecords = this.getAll().filter((record) => record.status === 'pending');
    if (pendingRecords.length === 0) return;

    for (const record of pendingRecords) {
      try {
        const [sourceExists, targetExists] = await Promise.all([
          fs.pathExists(record.sourcePath),
          fs.pathExists(record.targetPath),
        ]);

        const decision = decidePendingRecovery(sourceExists, targetExists);
        this.updateStatus(record.id, decision.status, decision.message);

        if (decision.status === 'completed') {
          log.warn('Recovered completed move from pending journal', { recordId: record.id });
        } else {
          log.warn('Pending move recovery required a safe stop', { recordId: record.id, sourceExists, targetExists, message: decision.message });
        }
      } catch (error) {
        log.error('Could not reconcile pending movement record', { recordId: record.id, error });
      }
    }
  }
}
