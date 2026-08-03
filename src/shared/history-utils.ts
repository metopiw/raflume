import type { MovementRecord } from './types';

export function movementBatchKey(record: MovementRecord): string {
  return record.batchId ?? record.id;
}

export function getLastUndoableBatch(records: MovementRecord[]): MovementRecord[] {
  const latest = records.find((record) => record.status === 'completed');
  if (!latest) return [];
  const key = movementBatchKey(latest);
  return records
    .filter((record) => record.status === 'completed' && movementBatchKey(record) === key)
    .sort((left, right) => right.movedAt.localeCompare(left.movedAt));
}

export function countCompletedMovements(records: MovementRecord[]): number {
  return records.filter((record) => record.status === 'completed').length;
}
