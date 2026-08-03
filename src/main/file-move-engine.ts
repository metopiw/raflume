import path from 'node:path';
import fs from 'fs-extra';
import { buildCollisionName } from '../shared/path-utils';

export async function resolveAvailablePath(directory: string, fileName: string): Promise<string> {
  try {
    const initialPath = path.join(directory, fileName);
    if (!await fs.pathExists(initialPath)) return initialPath;

    for (let index = 1; index < 10_000; index += 1) {
      const candidate = path.join(directory, buildCollisionName(fileName, index));
      if (!await fs.pathExists(candidate)) return candidate;
    }

    throw new Error('Could not find an available destination file name.');
  } catch (error) {
    throw error;
  }
}

export async function moveFileToResolvedPath(sourcePath: string, targetPath: string): Promise<void> {
  if (await fs.pathExists(targetPath)) {
    throw new Error('The planned destination became occupied before the move could start.');
  }
  await fs.ensureDir(path.dirname(targetPath));

  let lastError: unknown;
  for (let attempt = 0; attempt < 4; attempt += 1) {
    try {
      await fs.move(sourcePath, targetPath, { overwrite: false });
      return;
    } catch (error) {
      lastError = error;
      if (!isRetryableMoveError(error) || attempt === 3) break;
      await new Promise<void>((resolve) => setTimeout(resolve, 250 * (attempt + 1)));
    }
  }

  throw lastError instanceof Error ? lastError : new Error('The item could not be moved.');
}

function isRetryableMoveError(error: unknown): boolean {
  if (typeof error !== 'object' || error === null) return false;
  const code = (error as { code?: unknown }).code;
  return code === 'EBUSY' || code === 'EPERM' || code === 'EACCES' || code === 'ENOTEMPTY';
}

export async function moveFileCollisionSafe(sourcePath: string, destinationDirectory: string): Promise<string> {
  try {
    await fs.ensureDir(destinationDirectory);
    const targetPath = await resolveAvailablePath(destinationDirectory, path.basename(sourcePath));
    await moveFileToResolvedPath(sourcePath, targetPath);
    return targetPath;
  } catch (error) {
    throw error;
  }
}

export async function restoreFileSafely(currentPath: string, originalPath: string): Promise<void> {
  try {
    if (!await fs.pathExists(currentPath)) {
      throw new Error('The moved file no longer exists at its destination.');
    }
    if (await fs.pathExists(originalPath)) {
      throw new Error('Undo stopped because another file exists at the original location.');
    }
    await fs.move(currentPath, originalPath, { overwrite: false });
  } catch (error) {
    throw error;
  }
}
