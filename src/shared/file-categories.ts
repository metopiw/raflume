import path from 'node:path';
import type { FileCategory, OrganizableCategory, OrganizableItemKind, OrganizationRules } from './types';

const CATEGORY_EXTENSIONS: Readonly<Record<Exclude<OrganizableCategory, 'folders' | 'shortcuts'>, ReadonlySet<string>>> = {
  documents: new Set(['.pdf', '.doc', '.docx', '.xls', '.xlsx', '.ppt', '.pptx', '.txt', '.md', '.rtf', '.csv', '.odt', '.ods', '.odp']),
  images: new Set(['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg', '.bmp', '.tif', '.tiff', '.heic', '.ico']),
  videos: new Set(['.mp4', '.mkv', '.avi', '.mov', '.wmv', '.webm', '.m4v', '.mpg', '.mpeg']),
  installers: new Set(['.exe', '.msi', '.msix', '.appx', '.appxbundle', '.bat', '.cmd', '.ps1']),
  archives: new Set(['.zip', '.rar', '.7z', '.tar', '.gz', '.bz2', '.xz', '.tgz']),
};

const SHORTCUT_EXTENSIONS = new Set(['.lnk', '.url', '.website', '.pif', '.scf', '.appref-ms']);

export const CATEGORY_FOLDER_NAMES: Readonly<Record<OrganizableCategory, string>> = {
  documents: 'Belgeler',
  images: 'Görseller',
  videos: 'Videolar',
  installers: 'Kurulum Dosyaları',
  archives: 'Arşivler',
  folders: 'Klasörler',
  shortcuts: 'Kısayollar',
};

const TRANSIENT_EXTENSIONS = new Set(['.crdownload', '.part', '.download', '.tmp']);
const PROTECTED_SYSTEM_ITEMS = new Set(['desktop.ini', 'thumbs.db', 'ehthumbs.db', '$recycle.bin']);

export function getFileCategory(fileName: string): FileCategory {
  const extension = path.extname(fileName).toLowerCase();
  if (SHORTCUT_EXTENSIONS.has(extension)) return 'shortcuts';
  for (const [category, extensions] of Object.entries(CATEGORY_EXTENSIONS) as Array<[Exclude<OrganizableCategory, 'folders' | 'shortcuts'>, ReadonlySet<string>]>) {
    if (extensions.has(extension)) return category;
  }
  return 'other';
}

export function getOrganizableCategory(name: string, itemKind: OrganizableItemKind, rules: OrganizationRules): FileCategory {
  if (itemKind === 'directory') return rules.includeFolders ? 'folders' : 'other';
  const category = getFileCategory(name);
  if (category === 'shortcuts' && !rules.includeShortcuts) return 'other';
  return category;
}

export function isProtectedSystemItem(fileName: string): boolean {
  return PROTECTED_SYSTEM_ITEMS.has(fileName.toLocaleLowerCase('en-US'));
}

export function isTransientFile(fileName: string): boolean {
  return TRANSIENT_EXTENSIONS.has(path.extname(fileName).toLowerCase());
}

export function isOrganizableFile(fileName: string, includeShortcuts = true): boolean {
  if (isTransientFile(fileName)) return false;
  const category = getFileCategory(fileName);
  if (category === 'shortcuts') return includeShortcuts;
  return category !== 'other';
}

export function isCategoryFolder(folderName: string): boolean {
  return Object.values(CATEGORY_FOLDER_NAMES).some((name) => name.toLocaleLowerCase('tr-TR') === folderName.toLocaleLowerCase('tr-TR'));
}
