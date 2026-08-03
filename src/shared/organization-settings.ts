import type { AppSettings } from './types';

export function shouldScanExistingItems(previous: AppSettings, next: AppSettings): boolean {
  if (!next.automaticMode || !next.organizationRules.scanExistingOnAutomaticEnable) return false;
  if (!previous.automaticMode && next.automaticMode) return true;
  return (!previous.organizationRules.includeFolders && next.organizationRules.includeFolders)
    || (!previous.organizationRules.includeShortcuts && next.organizationRules.includeShortcuts);
}
