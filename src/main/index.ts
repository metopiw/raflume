import path from 'node:path';
import { app, dialog } from 'electron';
import { APP_ID, APP_NAME } from '../shared/brand';
import { ApplicationController } from './application-controller';
import { registerIpcHandlers } from './ipc-handlers';
import log from './logger';

const legacyUserDataPath = path.join(app.getPath('appData'), 'desktop-organizer');
app.setPath('userData', legacyUserDataPath);
app.setName(APP_NAME);
if (process.platform === 'win32') app.setAppUserModelId(APP_ID);

const hasSingleInstanceLock = app.requestSingleInstanceLock();
let controller: ApplicationController | null = null;

if (!hasSingleInstanceLock) {
  app.quit();
} else {
  app.on('second-instance', () => {
    controller?.windowManager.show();
  });

  app.whenReady().then(async () => {
    try {
      controller = new ApplicationController();
      registerIpcHandlers(controller);
      await controller.initialize();
    } catch (error) {
      log.error('Application startup failed', error);
      dialog.showErrorBox(APP_NAME, 'Uygulama başlatılamadı. Ayrıntılar uygulama log dosyasına yazıldı.');
      app.quit();
    }
  }).catch((error: unknown) => {
    log.error('app.whenReady failed', error);
    app.quit();
  });

  app.on('activate', () => {
    controller?.windowManager.show();
  });

  app.on('before-quit', () => {
    if (controller) void controller.dispose();
  });

  app.on('window-all-closed', () => {
    // Windows tray applications intentionally stay alive after the window is hidden.
    if (process.platform === 'darwin') app.quit();
  });
}
