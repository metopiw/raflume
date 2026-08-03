import type {
  AppSnapshot,
  DesktopOrganizerApi,
  NotificationPayload,
  OperationResult,
  OrganizationPreview,
} from '../shared/types';

const now = new Date();
const iso = (minutesAgo: number): string => new Date(now.getTime() - minutesAgo * 60_000).toISOString();

let snapshot: AppSnapshot = {
  settings: {
    language: 'tr',
    automaticMode: false,
    showNotifications: true,
    clipboardImageHistory: true,
    launchAtStartup: false,
    hotkey: 'CommandOrControl+Shift+O',
    maxRecentFiles: 40,
    watchedLocations: { desktop: true, downloads: true },
    organizationRules: { scanExistingOnAutomaticEnable: true, includeFolders: false, includeShortcuts: false },
    accentTheme: 'violet',
    interfaceFont: 'segoe-variable',
    desktopWidget: { enabled: true, corner: 'top-right', width: 420, height: 560, opacity: 0.74, design: 'glass', colorTheme: 'violet', font: 'segoe-variable' },
  },
  recentFiles: [
    { id: '1', path: 'C:/Users/Demo/Downloads/Tools.json', name: 'Tools.json', extension: '.json', size: 48_900, modifiedAt: iso(60), discoveredAt: iso(60), source: 'downloads', category: 'other', itemKind: 'file' },
    { id: '2', path: 'C:/Users/Demo/Desktop/brief.pdf', name: 'brief.pdf', extension: '.pdf', size: 820_000, modifiedAt: iso(90), discoveredAt: iso(90), source: 'desktop', category: 'documents', itemKind: 'file' },
    { id: '3', path: 'C:/Users/Demo/Downloads/cover.webp', name: 'cover.webp', extension: '.webp', size: 1_420_000, modifiedAt: iso(180), discoveredAt: iso(180), source: 'downloads', category: 'images', itemKind: 'file' },
  ],
  clipboardFile: null,
  clipboardImages: [
    { id: 'clip-1', capturedAt: iso(5), width: 1920, height: 1080, thumbnailDataUrl: 'data:image/svg+xml;charset=utf-8,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%22320%22 height=%22180%22%3E%3Cdefs%3E%3ClinearGradient id=%22g%22 x2=%221%22 y2=%221%22%3E%3Cstop stop-color=%22%23161a25%22/%3E%3Cstop offset=%221%22 stop-color=%22%238b5cf6%22/%3E%3C/linearGradient%3E%3C/defs%3E%3Crect width=%22320%22 height=%22180%22 fill=%22url(%23g)%22/%3E%3Crect x=%2228%22 y=%2230%22 width=%22264%22 height=%22120%22 rx=%2214%22 fill=%22%23090b12%22 opacity=%22.72%22/%3E%3C/svg%3E' },
  ],
  lastDetectedFile: { id: '1', path: 'C:/Users/Demo/Downloads/Tools.json', name: 'Tools.json', extension: '.json', size: 48_900, modifiedAt: iso(60), discoveredAt: iso(60), source: 'downloads', category: 'other', itemKind: 'file' },
  history: [
    { id: 'h1', batchId: 'batch-1', sourcePath: 'C:/Users/Demo/Desktop/contract.pdf', targetPath: 'C:/Users/Demo/Desktop/Belgeler/contract.pdf', fileName: 'contract.pdf', category: 'documents', movedAt: iso(25), status: 'completed', trigger: 'manual' },
    { id: 'h2', batchId: 'batch-1', sourcePath: 'C:/Users/Demo/Downloads/setup.exe', targetPath: 'C:/Users/Demo/Downloads/Kurulum Dosyaları/setup.exe', fileName: 'setup.exe', category: 'installers', movedAt: iso(25), status: 'completed', trigger: 'manual' },
  ],
  destinationShelves: [
    { id: 'desktop:documents', source: 'desktop', category: 'documents', directoryPath: 'C:/Users/Demo/Desktop/Belgeler', fileCount: 18, latestFileName: 'contract.pdf' },
    { id: 'desktop:images', source: 'desktop', category: 'images', directoryPath: 'C:/Users/Demo/Desktop/Görseller', fileCount: 32, latestFileName: 'wallpaper.png' },
    { id: 'desktop:videos', source: 'desktop', category: 'videos', directoryPath: 'C:/Users/Demo/Desktop/Videolar', fileCount: 4, latestFileName: 'demo.mp4' },
    { id: 'downloads:installers', source: 'downloads', category: 'installers', directoryPath: 'C:/Users/Demo/Downloads/Kurulum Dosyaları', fileCount: 11, latestFileName: 'setup.exe' },
    { id: 'downloads:archives', source: 'downloads', category: 'archives', directoryPath: 'C:/Users/Demo/Downloads/Arşivler', fileCount: 23, latestFileName: 'assets.zip' },
    { id: 'downloads:documents', source: 'downloads', category: 'documents', directoryPath: 'C:/Users/Demo/Downloads/Belgeler', fileCount: 7, latestFileName: 'notes.docx' },
    { id: 'downloads:images', source: 'downloads', category: 'images', directoryPath: 'C:/Users/Demo/Downloads/Görseller', fileCount: 9, latestFileName: 'cover.webp' },
    { id: 'downloads:videos', source: 'downloads', category: 'videos', directoryPath: 'C:/Users/Demo/Downloads/Videolar', fileCount: 2, latestFileName: 'clip.mov' },
    { id: 'desktop:installers', source: 'desktop', category: 'installers', directoryPath: 'C:/Users/Demo/Desktop/Kurulum Dosyaları', fileCount: 1, latestFileName: 'tool.msi' },
    { id: 'desktop:archives', source: 'desktop', category: 'archives', directoryPath: 'C:/Users/Demo/Desktop/Arşivler', fileCount: 5, latestFileName: 'backup.7z' },
    { id: 'desktop:folders', source: 'desktop', category: 'folders', directoryPath: 'C:/Users/Demo/Desktop/Klasörler', fileCount: 3, latestFileName: 'Proje' },
    { id: 'desktop:shortcuts', source: 'desktop', category: 'shortcuts', directoryPath: 'C:/Users/Demo/Desktop/Kısayollar', fileCount: 8, latestFileName: 'Tarayıcı.lnk' },
    { id: 'downloads:folders', source: 'downloads', category: 'folders', directoryPath: 'C:/Users/Demo/Downloads/Klasörler', fileCount: 2, latestFileName: 'Kaynaklar' },
    { id: 'downloads:shortcuts', source: 'downloads', category: 'shortcuts', directoryPath: 'C:/Users/Demo/Downloads/Kısayollar', fileCount: 1, latestFileName: 'Site.url' },
  ],
  stats: { readyToOrganizeCount: 4, movesToday: 12, watchedFolderCount: 2, recentFileCount: 3, protectedMoveCount: 129 },
  paths: { desktop: 'C:/Users/Demo/Desktop', downloads: 'C:/Users/Demo/Downloads' },
};

const preview: OrganizationPreview = {
  generatedAt: now.toISOString(),
  scannedFolderCount: 2,
  movableCount: 4,
  untouchedCount: 2,
  items: [
    { id: 'p1', source: 'desktop', sourcePath: 'C:/Users/Demo/Desktop/contract.pdf', fileName: 'contract.pdf', category: 'documents', destinationDirectory: 'C:/Users/Demo/Desktop/Belgeler', proposedTargetPath: 'C:/Users/Demo/Desktop/Belgeler/contract.pdf', collisionRenamed: false, itemKind: 'file' },
    { id: 'p2', source: 'desktop', sourcePath: 'C:/Users/Demo/Desktop/photo.png', fileName: 'photo.png', category: 'images', destinationDirectory: 'C:/Users/Demo/Desktop/Görseller', proposedTargetPath: 'C:/Users/Demo/Desktop/Görseller/photo (1).png', collisionRenamed: true, itemKind: 'file' },
    { id: 'p3', source: 'downloads', sourcePath: 'C:/Users/Demo/Downloads/setup.exe', fileName: 'setup.exe', category: 'installers', destinationDirectory: 'C:/Users/Demo/Downloads/Kurulum Dosyaları', proposedTargetPath: 'C:/Users/Demo/Downloads/Kurulum Dosyaları/setup.exe', collisionRenamed: false, itemKind: 'file' },
    { id: 'p4', source: 'downloads', sourcePath: 'C:/Users/Demo/Downloads/assets.zip', fileName: 'assets.zip', category: 'archives', destinationDirectory: 'C:/Users/Demo/Downloads/Arşivler', proposedTargetPath: 'C:/Users/Demo/Downloads/Arşivler/assets.zip', collisionRenamed: false, itemKind: 'file' },
  ],
};

const snapshotListeners = new Set<(next: AppSnapshot) => void>();
const notificationListeners = new Set<(notification: NotificationPayload) => void>();
const previewListeners = new Set<() => void>();

const api: DesktopOrganizerApi = {
  getSnapshot: async () => snapshot,
  updateSettings: async (patch) => {
    snapshot = {
      ...snapshot,
      settings: {
        ...snapshot.settings,
        ...patch,
        watchedLocations: { ...snapshot.settings.watchedLocations, ...(patch.watchedLocations ?? {}) },
        organizationRules: { ...snapshot.settings.organizationRules, ...(patch.organizationRules ?? {}) },
        desktopWidget: { ...snapshot.settings.desktopWidget, ...(patch.desktopWidget ?? {}) },
      },
    };
    snapshotListeners.forEach((listener) => listener(snapshot));
    return snapshot;
  },
  refreshFiles: async () => snapshot,
  previewOrganization: async () => preview,
  organizeNow: async (): Promise<OperationResult> => ({
    success: true,
    message: '4 dosya taşındı.',
    movedCount: 4,
    skippedCount: 2,
    batchId: 'demo-batch',
    movedItems: preview.items.map((item, index) => ({
      recordId: `demo-${index}`,
      batchId: 'demo-batch',
      source: item.source,
      sourcePath: item.sourcePath,
      targetPath: item.proposedTargetPath,
      fileName: item.fileName,
      category: item.category,
      itemKind: item.itemKind,
    })),
  }),
  undoLastMove: async () => ({ success: true, message: '4 dosya geri döndü.', undoneCount: 4 }),
  openFile: async () => ({ success: true, message: 'Opened.' }),
  openFolder: async () => ({ success: true, message: 'Opened.' }),
  showInFolder: async () => ({ success: true, message: 'Revealed.' }),
  getFileIcon: async () => null,
  minimizeWindow: async () => undefined,
  toggleMaximizeWindow: async () => undefined,
  closeWindow: async () => undefined,
  showMainWindow: async () => undefined,
  hideDesktopWidget: async () => undefined,
  resizeDesktopWidget: async () => undefined,
  copyClipboardImage: async () => ({ success: true, message: 'Copied.' }),
  saveClipboardImage: async () => ({ success: true, message: 'Saved.' }),
  clearClipboardImages: async () => ({ success: true, message: 'Cleared.' }),
  onSnapshotUpdated: (callback) => {
    snapshotListeners.add(callback);
    return () => snapshotListeners.delete(callback);
  },
  onNotification: (callback) => {
    notificationListeners.add(callback);
    return () => notificationListeners.delete(callback);
  },
  onPreviewRequested: (callback) => {
    previewListeners.add(callback);
    return () => previewListeners.delete(callback);
  },
};

window.desktopOrganizer = api;
