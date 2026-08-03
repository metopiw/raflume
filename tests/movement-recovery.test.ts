import test from 'node:test';
import assert from 'node:assert/strict';
import { decidePendingRecovery } from '../src/shared/movement-recovery';

test('marks a pending record completed when only the destination exists', () => {
  assert.deepEqual(decidePendingRecovery(false, true), { status: 'completed' });
});

test('keeps data safe when a pending move did not start', () => {
  const decision = decidePendingRecovery(true, false);
  assert.equal(decision.status, 'failed');
  assert.match(decision.message ?? '', /source file is still in place/);
});

test('never chooses deletion when both paths exist', () => {
  const decision = decidePendingRecovery(true, true);
  assert.equal(decision.status, 'failed');
  assert.match(decision.message ?? '', /Nothing was deleted/);
});
