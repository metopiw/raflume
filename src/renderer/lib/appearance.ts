import type {
  AccentTheme,
  AppLanguage,
  ApplicationFont,
  DesktopWidgetCorner,
  DesktopWidgetDesign,
  DesktopWidgetFont,
} from '../../shared/types';

export interface AccentOption {
  id: AccentTheme;
  label: Record<AppLanguage, string>;
  colors: [string, string, string];
}

export interface WidgetDesignOption {
  id: DesktopWidgetDesign;
  label: Record<AppLanguage, string>;
  description: Record<AppLanguage, string>;
}

export interface WidgetFontOption {
  id: DesktopWidgetFont;
  label: string;
  family: string;
}

export interface ApplicationFontOption {
  id: ApplicationFont;
  label: string;
  family: string;
  description: Record<AppLanguage, string>;
}

export const ACCENT_OPTIONS: AccentOption[] = [
  { id: 'violet', label: { tr: 'Mor Gece', en: 'Violet Night' }, colors: ['#8b5cf6', '#c4b5fd', '#2e1065'] },
  { id: 'ocean', label: { tr: 'Okyanus', en: 'Ocean' }, colors: ['#06b6d4', '#67e8f9', '#164e63'] },
  { id: 'mint', label: { tr: 'Nane', en: 'Mint' }, colors: ['#10b981', '#6ee7b7', '#064e3b'] },
  { id: 'amber', label: { tr: 'Kehribar', en: 'Amber' }, colors: ['#f59e0b', '#fcd34d', '#78350f'] },
  { id: 'rose', label: { tr: 'Gül', en: 'Rose' }, colors: ['#f43f5e', '#fda4af', '#881337'] },
  { id: 'crimson', label: { tr: 'Kızıl', en: 'Crimson' }, colors: ['#ef4444', '#fca5a5', '#7f1d1d'] },
  { id: 'indigo', label: { tr: 'İndigo', en: 'Indigo' }, colors: ['#6366f1', '#a5b4fc', '#312e81'] },
  { id: 'mono', label: { tr: 'Monokrom', en: 'Monochrome' }, colors: ['#d4d4d8', '#fafafa', '#27272a'] },
];

export const APPLICATION_FONT_OPTIONS: ApplicationFontOption[] = [
  {
    id: 'segoe-variable',
    label: 'Segoe UI Variable',
    family: '"Segoe UI Variable", "Segoe UI", sans-serif',
    description: { tr: 'Windows ile doğal, dengeli ve modern.', en: 'Native to Windows, balanced, and modern.' },
  },
  {
    id: 'verdana',
    label: 'Verdana',
    family: 'Verdana, "Segoe UI", sans-serif',
    description: { tr: 'Küçük boyutlarda açık ve geniş karakterler.', en: 'Open, wide letterforms for small text.' },
  },
  {
    id: 'tahoma',
    label: 'Tahoma',
    family: 'Tahoma, "Segoe UI", sans-serif',
    description: { tr: 'Sıkı, temiz ve masaüstü uygulamalarına uygun.', en: 'Compact, clean, and suited to desktop apps.' },
  },
  {
    id: 'arial',
    label: 'Arial',
    family: 'Arial, "Segoe UI", sans-serif',
    description: { tr: 'Tanıdık, sade ve yüksek kontrastlı.', en: 'Familiar, simple, and high contrast.' },
  },
  {
    id: 'georgia',
    label: 'Georgia',
    family: 'Georgia, "Times New Roman", serif',
    description: { tr: 'Daha karakterli, serifli ve rahat okunan.', en: 'A more distinctive, readable serif option.' },
  },
];

export const WIDGET_DESIGN_OPTIONS: WidgetDesignOption[] = [
  {
    id: 'glass',
    label: { tr: 'Yüzen Cam', en: 'Floating Glass' },
    description: { tr: 'Bulanık, katmanlı ve yumuşak yüzey.', en: 'Blurred, layered, soft surface.' },
  },
  {
    id: 'minimal',
    label: { tr: 'Sessiz Liste', en: 'Quiet List' },
    description: { tr: 'Düz, sıkı ve yüksek okunabilirlik.', en: 'Flat, dense, highly readable.' },
  },
  {
    id: 'shelf',
    label: { tr: 'Raf Panosu', en: 'Shelf Board' },
    description: { tr: 'Raf çizgileri ve belirgin kategori katları.', en: 'Shelf rails and defined category levels.' },
  },
];

export const WIDGET_FONT_OPTIONS: WidgetFontOption[] = [
  { id: 'segoe-variable', label: 'Segoe UI Variable', family: '"Segoe UI Variable", "Segoe UI", sans-serif' },
  { id: 'tahoma', label: 'Tahoma', family: 'Tahoma, "Segoe UI", sans-serif' },
  { id: 'verdana', label: 'Verdana', family: 'Verdana, "Segoe UI", sans-serif' },
  { id: 'arial', label: 'Arial', family: 'Arial, "Segoe UI", sans-serif' },
  { id: 'georgia', label: 'Georgia', family: 'Georgia, "Times New Roman", serif' },
];

export const WIDGET_CORNERS: DesktopWidgetCorner[] = ['top-left', 'top-right', 'bottom-left', 'bottom-right'];
