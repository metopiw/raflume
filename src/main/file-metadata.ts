import path from 'node:path';
import fs from 'fs-extra';
import { getFileCategory } from '../shared/file-categories';
import type { OrganizableItemKind, WatchLocation, WatchedFile } from '../shared/types';
import log from './logger';

export async function createFileMetadata(filePath: string, source: WatchLocation): Promise<WatchedFile | null> {
  try {
    const stats = await fs.stat(filePath);
    if (!stats.isFile()) return null;
    return createMetadata(filePath, source, 'file', stats.size, stats.mtime);
  } catch (error) {
    log.warn('Could not read file metadata', { filePath, error });
    return null;
  }
}

export async function createDirectoryMetadata(directoryPath: string, source: Exclude<WatchLocation, 'clipboard'>): Promise<WatchedFile | null> {
  try {
    const stats = await fs.stat(directoryPath);
    if (!stats.isDirectory()) return null;
    return createMetadata(directoryPath, source, 'directory', 0, stats.mtime);
  } catch (error) {
    log.warn('Could not read directory metadata', { directoryPath, error });
    return null;
  }
}

function createMetadata(itemPath: string, source: WatchLocation, itemKind: OrganizableItemKind, size: number, modifiedAt: Date): WatchedFile {
  const name = path.basename(itemPath);
  return {
    id: `${source}:${itemPath}`,
    path: itemPath,
    name,
    extension: itemKind === 'file' ? path.extname(name).toLowerCase() : '',
    size,
    modifiedAt: modifiedAt.toISOString(),
    discoveredAt: new Date().toISOString(),
    source,
    category: itemKind === 'directory' ? 'folders' : getFileCategory(name),
    itemKind,
  };
}
