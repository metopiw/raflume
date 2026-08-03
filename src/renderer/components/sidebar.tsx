import type { AppLanguage } from '../../shared/types';
import { copy } from '../lib/i18n';
import { cn } from '../lib/utils';
import { BrandMark } from './brand-mark';
import { NavGlyph, type NavGlyphKind } from './nav-glyph';

export type ViewName = 'dashboard' | 'files' | 'history' | 'settings';

interface SidebarProps {
  language: AppLanguage;
  currentView: ViewName;
  onViewChange: (view: ViewName) => void;
  automaticMode: boolean;
  protectedMoveCount: number;
}

export function Sidebar({ language, currentView, onViewChange, automaticMode, protectedMoveCount }: SidebarProps): JSX.Element {
  const t = copy[language];
  const items = [
    { id: 'dashboard' as const, label: t.dashboard, icon: 'dashboard' as NavGlyphKind },
    { id: 'files' as const, label: t.files, icon: 'files' as NavGlyphKind },
    { id: 'history' as const, label: t.history, icon: 'history' as NavGlyphKind },
    { id: 'settings' as const, label: t.settings, icon: 'settings' as NavGlyphKind },
  ];

  return (
    <aside className="glass-sidebar flex w-[248px] shrink-0 flex-col overflow-hidden p-4 backdrop-blur-3xl">
      <div className="mb-7 flex min-w-0 items-center gap-3 p-2.5">
        <BrandMark className="h-12 w-12 shrink-0" />
        <div className="min-w-0">
          <div className="truncate text-[17px] font-bold tracking-tight text-white">{t.appName}</div>
          <div className="mt-0.5 truncate text-[10px] font-medium tracking-[.02em] text-zinc-500">{t.appTagline}</div>
        </div>
      </div>

      <nav className="space-y-1.5">
        {items.map(({ id, label, icon }) => (
          <button
            key={id}
            type="button"
            onClick={() => onViewChange(id)}
            className={cn('glass-nav-item', currentView === id && 'is-active')}
          >
            <NavGlyph kind={icon} className="h-[18px] w-[18px]" />
            <span className="truncate">{label}</span>
          </button>
        ))}
      </nav>

      <div className="sidebar-safety mt-auto px-2 pb-2">
        <div className="flex items-center gap-2 text-[11px] font-semibold text-zinc-300">
          <span className={cn('h-1.5 w-1.5 rounded-full', automaticMode ? 'bg-emerald-400' : 'bg-zinc-600')} />
          {automaticMode
            ? language === 'tr' ? 'Otomatik düzenleme aktif' : 'Automatic organization active'
            : language === 'tr' ? 'Güvenlik günlüğü aktif' : 'Safety journal active'}
        </div>
        <p className="mt-1.5 text-[10px] leading-4 text-zinc-500">{protectedMoveCount} {language === 'tr' ? 'hareket geri alınabilir durumda.' : 'moves are currently undoable.'}</p>
      </div>
    </aside>
  );
}
