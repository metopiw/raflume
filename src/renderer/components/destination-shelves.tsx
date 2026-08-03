import { FolderOpen } from 'lucide-react';
import type { AppLanguage, DestinationShelf } from '../../shared/types';
import { categoryLabel, copy } from '../lib/i18n';
import { cn } from '../lib/utils';
import { CategoryArtwork } from './category-artwork';

interface DestinationShelvesProps {
  shelves: DestinationShelf[];
  language: AppLanguage;
  compact?: boolean;
  onOpenFolder: (folderPath: string) => void;
}

export function DestinationShelves({ shelves, language, compact = false, onOpenFolder }: DestinationShelvesProps): JSX.Element {
  const t = copy[language];

  if (shelves.length === 0) {
    return <div className="py-8 text-sm text-zinc-400">{t.emptyShelfGroup}</div>;
  }

  const populatedShelves = shelves.filter((shelf) => shelf.fileCount > 0);
  const emptyShelves = shelves.filter((shelf) => shelf.fileCount === 0);

  return (
    <div>
      {populatedShelves.length > 0 && (
        <div className={cn('dashboard-shelf-grid grid gap-2.5', compact ? 'grid-cols-2 md:grid-cols-3 2xl:grid-cols-5' : 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3')}>
          {populatedShelves.map((shelf) => (
            <button
              key={shelf.id}
              type="button"
              onClick={() => onOpenFolder(shelf.directoryPath)}
              className="shelf-tile group min-w-0 text-left"
            >
              <div className="flex items-start justify-between gap-3">
                <CategoryArtwork category={shelf.category} className="h-11 w-11 shrink-0 text-zinc-200" />
                <FolderOpen size={14} className="mt-1 shrink-0 text-zinc-700 opacity-0 transition-all group-hover:text-zinc-300 group-hover:opacity-100" />
              </div>
              <div className="mt-3 truncate text-sm font-semibold text-zinc-100">{categoryLabel(shelf.category, language)}</div>
              <div className="mt-1 flex items-center justify-between gap-2 text-[11px]">
                <span className="truncate text-zinc-400">{shelf.latestFileName ?? shelf.directoryPath}</span>
                <span className="shrink-0 tabular-nums text-zinc-300">{shelf.fileCount}</span>
              </div>
            </button>
          ))}
        </div>
      )}

      {emptyShelves.length > 0 && (
        <div className={cn('empty-shelf-strip flex flex-wrap items-center gap-2', populatedShelves.length > 0 && 'mt-3')}>
          <span className="mr-1 text-[10px] font-medium text-zinc-500">{language === 'tr' ? 'Boş raflar' : 'Empty shelves'}</span>
          {emptyShelves.map((shelf) => (
            <button
              key={shelf.id}
              type="button"
              onClick={() => onOpenFolder(shelf.directoryPath)}
              className="empty-shelf-chip group flex items-center gap-2 px-2.5 py-1.5 text-left"
              title={shelf.directoryPath}
            >
              <CategoryArtwork category={shelf.category} empty className="h-6 w-6 shrink-0 text-zinc-300" />
              <span className="text-[10px] font-medium text-zinc-500 group-hover:text-zinc-300">{categoryLabel(shelf.category, language)}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
