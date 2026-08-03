import { cn } from '../lib/utils';

interface IdentityGlyphProps {
  kind: 'radar' | 'shelves' | 'shield';
  className?: string;
}

export function IdentityGlyph({ kind, className }: IdentityGlyphProps): JSX.Element {
  return (
    <svg viewBox="0 0 48 48" aria-hidden="true" className={cn('select-none', className)}>
      <rect x="2" y="2" width="44" height="44" rx="14" fill="var(--accent-muted)" />
      {kind === 'radar' && (
        <>
          <circle cx="24" cy="24" r="12" fill="none" stroke="var(--accent-soft)" strokeWidth="2" opacity=".45" />
          <circle cx="24" cy="24" r="7" fill="none" stroke="var(--accent)" strokeWidth="2" opacity=".8" />
          <path d="M24 24 34 16" stroke="var(--accent-soft)" strokeWidth="2.5" strokeLinecap="round" />
          <circle cx="24" cy="24" r="2.8" fill="var(--accent-soft)" />
          <circle cx="34" cy="16" r="2.2" fill="white" />
        </>
      )}
      {kind === 'shelves' && (
        <>
          <rect x="12" y="13" width="24" height="22" rx="6" fill="none" stroke="var(--accent-soft)" strokeWidth="2" />
          <path d="M16 20h16M16 27h16" stroke="var(--accent)" strokeWidth="2" strokeLinecap="round" />
          <path d="M19 17v6M27 24v6" stroke="white" strokeWidth="2" strokeLinecap="round" opacity=".9" />
        </>
      )}
      {kind === 'shield' && (
        <>
          <path d="M24 10.5 35 15v8.2c0 7-4.5 12-11 15.1-6.5-3.1-11-8.1-11-15.1V15l11-4.5Z" fill="none" stroke="var(--accent-soft)" strokeWidth="2.2" />
          <path d="m18.5 24 3.6 3.7 7.8-8" fill="none" stroke="var(--accent)" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" />
        </>
      )}
    </svg>
  );
}
