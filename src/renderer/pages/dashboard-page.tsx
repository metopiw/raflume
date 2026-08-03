import { ArrowRight, Clipboard, FolderSearch2, RefreshCw, ShieldCheck, Undo2 } from 'lucide-react';
import { useMemo, useState } from 'react';
import { groupShelvesBySource } from '../../shared/shelf-utils';
import type { AppLanguage, AppSnapshot, WatchLocation } from '../../shared/types';
import { ClipboardImageHistory } from '../components/clipboard-image-history';
import { DestinationShelves } from '../components/destination-shelves';
import { FileGlyph } from '../components/file-glyph';
import { Button } from '../components/ui/button';
import { Switch } from '../components/ui/switch';
import { categoryLabel, copy, sourceLabel } from '../lib/i18n';
import { cn } from '../lib/utils';
import { formatBytes, formatRelativeDate } from '../lib/utils';

interface DashboardPageProps {
  snapshot: AppSnapshot;
  language: AppLanguage;
  busy: boolean;
  onOrganize: () => void;
  onUndo: () => void;
  onRefresh: () => void;
  onAutomaticModeChange: (checked: boolean) => void;
  onOpenFiles: () => void;
  onOpenFolder: (folderPath: string) => void;
  onError: (message: string) => void;
}

type ShelfSource = Exclude<WatchLocation, 'clipboard'>;

export function DashboardPage({
  snapshot,
  language,
  busy,
  onOrganize,
  onUndo,
  onRefresh,
  onAutomaticModeChange,
  onOpenFiles,
  onOpenFolder,
  onError,
}: DashboardPageProps): JSX.Element {
  const t = copy[language];
  const latest = snapshot.lastDetectedFile;
  const clipboardFile = snapshot.clipboardFile;
  const shelves = groupShelvesBySource(snapshot.destinationShelves);
  const [shelfSource, setShelfSource] = useState<ShelfSource>('desktop');
  const selectedShelves = shelfSource === 'desktop' ? shelves.desktop : shelves.downloads;
  const sourceTotals = useMemo(() => ({
    desktop: shelves.desktop.reduce((sum, shelf) => sum + shelf.fileCount, 0),
    downloads: shelves.downloads.reduce((sum, shelf) => sum + shelf.fileCount, 0),
  }), [shelves.desktop, shelves.downloads]);
  const ready = snapshot.stats.readyToOrganizeCount;
  const title = ready > 0
    ? language === 'tr' ? `${ready} dosya düzenlenmeye hazır` : `${ready} files are ready to organize`
    : language === 'tr' ? 'Klasörlerin düzenli' : 'Your folders are tidy';
  const subtitle = ready > 0
    ? language === 'tr' ? 'Önizlemeyi aç, hedefleri kontrol et ve tek onayla raflara taşı.' : 'Open the preview, inspect destinations, and move everything with one approval.'
    : language === 'tr' ? 'Radar çalışıyor. Yeni bir dosya geldiğinde burada net olarak göreceksin.' : 'Radar is running. New files will appear here with a clear status.';

  return (
    <div className="page-content dashboard-page readability-scale-120 animate-fade-in p-6 xl:p-7">
      <header className="dashboard-commandbar flex items-start justify-between gap-6">
        <div className="min-w-0">
          <div className="mb-2 flex items-center gap-2 text-xs font-medium text-zinc-400">
            <span className="radar-pulse" />
            {snapshot.settings.automaticMode
              ? language === 'tr' ? 'Radar açık · otomatik düzenleme etkin' : 'Radar live · automatic organization enabled'
              : language === 'tr' ? 'Radar açık · onay sende' : 'Radar live · approval stays with you'}
          </div>
          <h1 className="dashboard-title text-[clamp(1.6rem,2.15vw,2.05rem)] font-semibold leading-tight tracking-[-.018em] text-white">{title}</h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-zinc-400">{subtitle}</p>
        </div>
        <div className="flex shrink-0 flex-wrap justify-end gap-2">
          <Button variant="ghost" size="icon" title={t.refresh} onClick={onRefresh}><RefreshCw size={16} /></Button>
          <Button variant="ghost" onClick={onUndo}><Undo2 size={16} />{language === 'tr' ? 'Geri al' : 'Undo'}</Button>
          <Button variant="primary" size="lg" disabled={busy} onClick={onOrganize}><FolderSearch2 size={17} />{busy ? t.organizing : t.organizeNow}</Button>
        </div>
      </header>

      <section className="status-ribbon mt-5 grid gap-3 lg:grid-cols-[minmax(310px,1.45fr)_repeat(2,minmax(150px,.55fr))]">
        <div className="auto-control flex items-center justify-between gap-4">
          <div className="min-w-0">
            <div className="flex items-center gap-2 text-sm font-semibold text-zinc-100">
              {t.autoMode}
              <span className={cn('status-label', snapshot.settings.automaticMode && 'is-on')}>{snapshot.settings.automaticMode ? t.active : t.paused}</span>
            </div>
            <p className="mt-1 text-xs leading-5 text-zinc-400">{snapshot.settings.automaticMode
              ? snapshot.settings.organizationRules.scanExistingOnAutomaticEnable
                ? language === 'tr' ? 'Açılırken mevcut desteklenen öğeleri tarar; ardından yeni gelenleri otomatik taşır.' : 'Scans existing supported items when enabled, then automatically moves new arrivals.'
                : language === 'tr' ? 'Yalnızca otomatik mod açıldıktan sonra yeni gelen öğeleri taşır.' : 'Moves only items that arrive after automatic mode is enabled.'
              : language === 'tr' ? 'Öğeler yalnızca önizleme ve onaydan sonra taşınır.' : 'Items move only after preview and approval.'}</p>
            <div className="mt-2 flex flex-wrap gap-1.5 text-[11px] font-semibold">
              <span className={cn('rounded-full px-2 py-1', snapshot.settings.automaticMode ? 'bg-emerald-400/10 text-emerald-300' : 'bg-white/[.045] text-zinc-500')}>{language === 'tr' ? 'Dosyalar' : 'Files'} · {language === 'tr' ? 'açık' : 'on'}</span>
              <span className={cn('rounded-full px-2 py-1', snapshot.settings.organizationRules.includeFolders ? 'bg-emerald-400/10 text-emerald-300' : 'bg-white/[.045] text-zinc-500')}>{language === 'tr' ? 'Klasörler' : 'Folders'} · {snapshot.settings.organizationRules.includeFolders ? (language === 'tr' ? 'açık' : 'on') : (language === 'tr' ? 'kapalı' : 'off')}</span>
              <span className={cn('rounded-full px-2 py-1', snapshot.settings.organizationRules.includeShortcuts ? 'bg-emerald-400/10 text-emerald-300' : 'bg-white/[.045] text-zinc-500')}>{language === 'tr' ? 'Kısayollar' : 'Shortcuts'} · {snapshot.settings.organizationRules.includeShortcuts ? (language === 'tr' ? 'açık' : 'on') : (language === 'tr' ? 'kapalı' : 'off')}</span>
            </div>
          </div>
          <Switch checked={snapshot.settings.automaticMode} onCheckedChange={onAutomaticModeChange} label={t.autoMode} />
        </div>
        <Metric value={snapshot.stats.movesToday} label={language === 'tr' ? 'Bugün taşındı' : 'Moved today'} detail={language === 'tr' ? `${snapshot.stats.protectedMoveCount} hareket geri alınabilir` : `${snapshot.stats.protectedMoveCount} moves are undoable`} />
        <Metric value={snapshot.stats.watchedFolderCount} label={language === 'tr' ? 'İzlenen kaynak' : 'Watched sources'} detail={language === 'tr' ? 'Masaüstü ve İndirilenler' : 'Desktop and Downloads'} />
      </section>

      <div className="dashboard-workspace mt-5 grid gap-5 xl:grid-cols-[minmax(0,1.55fr)_minmax(320px,.75fr)]">
        <section className="shelf-workspace min-w-0">
          <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
            <div>
              <h2 className="text-base font-semibold text-zinc-100">{language === 'tr' ? 'Dosya rafları' : 'File shelves'}</h2>
              <p className="mt-1 text-xs leading-5 text-zinc-400">{language === 'tr' ? 'Bunlar dosyaların gerçekten bulunduğu klasörlerdir.' : 'These are the real folders where organized files live.'}</p>
            </div>
            <div className="source-tabs flex items-center gap-1 p-1">
              <SourceTab label={language === 'tr' ? 'Masaüstü' : 'Desktop'} count={sourceTotals.desktop} active={shelfSource === 'desktop'} onClick={() => setShelfSource('desktop')} />
              <SourceTab label={language === 'tr' ? 'İndirilenler' : 'Downloads'} count={sourceTotals.downloads} active={shelfSource === 'downloads'} onClick={() => setShelfSource('downloads')} />
            </div>
          </div>
          <DestinationShelves shelves={selectedShelves} language={language} compact onOpenFolder={onOpenFolder} />
        </section>

        <aside className="activity-rail min-w-0">
          <div className="mb-3 flex items-center justify-between">
            <div>
              <h2 className="text-base font-semibold text-zinc-100">{language === 'tr' ? 'Canlı akış' : 'Live activity'}</h2>
              <p className="mt-1 text-xs text-zinc-400">{language === 'tr' ? 'Algılanan dosya ve pano durumu.' : 'Detected file and clipboard status.'}</p>
            </div>
            <Button variant="ghost" size="sm" onClick={onOpenFiles}>{t.allFiles}<ArrowRight size={14} /></Button>
          </div>

          <div className="activity-block">
            <div className="mb-3 flex items-center justify-between gap-2">
              <span className="text-xs font-semibold text-zinc-300">{language === 'tr' ? 'Son yakalanan dosya' : 'Latest detected file'}</span>
              {latest && <span className="source-pill">{sourceLabel(latest.source, language)}</span>}
            </div>
            {latest ? (
              <div className="flex items-center gap-3">
                <FileGlyph category={latest.category} extension={latest.extension} itemKind={latest.itemKind} filePath={latest.path} className="h-11 w-11 rounded-xl" />
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-semibold text-white">{latest.name}</div>
                  <div className="mt-1 truncate text-[11px] text-zinc-500">{categoryLabel(latest.category, language)} · {formatBytes(latest.size, language)} · {formatRelativeDate(latest.modifiedAt, language)}</div>
                </div>
              </div>
            ) : <p className="text-xs leading-5 text-zinc-500">{t.noFiles}</p>}
            {latest && <div className="mt-3 flex gap-2"><Button size="sm" onClick={() => void window.desktopOrganizer.openFile(latest.path)}>{t.open}</Button><Button size="sm" variant="ghost" onClick={() => void window.desktopOrganizer.showInFolder(latest.path)}>{t.reveal}</Button></div>}
          </div>

          <div className="activity-block mt-2">
            <div className="mb-3 flex items-center gap-2 text-xs font-semibold text-zinc-300"><Clipboard size={14} />{language === 'tr' ? 'Kopyalanan dosya' : 'Copied file'}</div>
            {clipboardFile ? (
              <div>
                <div className="truncate text-sm font-semibold text-white">{clipboardFile.name}</div>
                <div className="mt-1 text-[11px] text-zinc-500">{categoryLabel(clipboardFile.category, language)} · {formatBytes(clipboardFile.size, language)}</div>
                <Button className="mt-3" size="sm" variant="ghost" onClick={() => void window.desktopOrganizer.showInFolder(clipboardFile.path)}>{t.reveal}</Button>
              </div>
            ) : <p className="text-xs leading-5 text-zinc-500">{language === 'tr' ? 'Windows Gezgini’nden bir dosya kopyaladığında burada görünür.' : 'A file copied in Windows Explorer will appear here.'}</p>}
          </div>

          <div className="safety-note mt-3 flex items-start gap-3">
            <ShieldCheck size={17} className="mt-0.5 shrink-0 text-emerald-300" />
            <p className="text-[11px] leading-5 text-zinc-400">{language === 'tr' ? 'Raflume dosya silmez, aynı isimli dosyanın üzerine yazmaz ve her hareketi toplu geri alma için kaydeder.' : 'Raflume never deletes or overwrites files and records every move for batch undo.'}</p>
          </div>
        </aside>
      </div>

      <div className="dashboard-clipboard mt-5">
        <ClipboardImageHistory images={snapshot.clipboardImages} language={language} enabled={snapshot.settings.clipboardImageHistory} onError={onError} />
      </div>
    </div>
  );
}

function Metric({ value, label, detail }: { value: number; label: string; detail: string }): JSX.Element {
  return (
    <div className="metric-cell">
      <div className="flex items-baseline gap-2"><span className="text-xl font-semibold tabular-nums text-zinc-100">{value}</span><span className="text-[11px] font-medium text-zinc-400">{label}</span></div>
      <div className="mt-1 text-[10px] text-zinc-500">{detail}</div>
    </div>
  );
}

function SourceTab({ label, count, active, onClick }: { label: string; count: number; active: boolean; onClick: () => void }): JSX.Element {
  return (
    <button type="button" onClick={onClick} className={cn('source-tab', active && 'is-active')}>
      <span>{label}</span>
      <span className="source-tab-count">{count}</span>
    </button>
  );
}
