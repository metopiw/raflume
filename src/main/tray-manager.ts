import path from 'node:path';
import { app, Menu, nativeImage, Tray } from 'electron';
import { APP_NAME } from '../shared/brand';
import type { AppLanguage } from '../shared/types';
import log from './logger';

interface TrayActions {
  showWindow: () => void;
  organizeNow: () => void;
  toggleAutomaticMode: () => void;
  getAutomaticMode: () => boolean;
  getLanguage: () => AppLanguage;
}

export class TrayManager {
  private tray: Tray | null = null;

  public constructor(private readonly actions: TrayActions) {}

  public create(): void {
    try {
      const iconPath = path.join(app.getAppPath(), 'assets', 'tray-icon.png');
      const icon = nativeImage.createFromPath(iconPath).resize({ width: 18, height: 18 });
      this.tray = new Tray(icon);
      this.tray.setToolTip(`${APP_NAME} — Akıllı Dosya Rafları`);
      this.tray.on('click', this.actions.showWindow);
      this.refreshMenu();
      log.info('Tray created');
    } catch (error) {
      log.error('Could not create tray', error);
      throw error;
    }
  }

  public refreshMenu(): void {
    try {
      if (!this.tray) return;
      const language = this.actions.getLanguage();
      const automatic = this.actions.getAutomaticMode();
      const labels = language === 'tr'
        ? { open: 'Raflume’u aç', organize: 'Düzenlemeyi önizle', auto: 'Otomatik düzenleme', quit: 'Çıkış' }
        : { open: 'Open Raflume', organize: 'Preview organization', auto: 'Automatic organization', quit: 'Quit' };

      this.tray.setContextMenu(Menu.buildFromTemplate([
        { label: labels.open, click: this.actions.showWindow },
        { label: labels.organize, click: this.actions.organizeNow },
        { type: 'separator' },
        { label: labels.auto, type: 'checkbox', checked: automatic, click: this.actions.toggleAutomaticMode },
        { type: 'separator' },
        { label: labels.quit, click: () => app.quit() },
      ]));
    } catch (error) {
      log.error('Could not refresh tray menu', error);
    }
  }

  public destroy(): void {
    try {
      this.tray?.destroy();
      this.tray = null;
    } catch (error) {
      log.error('Could not destroy tray', error);
    }
  }
}
