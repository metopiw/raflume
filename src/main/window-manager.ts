import { existsSync } from 'node:fs';
import { execFile } from 'node:child_process';
import path from 'node:path';
import { app, BrowserWindow, screen, shell } from 'electron';
import { APP_NAME } from '../shared/brand';
import { IPC_CHANNELS } from '../shared/ipc-channels';
import type { AppSettings, AppSnapshot, NotificationPayload } from '../shared/types';
import { calculateWidgetPosition } from '../shared/widget-position';
import { clampWidgetSize, WIDGET_SIZE_LIMITS } from '../shared/widget-size';
import log from './logger';

export class WindowManager {
  private window: BrowserWindow | null = null;
  private widgetWindow: BrowserWindow | null = null;
  private widgetCorner: AppSettings['desktopWidget']['corner'] = 'top-right';
  private widgetResizeTimer: NodeJS.Timeout | null = null;
  private widgetRestoreTimer: NodeJS.Timeout | null = null;
  private widgetEnabled = false;
  private widgetDesktopHosted = false;
  private widgetBorderRadius = 24;
  private widgetBoundsChangeHandler: ((width: number, height: number) => void) | null = null;

  public async create(): Promise<BrowserWindow> {
    try {
      if (this.window && !this.window.isDestroyed()) return this.window;

      const preloadPath = path.join(__dirname, '..', 'preload', 'index.cjs');
      const iconPath = path.join(app.getAppPath(), 'assets', process.platform === 'win32' ? 'app-icon.ico' : 'app-icon.png');
      this.window = new BrowserWindow({
        width: 1380,
        height: 900,
        minWidth: 1080,
        minHeight: 700,
        show: false,
        title: APP_NAME,
        icon: iconPath,
        frame: process.platform !== 'win32',
        backgroundColor: '#080a10',
        backgroundMaterial: process.platform === 'win32' ? 'mica' : 'none',
        webPreferences: {
          preload: preloadPath,
          contextIsolation: true,
          nodeIntegration: false,
          sandbox: true,
          spellcheck: false,
        },
      });

      this.secureWindow(this.window);
      this.window.once('ready-to-show', () => this.window?.show());
      this.window.on('closed', () => {
        this.window = null;
      });

      await this.loadRenderer(this.window);
      log.info('Main window created');
      return this.window;
    } catch (error) {
      log.error('Could not create main window', error);
      throw error;
    }
  }

  public async syncDesktopWidget(settings: AppSettings): Promise<void> {
    try {
      this.widgetEnabled = settings.desktopWidget.enabled;
      if (!settings.desktopWidget.enabled) {
        if (this.widgetRestoreTimer) clearTimeout(this.widgetRestoreTimer);
        this.widgetRestoreTimer = null;
        if (this.widgetWindow && !this.widgetWindow.isDestroyed()) this.widgetWindow.hide();
        return;
      }

      if (!this.widgetWindow || this.widgetWindow.isDestroyed()) {
        await this.createDesktopWidget();
      }

      this.widgetCorner = settings.desktopWidget.corner;
      this.widgetBorderRadius = settings.desktopWidget.design === 'minimal' ? 14 : settings.desktopWidget.design === 'shelf' ? 20 : 24;
      this.resizeDesktopWidget(settings.desktopWidget.width, settings.desktopWidget.height, false);
      this.positionDesktopWidget(settings.desktopWidget.corner);
      await this.hostDesktopWidget(true);
      this.widgetWindow?.showInactive();
    } catch (error) {
      log.error('Could not sync desktop widget', error);
      throw error;
    }
  }

  private async createDesktopWidget(): Promise<void> {
    const preloadPath = path.join(__dirname, '..', 'preload', 'index.cjs');
    this.widgetWindow = new BrowserWindow({
      width: 420,
      height: 560,
      minWidth: WIDGET_SIZE_LIMITS.minWidth,
      minHeight: WIDGET_SIZE_LIMITS.minHeight,
      maxWidth: WIDGET_SIZE_LIMITS.maxWidth,
      maxHeight: WIDGET_SIZE_LIMITS.maxHeight,
      show: false,
      frame: false,
      transparent: true,
      backgroundColor: '#00000000',
      backgroundMaterial: process.platform === 'win32' ? 'acrylic' : 'none',
      hasShadow: true,
      resizable: true,
      maximizable: false,
      minimizable: false,
      fullscreenable: false,
      skipTaskbar: true,
      alwaysOnTop: false,
      webPreferences: {
        preload: preloadPath,
        contextIsolation: true,
        nodeIntegration: false,
        sandbox: true,
        spellcheck: false,
      },
    });

    this.secureWindow(this.widgetWindow);
    this.widgetDesktopHosted = false;
    this.widgetWindow.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: false });
    this.widgetWindow.on('minimize', () => this.scheduleWidgetRestore());
    this.widgetWindow.on('resized', () => this.handleWidgetResized());
    this.widgetWindow.on('closed', () => {
      if (this.widgetResizeTimer) clearTimeout(this.widgetResizeTimer);
      if (this.widgetRestoreTimer) clearTimeout(this.widgetRestoreTimer);
      this.widgetResizeTimer = null;
      this.widgetRestoreTimer = null;
      this.widgetDesktopHosted = false;
      this.widgetWindow = null;
    });
    await this.loadRenderer(this.widgetWindow, 'widget');
    log.info('Desktop shelf widget created');
  }

  public setWidgetBoundsChangeHandler(handler: (width: number, height: number) => void): void {
    this.widgetBoundsChangeHandler = handler;
  }

  public resizeDesktopWidget(width: number, height: number, persist = true): void {
    try {
      if (!this.widgetWindow || this.widgetWindow.isDestroyed()) return;
      const { width: nextWidth, height: nextHeight } = clampWidgetSize(width, height);
      const [currentWidth = 420, currentHeight = 560] = this.widgetWindow.getSize();
      if (currentWidth !== nextWidth || currentHeight !== nextHeight) {
        this.widgetWindow.setSize(nextWidth, nextHeight, true);
      }
      this.positionDesktopWidget(this.widgetCorner);
      if (persist) this.widgetBoundsChangeHandler?.(nextWidth, nextHeight);
    } catch (error) {
      log.error('Could not resize desktop widget', { width, height, error });
      throw error;
    }
  }

  private handleWidgetResized(): void {
    try {
      if (!this.widgetWindow || this.widgetWindow.isDestroyed()) return;
      if (this.widgetResizeTimer) clearTimeout(this.widgetResizeTimer);
      this.widgetResizeTimer = setTimeout(() => {
        if (!this.widgetWindow || this.widgetWindow.isDestroyed()) return;
        const [width = 420, height = 560] = this.widgetWindow.getSize();
        this.positionDesktopWidget(this.widgetCorner);
        void this.hostDesktopWidget(true);
        this.widgetBoundsChangeHandler?.(width, height);
      }, 220);
    } catch (error) {
      log.error('Could not persist desktop widget size', error);
    }
  }

  private scheduleWidgetRestore(): void {
    if (!this.widgetEnabled) return;
    if (this.widgetRestoreTimer) clearTimeout(this.widgetRestoreTimer);
    this.widgetRestoreTimer = setTimeout(() => {
      this.widgetRestoreTimer = null;
      if (!this.widgetEnabled || !this.widgetWindow || this.widgetWindow.isDestroyed()) return;
      if (this.widgetWindow.isMinimized()) this.widgetWindow.restore();
      this.positionDesktopWidget(this.widgetCorner);
      this.widgetWindow.showInactive();
    }, 180);
  }

  private async hostDesktopWidget(force = false): Promise<void> {
    if (process.platform !== 'win32' || (!force && this.widgetDesktopHosted) || !this.widgetWindow || this.widgetWindow.isDestroyed()) return;
    const desktopHostPath = app.isPackaged
      ? path.join(process.resourcesPath, 'app.asar.unpacked', 'assets', 'RaflumeDesktopHost.exe')
      : path.join(app.getAppPath(), 'assets', 'RaflumeDesktopHost.exe');
    if (!existsSync(desktopHostPath)) {
      log.warn('Desktop host helper is missing', { desktopHostPath });
      return;
    }

    const nativeHandle = this.widgetWindow.getNativeWindowHandle();
    const handleValue = nativeHandle.length >= 8
      ? nativeHandle.readBigUInt64LE(0)
      : BigInt(nativeHandle.readUInt32LE(0));

    await new Promise<void>((resolve) => {
      execFile(desktopHostPath, [handleValue.toString(), this.widgetBorderRadius.toString()], { windowsHide: true }, (error, stdout, stderr) => {
        if (error) {
          log.error('Could not attach widget to the Windows desktop host', { error, stderr: stderr.trim() });
          resolve();
          return;
        }
        this.widgetDesktopHosted = true;
        log.info('Desktop widget attached to Windows desktop host', { output: stdout.trim() });
        resolve();
      });
    });
  }

  private secureWindow(window: BrowserWindow): void {
    window.webContents.setWindowOpenHandler(() => ({ action: 'deny' }));
    window.webContents.on('will-navigate', (event) => event.preventDefault());
  }

  private async loadRenderer(window: BrowserWindow, surface?: 'widget'): Promise<void> {
    const devServerUrl = process.env.VITE_DEV_SERVER_URL;
    const query = surface ? `?surface=${surface}` : '';
    if (devServerUrl) {
      await window.loadURL(`${devServerUrl}${query}`);
      return;
    }
    await window.loadFile(path.join(app.getAppPath(), 'dist', 'renderer', 'index.html'), {
      query: surface ? { surface } : undefined,
    });
  }

  private positionDesktopWidget(corner: AppSettings['desktopWidget']['corner']): void {
    if (!this.widgetWindow || this.widgetWindow.isDestroyed()) return;
    const display = screen.getPrimaryDisplay();
    const [width = 420, height = 560] = this.widgetWindow.getSize();
    const position = calculateWidgetPosition(display.workArea, { width, height }, corner);
    this.widgetWindow.setPosition(position.x, position.y, false);
  }

  public getWindow(): BrowserWindow | null {
    return this.window;
  }

  public show(): void {
    try {
      if (!this.window || this.window.isDestroyed()) return;
      if (this.window.isMinimized()) this.window.restore();
      this.window.show();
      this.window.focus();
    } catch (error) {
      log.error('Could not show main window', error);
    }
  }

  public hide(): void {
    try {
      this.window?.hide();
    } catch (error) {
      log.error('Could not hide main window', error);
    }
  }

  public hideDesktopWidget(): void {
    try {
      this.widgetWindow?.hide();
    } catch (error) {
      log.error('Could not hide desktop widget', error);
    }
  }

  public minimize(): void {
    try {
      this.window?.minimize();
    } catch (error) {
      log.error('Could not minimize main window', error);
    }
  }

  public toggleMaximize(): void {
    try {
      if (!this.window) return;
      if (this.window.isMaximized()) this.window.unmaximize();
      else this.window.maximize();
    } catch (error) {
      log.error('Could not toggle maximize state', error);
    }
  }

  public close(): void {
    try {
      this.window?.hide();
    } catch (error) {
      log.error('Could not close main window', error);
    }
  }

  public broadcastSnapshot(snapshot: AppSnapshot): void {
    try {
      for (const target of [this.window, this.widgetWindow]) {
        if (target && !target.isDestroyed()) target.webContents.send(IPC_CHANNELS.APP_SNAPSHOT_UPDATED, snapshot);
      }
    } catch (error) {
      log.error('Could not broadcast snapshot', error);
    }
  }

  public requestOrganizationPreview(): void {
    try {
      if (this.window && !this.window.isDestroyed()) {
        this.window.webContents.send(IPC_CHANNELS.APP_PREVIEW_REQUESTED);
      }
    } catch (error) {
      log.error('Could not request organization preview', error);
    }
  }

  public notify(payload: NotificationPayload): void {
    try {
      if (this.window && !this.window.isDestroyed()) {
        this.window.webContents.send(IPC_CHANNELS.APP_NOTIFICATION, payload);
      }
    } catch (error) {
      log.error('Could not send notification to renderer', error);
    }
  }

  public async openPath(filePath: string): Promise<string> {
    try {
      return await shell.openPath(filePath);
    } catch (error) {
      log.error('Could not open path', { filePath, error });
      throw error;
    }
  }

  public async getFileIconDataUrl(filePath: string): Promise<string | null> {
    try {
      const icon = await app.getFileIcon(filePath, { size: 'normal' });
      if (icon.isEmpty()) return null;
      return icon.toDataURL();
    } catch (error) {
      log.error('Could not get file icon', { filePath, error });
      return null;
    }
  }

  public showItemInFolder(filePath: string): void {
    try {
      if (existsSync(filePath)) {
        shell.showItemInFolder(filePath);
        return;
      }
      void shell.openPath(path.dirname(filePath));
    } catch (error) {
      log.error('Could not reveal item in folder', { filePath, error });
      throw error;
    }
  }
}
