import type { AppSettings } from './types';

export function shouldScanExistingItemsOnStartup(settings: AppSettings): boolean {
  return settings.automaticMode
    && settings.organizationRules.scanExistingOnAutomaticEnable
    && (settings.watchedLocations.desktop || settings.watchedLocations.downloads);
}

export function shouldScanExistingItems(previous: AppSettings, next: AppSettings): boolean {
  if (!next.automaticMode || !next.organizationRules.scanExistingOnAutomaticEnable) return false;
  if (!previous.automaticMode && next.automaticMode) return true;
  if (!previous.organizationRules.scanExistingOnAutomaticEnable && next.organizationRules.scanExistingOnAutomaticEnable) return true;
  if (!previous.watchedLocations.desktop && next.watchedLocations.desktop) return true;
  if (!previous.watchedLocations.downloads && next.watchedLocations.downloads) return true;
  return (!previous.organizationRules.includeFolders && next.organizationRules.includeFolders)
    || (!previous.organizationRules.includeShortcuts && next.organizationRules.includeShortcuts);
}
