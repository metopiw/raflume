import type React from 'react';
import { ArrowRight, CheckCircle2, FolderOpen, ShieldCheck, Undo2, X } from 'lucide-react';
import type { AppLanguage, MovedItem, OperationResult, OrganizationPreview } from '../../shared/types';
import { categoryLabel, copy, sourceLabel } from '../lib/i18n';
import { CategoryArtwork } from './category-artwork';
import { Badge } from './ui/badge';
import { Button } from './ui/button';

interface DialogShellProps {
  children: React.ReactNode;
  onClose: () => void;
}

function DialogShell({ children, onClose }: DialogShellProps): JSX.Element {
  return (
    <div className="fixed inset-0 z-[80] grid place-items-center bg-[#020308]/75 p-6 backdrop-blur-md" onMouseDown={(event) => { if (event.currentTarget === event.target) onClose(); }}>
      <section className="relative max-h-[86vh] w-full max-w-5xl overflow-hidden rounded-[28px] border border-white/[.12] bg-[#0e1018]/90 shadow-[0_40px_120px_rgba(0,0,0,.72),0_0_80px_rgba(124,58,237,.12)] backdrop-blur-3xl">
        <button type="button" onClick={onClose} className="absolute right-4 top-4 z-10 grid h-9 w-9 place-items-center rounded-xl bg-white/[.06] text-zinc-500 transition-colors hover:bg-white/[.1] hover:text-white"><X size={16} /></button>
        {children}
      </section>
    </div>
  );
}

interface PreviewDialogProps {
  preview: OrganizationPreview;
  language: AppLanguage;
  busy: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

export function OrganizationPreviewDialog({ preview, language, busy, onClose, onConfirm }: PreviewDialogProps): JSX.Element {
  const t = copy[language];
  const grouped = new Map<string, OrganizationPreview['items']>();
  for (const item of preview.items) {
    const key = `${item.source}:${item.category}`;
    grouped.set(key, [...(grouped.get(key) ?? []), item]);
  }

  return (
    <DialogShell onClose={onClose}>
      <div className="border-b border-white/[.07] px-7 pb-5 pt-7">
        <Badge className="mb-3 border-emerald-400/20 bg-emerald-400/10 text-emerald-200"><ShieldCheck size={12} className="mr-1.5" />{t.safetyCenter}</Badge>
        <h2 className="text-3xl font-bold tracking-[-.04em] text-white">{t.previewTitle}</h2>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-zinc-400">{t.previewSubtitle}</p>
        <div className="mt-5 flex flex-wrap gap-2">
          <Badge className="border-violet-400/20 bg-violet-400/10 text-violet-200">{preview.movableCount} {t.previewMovable}</Badge>
          <Badge>{preview.untouchedCount} {t.previewUntouched}</Badge>
          <Badge>{t.safetyNeverDelete}</Badge>
          <Badge>{t.safetyNoOverwrite}</Badge>
        </div>
      </div>

      <div className="max-h-[48vh] overflow-y-auto p-5">
        {preview.items.length === 0 ? (
          <div className="grid min-h-52 place-items-center rounded-2xl border border-dashed border-white/10 bg-white/[.02] text-sm text-zinc-500">{t.nothingToOrganize}</div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {[...grouped.entries()].map(([key, items]) => {
              const first = items[0];
              if (!first) return null;
              return (
                <article key={key} className="rounded-2xl border border-white/[.08] bg-white/[.03] p-4">
                  <div className="flex items-center gap-3">
                    <CategoryArtwork category={first.category} className="h-14 w-[72px] shrink-0" />
                    <div className="min-w-0 flex-1">
                      <div className="text-sm font-semibold text-white">{categoryLabel(first.category, language)}</div>
                      <div className="mt-1 text-xs text-zinc-500">{sourceLabel(first.source, language)} · {items.length} {t.previewMovable}</div>
                      <div className="mt-1 truncate text-[10px] text-zinc-600">{first.destinationDirectory}</div>
                    </div>
                  </div>
                  <div className="mt-3 space-y-1.5">
                    {items.slice(0, 4).map((item) => (
                      <div key={item.id} className="flex items-center gap-2 rounded-xl bg-black/20 px-3 py-2 text-[11px]">
                        <span className="min-w-0 flex-1 truncate text-zinc-300">{item.fileName}</span>
                        <ArrowRight size={12} className="shrink-0 text-zinc-600" />
                        <span className="max-w-[42%] truncate text-zinc-500">{item.proposedTargetPath.split(/[\\/]/).pop()}</span>
                      </div>
                    ))}
                    {items.length > 4 && <div className="px-2 text-[10px] text-zinc-600">+{items.length - 4}</div>}
                    {items.some((item) => item.collisionRenamed) && <div className="pt-1 text-[10px] font-medium text-orange-300">{t.previewCollision}</div>}
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </div>

      <div className="flex items-center justify-between gap-5 border-t border-white/[.07] bg-black/20 px-7 py-5">
        <p className="max-w-2xl text-[11px] leading-5 text-zinc-500">{t.previewSafeNote}</p>
        <div className="flex shrink-0 gap-2">
          <Button variant="ghost" onClick={onClose}>{t.cancel}</Button>
          <Button variant="primary" disabled={busy || preview.movableCount === 0} onClick={onConfirm}>{busy ? t.organizing : t.confirmOrganize}</Button>
        </div>
      </div>
    </DialogShell>
  );
}

interface ResultDialogProps {
  result: OperationResult;
  language: AppLanguage;
  busy: boolean;
  onClose: () => void;
  onUndo: () => void;
  onOpenFolder: (folderPath: string) => void;
}

interface ResultGroup {
  key: string;
  targetDirectory: string;
  items: MovedItem[];
}

export function OrganizationResultDialog({ result, language, busy, onClose, onUndo, onOpenFolder }: ResultDialogProps): JSX.Element {
  const t = copy[language];
  const groups = new Map<string, ResultGroup>();
  for (const item of result.movedItems ?? []) {
    const targetDirectory = item.targetPath.replace(/[\\/][^\\/]+$/, '');
    const key = `${item.source}:${item.category}:${targetDirectory}`;
    const current = groups.get(key) ?? { key, targetDirectory, items: [] };
    current.items.push(item);
    groups.set(key, current);
  }

  return (
    <DialogShell onClose={onClose}>
      <div className="relative overflow-hidden border-b border-white/[.07] px-7 pb-6 pt-7">
        <div className="absolute right-20 top-0 h-40 w-40 rounded-full bg-emerald-400/10 blur-3xl" />
        <div className="mb-4 grid h-12 w-12 place-items-center rounded-2xl bg-emerald-400/12 text-emerald-300"><CheckCircle2 size={24} /></div>
        <h2 className="text-3xl font-bold tracking-[-.04em] text-white">{t.resultTitle}</h2>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-zinc-400">{t.resultSubtitle}</p>
        <div className="mt-5 flex gap-2">
          <Badge className="border-emerald-400/20 bg-emerald-400/10 text-emerald-200">{result.movedCount ?? 0} {t.movedFiles}</Badge>
          <Badge>{result.skippedCount ?? 0} {t.untouchedFiles}</Badge>
          {(result.failedCount ?? 0) > 0 && <Badge className="border-red-400/20 bg-red-400/10 text-red-200">{result.failedCount} {t.failed.toLocaleLowerCase(language === 'tr' ? 'tr-TR' : 'en-US')}</Badge>}
          <Badge>{t.safetyBatchUndo}</Badge>
        </div>
      </div>

      <div className="max-h-[48vh] overflow-y-auto p-5">
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-3">
          {[...groups.values()].map((group) => {
            const first = group.items[0];
            if (!first) return null;
            return (
              <button key={group.key} type="button" onClick={() => onOpenFolder(group.targetDirectory)} className="group rounded-2xl border border-white/[.08] bg-white/[.035] p-4 text-left transition-all hover:-translate-y-0.5 hover:border-white/[.16] hover:bg-white/[.065]">
                <div className="flex items-start justify-between">
                  <CategoryArtwork category={first.category} />
                  <FolderOpen size={17} className="text-zinc-600 transition-colors group-hover:text-white" />
                </div>
                <div className="mt-2 text-sm font-semibold text-white">{categoryLabel(first.category, language)}</div>
                <div className="mt-1 text-xs text-zinc-500">{sourceLabel(first.source, language)} · {group.items.length} {t.shelfFiles}</div>
                <div className="mt-2 truncate text-[10px] text-zinc-600">{group.targetDirectory}</div>
              </button>
            );
          })}
        </div>
      </div>

      <div className="flex justify-end gap-2 border-t border-white/[.07] bg-black/20 px-7 py-5">
        <Button variant="secondary" disabled={busy} onClick={onUndo}><Undo2 size={16} />{t.undoThisBatch}</Button>
        <Button variant="primary" onClick={onClose}>{t.close}</Button>
      </div>
    </DialogShell>
  );
}
