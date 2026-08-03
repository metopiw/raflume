import { createHash } from 'node:crypto';
import path from 'node:path';
import { app, clipboard, nativeImage, type NativeImage } from 'electron';
import fs from 'fs-extra';
import type { ClipboardImageRecord, OperationResult } from '../shared/types';
import log from './logger';

interface StoredClipboardImage {
  id: string;
  capturedAt: string;
  width: number;
  height: number;
  fileName: string;
}

const MAX_ITEMS = 12;
const THUMBNAIL_WIDTH = 320;

export class ClipboardImageStore {
  private readonly directoryPath = path.join(app.getPath('userData'), 'clipboard-images');
  private readonly indexPath = path.join(this.directoryPath, 'index.json');
  private records: StoredClipboardImage[] = [];
  private readonly thumbnailCache = new Map<string, string>();

  public async initialize(): Promise<void> {
    try {
      await fs.ensureDir(this.directoryPath);
      if (await fs.pathExists(this.indexPath)) {
        const candidate = await fs.readJson(this.indexPath) as unknown;
        if (Array.isArray(candidate)) {
          this.records = candidate.filter(isStoredClipboardImage).slice(0, MAX_ITEMS);
        }
      }
      await this.removeMissingRecords();
      log.info('Clipboard image history initialized', { count: this.records.length });
    } catch (error) {
      log.error('Could not initialize clipboard image history', error);
      this.records = [];
    }
  }

  public async add(image: NativeImage): Promise<ClipboardImageRecord | null> {
    try {
      if (image.isEmpty()) return null;
      const png = image.toPNG();
      const id = createHash('sha256').update(png).digest('hex').slice(0, 24);
      const existing = this.records.find((record) => record.id === id);
      if (existing) return null;

      const size = image.getSize();
      const fileName = `${id}.png`;
      await fs.writeFile(path.join(this.directoryPath, fileName), png);
      this.records = [{
        id,
        capturedAt: new Date().toISOString(),
        width: size.width,
        height: size.height,
        fileName,
      }, ...this.records].slice(0, MAX_ITEMS);
      await this.cleanupOrphanedFiles();
      await this.persist();
      const newest = this.records[0];
      if (!newest) return null;
      const record = await this.toPublicRecord(newest);
      log.info('Clipboard image captured', { id, width: size.width, height: size.height });
      return record;
    } catch (error) {
      log.error('Could not add clipboard image', error);
      return null;
    }
  }

  public async getAll(): Promise<ClipboardImageRecord[]> {
    try {
      const result: ClipboardImageRecord[] = [];
      for (const record of this.records) {
        const publicRecord = await this.toPublicRecord(record);
        if (publicRecord) result.push(publicRecord);
      }
      return result;
    } catch (error) {
      log.error('Could not read clipboard image history', error);
      return [];
    }
  }


  public async clear(): Promise<OperationResult> {
    try {
      const removedCount = this.records.length;
      this.records = [];
      this.thumbnailCache.clear();
      await this.cleanupOrphanedFiles();
      await this.persist();
      log.info('Clipboard image history cleared', { removedCount });
      return { success: true, message: `${removedCount} clipboard image(s) removed.`, movedCount: removedCount };
    } catch (error) {
      log.error('Could not clear clipboard image history', error);
      return { success: false, message: 'Clipboard image history could not be cleared.' };
    }
  }

  public async copyToClipboard(id: string): Promise<OperationResult> {
    try {
      const filePath = this.resolveFilePath(id);
      if (!filePath) return { success: false, message: 'Clipboard image was not found.' };
      const image = nativeImage.createFromPath(filePath);
      if (image.isEmpty()) return { success: false, message: 'Clipboard image could not be read.' };
      clipboard.writeImage(image);
      log.info('Clipboard image restored to clipboard', { id });
      return { success: true, message: 'Image copied back to the clipboard.' };
    } catch (error) {
      log.error('Could not copy clipboard image', { id, error });
      return { success: false, message: 'Image could not be copied to the clipboard.' };
    }
  }

  public async saveToPictures(id: string): Promise<OperationResult> {
    try {
      const sourcePath = this.resolveFilePath(id);
      const record = this.records.find((item) => item.id === id);
      if (!sourcePath || !record) return { success: false, message: 'Clipboard image was not found.' };
      const destinationDirectory = path.join(app.getPath('pictures'), 'Raflume Captures');
      await fs.ensureDir(destinationDirectory);
      const stamp = record.capturedAt.replace(/[:.]/g, '-');
      const destinationPath = path.join(destinationDirectory, `Raflume-${stamp}.png`);
      await fs.copy(sourcePath, destinationPath, { overwrite: false, errorOnExist: true });
      log.info('Clipboard image saved', { id, destinationPath });
      return { success: true, message: destinationPath };
    } catch (error) {
      log.error('Could not save clipboard image', { id, error });
      return { success: false, message: 'Image could not be saved.' };
    }
  }

  private resolveFilePath(id: string): string | null {
    const record = this.records.find((item) => item.id === id);
    return record ? path.join(this.directoryPath, record.fileName) : null;
  }

  private async toPublicRecord(record: StoredClipboardImage): Promise<ClipboardImageRecord | null> {
    const filePath = path.join(this.directoryPath, record.fileName);
    if (!await fs.pathExists(filePath)) return null;
    let thumbnailDataUrl = this.thumbnailCache.get(record.id);
    if (!thumbnailDataUrl) {
      const image = nativeImage.createFromPath(filePath);
      if (image.isEmpty()) return null;
      const size = image.getSize();
      const width = Math.min(THUMBNAIL_WIDTH, size.width);
      const height = Math.max(1, Math.round(size.height * (width / size.width)));
      thumbnailDataUrl = image.resize({ width, height, quality: 'good' }).toDataURL();
      this.thumbnailCache.set(record.id, thumbnailDataUrl);
    }
    return {
      id: record.id,
      capturedAt: record.capturedAt,
      width: record.width,
      height: record.height,
      thumbnailDataUrl,
    };
  }

  private async persist(): Promise<void> {
    await fs.writeJson(this.indexPath, this.records, { spaces: 2 });
  }

  private async removeMissingRecords(): Promise<void> {
    const existing: StoredClipboardImage[] = [];
    for (const record of this.records) {
      if (await fs.pathExists(path.join(this.directoryPath, record.fileName))) existing.push(record);
    }
    this.records = existing;
    await this.persist();
  }

  private async cleanupOrphanedFiles(): Promise<void> {
    const keep = new Set(this.records.map((record) => record.fileName));
    const entries = await fs.readdir(this.directoryPath);
    for (const entry of entries) {
      if (entry === 'index.json' || keep.has(entry) || !entry.endsWith('.png')) continue;
      await fs.remove(path.join(this.directoryPath, entry));
      this.thumbnailCache.delete(entry.replace(/\.png$/i, ''));
    }
  }
}

function isStoredClipboardImage(value: unknown): value is StoredClipboardImage {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) return false;
  const candidate = value as Record<string, unknown>;
  return typeof candidate.id === 'string'
    && typeof candidate.capturedAt === 'string'
    && typeof candidate.width === 'number'
    && typeof candidate.height === 'number'
    && typeof candidate.fileName === 'string';
}
