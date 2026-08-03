import { useEffect, useState } from 'react';
import type { FileCategory, OrganizableItemKind } from '../../shared/types';
import { cn } from '../lib/utils';
import { CategoryArtwork } from './category-artwork';
import genericFileIcon from '../assets/generated-icons/file-generic.png';

interface FileGlyphProps {
  category: FileCategory;
  extension?: string;
  itemKind?: OrganizableItemKind;
  filePath?: string;
  className?: string;
}

const shortcutExtensions = new Set(['.lnk', '.url', '.website', '.pif', '.scf', '.appref-ms']);
const fileIconCache = new Map<string, string | null>();

function normalizeExtension(extension: string | undefined): string {
  if (!extension) return '';
  return extension.startsWith('.') ? extension.toLowerCase() : `.${extension.toLowerCase()}`;
}

function useFileIcon(filePath: string | undefined, shouldFetch: boolean): string | null {
  const [iconDataUrl, setIconDataUrl] = useState<string | null>(() => {
    if (!filePath) return null;
    return fileIconCache.get(filePath) ?? null;
  });

  useEffect(() => {
    if (!filePath || !shouldFetch) {
      setIconDataUrl(null);
      return;
    }

    const cached = fileIconCache.get(filePath);
    if (cached !== undefined) {
      setIconDataUrl(cached);
      return;
    }

    let disposed = false;
    void window.desktopOrganizer.getFileIcon(filePath)
      .then((result) => {
        fileIconCache.set(filePath, result);
        if (!disposed) setIconDataUrl(result);
      })
      .catch(() => {
        fileIconCache.set(filePath, null);
        if (!disposed) setIconDataUrl(null);
      });

    return () => {
      disposed = true;
    };
  }, [filePath, shouldFetch]);

  return iconDataUrl;
}

function extensionBadgeLabel(normalizedExtension: string): string {
  const short = normalizedExtension.replace('.', '').toUpperCase();
  if (!short) return 'FILE';
  return short.slice(0, short.length > 4 ? 3 : 4);
}

export function FileGlyph({ category, extension, itemKind = 'file', filePath, className }: FileGlyphProps): JSX.Element {
  const normalizedExtension = normalizeExtension(extension);
  const shouldUseSystemFileIcon = itemKind !== 'directory' && !!filePath && (category === 'shortcuts' || shortcutExtensions.has(normalizedExtension));
  const systemIcon = useFileIcon(filePath, shouldUseSystemFileIcon);

  if (itemKind === 'directory') {
    return (
      <div className={cn('grid h-10 w-10 shrink-0 place-items-center overflow-hidden rounded-xl bg-white/[.035]', className)}>
        <CategoryArtwork category="folders" className="h-9 w-9" />
      </div>
    );
  }

  if (systemIcon) {
    return (
      <div className={cn('grid h-10 w-10 shrink-0 place-items-center overflow-hidden rounded-xl bg-white/[.03]', className)}>
        <img src={systemIcon} alt="" aria-hidden="true" draggable={false} className="h-7 w-7 object-contain" />
      </div>
    );
  }

  if (category !== 'other') {
    return (
      <div className={cn('grid h-10 w-10 shrink-0 place-items-center overflow-hidden rounded-xl bg-white/[.028]', className)}>
        <CategoryArtwork category={category} className="h-9 w-9" />
      </div>
    );
  }

  return (
    <div className={cn('relative grid h-10 w-10 shrink-0 place-items-center overflow-hidden rounded-xl bg-white/[.03]', className)}>
      <img src={genericFileIcon} alt="" aria-hidden="true" draggable={false} className="h-8 w-8 object-contain" />
      <span className="pointer-events-none absolute bottom-0.5 rounded-md bg-black/45 px-1 py-[1px] text-[7px] font-bold uppercase tracking-[.08em] text-white/92 shadow-sm backdrop-blur-sm">
        {extensionBadgeLabel(normalizedExtension)}
      </span>
    </div>
  );
}
