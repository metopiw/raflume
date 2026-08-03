import test from 'node:test';
import assert from 'node:assert/strict';
import { getLastUndoableBatch, movementBatchKey } from '../src/shared/history-utils';
import type { MovementRecord } from '../src/shared/types';

function record(id: string, batchId: string | undefined, status: MovementRecord['status'], movedAt: string): MovementRecord {
  return {
    id,
    batchId,
    sourcePath: `C:/source/${id}.pdf`,
    targetPath: `C:/target/${id}.pdf`,
    fileName: `${id}.pdf`,
    category: 'documents',
    movedAt,
    status,
    trigger: 'manual',
  };
}

test('uses record id as a backward-compatible batch key', () => {
  const legacy = record('legacy-record', undefined, 'completed', '2026-08-02T10:00:00.000Z');
  assert.equal(movementBatchKey(legacy), 'legacy-record');
});

test('returns every completed record in the newest undoable batch', () => {
  const records = [
    record('new-2', 'new-batch', 'completed', '2026-08-02T12:00:02.000Z'),
    record('new-1', 'new-batch', 'completed', '2026-08-02T12:00:01.000Z'),
    record('new-failed', 'new-batch', 'failed', '2026-08-02T12:00:00.000Z'),
    record('old', 'old-batch', 'completed', '2026-08-01T12:00:00.000Z'),
  ];

  assert.deepEqual(getLastUndoableBatch(records).map((item) => item.id), ['new-2', 'new-1']);
});
