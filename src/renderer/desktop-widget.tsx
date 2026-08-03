import { ExternalLink, EyeOff, FolderOpen, Maximize2, Minimize2, RefreshCw } from 'lucide-react';
import { useEffect, useMemo, useState, type CSSProperties } from 'react';
import { groupShelvesBySource } from '../shared/shelf-utils';
import type { AppSnapshot, DestinationShelf, WatchLocation } from '../shared/types';
import { BrandMark } from './components/brand-mark';
import { CategoryArtwork } from './components/category-artwork';
import { WIDGET_FONT_OPTIONS } from './lib/appearance';
import { categoryLabel, copy } from './lib/i18n';
import { cn } from './lib/utils';

type WidgetSource = Exclude<WatchLocation, 'clipboard'>;

export function DesktopWidget(): JSX.Element {
  const [snapshot, setSnapshot] = useState<AppSnapshot | null>(null);
  const [source, setSource] = useState<WidgetSource>('desktop');
  const [windowSize, setWindowSize] = useState({ width: window.innerWidth, height: window.innerHeight });

  useEffect(() => {
    document.documentElement.dataset.surface = 'widget';
    let mounted = true;
    void window.desktopOrganizer.getSnapshot().then((value) => {
      if (mounted) setSnapshot(value);
    });
    const removeListener = window.desktopOrganizer.onSnapshotUpdated((value) => setSnapshot(value));
    const onResize = (): void => setWindowSize({ width: window.innerWidth, height: window.innerHeight });
    window.addEventListener('resize', onResize);
    return () => {
      mounted = false;
      removeListener();
      window.removeEventListener('resize', onResize);
      delete document.documentElement.dataset.surface;
    };
  }, []);

  if (!snapshot) {
    return <div className="desktop-widget-root grid place-items-center"><div className="h-7 w-7 animate-spin rounded-full border-2 border-white/15 border-t-white" /></div>;
  }

  const language = snapshot.settings.language;
  const t = copy[language];
  const widget = snapshot.settings.desktopWidget;
  const groups = groupShelvesBySource(snapshot.destinationShelves);
  const selectedShelves = source === 'desktop' ? groups.desktop : groups.downloads;
  const totalBySource = {
    desktop: groups.desktop.reduce((total, shelf) => total + shelf.fileCount, 0),
    downloads: groups.downloads.reduce((total, shelf) => total + shelf.fileCount, 0),
  };
  const fontFamily = WIDGET_FONT_OPTIONS.find((option) => option.id === widget.font)?.family ?? '"Segoe UI", sans-serif';
  const style = {
    '--widget-opacity': String(widget.opacity),
    '--widget-font-family': fontFamily,
  } as CSSProperties;

  const disableWidget = async (): Promise<void> => {
    await window.desktopOrganizer.updateSettings({
      desktopWidget: { ...widget, enabled: false },
    });
  };

  const resizeBy = async (factor: number): Promise<void> => {
    const width = Math.round(windowSize.width * factor);
    const height = Math.round(windowSize.height * factor);
    await window.desktopOrganizer.resizeDesktopWidget(width, height);
  };

  return (
    <div
      className="desktop-widget-root"
      data-accent={widget.colorTheme}
      data-widget-design={widget.design}
      style={style}
    >
      <section className="desktop-widget-panel flex flex-col">
        <header className="widget-drag flex items-center gap-3 px-4 pb-3 pt-4">
          <BrandMark className="h-9 w-9 shrink-0" />
          <div className="min-w-0 flex-1">
            <div className="truncate text-[14px] font-semibold text-white">{t.appName}</div>
            <div className="mt-0.5 truncate text-[11px] text-zinc-300">{language === 'tr' ? 'Dosya, klasör ve kısayol rafları' : 'File, folder, and shortcut shelves'}</div>
          </div>
          <div className="widget-no-drag flex items-center gap-0.5">
            <button type="button" className="widget-icon-button" title={language === 'tr' ? 'Küçült' : 'Shrink'} onClick={() => void resizeBy(.86)}><Minimize2 size={13} /></button>
            <button type="button" className="widget-icon-button" title={language === 'tr' ? 'Büyüt' : 'Grow'} onClick={() => void resizeBy(1.16)}><Maximize2 size={13} /></button>
            <button type="button" className="widget-icon-button" title={t.refresh} onClick={() => void window.desktopOrganizer.refreshFiles()}><RefreshCw size={13} /></button>
            <button type="button" className="widget-icon-button" title={t.openApp} onClick={() => void window.desktopOrganizer.showMainWindow()}><ExternalLink size={13} /></button>
            <button type="button" className="widget-icon-button" title={t.hideWidget} onClick={() => void disableWidget()}><EyeOff size={13} /></button>
          </div>
        </header>

        <div className="widget-no-drag px-3">
          <div className="widget-source-tabs grid grid-cols-2 gap-1 p-1">
            <SourceTab active={source === 'desktop'} label={language === 'tr' ? 'Masaüstü' : 'Desktop'} count={totalBySource.desktop} onClick={() => setSource('desktop')} />
            <SourceTab active={source === 'downloads'} label={language === 'tr' ? 'İndirilenler' : 'Downloads'} count={totalBySource.downloads} onClick={() => setSource('downloads')} />
          </div>
        </div>

        <div className="widget-no-drag min-h-0 flex-1 overflow-y-auto px-3 pb-3 pt-2">
          <WidgetShelfList shelves={selectedShelves} language={language} />
        </div>

        <footer className="widget-drag flex items-center justify-between px-4 pb-3 pt-1 text-[10px] text-zinc-400">
          <span>{snapshot.stats.protectedMoveCount} {language === 'tr' ? 'geri alınabilir hareket' : 'undoable moves'}</span>
          <span>{windowSize.width} × {windowSize.height}</span>
        </footer>
        <span className="widget-resize-cue" aria-hidden="true" />
      </section>
    </div>
  );
}

function SourceTab({ active, label, count, onClick }: { active: boolean; label: string; count: number; onClick: () => void }): JSX.Element {
  return (
    <button type="button" onClick={onClick} className={cn('widget-source-tab flex min-w-0 items-center justify-between gap-2', active && 'is-active')}>
      <span className="truncate">{label}</span>
      <span className="widget-source-count">{count}</span>
    </button>
  );
}

function WidgetShelfList({ shelves, language }: { shelves: DestinationShelf[]; language: AppSnapshot['settings']['language'] }): JSX.Element {
  const sortedShelves = useMemo(() => [...shelves].sort((left, right) => {
    if (left.fileCount === right.fileCount) return left.category.localeCompare(right.category);
    return right.fileCount - left.fileCount;
  }), [shelves]);

  return (
    <div className="widget-shelf-list">
      {sortedShelves.map((shelf) => {
        const isEmpty = shelf.fileCount === 0;
        return (
          <div
            key={shelf.id}
            className={cn('widget-shelf-row group flex w-full min-w-0 items-center gap-3 text-left', isEmpty && 'is-empty')}
          >
            <button
              type="button"
              disabled={!shelf.latestItemPath}
              onClick={() => shelf.latestItemPath && void window.desktopOrganizer.openFile(shelf.latestItemPath)}
              className="widget-shelf-open flex min-w-0 flex-1 items-center gap-3 text-left"
              title={shelf.latestFileName ? (language === 'tr' ? `Son öğeyi aç: ${shelf.latestFileName}` : `Open latest item: ${shelf.latestFileName}`) : copy[language].shelfEmpty}
            >
              <CategoryArtwork category={shelf.category} empty={isEmpty} className="h-9 w-9 shrink-0 text-zinc-100" />
              <span className="min-w-0 flex-1">
                <span className="block truncate text-[12px] font-semibold text-zinc-50">{categoryLabel(shelf.category, language)}</span>
                <span className="mt-0.5 block truncate text-[10px] text-zinc-400">{isEmpty ? copy[language].shelfEmpty : shelf.latestFileName ?? shelf.directoryPath}</span>
              </span>
              <span className="shrink-0 text-[11px] tabular-nums text-zinc-300">{shelf.fileCount}</span>
            </button>
            <button
              type="button"
              onClick={() => void window.desktopOrganizer.openFolder(shelf.directoryPath)}
              className="widget-shelf-folder-button grid h-8 w-8 shrink-0 place-items-center rounded-lg text-zinc-500 transition-colors hover:bg-white/[.07] hover:text-zinc-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-white/70"
              title={language === 'tr' ? 'Raf klasörünü aç' : 'Open shelf folder'}
              aria-label={language === 'tr' ? `${categoryLabel(shelf.category, language)} klasörünü aç` : `Open ${categoryLabel(shelf.category, language)} folder`}
            >
              <FolderOpen size={14} />
            </button>
          </div>
        );
      })}
    </div>
  );
}
