export type AppLanguage = 'tr' | 'en';
export type WatchLocation = 'desktop' | 'downloads' | 'clipboard';
export type FileCategory = 'documents' | 'images' | 'videos' | 'installers' | 'archives' | 'folders' | 'shortcuts' | 'other';
export type OrganizableCategory = Exclude<FileCategory, 'other'>;
export type OrganizableItemKind = 'file' | 'directory';
export type MoveTrigger = 'manual' | 'automatic';
export type MovementStatus = 'pending' | 'completed' | 'undone' | 'failed';
export type NotificationKind = 'success' | 'error' | 'info';
export type AccentTheme = 'violet' | 'ocean' | 'mint' | 'amber' | 'rose' | 'crimson' | 'indigo' | 'mono';
export type ApplicationFont = 'segoe-variable' | 'verdana' | 'tahoma' | 'arial' | 'georgia';
export type DesktopWidgetCorner = 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
export type DesktopWidgetDesign = 'glass' | 'minimal' | 'shelf';
export type DesktopWidgetFont = 'segoe-variable' | 'tahoma' | 'verdana' | 'arial' | 'georgia';

export interface DesktopWidgetSettings {
  enabled: boolean;
  corner: DesktopWidgetCorner;
  width: number;
  height: number;
  opacity: number;
  design: DesktopWidgetDesign;
  colorTheme: AccentTheme;
  font: DesktopWidgetFont;
}

export interface WatchedLocations {
  desktop: boolean;
  downloads: boolean;
}

export interface OrganizationRules {
  scanExistingOnAutomaticEnable: boolean;
  includeFolders: boolean;
  includeShortcuts: boolean;
}

export interface AppSettings {
  language: AppLanguage;
  automaticMode: boolean;
  showNotifications: boolean;
  clipboardImageHistory: boolean;
  launchAtStartup: boolean;
  hotkey: string;
  maxRecentFiles: number;
  watchedLocations: WatchedLocations;
  organizationRules: OrganizationRules;
  accentTheme: AccentTheme;
  interfaceFont: ApplicationFont;
  desktopWidget: DesktopWidgetSettings;
}

export interface WatchedFile {
  id: string;
  path: string;
  name: string;
  extension: string;
  size: number;
  modifiedAt: string;
  discoveredAt: string;
  source: WatchLocation;
  category: FileCategory;
  itemKind: OrganizableItemKind;
}

export interface MovementRecord {
  id: string;
  batchId?: string;
  sourcePath: string;
  targetPath: string;
  fileName: string;
  category: OrganizableCategory;
  itemKind?: OrganizableItemKind;
  movedAt: string;
  status: MovementStatus;
  trigger: MoveTrigger;
  errorMessage?: string;
}

export interface AppStats {
  readyToOrganizeCount: number;
  movesToday: number;
  watchedFolderCount: number;
  recentFileCount: number;
  protectedMoveCount: number;
}

export interface WatchedPaths {
  desktop: string;
  downloads: string;
}

export interface DestinationShelf {
  id: string;
  source: Exclude<WatchLocation, 'clipboard'>;
  category: OrganizableCategory;
  directoryPath: string;
  fileCount: number;
  latestFileName: string | null;
}

export interface OrganizationPreviewItem {
  id: string;
  source: Exclude<WatchLocation, 'clipboard'>;
  sourcePath: string;
  fileName: string;
  category: OrganizableCategory;
  itemKind: OrganizableItemKind;
  destinationDirectory: string;
  proposedTargetPath: string;
  collisionRenamed: boolean;
}

export interface OrganizationPreview {
  generatedAt: string;
  scannedFolderCount: number;
  movableCount: number;
  untouchedCount: number;
  items: OrganizationPreviewItem[];
}

export interface MovedItem {
  recordId: string;
  batchId: string;
  source: Exclude<WatchLocation, 'clipboard'>;
  sourcePath: string;
  targetPath: string;
  fileName: string;
  category: OrganizableCategory;
  itemKind: OrganizableItemKind;
}

export interface ClipboardImageRecord {
  id: string;
  capturedAt: string;
  width: number;
  height: number;
  thumbnailDataUrl: string;
}

export interface AppSnapshot {
  settings: AppSettings;
  recentFiles: WatchedFile[];
  clipboardFile: WatchedFile | null;
  clipboardImages: ClipboardImageRecord[];
  lastDetectedFile: WatchedFile | null;
  history: MovementRecord[];
  destinationShelves: DestinationShelf[];
  stats: AppStats;
  paths: WatchedPaths;
}

export interface OperationResult {
  success: boolean;
  message: string;
  movedCount?: number;
  skippedCount?: number;
  failedCount?: number;
  undoneCount?: number;
  batchId?: string;
  movedItems?: MovedItem[];
}

export interface NotificationPayload {
  id: string;
  kind: NotificationKind;
  title: string;
  message: string;
}

export interface DesktopOrganizerApi {
  getSnapshot: () => Promise<AppSnapshot>;
  updateSettings: (patch: Partial<AppSettings>) => Promise<AppSnapshot>;
  refreshFiles: () => Promise<AppSnapshot>;
  previewOrganization: () => Promise<OrganizationPreview>;
  organizeNow: () => Promise<OperationResult>;
  undoLastMove: () => Promise<OperationResult>;
  openFile: (filePath: string) => Promise<OperationResult>;
  openFolder: (folderPath: string) => Promise<OperationResult>;
  showInFolder: (filePath: string) => Promise<OperationResult>;
  getFileIcon: (filePath: string) => Promise<string | null>;
  minimizeWindow: () => Promise<void>;
  toggleMaximizeWindow: () => Promise<void>;
  closeWindow: () => Promise<void>;
  showMainWindow: () => Promise<void>;
  hideDesktopWidget: () => Promise<void>;
  resizeDesktopWidget: (width: number, height: number) => Promise<void>;
  copyClipboardImage: (imageId: string) => Promise<OperationResult>;
  saveClipboardImage: (imageId: string) => Promise<OperationResult>;
  clearClipboardImages: () => Promise<OperationResult>;
  onSnapshotUpdated: (callback: (snapshot: AppSnapshot) => void) => () => void;
  onNotification: (callback: (notification: NotificationPayload) => void) => () => void;
  onPreviewRequested: (callback: () => void) => () => void;
}
