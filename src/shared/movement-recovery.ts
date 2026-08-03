import type { MovementStatus } from './types';

export interface PendingRecoveryDecision {
  status: Extract<MovementStatus, 'completed' | 'failed'>;
  message?: string;
}

export function decidePendingRecovery(sourceExists: boolean, targetExists: boolean): PendingRecoveryDecision {
  if (!sourceExists && targetExists) return { status: 'completed' };
  if (sourceExists && !targetExists) {
    return {
      status: 'failed',
      message: 'Recovered safely: the move did not complete and the source file is still in place.',
    };
  }
  if (sourceExists && targetExists) {
    return {
      status: 'failed',
      message: 'Recovery stopped because files exist in both source and destination. Nothing was deleted.',
    };
  }
  return {
    status: 'failed',
    message: 'Recovery could not find the file at either recorded path. Manual review is required.',
  };
}
