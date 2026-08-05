import { ipcMain } from 'electron';
import fs from 'fs-extra';
import { IPC_CHANNELS } from '../shared/ipc-channels';
import type { AppSettings, OperationResult } from '../shared/types';
import { ApplicationController } from './application-controller';
import log from './logger';

function validateFilePath(value: unknown): string {
  if (typeof value !== 'string' || value.trim().length === 0) throw new Error('A valid file path is required.');
  return value;
}

function validateSettingsPatch(value: unknown): Partial<AppSettings> {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) throw new Error('Invalid settings payload.');
  return value as Partial<AppSettings>;
}

export function registerIpcHandlers(controller: ApplicationController): void {
  ipcMain.handle(IPC_CHANNELS.APP_GET_SNAPSHOT, async () => {
    try {
      return await controller.getSnapshot();
    } catch (error) {
      log.error('IPC get snapshot failed', error);
      throw error;
    }
  });

  ipcMain.handle(IPC_CHANNELS.SETTINGS_UPDATE, async (_event, patch: unknown) => {
    try {
      return await controller.updateSettings(validateSettingsPatch(patch));
    } catch (error) {
      log.error('IPC settings update failed', error);
      throw error;
    }
  });

  ipcMain.handle(IPC_CHANNELS.FILES_REFRESH, async () => {
    try {
      return await controller.refreshAndBroadcast();
    } catch (error) {
      log.error('IPC file refresh failed', error);
      throw error;
    }
  });

  ipcMain.handle(IPC_CHANNELS.FILES_PREVIEW_ORGANIZATION, async () => {
    try {
      return await controller.previewOrganization();
    } catch (error) {
      log.error('IPC organization preview failed', error);
      throw error;
    }
  });

  ipcMain.handle(IPC_CHANNELS.FILES_ORGANIZE_NOW, async () => {
    try {
      return await controller.organizeNow();
    } catch (error) {
      log.error('IPC organize now failed', error);
      return { success: false, message: 'Organization failed.' } satisfies OperationResult;
    }
  });

  ipcMain.handle(IPC_CHANNELS.HISTORY_UNDO_LAST, async () => {
    try {
      return await controller.undoLastMove();
    } catch (error) {
      log.error('IPC undo failed', error);
      return { success: false, message: 'Undo failed.' } satisfies OperationResult;
    }
  });

  ipcMain.handle(IPC_CHANNELS.FILES_OPEN, async (_event, candidate: unknown) => {
    try {
      const filePath = validateFilePath(candidate);
      const errorMessage = await controller.windowManager.openPath(filePath);
      return errorMessage
        ? { success: false, message: errorMessage } satisfies OperationResult
        : { success: true, message: 'File opened.' } satisfies OperationResult;
    } catch (error) {
      log.error('IPC open file failed', error);
      return { success: false, message: 'File could not be opened.' } satisfies OperationResult;
    }
  });

  ipcMain.handle(IPC_CHANNELS.FILES_OPEN_FOLDER, async (_event, candidate: unknown) => {
    try {
      const folderPath = validateFilePath(candidate);
      await fs.ensureDir(folderPath);
      const errorMessage = await controller.windowManager.openPath(folderPath);
      return errorMessage
        ? { success: false, message: errorMessage } satisfies OperationResult
        : { success: true, message: 'Folder opened.' } satisfies OperationResult;
    } catch (error) {
      log.error('IPC open folder failed', error);
      return { success: false, message: 'Folder could not be opened.' } satisfies OperationResult;
    }
  });

  ipcMain.handle(IPC_CHANNELS.FILES_SHOW_IN_FOLDER, async (_event, candidate: unknown) => {
    try {
      controller.windowManager.showItemInFolder(validateFilePath(candidate));
      return { success: true, message: 'File location opened.' } satisfies OperationResult;
    } catch (error) {
      log.error('IPC reveal file failed', error);
      return { success: false, message: 'File location could not be opened.' } satisfies OperationResult;
    }
  });

  ipcMain.handle(IPC_CHANNELS.FILES_GET_ICON, async (_event, candidate: unknown) => {
    try {
      return await controller.windowManager.getFileIconDataUrl(validateFilePath(candidate));
    } catch (error) {
      log.error('IPC get file icon failed', error);
      return null;
    }
  });

  ipcMain.handle(IPC_CHANNELS.WINDOW_MINIMIZE, async () => {
    try {
      controller.windowManager.minimize();
    } catch (error) {
      log.error('IPC minimize failed', error);
      throw error;
    }
  });

  ipcMain.handle(IPC_CHANNELS.WINDOW_TOGGLE_MAXIMIZE, async () => {
    try {
      controller.windowManager.toggleMaximize();
    } catch (error) {
      log.error('IPC maximize toggle failed', error);
      throw error;
    }
  });

  ipcMain.handle(IPC_CHANNELS.WINDOW_CLOSE, async () => {
    try {
      controller.windowManager.close();
    } catch (error) {
      log.error('IPC close failed', error);
      throw error;
    }
  });

  ipcMain.handle(IPC_CHANNELS.WINDOW_SHOW_MAIN, async () => {
    try {
      controller.windowManager.show();
    } catch (error) {
      log.error('IPC show main window failed', error);
      throw error;
    }
  });


  ipcMain.handle(IPC_CHANNELS.WIDGET_RESIZE, async (_event, width: unknown, height: unknown) => {
    try {
      if (typeof width !== 'number' || typeof height !== 'number') throw new Error('Invalid widget size.');
      controller.windowManager.resizeDesktopWidget(width, height);
    } catch (error) {
      log.error('IPC widget resize failed', error);
      throw error;
    }
  });

  ipcMain.handle(IPC_CHANNELS.CLIPBOARD_IMAGE_COPY, async (_event, imageId: unknown) => {
    try {
      if (typeof imageId !== 'string' || imageId.length === 0) throw new Error('Invalid clipboard image id.');
      return await controller.copyClipboardImage(imageId);
    } catch (error) {
      log.error('IPC clipboard image copy failed', error);
      return { success: false, message: 'Clipboard image could not be copied.' } satisfies OperationResult;
    }
  });

  ipcMain.handle(IPC_CHANNELS.CLIPBOARD_IMAGE_SAVE, async (_event, imageId: unknown) => {
    try {
      if (typeof imageId !== 'string' || imageId.length === 0) throw new Error('Invalid clipboard image id.');
      return await controller.saveClipboardImage(imageId);
    } catch (error) {
      log.error('IPC clipboard image save failed', error);
      return { success: false, message: 'Clipboard image could not be saved.' } satisfies OperationResult;
    }
  });


  ipcMain.handle(IPC_CHANNELS.CLIPBOARD_IMAGE_CLEAR, async () => {
    try {
      return await controller.clearClipboardImages();
    } catch (error) {
      log.error('IPC clipboard image clear failed', error);
      return { success: false, message: 'Clipboard image history could not be cleared.' } satisfies OperationResult;
    }
  });

  ipcMain.handle(IPC_CHANNELS.WIDGET_HIDE, async () => {
    try {
      controller.windowManager.hideDesktopWidget();
    } catch (error) {
      log.error('IPC hide desktop widget failed', error);
      throw error;
    }
  });

  ipcMain.handle(IPC_CHANNELS.EXCLUSIONS_ADD_FILES, async () => {
    try {
      return await controller.addExclusionFiles();
    } catch (error) {
      log.error('IPC add exclusion files failed', error);
      throw error;
    }
  });

  ipcMain.handle(IPC_CHANNELS.EXCLUSIONS_ADD_FOLDERS, async () => {
    try {
      return await controller.addExclusionFolders();
    } catch (error) {
      log.error('IPC add exclusion folders failed', error);
      throw error;
    }
  });

  ipcMain.handle(IPC_CHANNELS.EXCLUSIONS_REMOVE, async (_event, candidate: unknown) => {
    try {
      return await controller.removeExclusion(validateFilePath(candidate));
    } catch (error) {
      log.error('IPC remove exclusion failed', error);
      throw error;
    }
  });
}
