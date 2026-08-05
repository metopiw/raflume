import test from 'node:test';
import assert from 'node:assert/strict';
import type { AppSettings } from '../src/shared/types';
import { shouldScanExistingItems, shouldScanExistingItemsOnStartup } from '../src/shared/organization-settings';

const base: AppSettings = {
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
  desktopWidget: { enabled: false, corner: 'top-right', width: 420, height: 560, opacity: .74, design: 'glass', colorTheme: 'violet', font: 'segoe-variable' },
  exclusions: [],
};

test('scans existing items when automatic mode is enabled', () => {
  assert.equal(shouldScanExistingItems(base, { ...base, automaticMode: true }), true);
});

test('does not scan when the existing-item rule is disabled', () => {
  const next: AppSettings = {
    ...base,
    automaticMode: true,
    organizationRules: { ...base.organizationRules, scanExistingOnAutomaticEnable: false },
  };
  assert.equal(shouldScanExistingItems(base, next), false);
});

test('rescans when folder or shortcut handling is enabled during automatic mode', () => {
  const previous: AppSettings = { ...base, automaticMode: true };
  const foldersEnabled: AppSettings = { ...previous, organizationRules: { ...previous.organizationRules, includeFolders: true } };
  const shortcutsEnabled: AppSettings = { ...previous, organizationRules: { ...previous.organizationRules, includeShortcuts: true } };
  assert.equal(shouldScanExistingItems(previous, foldersEnabled), true);
  assert.equal(shouldScanExistingItems(previous, shortcutsEnabled), true);
});

test('scans existing items at startup when automatic mode and a radar source are active', () => {
  const settings: AppSettings = { ...base, automaticMode: true };
  assert.equal(shouldScanExistingItemsOnStartup(settings), true);
  assert.equal(shouldScanExistingItemsOnStartup({ ...settings, automaticMode: false }), false);
  assert.equal(shouldScanExistingItemsOnStartup({ ...settings, watchedLocations: { desktop: false, downloads: false } }), false);
});

test('rescans when a watched location is enabled during automatic mode', () => {
  const previous: AppSettings = {
    ...base,
    automaticMode: true,
    watchedLocations: { desktop: true, downloads: false },
  };
  const next: AppSettings = {
    ...previous,
    watchedLocations: { ...previous.watchedLocations, downloads: true },
  };
  assert.equal(shouldScanExistingItems(previous, next), true);
});

test('scans when the existing-item rule is enabled during automatic mode', () => {
  const previous: AppSettings = {
    ...base,
    automaticMode: true,
    organizationRules: { ...base.organizationRules, scanExistingOnAutomaticEnable: false },
  };
  const next: AppSettings = {
    ...previous,
    organizationRules: { ...previous.organizationRules, scanExistingOnAutomaticEnable: true },
  };
  assert.equal(shouldScanExistingItems(previous, next), true);
});
