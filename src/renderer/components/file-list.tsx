import { ExternalLink, FolderOpen } from 'lucide-react';
import type { AppLanguage, WatchedFile } from '../../shared/types';
import { categoryLabel, copy, sourceLabel } from '../lib/i18n';
import { formatBytes, formatRelativeDate } from '../lib/utils';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { FileGlyph } from './file-glyph';

interface FileListProps {
  files: WatchedFile[];
  language: AppLanguage;
  compact?: boolean;
}

function directoryPath(filePath: string): string {
  const separatorIndex = Math.max(filePath.lastIndexOf('\\'), filePath.lastIndexOf('/'));
  return separatorIndex > 0 ? filePath.slice(0, separatorIndex) : filePath;
}

function extensionLabel(file: WatchedFile): string {
  if (file.itemKind === 'directory') return 'DIR';
  const extension = file.extension.replace('.', '').toUpperCase();
  return extension || 'FILE';
}

export function FileList({ files, language, compact = false }: FileListProps): JSX.Element {
  const t = copy[language];
  if (files.length === 0) return <div className="grid min-h-44 place-items-center text-sm text-zinc-400">{t.noFiles}</div>;

  return (
    <div className="file-table">
      {!compact && (
        <div className="file-table-head grid grid-cols-[minmax(0,1fr)_140px_120px_84px] items-center gap-3 px-4 py-2 text-[10px] font-semibold uppercase tracking-[.08em] text-zinc-500">
          <span>{language === 'tr' ? 'Öğe' : 'Item'}</span>
          <span>{language === 'tr' ? 'Kaynak' : 'Source'}</span>
          <span>{language === 'tr' ? 'Değiştirilme' : 'Modified'}</span>
          <span className="text-right">{language === 'tr' ? 'Tür' : 'Type'}</span>
        </div>
      )}
      <div className="divide-y divide-white/[.045]">
        {files.map((file) => (
          <div key={`${file.source}:${file.path}`} className="file-table-row group grid grid-cols-[minmax(0,1fr)_140px_120px_84px] items-center gap-3 px-4 py-2.5 transition-colors hover:bg-white/[.028]">
            <div className="flex min-w-0 items-center gap-3">
              <FileGlyph category={file.category} extension={file.extension} itemKind={file.itemKind} filePath={file.path} className="h-9 w-9 rounded-lg" />
              <div className="min-w-0 flex-1">
                <div className="truncate text-[13px] font-semibold text-zinc-100">{file.name}</div>
                <div className="mt-0.5 truncate text-[10px] text-zinc-400" title={file.path}>{directoryPath(file.path)}</div>
              </div>
            </div>
            <div className="min-w-0 text-[11px] text-zinc-400">
              <div className="truncate">{sourceLabel(file.source, language)}</div>
              <div className="mt-0.5 text-[10px] text-zinc-500">{formatBytes(file.size, language)}</div>
            </div>
            <div className="text-[11px] text-zinc-400">{formatRelativeDate(file.modifiedAt, language)}</div>
            <div className="flex items-center justify-end gap-1.5">
              {file.category === 'other'
                ? <span className="extension-chip">{extensionLabel(file)}</span>
                : <Badge>{categoryLabel(file.category, language)}</Badge>}
              <div className="file-row-actions flex opacity-0 transition-opacity group-hover:opacity-100 group-focus-within:opacity-100">
                <Button size="icon" variant="ghost" title={t.open} onClick={() => void window.desktopOrganizer.openFile(file.path)}><ExternalLink size={14} /></Button>
                <Button size="icon" variant="ghost" title={t.reveal} onClick={() => void window.desktopOrganizer.showInFolder(file.path)}><FolderOpen size={14} /></Button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
