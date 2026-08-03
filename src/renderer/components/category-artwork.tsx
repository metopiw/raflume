import type { OrganizableCategory } from '../../shared/types';
import { cn } from '../lib/utils';
import documentsIcon from '../assets/generated-icons/category-documents.png';
import imagesIcon from '../assets/generated-icons/category-images.png';
import archivesIcon from '../assets/generated-icons/category-archives.png';
import foldersIcon from '../assets/generated-icons/category-folders.png';
import shortcutsIcon from '../assets/generated-icons/category-shortcuts.png';

interface CategoryArtworkProps {
  category: OrganizableCategory;
  className?: string;
  empty?: boolean;
}

const rasterCategoryIcons: Partial<Record<OrganizableCategory, string>> = {
  documents: documentsIcon,
  images: imagesIcon,
  archives: archivesIcon,
  folders: foldersIcon,
  shortcuts: shortcutsIcon,
};

const categoryColors: Record<OrganizableCategory, string> = {
  documents: '#8fb4ff',
  images: '#d69cff',
  videos: '#ff9a8f',
  installers: '#77d6aa',
  archives: '#e8b477',
  folders: '#8dd3c7',
  shortcuts: '#b8a6ff',
};

function VectorFallback({ category, className, empty = false }: CategoryArtworkProps): JSX.Element {
  const accent = categoryColors[category];
  return (
    <svg viewBox="0 0 48 48" aria-hidden="true" className={cn('h-10 w-10', empty && 'opacity-35 grayscale', className)}>
      <rect x="4.5" y="6.5" width="39" height="35" rx="10" fill="rgba(255,255,255,.035)" stroke="rgba(255,255,255,.12)" />
      <path d="M12 17h24M12 31h24" stroke="rgba(255,255,255,.16)" strokeWidth="1.4" strokeLinecap="round" />
      <path d="M10 12v24" stroke={accent} strokeWidth="3" strokeLinecap="round" />
      {category === 'videos' && <><rect x="17" y="16" width="19" height="16" rx="4" stroke="currentColor" strokeWidth="1.7" /><path d="m24 21 7 3.5-7 3.5v-7Z" fill="currentColor" /></>}
      {category === 'installers' && <><path d="M26.5 15v12M21.5 22l5 5 5-5M19 32h15" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" /></>}
    </svg>
  );
}

export function CategoryArtwork({ category, className, empty = false }: CategoryArtworkProps): JSX.Element {
  const rasterIcon = rasterCategoryIcons[category];

  if (rasterIcon) {
    return (
      <img
        src={rasterIcon}
        alt=""
        aria-hidden="true"
        draggable={false}
        className={cn('select-none object-contain', empty && 'opacity-35 grayscale', className)}
      />
    );
  }

  return <VectorFallback category={category} className={className} empty={empty} />;
}
