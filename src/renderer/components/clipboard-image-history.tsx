import { ClipboardCopy, Download, Images, Trash2 } from 'lucide-react';
import type { AppLanguage, ClipboardImageRecord } from '../../shared/types';
import { formatRelativeDate } from '../lib/utils';

interface ClipboardImageHistoryProps {
  images: ClipboardImageRecord[];
  language: AppLanguage;
  enabled: boolean;
  onError: (message: string) => void;
}

export function ClipboardImageHistory({ images, language, enabled, onError }: ClipboardImageHistoryProps): JSX.Element {
  const copyImage = async (id: string): Promise<void> => {
    const result = await window.desktopOrganizer.copyClipboardImage(id);
    if (!result.success) onError(result.message);
  };

  const saveImage = async (id: string): Promise<void> => {
    const result = await window.desktopOrganizer.saveClipboardImage(id);
    if (!result.success) onError(result.message);
  };

  const clearImages = async (): Promise<void> => {
    const result = await window.desktopOrganizer.clearClipboardImages();
    if (!result.success) onError(result.message);
  };

  return (
    <section className="clipboard-history">
      <div className="mb-3 flex items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 text-sm font-semibold text-zinc-100"><Images size={16} />{language === 'tr' ? 'Pano görsel geçmişi' : 'Clipboard image history'}</div>
          <p className="mt-1 text-xs leading-5 text-zinc-400">{enabled
            ? language === 'tr' ? 'Print Screen ve kopyaladığın son görseller. En fazla 12 kayıt tutulur.' : 'Recent Print Screen and copied images. Up to 12 items are kept.'
            : language === 'tr' ? 'Yeni görsel kaydı kapalı. Mevcut kayıtlar erişilebilir.' : 'New image capture is off. Existing items remain available.'}</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs tabular-nums text-zinc-500">{images.length}/12</span>
          <button
            type="button"
            className="clipboard-clear-button"
            title={language === 'tr' ? 'Pano görsel geçmişini temizle' : 'Clear clipboard image history'}
            aria-label={language === 'tr' ? 'Pano görsel geçmişini temizle' : 'Clear clipboard image history'}
            disabled={images.length === 0}
            onClick={() => void clearImages()}
          >
            <Trash2 size={14} />
          </button>
        </div>
      </div>

      {images.length === 0 ? (
        <div className="clipboard-empty grid min-h-28 place-items-center rounded-2xl text-center text-xs leading-5 text-zinc-500">
          <div><Images size={22} className="mx-auto mb-2 text-zinc-600" />{language === 'tr' ? 'Henüz kopyalanmış bir görsel yok.' : 'No copied image yet.'}</div>
        </div>
      ) : (
        <div className="clipboard-strip flex gap-2.5 overflow-x-auto pb-1">
          {images.map((image) => (
            <article key={image.id} className="clipboard-shot group relative shrink-0 overflow-hidden rounded-xl">
              <img src={image.thumbnailDataUrl} alt="" className="h-24 w-40 object-cover" />
              <div className="clipboard-shot-overlay absolute inset-0 flex items-end justify-between gap-2 p-2 opacity-0 transition-opacity group-hover:opacity-100">
                <span className="text-[9px] font-medium text-white">{formatRelativeDate(image.capturedAt, language)}</span>
                <span className="flex gap-1">
                  <button type="button" className="clipboard-shot-action" title={language === 'tr' ? 'Panoya kopyala' : 'Copy to clipboard'} onClick={() => void copyImage(image.id)}><ClipboardCopy size={13} /></button>
                  <button type="button" className="clipboard-shot-action" title={language === 'tr' ? 'Resimler klasörüne kaydet' : 'Save to Pictures'} onClick={() => void saveImage(image.id)}><Download size={13} /></button>
                </span>
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
