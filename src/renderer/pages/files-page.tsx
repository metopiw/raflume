import { RefreshCw, Search } from 'lucide-react';
import { useMemo, useState } from 'react';
import type { AppLanguage, AppSnapshot, FileCategory, WatchLocation } from '../../shared/types';
import { FileList } from '../components/file-list';
import { Button } from '../components/ui/button';
import { Card } from '../components/ui/card';
import { categoryLabel, copy, sourceLabel } from '../lib/i18n';

interface FilesPageProps {
  snapshot: AppSnapshot;
  language: AppLanguage;
  onRefresh: () => void;
}

type SourceFilter = 'all' | Exclude<WatchLocation, 'clipboard'>;
type CategoryFilter = 'all' | FileCategory;

export function FilesPage({ snapshot, language, onRefresh }: FilesPageProps): JSX.Element {
  const t = copy[language];
  const [query, setQuery] = useState('');
  const [source, setSource] = useState<SourceFilter>('all');
  const [category, setCategory] = useState<CategoryFilter>('all');

  const filteredFiles = useMemo(() => {
    const normalizedQuery = query.trim().toLocaleLowerCase(language === 'tr' ? 'tr-TR' : 'en-US');
    return snapshot.recentFiles.filter((file) => {
      if (source !== 'all' && file.source !== source) return false;
      if (category !== 'all' && file.category !== category) return false;
      if (!normalizedQuery) return true;
      return `${file.name} ${file.path} ${file.extension}`.toLocaleLowerCase(language === 'tr' ? 'tr-TR' : 'en-US').includes(normalizedQuery);
    });
  }, [category, language, query, snapshot.recentFiles, source]);

  const categoryOptions: FileCategory[] = ['documents', 'images', 'videos', 'installers', 'archives', 'folders', 'shortcuts', 'other'];

  return (
    <div className="page-content files-page animate-fade-in p-6 xl:p-7">
      <header className="mb-5 flex items-end justify-between gap-5">
        <div>
          <h1 className="page-title text-white">{language === 'tr' ? 'Dosyalar' : 'Files'}</h1>
          <p className="mt-1.5 text-sm text-zinc-400">{language === 'tr' ? `${filteredFiles.length} öğe gösteriliyor` : `${filteredFiles.length} items shown`}</p>
        </div>
        <Button variant="secondary" onClick={onRefresh}><RefreshCw size={16} />{t.refresh}</Button>
      </header>

      <div className="file-toolbar mb-3 flex flex-wrap items-center gap-2">
        <label className="file-search flex min-w-[260px] flex-1 items-center gap-2 px-3">
          <Search size={15} className="text-zinc-500" />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder={language === 'tr' ? 'Dosya adı, uzantı veya yol ara' : 'Search file name, extension, or path'}
            className="h-10 min-w-0 flex-1 bg-transparent text-sm text-zinc-100 outline-none placeholder:text-zinc-600"
          />
        </label>
        <select value={source} onChange={(event) => setSource(event.target.value as SourceFilter)} className="filter-select h-10 px-3 text-xs">
          <option value="all">{language === 'tr' ? 'Tüm kaynaklar' : 'All sources'}</option>
          <option value="desktop">{sourceLabel('desktop', language)}</option>
          <option value="downloads">{sourceLabel('downloads', language)}</option>
        </select>
        <select value={category} onChange={(event) => setCategory(event.target.value as CategoryFilter)} className="filter-select h-10 px-3 text-xs">
          <option value="all">{language === 'tr' ? 'Tüm türler' : 'All types'}</option>
          {categoryOptions.map((item) => <option key={item} value={item}>{categoryLabel(item, language)}</option>)}
        </select>
      </div>

      <Card className="file-list-shell overflow-hidden">
        <FileList files={filteredFiles} language={language} />
      </Card>
    </div>
  );
}
