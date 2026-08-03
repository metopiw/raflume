import path from 'node:path';
import fs from 'fs-extra';
import chokidar, { type FSWatcher } from 'chokidar';
import { getOrganizableCategory, isCategoryFolder, isProtectedSystemItem, isTransientFile } from '../shared/file-categories';
import type { AppSettings, OperationResult, OrganizableItemKind, WatchLocation, WatchedFile, WatchedPaths } from '../shared/types';
import { createDirectoryMetadata, createFileMetadata } from './file-metadata';
import { FileOrganizer } from './organizer';
import log from './logger';

interface FileWatcherCallbacks {
  onFileDetected: (file: WatchedFile) => void;
  onAutomaticMoveFinished: (result: OperationResult, file: WatchedFile) => void;
}

export class FileWatcher {
  private watcher: FSWatcher | null = null;
  private settings: AppSettings;
  private automaticReadyAt = 0;

  public constructor(
    private readonly watchedPaths: WatchedPaths,
    private readonly additionalDesktopPaths: string[],
    initialSettings: AppSettings,
    private readonly organizer: FileOrganizer,
    private readonly callbacks: FileWatcherCallbacks,
  ) {
    this.settings = initialSettings;
  }

  public async start(): Promise<void> {
    try {
      await this.stop();
      const enabledPaths = this.getEnabledPaths();
      if (enabledPaths.length === 0) {
        log.warn('File watcher not started because all watch locations are disabled');
        return;
      }

      this.watcher = chokidar.watch(enabledPaths, {
        depth: 0,
        ignoreInitial: true,
        persistent: true,
        awaitWriteFinish: {
          stabilityThreshold: 800,
          pollInterval: 150,
        },
        ignored: (candidatePath) => {
          const name = path.basename(candidatePath);
          return name.startsWith('.') || isCategoryFolder(name) || isProtectedSystemItem(name) || isTransientFile(name);
        },
      });

      this.watcher.on('add', (filePath) => {
        void this.handleAddedItem(filePath, 'file');
      });
      this.watcher.on('addDir', (directoryPath) => {
        void this.handleAddedItem(directoryPath, 'directory');
      });
      this.watcher.on('error', (error) => {
        log.error('File watcher emitted an error', error);
      });
      log.info('File watcher started', { paths: enabledPaths });
    } catch (error) {
      log.error('Could not start file watcher', error);
      throw error;
    }
  }

  public async stop(): Promise<void> {
    try {
      if (this.watcher) {
        await this.watcher.close();
        this.watcher = null;
        log.info('File watcher stopped');
      }
    } catch (error) {
      log.error('Could not stop file watcher', error);
      throw error;
    }
  }

  public async updateSettings(settings: AppSettings): Promise<void> {
    try {
      const pathsChanged = settings.watchedLocations.desktop !== this.settings.watchedLocations.desktop
        || settings.watchedLocations.downloads !== this.settings.watchedLocations.downloads;
      const automaticEnabled = !this.settings.automaticMode && settings.automaticMode;
      this.settings = settings;
      if (automaticEnabled) this.automaticReadyAt = Date.now() + 1000;
      if (!settings.automaticMode) this.automaticReadyAt = 0;
      if (pathsChanged) await this.start();
    } catch (error) {
      log.error('Could not update file watcher settings', error);
      throw error;
    }
  }

  public async scanRecentFiles(limit: number): Promise<WatchedFile[]> {
    const files: WatchedFile[] = [];

    try {
      for (const [source, folderPath] of this.getEnabledSourcePaths()) {
        try {
          const entries = await fs.readdir(folderPath, { withFileTypes: true });
          for (const entry of entries) {
            if (entry.name.startsWith('.') || isTransientFile(entry.name) || isProtectedSystemItem(entry.name) || isCategoryFolder(entry.name)) continue;
            if (entry.isFile()) {
              const metadata = await createFileMetadata(path.join(folderPath, entry.name), source);
              if (metadata) files.push(metadata);
            } else if (entry.isDirectory() && this.settings.organizationRules.includeFolders) {
              const metadata = await createDirectoryMetadata(path.join(folderPath, entry.name), source);
              if (metadata) files.push(metadata);
            }
          }
        } catch (error) {
          log.error('Could not scan watched folder', { folderPath, error });
        }
      }

      return files
        .sort((left, right) => right.modifiedAt.localeCompare(left.modifiedAt))
        .slice(0, limit);
    } catch (error) {
      log.error('Could not scan recent files', error);
      return [];
    }
  }

  private async handleAddedItem(itemPath: string, itemKind: OrganizableItemKind): Promise<void> {
    try {
      const source = this.resolveSource(itemPath);
      if (!source || isCategoryFolder(path.basename(itemPath)) || isProtectedSystemItem(path.basename(itemPath))) return;

      if (itemKind === 'directory') {
        if (!this.settings.organizationRules.includeFolders) return;
        const stable = await this.waitForDirectoryStability(itemPath);
        if (!stable) {
          log.warn('New directory was left in place because it did not become stable in time', { itemPath });
          return;
        }
      }

      const metadata = itemKind === 'file'
        ? await createFileMetadata(itemPath, source)
        : await createDirectoryMetadata(itemPath, source);
      if (!metadata) return;

      log.info('New item detected', { itemPath, source, itemKind });
      this.callbacks.onFileDetected(metadata);

      if (!this.settings.automaticMode) return;
      const activationDelay = this.automaticReadyAt - Date.now();
      if (activationDelay > 0) await new Promise<void>((resolve) => setTimeout(resolve, activationDelay));
      if (!this.settings.automaticMode) return;

      const category = getOrganizableCategory(metadata.name, itemKind, this.settings.organizationRules);
      if (category === 'other') {
        this.callbacks.onAutomaticMoveFinished({ success: true, message: 'Item is not enabled or supported.', movedCount: 0, skippedCount: 1 }, metadata);
        return;
      }

      const destinationRoot = this.resolveDestinationRoot(itemPath, source);
      const result = itemKind === 'directory'
        ? await this.organizer.organizeDirectory(itemPath, source, 'automatic', this.settings.organizationRules, undefined, destinationRoot)
        : await this.organizer.organizeFile(itemPath, source, 'automatic', this.settings.organizationRules, undefined, destinationRoot);
      this.callbacks.onAutomaticMoveFinished(result, metadata);
    } catch (error) {
      log.error('Could not process newly added item', { itemPath, itemKind, error });
      this.callbacks.onAutomaticMoveFinished({ success: false, message: 'The detected item could not be processed.' }, {
        id: itemPath,
        path: itemPath,
        name: path.basename(itemPath),
        extension: itemKind === 'file' ? path.extname(itemPath) : '',
        size: 0,
        modifiedAt: new Date().toISOString(),
        discoveredAt: new Date().toISOString(),
        source: this.resolveSource(itemPath) ?? 'downloads',
        category: itemKind === 'directory' ? 'folders' : 'other',
        itemKind,
      });
    }
  }

  private async waitForDirectoryStability(directoryPath: string): Promise<boolean> {
    let previousSignature = '';
    let stableSamples = 0;

    for (let attempt = 0; attempt < 20; attempt += 1) {
      try {
        if (!await fs.pathExists(directoryPath)) return false;
        const signature = await this.buildDirectorySignature(directoryPath);
        if (signature === previousSignature) stableSamples += 1;
        else stableSamples = 0;
        if (stableSamples >= 2) return true;
        previousSignature = signature;
        await new Promise<void>((resolve) => setTimeout(resolve, 750));
      } catch (error) {
        log.warn('Could not sample new directory stability', { directoryPath, error });
        await new Promise<void>((resolve) => setTimeout(resolve, 750));
      }
    }

    return false;
  }

  private async buildDirectorySignature(directoryPath: string): Promise<string> {
    const pending = [directoryPath];
    let itemCount = 0;
    let totalSize = 0;
    let latestModified = 0;

    while (pending.length > 0 && itemCount < 20_000) {
      const current = pending.pop();
      if (!current) continue;
      const entries = await fs.readdir(current, { withFileTypes: true });
      for (const entry of entries) {
        const entryPath = path.join(current, entry.name);
        itemCount += 1;
        if (entry.isDirectory()) {
          pending.push(entryPath);
          continue;
        }
        if (!entry.isFile()) continue;
        const stats = await fs.stat(entryPath);
        totalSize += stats.size;
        latestModified = Math.max(latestModified, stats.mtimeMs);
      }
    }

    return `${itemCount}:${totalSize}:${Math.round(latestModified)}`;
  }

  private getEnabledPaths(): string[] {
    return this.getEnabledSourcePaths().map(([, folderPath]) => folderPath);
  }

  private getEnabledSourcePaths(): Array<[Exclude<WatchLocation, 'clipboard'>, string]> {
    const result: Array<[Exclude<WatchLocation, 'clipboard'>, string]> = [];
    if (this.settings.watchedLocations.desktop) {
      result.push(['desktop', this.watchedPaths.desktop]);
      for (const desktopPath of this.additionalDesktopPaths) result.push(['desktop', desktopPath]);
    }
    if (this.settings.watchedLocations.downloads) result.push(['downloads', this.watchedPaths.downloads]);
    return result;
  }

  private resolveDestinationRoot(itemPath: string, source: Exclude<WatchLocation, 'clipboard'>): string | undefined {
    if (source !== 'desktop') return undefined;
    const parent = path.resolve(path.dirname(itemPath));
    return this.additionalDesktopPaths.some((desktopPath) => parent === path.resolve(desktopPath))
      ? this.watchedPaths.desktop
      : undefined;
  }

  private resolveSource(itemPath: string): Exclude<WatchLocation, 'clipboard'> | null {
    const parent = path.resolve(path.dirname(itemPath));
    if (parent === path.resolve(this.watchedPaths.desktop)) return 'desktop';
    if (this.additionalDesktopPaths.some((desktopPath) => parent === path.resolve(desktopPath))) return 'desktop';
    if (parent === path.resolve(this.watchedPaths.downloads)) return 'downloads';
    return null;
  }
}
