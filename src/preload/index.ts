import { contextBridge, ipcRenderer } from 'electron';
import { IPC_CHANNELS } from '../shared/ipc-channels';
import type {
  AppSettings,
  AppSnapshot,
  DesktopOrganizerApi,
  NotificationPayload,
  OperationResult,
  OrganizationPreview,
} from '../shared/types';

const api: DesktopOrganizerApi = {
  getSnapshot: () => ipcRenderer.invoke(IPC_CHANNELS.APP_GET_SNAPSHOT) as Promise<AppSnapshot>,
  updateSettings: (patch: Partial<AppSettings>) => ipcRenderer.invoke(IPC_CHANNELS.SETTINGS_UPDATE, patch) as Promise<AppSnapshot>,
  refreshFiles: () => ipcRenderer.invoke(IPC_CHANNELS.FILES_REFRESH) as Promise<AppSnapshot>,
  previewOrganization: () => ipcRenderer.invoke(IPC_CHANNELS.FILES_PREVIEW_ORGANIZATION) as Promise<OrganizationPreview>,
  organizeNow: () => ipcRenderer.invoke(IPC_CHANNELS.FILES_ORGANIZE_NOW) as Promise<OperationResult>,
  undoLastMove: () => ipcRenderer.invoke(IPC_CHANNELS.HISTORY_UNDO_LAST) as Promise<OperationResult>,
  openFile: (filePath: string) => ipcRenderer.invoke(IPC_CHANNELS.FILES_OPEN, filePath) as Promise<OperationResult>,
  openFolder: (folderPath: string) => ipcRenderer.invoke(IPC_CHANNELS.FILES_OPEN_FOLDER, folderPath) as Promise<OperationResult>,
  showInFolder: (filePath: string) => ipcRenderer.invoke(IPC_CHANNELS.FILES_SHOW_IN_FOLDER, filePath) as Promise<OperationResult>,
  getFileIcon: (filePath: string) => ipcRenderer.invoke(IPC_CHANNELS.FILES_GET_ICON, filePath) as Promise<string | null>,
  minimizeWindow: () => ipcRenderer.invoke(IPC_CHANNELS.WINDOW_MINIMIZE) as Promise<void>,
  toggleMaximizeWindow: () => ipcRenderer.invoke(IPC_CHANNELS.WINDOW_TOGGLE_MAXIMIZE) as Promise<void>,
  closeWindow: () => ipcRenderer.invoke(IPC_CHANNELS.WINDOW_CLOSE) as Promise<void>,
  showMainWindow: () => ipcRenderer.invoke(IPC_CHANNELS.WINDOW_SHOW_MAIN) as Promise<void>,
  hideDesktopWidget: () => ipcRenderer.invoke(IPC_CHANNELS.WIDGET_HIDE) as Promise<void>,
  resizeDesktopWidget: (width: number, height: number) => ipcRenderer.invoke(IPC_CHANNELS.WIDGET_RESIZE, width, height) as Promise<void>,
  copyClipboardImage: (imageId: string) => ipcRenderer.invoke(IPC_CHANNELS.CLIPBOARD_IMAGE_COPY, imageId) as Promise<OperationResult>,
  saveClipboardImage: (imageId: string) => ipcRenderer.invoke(IPC_CHANNELS.CLIPBOARD_IMAGE_SAVE, imageId) as Promise<OperationResult>,
  clearClipboardImages: () => ipcRenderer.invoke(IPC_CHANNELS.CLIPBOARD_IMAGE_CLEAR) as Promise<OperationResult>,
  addExclusionFiles: () => ipcRenderer.invoke(IPC_CHANNELS.EXCLUSIONS_ADD_FILES) as Promise<AppSnapshot>,
  addExclusionFolders: () => ipcRenderer.invoke(IPC_CHANNELS.EXCLUSIONS_ADD_FOLDERS) as Promise<AppSnapshot>,
  removeExclusion: (itemPath: string) => ipcRenderer.invoke(IPC_CHANNELS.EXCLUSIONS_REMOVE, itemPath) as Promise<AppSnapshot>,
  onSnapshotUpdated: (callback: (snapshot: AppSnapshot) => void) => {
    const listener = (_event: Electron.IpcRendererEvent, snapshot: AppSnapshot) => callback(snapshot);
    ipcRenderer.on(IPC_CHANNELS.APP_SNAPSHOT_UPDATED, listener);
    return () => ipcRenderer.removeListener(IPC_CHANNELS.APP_SNAPSHOT_UPDATED, listener);
  },
  onNotification: (callback: (notification: NotificationPayload) => void) => {
    const listener = (_event: Electron.IpcRendererEvent, notification: NotificationPayload) => callback(notification);
    ipcRenderer.on(IPC_CHANNELS.APP_NOTIFICATION, listener);
    return () => ipcRenderer.removeListener(IPC_CHANNELS.APP_NOTIFICATION, listener);
  },
  onPreviewRequested: (callback: () => void) => {
    const listener = () => callback();
    ipcRenderer.on(IPC_CHANNELS.APP_PREVIEW_REQUESTED, listener);
    return () => ipcRenderer.removeListener(IPC_CHANNELS.APP_PREVIEW_REQUESTED, listener);
  },
};

contextBridge.exposeInMainWorld('desktopOrganizer', api);
