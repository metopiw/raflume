import { app, globalShortcut } from 'electron';
import { randomUUID } from 'node:crypto';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { shouldScanExistingItems } from '../shared/organization-settings';
import type {
  AppSettings,
  AppSnapshot,
  NotificationKind,
  OperationResult,
  OrganizationPreview,
  WatchedFile,
  WatchedPaths,
} from '../shared/types';
import { ClipboardMonitor } from './clipboard-monitor';
import { ClipboardImageStore } from './clipboard-image-store';
import { scanDestinationShelves } from './destination-overview';
import { FileWatcher } from './file-watcher';
import { HistoryStore } from './history-store';
import { FileOrganizer, type OrganizeLocation } from './organizer';
import { SettingsStore } from './settings-store';
import { TrayManager } from './tray-manager';
import { WindowManager } from './window-manager';
import log from './logger';

export class ApplicationController {
  public readonly windowManager = new WindowManager();
  private readonly settingsStore = new SettingsStore();
  private readonly historyStore = new HistoryStore();
  private readonly organizer = new FileOrganizer(this.historyStore);
  private readonly clipboardImageStore = new ClipboardImageStore();
  private readonly watchedPaths: WatchedPaths = {
    desktop: app.getPath('desktop'),
    downloads: app.getPath('downloads'),
  };
  private readonly additionalDesktopPaths = resolveAdditionalDesktopPaths(this.watchedPaths.desktop);
  private readonly fileWatcher: FileWatcher;
  private readonly clipboardMonitor: ClipboardMonitor;
  private readonly trayManager: TrayManager;
  private recentFiles: WatchedFile[] = [];
  private clipboardFile: WatchedFile | null = null;
  private lastDetectedFile: WatchedFile | null = null;
  private existingScanTimer: ReturnType<typeof setTimeout> | null = null;

  public constructor() {
    const settings = this.settingsStore.getAll();
    this.fileWatcher = new FileWatcher(this.watchedPaths, this.additionalDesktopPaths, settings, this.organizer, {
      onFileDetected: (file) => {
        this.handleDetectedFile(file);
      },
      onAutomaticMoveFinished: (result, file) => {
        void this.handleAutomaticMoveFinished(result, file);
      },
    });
    this.clipboardMonitor = new ClipboardMonitor({
      onFileDetected: (file) => {
        this.clipboardFile = file;
        this.lastDetectedFile = file;
        this.notify('info', this.localize('Panoda dosya algılandı', 'Clipboard file detected'), file.name);
        void this.refreshAndBroadcast();
      },
      onImageDetected: async (image) => {
        if (!this.settingsStore.getAll().clipboardImageHistory) return;
        const captured = await this.clipboardImageStore.add(image);
        if (captured) await this.refreshAndBroadcast();
      },
    });
    this.windowManager.setWidgetBoundsChangeHandler((width, height) => {
      const current = this.settingsStore.getAll();
      this.settingsStore.update({ desktopWidget: { ...current.desktopWidget, width, height } });
    });
    this.trayManager = new TrayManager({
      showWindow: () => this.windowManager.show(),
      organizeNow: () => { void this.organizeNow(); },
      toggleAutomaticMode: () => { void this.toggleAutomaticMode(); },
      getAutomaticMode: () => this.settingsStore.getAll().automaticMode,
      getLanguage: () => this.settingsStore.getAll().language,
    });
  }

  public async initialize(): Promise<void> {
    try {
      await this.historyStore.recoverPendingRecords();
      await this.clipboardImageStore.initialize();
      await this.windowManager.create();
      await this.windowManager.syncDesktopWidget(this.settingsStore.getAll());
      this.trayManager.create();
      await this.fileWatcher.start();
      this.clipboardMonitor.start();
      await this.registerHotkey(this.settingsStore.getAll().hotkey);
      this.applyLoginItemSetting(this.settingsStore.getAll().launchAtStartup);
      await this.refreshAndBroadcast();
      log.info('Application controller initialized');
    } catch (error) {
      log.error('Could not initialize application controller', error);
      throw error;
    }
  }

  public async dispose(): Promise<void> {
    try {
      globalShortcut.unregisterAll();
      this.cancelExistingItemScan();
      this.clipboardMonitor.stop();
      await this.fileWatcher.stop();
      this.trayManager.destroy();
      log.info('Application controller disposed');
    } catch (error) {
      log.error('Could not dispose application controller', error);
    }
  }

  public async getSnapshot(): Promise<AppSnapshot> {
    try {
      const settings = this.settingsStore.getAll();
      if (this.recentFiles.length === 0) {
        this.recentFiles = await this.fileWatcher.scanRecentFiles(settings.maxRecentFiles);
      }
      return await this.buildSnapshot(settings);
    } catch (error) {
      log.error('Could not build app snapshot', error);
      throw error;
    }
  }

  public async refreshAndBroadcast(): Promise<AppSnapshot> {
    try {
      const settings = this.settingsStore.getAll();
      this.recentFiles = await this.fileWatcher.scanRecentFiles(settings.maxRecentFiles);
      const snapshot = await this.buildSnapshot(settings);
      this.windowManager.broadcastSnapshot(snapshot);
      return snapshot;
    } catch (error) {
      log.error('Could not refresh app snapshot', error);
      throw error;
    }
  }

  public async updateSettings(patch: Partial<AppSettings>): Promise<AppSnapshot> {
    try {
      const previous = this.settingsStore.getAll();
      const next = this.settingsStore.update(patch);
      await this.fileWatcher.updateSettings(next);

      if (previous.hotkey !== next.hotkey) await this.registerHotkey(next.hotkey);
      if (previous.launchAtStartup !== next.launchAtStartup) this.applyLoginItemSetting(next.launchAtStartup);
      await this.windowManager.syncDesktopWidget(next);
      this.trayManager.refreshMenu();

      if (!next.automaticMode) this.cancelExistingItemScan();
      const snapshot = await this.refreshAndBroadcast();

      if (shouldScanExistingItems(previous, next)) {
        this.scheduleExistingItemScan();
        this.notify(
          'info',
          this.localize('Otomatik düzenleme açıldı', 'Automatic organization enabled'),
          this.localize('Mevcut öğeler bir saniye sonra taranacak.', 'Existing items will be scanned in one second.'),
        );
      }

      return snapshot;
    } catch (error) {
      log.error('Could not update application settings', error);
      throw error;
    }
  }

  public async previewOrganization(): Promise<OrganizationPreview> {
    try {
      return await this.organizer.previewFolders(this.getEnabledLocations(), this.settingsStore.getAll().organizationRules);
    } catch (error) {
      log.error('Could not preview organization', error);
      throw error;
    }
  }

  public async organizeNow(): Promise<OperationResult> {
    try {
      const result = await this.organizer.organizeFolders(this.getEnabledLocations(), 'manual', this.settingsStore.getAll().organizationRules);
      this.notify(
        result.success ? 'success' : 'error',
        this.localize('Düzenleme tamamlandı', 'Organization finished'),
        this.localizeResult(result),
      );
      await this.refreshAndBroadcast();
      return { ...result, message: this.localizeResult(result) };
    } catch (error) {
      log.error('Manual organization failed', error);
      const message = this.localize('Düzenleme sırasında beklenmeyen bir hata oluştu.', 'An unexpected error occurred while organizing.');
      this.notify('error', this.localize('Hata', 'Error'), message);
      return { success: false, message };
    }
  }

  public async undoLastMove(): Promise<OperationResult> {
    try {
      const result = await this.organizer.undoLastBatch();
      const message = result.success
        ? this.localize(`${result.undoneCount ?? 0} öğe eski yerine döndü.`, `${result.undoneCount ?? 0} items returned to their original locations.`)
        : this.localizeUndoError(result.message);
      this.notify(result.success ? 'success' : 'error', this.localize('Düzenlemeyi geri al', 'Undo organization'), message);
      await this.refreshAndBroadcast();
      return { ...result, message };
    } catch (error) {
      log.error('Undo operation failed', error);
      const message = this.localize('Geri alma işlemi başarısız.', 'Undo failed.');
      this.notify('error', this.localize('Hata', 'Error'), message);
      return { success: false, message };
    }
  }

  public async copyClipboardImage(imageId: string): Promise<OperationResult> {
    try {
      const result = await this.clipboardImageStore.copyToClipboard(imageId);
      const message = result.success
        ? this.localize('Görsel yeniden panoya kopyalandı.', 'Image copied back to the clipboard.')
        : this.localize('Görsel panoya kopyalanamadı.', 'Image could not be copied to the clipboard.');
      this.notify(result.success ? 'success' : 'error', this.localize('Pano görseli', 'Clipboard image'), message);
      return { ...result, message };
    } catch (error) {
      log.error('Could not restore clipboard image', { imageId, error });
      return { success: false, message: this.localize('Görsel panoya kopyalanamadı.', 'Image could not be copied to the clipboard.') };
    }
  }

  public async clearClipboardImages(): Promise<OperationResult> {
    try {
      const result = await this.clipboardImageStore.clear();
      const message = result.success
        ? this.localize('Pano görsel geçmişi temizlendi.', 'Clipboard image history cleared.')
        : this.localize('Pano görsel geçmişi temizlenemedi.', 'Clipboard image history could not be cleared.');
      this.notify(result.success ? 'success' : 'error', this.localize('Pano görselleri', 'Clipboard images'), message);
      if (result.success) await this.refreshAndBroadcast();
      return { ...result, message };
    } catch (error) {
      log.error('Could not clear clipboard image history', error);
      return { success: false, message: this.localize('Pano görsel geçmişi temizlenemedi.', 'Clipboard image history could not be cleared.') };
    }
  }

  public async saveClipboardImage(imageId: string): Promise<OperationResult> {
    try {
      const result = await this.clipboardImageStore.saveToPictures(imageId);
      const message = result.success
        ? this.localize(`Görsel kaydedildi: ${result.message}`, `Image saved: ${result.message}`)
        : this.localize('Görsel kaydedilemedi.', 'Image could not be saved.');
      this.notify(result.success ? 'success' : 'error', this.localize('Pano görseli', 'Clipboard image'), message);
      return { ...result, message };
    } catch (error) {
      log.error('Could not save clipboard image', { imageId, error });
      return { success: false, message: this.localize('Görsel kaydedilemedi.', 'Image could not be saved.') };
    }
  }

  private scheduleExistingItemScan(): void {
    this.cancelExistingItemScan();
    this.existingScanTimer = setTimeout(() => {
      this.existingScanTimer = null;
      void this.runExistingItemScan();
    }, 1000);
  }

  private cancelExistingItemScan(): void {
    if (!this.existingScanTimer) return;
    clearTimeout(this.existingScanTimer);
    this.existingScanTimer = null;
  }

  private async runExistingItemScan(): Promise<void> {
    try {
      const settings = this.settingsStore.getAll();
      if (!settings.automaticMode || !settings.organizationRules.scanExistingOnAutomaticEnable) return;
      const result = await this.organizer.organizeFolders(this.getEnabledLocations(), 'automatic', settings.organizationRules);
      const message = this.localizeResult(result);
      this.notify(
        result.success ? 'success' : 'error',
        this.localize('Mevcut öğeler tarandı', 'Existing items scanned'),
        message,
      );
      await this.refreshAndBroadcast();
    } catch (error) {
      log.error('Scheduled existing-item scan failed', error);
      this.notify(
        'error',
        this.localize('Mevcut öğe taraması başarısız', 'Existing item scan failed'),
        this.localize('Masaüstü ve İndirilenler taranamadı.', 'Desktop and Downloads could not be scanned.'),
      );
    }
  }

  private getEnabledLocations(): OrganizeLocation[] {
    const settings = this.settingsStore.getAll();
    const locations: OrganizeLocation[] = [];
    if (settings.watchedLocations.desktop) {
      locations.push({ source: 'desktop', path: this.watchedPaths.desktop });
      for (const desktopPath of this.additionalDesktopPaths) locations.push({ source: 'desktop', path: desktopPath, destinationRoot: this.watchedPaths.desktop });
    }
    if (settings.watchedLocations.downloads) locations.push({ source: 'downloads', path: this.watchedPaths.downloads });
    return locations;
  }

  private handleDetectedFile(file: WatchedFile): void {
    this.lastDetectedFile = file;
    this.recentFiles = [file, ...this.recentFiles.filter((item) => item.path !== file.path)]
      .slice(0, this.settingsStore.getAll().maxRecentFiles);
    if (!this.settingsStore.getAll().automaticMode) {
      this.notify('info', this.localize('Yeni öğe algılandı', 'New item detected'), file.name);
    }
    void this.refreshAndBroadcast();
  }

  private async handleAutomaticMoveFinished(result: OperationResult, file: WatchedFile): Promise<void> {
    try {
      if (result.success && (result.movedCount ?? 0) === 1) {
        const moved = result.movedItems?.[0];
        const targetFolder = moved?.targetPath.split(/[\\/]/).slice(0, -1).join('\\') ?? '';
        const message = this.localize(
          `${file.name} güvenli rafa taşındı${targetFolder ? `: ${targetFolder}` : '.'} Geçmişten geri alınabilir.`,
          `${file.name} moved to its safe shelf${targetFolder ? `: ${targetFolder}` : '.'} It can be undone from History.`,
        );
        this.notify('success', this.localize('Otomatik düzenleme tamamlandı', 'Automatic organization completed'), message);
      } else if (result.success) {
        this.notify(
          'info',
          this.localize('Öğe yerinde bırakıldı', 'Item left in place'),
          this.localize(`${file.name} için ilgili kural kapalı, tür desteklenmiyor veya öğe geçici olduğu için taşınmadı.`, `${file.name} was not moved because its rule is disabled, the type is unsupported, or the item is temporary.`),
        );
      } else {
        this.notify('error', this.localize('Otomatik düzenleme başarısız', 'Automatic organization failed'), result.message);
      }
      await this.refreshAndBroadcast();
    } catch (error) {
      log.error('Could not handle automatic move result', error);
    }
  }

  private async toggleAutomaticMode(): Promise<void> {
    try {
      const current = this.settingsStore.getAll();
      await this.updateSettings({ automaticMode: !current.automaticMode });
    } catch (error) {
      log.error('Could not toggle automatic mode from tray', error);
    }
  }

  private async registerHotkey(accelerator: string): Promise<void> {
    try {
      globalShortcut.unregisterAll();
      const registered = globalShortcut.register(accelerator, () => {
        this.windowManager.show();
        this.windowManager.requestOrganizationPreview();
      });
      if (!registered) throw new Error(`Hotkey could not be registered: ${accelerator}`);
      log.info('Global hotkey registered', { accelerator });
    } catch (error) {
      log.error('Could not register global hotkey', error);
      this.notify('error', this.localize('Kısayol kullanılamıyor', 'Hotkey unavailable'), accelerator);
    }
  }

  private applyLoginItemSetting(enabled: boolean): void {
    try {
      if (process.platform !== 'win32') return;
      const isPackagedRuntime = !process.execPath.toLowerCase().endsWith('electron.exe');
      app.setLoginItemSettings({
        openAtLogin: enabled,
        path: process.execPath,
        args: isPackagedRuntime ? [] : [app.getAppPath()],
      });
      log.info('Login item setting updated', { enabled, isPackagedRuntime });
    } catch (error) {
      log.error('Could not update login item setting', error);
    }
  }

  private async buildSnapshot(settings: AppSettings): Promise<AppSnapshot> {
    const history = this.historyStore.getAll();
    const today = new Date().toISOString().slice(0, 10);
    const movesToday = history.filter((record) => record.status !== 'failed' && record.movedAt.startsWith(today)).length;
    const enabledFolderCount = Number(settings.watchedLocations.desktop) + Number(settings.watchedLocations.downloads);
    const destinationShelves = await scanDestinationShelves(this.watchedPaths, this.additionalDesktopPaths);
    const organizationPreview = await this.organizer.previewFolders(this.getEnabledLocations(), settings.organizationRules);
    const clipboardImages = await this.clipboardImageStore.getAll();

    return {
      settings,
      recentFiles: this.recentFiles,
      clipboardFile: this.clipboardFile,
      clipboardImages,
      lastDetectedFile: this.lastDetectedFile ?? this.recentFiles[0] ?? null,
      history,
      destinationShelves,
      stats: {
        readyToOrganizeCount: organizationPreview.movableCount,
        movesToday,
        watchedFolderCount: enabledFolderCount,
        recentFileCount: this.recentFiles.length,
        protectedMoveCount: history.filter((record) => record.status === 'completed').length,
      },
      paths: this.watchedPaths,
    };
  }

  private notify(kind: NotificationKind, title: string, message: string): void {
    if (!this.settingsStore.getAll().showNotifications && kind !== 'error') return;
    this.windowManager.notify({ id: randomUUID(), kind, title, message });
  }

  private localize(turkish: string, english: string): string {
    return this.settingsStore.getAll().language === 'tr' ? turkish : english;
  }

  private localizeResult(result: OperationResult): string {
    const moved = result.movedCount ?? 0;
    const skipped = result.skippedCount ?? 0;
    const failed = result.failedCount ?? 0;
    return this.settingsStore.getAll().language === 'tr'
      ? failed > 0
        ? `${moved} öğe taşındı, ${skipped} öğeye dokunulmadı, ${failed} öğe güvenlik veya erişim hatası nedeniyle taşınamadı.`
        : moved > 0
          ? `${moved} öğe raflarına taşındı; ${skipped} öğeye dokunulmadı.`
          : 'Taşınabilecek veya kurallarda etkinleştirilmiş bir öğe bulunamadı.'
      : failed > 0
        ? `${moved} items moved, ${skipped} were left untouched, and ${failed} could not move because of a safety or access error.`
        : moved > 0
          ? `${moved} items moved to their shelves; ${skipped} items were left untouched.`
          : 'No supported or enabled items were found to move.';
  }

  private localizeUndoError(message: string): string {
    if (this.settingsStore.getAll().language === 'en') return message;
    if (message.includes('There is no move')) return 'Geri alınabilecek bir düzenleme yok.';
    if (message.includes('restored')) return 'Bazı öğeler geri döndü, bazıları güvenlik nedeniyle yerinde bırakıldı.';
    return 'Geri alma güvenlik nedeniyle tamamlanamadı.';
  }
}

function resolveAdditionalDesktopPaths(primaryDesktopPath: string): string[] {
  if (process.platform !== 'win32') return [];
  const publicRoot = process.env.PUBLIC;
  if (!publicRoot) return [];
  const publicDesktop = path.join(publicRoot, 'Desktop');
  if (path.resolve(publicDesktop) === path.resolve(primaryDesktopPath) || !existsSync(publicDesktop)) return [];
  return [publicDesktop];
}
