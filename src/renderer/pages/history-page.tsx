import { ArrowRight, ChevronDown, RotateCcw, ShieldCheck, Undo2 } from 'lucide-react';
import { useState } from 'react';
import { movementBatchKey } from '../../shared/history-utils';
import type { AppLanguage, AppSnapshot, MovementRecord } from '../../shared/types';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import { categoryLabel, copy } from '../lib/i18n';
import { cn, formatDate } from '../lib/utils';

interface HistoryPageProps {
  snapshot: AppSnapshot;
  language: AppLanguage;
  onUndo: () => void;
}

interface HistoryBatch {
  key: string;
  records: MovementRecord[];
}

function dateKey(isoDate: string): string {
  const date = new Date(isoDate);
  return `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
}

function dateLabel(isoDate: string, language: AppLanguage): string {
  const date = new Date(isoDate);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);
  if (dateKey(isoDate) === dateKey(today.toISOString())) return language === 'tr' ? 'Bugün' : 'Today';
  if (dateKey(isoDate) === dateKey(yesterday.toISOString())) return language === 'tr' ? 'Dün' : 'Yesterday';
  return new Intl.DateTimeFormat(language === 'tr' ? 'tr-TR' : 'en-US', { day: 'numeric', month: 'long', year: 'numeric' }).format(date);
}

export function HistoryPage({ snapshot, language, onUndo }: HistoryPageProps): JSX.Element {
  const t = copy[language];
  const batchMap = new Map<string, MovementRecord[]>();
  for (const record of snapshot.history) {
    const key = movementBatchKey(record);
    batchMap.set(key, [...(batchMap.get(key) ?? []), record]);
  }
  const batches: HistoryBatch[] = [...batchMap.entries()].map(([key, records]) => ({ key, records }));
  const dayGroups = new Map<string, HistoryBatch[]>();
  for (const batch of batches) {
    const first = batch.records[0];
    if (!first) continue;
    const key = dateKey(first.movedAt);
    dayGroups.set(key, [...(dayGroups.get(key) ?? []), batch]);
  }

  return (
    <div className="page-content history-page readability-scale-120 animate-fade-in p-6 xl:p-7">
      <header className="mb-5 flex items-end justify-between gap-5">
        <div>
          <h1 className="page-title text-white">{t.moveHistory}</h1>
          <p className="mt-1.5 max-w-3xl text-sm leading-6 text-zinc-400">{language === 'tr' ? 'Her düzenleme tek işlem olarak kaydedilir; kaynak ve hedef yolları buradan denetleyebilirsin.' : 'Each organization run is stored as one operation; inspect source and destination paths here.'}</p>
        </div>
        <Button variant="secondary" onClick={onUndo}><Undo2 size={16} />{t.undo}</Button>
      </header>

      {batches.length === 0 ? (
        <div className="history-empty grid min-h-64 place-items-center text-sm text-zinc-400">{t.historyEmpty}</div>
      ) : (
        <div className="space-y-6">
          {[...dayGroups.entries()].map(([key, groupedBatches]) => {
            const firstRecord = groupedBatches[0]?.records[0];
            if (!firstRecord) return null;
            return (
              <section key={key}>
                <div className="history-day-label mb-2 text-[11px] font-semibold uppercase tracking-[.08em] text-zinc-500">{dateLabel(firstRecord.movedAt, language)}</div>
                <div className="history-stack">
                  {groupedBatches.map((batch) => <HistoryBatchRow key={batch.key} batch={batch} language={language} />)}
                </div>
              </section>
            );
          })}
        </div>
      )}
    </div>
  );
}

function HistoryBatchRow({ batch, language }: { batch: HistoryBatch; language: AppLanguage }): JSX.Element | null {
  const t = copy[language];
  const [expanded, setExpanded] = useState(false);
  const pending = batch.records.filter((record) => record.status === 'pending').length;
  const completed = batch.records.filter((record) => record.status === 'completed').length;
  const undone = batch.records.filter((record) => record.status === 'undone').length;
  const failed = batch.records.filter((record) => record.status === 'failed').length;
  const first = batch.records[0];
  if (!first) return null;
  const status = pending > 0 ? 'pending' : completed > 0 ? 'completed' : failed > 0 ? 'failed' : 'undone';
  const visibleRecords = expanded ? batch.records : batch.records.slice(0, 4);

  return (
    <article className="history-batch">
      <div className="history-batch-head flex items-center gap-3 px-4 py-3">
        <div className={cn('history-status-icon grid h-9 w-9 shrink-0 place-items-center rounded-xl', status === 'pending' ? 'bg-orange-400/10 text-orange-300' : status === 'completed' ? 'bg-emerald-400/10 text-emerald-300' : status === 'failed' ? 'bg-red-400/10 text-red-300' : 'bg-violet-400/10 text-violet-300')}>
          {status === 'undone' ? <RotateCcw size={16} /> : <ShieldCheck size={16} />}
        </div>
        <div className="min-w-0 flex-1">
          <div className="text-sm font-semibold text-zinc-100">{batch.records.length} {language === 'tr' ? 'öğe düzenlendi' : 'items organized'}</div>
          <div className="mt-0.5 text-[11px] text-zinc-400">{first.trigger === 'automatic' ? t.autoMode : language === 'tr' ? 'Onaylı işlem' : 'Approved operation'} · {formatDate(first.movedAt, language)}</div>
        </div>
        {pending > 0 && <Badge className="border-orange-400/20 bg-orange-400/10 text-orange-200">{pending} {t.pending.toLocaleLowerCase(language === 'tr' ? 'tr-TR' : 'en-US')}</Badge>}
        {completed > 0 && <Badge className="border-emerald-400/20 bg-emerald-400/10 text-emerald-200">{completed} {t.completed.toLocaleLowerCase(language === 'tr' ? 'tr-TR' : 'en-US')}</Badge>}
        {undone > 0 && <Badge>{undone} {t.undone.toLocaleLowerCase(language === 'tr' ? 'tr-TR' : 'en-US')}</Badge>}
        {failed > 0 && <Badge className="border-red-400/20 bg-red-400/10 text-red-200">{failed} {t.failed.toLocaleLowerCase(language === 'tr' ? 'tr-TR' : 'en-US')}</Badge>}
      </div>
      <div className="history-records">
        {visibleRecords.map((record) => (
          <div key={record.id} className="history-record grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)_auto] items-center gap-3 px-4 py-2.5 text-xs">
            <div className="min-w-0">
              <div className="truncate font-medium text-zinc-200">{record.fileName}</div>
              <div className="mt-0.5 truncate text-[10px] text-zinc-400" title={record.sourcePath}>{record.sourcePath}</div>
              {record.status === 'failed' && record.errorMessage && <div className="mt-1 truncate text-[10px] text-red-300" title={record.errorMessage}>{record.errorMessage}</div>}
            </div>
            <ArrowRight size={13} className="text-zinc-600" />
            <div className="min-w-0 truncate text-[10px] text-zinc-400" title={record.targetPath}>{record.targetPath}</div>
            <Badge>{categoryLabel(record.category, language)}</Badge>
          </div>
        ))}
        {batch.records.length > 4 && (
          <button type="button" onClick={() => setExpanded((current) => !current)} className="flex w-full items-center gap-1 px-4 py-2 text-left text-[10px] text-zinc-400 hover:text-zinc-200">
            {expanded
              ? language === 'tr' ? 'Daralt' : 'Collapse'
              : `+${batch.records.length - 4} ${language === 'tr' ? 'öğe daha' : 'more items'}`}
            <ChevronDown size={12} className={cn('transition-transform', expanded && 'rotate-180')} />
          </button>
        )}
      </div>
    </article>
  );
}
