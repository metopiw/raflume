import path from 'node:path';
import fs from 'fs-extra';
import { CATEGORY_FOLDER_NAMES } from '../shared/file-categories';
import type { DestinationShelf, WatchedPaths } from '../shared/types';
import log from './logger';

export async function scanDestinationShelves(watchedPaths: WatchedPaths, additionalDesktopPaths: string[] = []): Promise<DestinationShelf[]> {
  const shelves: DestinationShelf[] = [];
  const roots: Array<{ source: DestinationShelf['source']; primaryPath: string; scanPaths: string[] }> = [
    { source: 'desktop', primaryPath: watchedPaths.desktop, scanPaths: [watchedPaths.desktop, ...additionalDesktopPaths] },
    { source: 'downloads', primaryPath: watchedPaths.downloads, scanPaths: [watchedPaths.downloads] },
  ];

  try {
    for (const root of roots) {
      for (const [category, folderName] of Object.entries(CATEGORY_FOLDER_NAMES) as Array<[DestinationShelf['category'], string]>) {
        let fileCount = 0;
        let latestFileName: string | null = null;
        let latestItemPath: string | null = null;
        let latestModified = 0;

        for (const rootPath of root.scanPaths) {
          const directoryPath = path.join(rootPath, folderName);
          try {
            if (!await fs.pathExists(directoryPath)) continue;
            const entries = await fs.readdir(directoryPath, { withFileTypes: true });
            for (const entry of entries) {
              const matchesShelf = category === 'folders' ? entry.isDirectory() : entry.isFile();
              if (!matchesShelf) continue;
              fileCount += 1;
              try {
                const itemPath = path.join(directoryPath, entry.name);
                const stats = await fs.stat(itemPath);
                if (stats.mtimeMs > latestModified) {
                  latestModified = stats.mtimeMs;
                  latestFileName = entry.name;
                  latestItemPath = itemPath;
                }
              } catch (error) {
                log.warn('Could not stat destination shelf item', { directoryPath, fileName: entry.name, error });
              }
            }
          } catch (error) {
            log.error('Could not scan destination shelf', { directoryPath, error });
          }
        }

        shelves.push({
          id: `${root.source}:${category}`,
          source: root.source,
          category,
          directoryPath: path.join(root.primaryPath, folderName),
          fileCount,
          latestFileName,
          latestItemPath,
        });
      }
    }

    return shelves;
  } catch (error) {
    log.error('Could not build destination overview', error);
    return shelves;
  }
}
