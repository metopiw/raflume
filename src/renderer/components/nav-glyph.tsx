import { cn } from '../lib/utils';

export type NavGlyphKind = 'dashboard' | 'files' | 'history' | 'settings';

export function NavGlyph({ kind, className }: { kind: NavGlyphKind; className?: string }): JSX.Element {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" className={cn('h-[19px] w-[19px]', className)}>
      {kind === 'dashboard' && (
        <>
          <rect x="3" y="3" width="7" height="7" rx="2.2" fill="currentColor" opacity=".92" />
          <rect x="14" y="3" width="7" height="5" rx="2" stroke="currentColor" strokeWidth="1.7" />
          <rect x="3" y="14" width="7" height="7" rx="2.2" stroke="currentColor" strokeWidth="1.7" />
          <path d="M15 15.5h5M15 19h3.2" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
          <path d="M19.4 9.7l.55 1.45 1.45.55-1.45.55-.55 1.45-.55-1.45-1.45-.55 1.45-.55.55-1.45Z" fill="currentColor" />
        </>
      )}
      {kind === 'files' && (
        <>
          <path d="M6.2 4.2h6l2.3 2.4h3.3A2.2 2.2 0 0 1 20 8.8v8.7a2.3 2.3 0 0 1-2.3 2.3H6.2A2.2 2.2 0 0 1 4 17.6V6.4a2.2 2.2 0 0 1 2.2-2.2Z" fill="currentColor" opacity=".22" />
          <path d="M7.5 10.2h9M7.5 13.5h7M7.5 16.8h4.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
          <path d="M15.4 3.5v3.3h3.3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </>
      )}
      {kind === 'history' && (
        <>
          <path d="M5.2 8.2A8 8 0 1 1 4 14" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" />
          <path d="M3.4 4.8v4.5h4.5" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M12 7.4v5l3.2 1.9" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" />
          <circle cx="12" cy="12.4" r="1.25" fill="currentColor" />
        </>
      )}
      {kind === 'settings' && (
        <>
          <path d="M4 6h8M16 6h4M4 12h3M11 12h9M4 18h10M18 18h2" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
          <circle cx="14" cy="6" r="2" fill="currentColor" />
          <circle cx="9" cy="12" r="2" fill="currentColor" />
          <circle cx="16" cy="18" r="2" fill="currentColor" />
        </>
      )}
    </svg>
  );
}
