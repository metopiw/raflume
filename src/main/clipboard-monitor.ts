import path from 'node:path';
import fs from 'fs-extra';
import { clipboard, type NativeImage } from 'electron';
import type { WatchedFile } from '../shared/types';
import { pathsEqual } from '../shared/path-utils';
import { createFileMetadata } from './file-metadata';
import log from './logger';

function getClipboardFilePath(): string | null {
  const raw = clipboard.readBuffer('FileNameW').toString('ucs2').replace(/\0/g, '');
  return raw || null;
}

interface ClipboardMonitorCallbacks {
  onFileDetected: (file: WatchedFile) => void;
  onImageDetected: (image: NativeImage) => Promise<void>;
}

export class ClipboardMonitor {
  private timer: NodeJS.Timeout | null = null;
  private lastFilePath: string | null = null;
  private lastImageSignature: string | null = null;

  public constructor(private readonly callbacks: ClipboardMonitorCallbacks) {}

  public start(): void {
    try {
      if (this.timer) return;
      this.timer = setInterval(() => {
        void this.poll();
      }, 1100);
      log.info('Clipboard monitor started');
    } catch (error) {
      log.error('Could not start clipboard monitor', error);
      throw error;
    }
  }

  public stop(): void {
    try {
      if (this.timer) clearInterval(this.timer);
      this.timer = null;
      log.info('Clipboard monitor stopped');
    } catch (error) {
      log.error('Could not stop clipboard monitor', error);
    }
  }

  private async poll(): Promise<void> {
    try {
      await Promise.all([this.pollFilePath(), this.pollImage()]);
    } catch (error) {
      log.debug('Clipboard poll failed', error);
    }
  }

  private async pollFilePath(): Promise<void> {
    try {
      const candidate = getClipboardFilePath();
      if (!candidate || !path.isAbsolute(candidate)) return;
      if (this.lastFilePath && pathsEqual(candidate, this.lastFilePath)) return;
      if (!await fs.pathExists(candidate)) return;

      const metadata = await createFileMetadata(candidate, 'clipboard');
      if (!metadata) return;
      this.lastFilePath = candidate;
      this.callbacks.onFileDetected(metadata);
      log.info('Clipboard file detected', { filePath: candidate });
    } catch (error) {
      log.debug('Clipboard file poll failed', error);
    }
  }

  private async pollImage(): Promise<void> {
    try {
      const image = clipboard.readImage();
      if (image.isEmpty()) return;
      const size = image.getSize();
      const sampleWidth = Math.min(48, size.width);
      const sampleHeight = Math.max(1, Math.round(size.height * (sampleWidth / size.width)));
      const sample = image.resize({ width: sampleWidth, height: sampleHeight, quality: 'good' }).toDataURL();
      const signature = `${size.width}x${size.height}:${sample.slice(-128)}`;
      if (signature === this.lastImageSignature) return;
      this.lastImageSignature = signature;
      await this.callbacks.onImageDetected(image);
    } catch (error) {
      log.debug('Clipboard image poll failed', error);
    }
  }
}
