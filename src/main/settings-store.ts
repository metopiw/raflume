import Store from 'electron-store';
import type { ApplicationFont, AppSettings, DesktopWidgetFont } from '../shared/types';
import { normalizeExclusions } from '../shared/exclusions';
import { clampWidgetOpacity, clampWidgetSize } from '../shared/widget-size';
import log from './logger';

const DEFAULT_SETTINGS: AppSettings = {
  language: 'tr',
  automaticMode: false,
  showNotifications: true,
  clipboardImageHistory: true,
  launchAtStartup: false,
  hotkey: 'CommandOrControl+Shift+O',
  maxRecentFiles: 40,
  watchedLocations: {
    desktop: true,
    downloads: true,
  },
  organizationRules: {
    scanExistingOnAutomaticEnable: true,
    includeFolders: false,
    includeShortcuts: false,
  },
  accentTheme: 'violet',
  interfaceFont: 'segoe-variable',
  desktopWidget: {
    enabled: false,
    corner: 'top-right',
    width: 420,
    height: 560,
    opacity: 0.74,
    design: 'glass',
    colorTheme: 'violet',
    font: 'segoe-variable',
  },
  exclusions: [],
};

const SUPPORTED_APP_FONTS: ReadonlySet<ApplicationFont> = new Set(['segoe-variable', 'verdana', 'tahoma', 'arial', 'georgia']);

function normalizeApplicationFont(value: unknown): ApplicationFont {
  return typeof value === 'string' && SUPPORTED_APP_FONTS.has(value as ApplicationFont)
    ? value as ApplicationFont
    : DEFAULT_SETTINGS.interfaceFont;
}

const SUPPORTED_WIDGET_FONTS: ReadonlySet<DesktopWidgetFont> = new Set([
  'segoe-variable',
  'tahoma',
  'verdana',
  'arial',
  'georgia',
]);

function normalizeWidgetFont(value: unknown): DesktopWidgetFont {
  return typeof value === 'string' && SUPPORTED_WIDGET_FONTS.has(value as DesktopWidgetFont)
    ? value as DesktopWidgetFont
    : DEFAULT_SETTINGS.desktopWidget.font;
}

export class SettingsStore {
  private readonly store = new Store<AppSettings>({
    name: 'settings',
    defaults: DEFAULT_SETTINGS,
  });

  public getAll(): AppSettings {
    const watchedLocations = this.store.get('watchedLocations') ?? DEFAULT_SETTINGS.watchedLocations;
    const organizationRules = this.store.get('organizationRules') ?? DEFAULT_SETTINGS.organizationRules;
    const desktopWidget = this.store.get('desktopWidget') ?? DEFAULT_SETTINGS.desktopWidget;
    const widgetSize = clampWidgetSize(
      desktopWidget.width ?? DEFAULT_SETTINGS.desktopWidget.width,
      desktopWidget.height ?? DEFAULT_SETTINGS.desktopWidget.height,
    );

    return {
      language: this.store.get('language') ?? DEFAULT_SETTINGS.language,
      automaticMode: this.store.get('automaticMode') ?? DEFAULT_SETTINGS.automaticMode,
      showNotifications: this.store.get('showNotifications') ?? DEFAULT_SETTINGS.showNotifications,
      clipboardImageHistory: this.store.get('clipboardImageHistory') ?? DEFAULT_SETTINGS.clipboardImageHistory,
      launchAtStartup: this.store.get('launchAtStartup') ?? DEFAULT_SETTINGS.launchAtStartup,
      hotkey: this.store.get('hotkey') ?? DEFAULT_SETTINGS.hotkey,
      maxRecentFiles: this.store.get('maxRecentFiles') ?? DEFAULT_SETTINGS.maxRecentFiles,
      watchedLocations: {
        desktop: watchedLocations.desktop ?? DEFAULT_SETTINGS.watchedLocations.desktop,
        downloads: watchedLocations.downloads ?? DEFAULT_SETTINGS.watchedLocations.downloads,
      },
      organizationRules: {
        scanExistingOnAutomaticEnable: organizationRules.scanExistingOnAutomaticEnable ?? DEFAULT_SETTINGS.organizationRules.scanExistingOnAutomaticEnable,
        includeFolders: organizationRules.includeFolders ?? DEFAULT_SETTINGS.organizationRules.includeFolders,
        includeShortcuts: organizationRules.includeShortcuts ?? DEFAULT_SETTINGS.organizationRules.includeShortcuts,
      },
      accentTheme: this.store.get('accentTheme') ?? DEFAULT_SETTINGS.accentTheme,
      interfaceFont: normalizeApplicationFont(this.store.get('interfaceFont')),
      desktopWidget: {
        enabled: desktopWidget.enabled ?? DEFAULT_SETTINGS.desktopWidget.enabled,
        corner: desktopWidget.corner ?? DEFAULT_SETTINGS.desktopWidget.corner,
        width: widgetSize.width,
        height: widgetSize.height,
        opacity: clampWidgetOpacity(desktopWidget.opacity ?? DEFAULT_SETTINGS.desktopWidget.opacity),
        design: desktopWidget.design ?? DEFAULT_SETTINGS.desktopWidget.design,
        colorTheme: desktopWidget.colorTheme ?? DEFAULT_SETTINGS.desktopWidget.colorTheme,
        font: normalizeWidgetFont(desktopWidget.font),
      },
      exclusions: normalizeExclusions(this.store.get('exclusions')),
    };
  }

  public update(patch: Partial<AppSettings>): AppSettings {
    try {
      const current = this.getAll();
      const next: AppSettings = {
        ...current,
        ...patch,
        watchedLocations: {
          ...current.watchedLocations,
          ...(patch.watchedLocations ?? {}),
        },
        organizationRules: {
          ...current.organizationRules,
          ...(patch.organizationRules ?? {}),
        },
        desktopWidget: {
          ...current.desktopWidget,
          ...(patch.desktopWidget ?? {}),
        },
        exclusions: patch.exclusions ? normalizeExclusions(patch.exclusions) : current.exclusions,
      };
      this.store.set(next);
      log.info('Settings updated', { keys: Object.keys(patch) });
      return next;
    } catch (error) {
      log.error('Could not update settings', error);
      throw error;
    }
  }
}
