import {
  BellRing,
  FolderTree,
  Images,
  Keyboard,
  Languages,
  Link2,
  MonitorUp,
  Palette,
  PanelsTopLeft,
  Radar,
  ScanSearch,
  ShieldCheck,
  Type,
} from 'lucide-react';
import type { AppLanguage, AppSettings, DesktopWidgetCorner } from '../../shared/types';
import { BrandMark } from '../components/brand-mark';
import { Switch } from '../components/ui/switch';
import {
  ACCENT_OPTIONS,
  APPLICATION_FONT_OPTIONS,
  WIDGET_CORNERS,
  WIDGET_DESIGN_OPTIONS,
  WIDGET_FONT_OPTIONS,
} from '../lib/appearance';
import { copy } from '../lib/i18n';
import { cn } from '../lib/utils';

interface SettingsPageProps {
  settings: AppSettings;
  language: AppLanguage;
  onUpdate: (patch: Partial<AppSettings>) => void;
}

function SettingRow({ icon, title, description, control }: { icon: JSX.Element; title: string; description: string; control: JSX.Element }): JSX.Element {
  return (
    <div className="settings-row flex items-center gap-4 py-4">
      <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-white/[.045] text-zinc-300">{icon}</div>
      <div className="min-w-0 flex-1">
        <div className="text-sm font-semibold text-white">{title}</div>
        <div className="mt-1 max-w-3xl text-xs leading-5 text-zinc-400">{description}</div>
      </div>
      <div className="shrink-0">{control}</div>
    </div>
  );
}

function SettingsSection({ title, description, children }: { title: string; description?: string; children: React.ReactNode }): JSX.Element {
  return (
    <section className="settings-section rounded-[24px] px-5 py-4">
      <div className="mb-2">
        <div className="text-sm font-semibold text-zinc-200">{title}</div>
        {description && <div className="mt-1.5 max-w-4xl text-xs leading-5 text-zinc-400">{description}</div>}
      </div>
      {children}
    </section>
  );
}

export function SettingsPage({ settings, language, onUpdate }: SettingsPageProps): JSX.Element {
  const t = copy[language];
  const widget = settings.desktopWidget;
  const rules = settings.organizationRules;

  return (
    <div className="page-content settings-page animate-fade-in space-y-5 p-6 xl:p-7">
      <header>
        <h1 className="text-3xl font-bold tracking-[-.025em] text-white">{t.settings}</h1>
        <p className="mt-2 text-sm text-zinc-400">{language === 'tr' ? 'Raflume’un davranışını, görünümünü, düzenleme kurallarını ve masaüstü widget’ını buradan yönet.' : 'Manage Raflume’s behavior, appearance, organization rules, and desktop widget here.'}</p>
      </header>

      <SettingsSection title={language === 'tr' ? 'Otomatik düzenleme kuralları' : 'Automatic organization rules'} description={language === 'tr' ? 'Otomatik modun hangi öğelere ve ne zaman dokunacağını açıkça seç.' : 'Choose exactly which items automatic mode may move and when.'}>
        <SettingRow
          icon={<ScanSearch size={18} />}
          title={language === 'tr' ? 'Mevcut öğeleri de tara' : 'Scan existing items too'}
          description={language === 'tr' ? 'Otomatik düzenleme açıldığında, uygulama otomatik mod açıkken başladığında veya yeni bir radar kaynağı etkinleştirildiğinde mevcut desteklenen öğeleri bir saniye sonra tarar. Kapalıysa yalnızca sonradan gelenleri işler.' : 'Scans existing supported items one second after automatic organization is enabled, the app starts with automatic mode active, or a new radar source is enabled. When off, only new arrivals are handled.'}
          control={<Switch checked={rules.scanExistingOnAutomaticEnable} onCheckedChange={(checked) => onUpdate({ organizationRules: { ...rules, scanExistingOnAutomaticEnable: checked } })} label={language === 'tr' ? 'Mevcut öğeleri tara' : 'Scan existing items'} />}
        />
        <SettingRow
          icon={<FolderTree size={18} />}
          title={language === 'tr' ? 'Klasörleri düzenle' : 'Organize folders'}
          description={language === 'tr' ? 'Kök seviyedeki normal klasörleri Klasörler rafına taşır. Raflume’un kendi raf klasörleri daima korunur.' : 'Moves ordinary root-level folders into the Folders shelf. Raflume shelf folders are always protected.'}
          control={<Switch checked={rules.includeFolders} onCheckedChange={(checked) => onUpdate({ organizationRules: { ...rules, includeFolders: checked } })} label={language === 'tr' ? 'Klasörleri düzenle' : 'Organize folders'} />}
        />
        <SettingRow
          icon={<Link2 size={18} />}
          title={language === 'tr' ? 'Kısayolları düzenle' : 'Organize shortcuts'}
          description={language === 'tr' ? '.lnk, .url, .website, .pif, .scf ve .appref-ms kısayollarını Kısayollar rafına taşır. Programın kendisi taşınmaz.' : 'Moves .lnk, .url, .website, .pif, .scf, and .appref-ms shortcut files into the Shortcuts shelf. The program itself never moves.'}
          control={<Switch checked={rules.includeShortcuts} onCheckedChange={(checked) => onUpdate({ organizationRules: { ...rules, includeShortcuts: checked } })} label={language === 'tr' ? 'Kısayolları düzenle' : 'Organize shortcuts'} />}
        />
      </SettingsSection>

      <SettingsSection title={t.locations} description={t.locationsHelp}>
        <SettingRow icon={<Radar size={18} />} title={t.watchDesktop} description={t.watchDesktopDescription} control={<Switch checked={settings.watchedLocations.desktop} onCheckedChange={(checked) => onUpdate({ watchedLocations: { ...settings.watchedLocations, desktop: checked } })} label={t.watchDesktop} />} />
        <SettingRow icon={<Radar size={18} />} title={t.watchDownloads} description={t.watchDownloadsDescription} control={<Switch checked={settings.watchedLocations.downloads} onCheckedChange={(checked) => onUpdate({ watchedLocations: { ...settings.watchedLocations, downloads: checked } })} label={t.watchDownloads} />} />
      </SettingsSection>

      <SettingsSection title={language === 'tr' ? 'Ana arayüz görünümü' : 'Main interface appearance'} description={language === 'tr' ? 'Renk yalnızca vurgu elemanlarını değiştirir. Beyaz ve gri metinler her temada nötr ve opak kalır.' : 'Color changes only accent elements. White and gray text stays neutral and opaque in every theme.'}>
        <div className="py-4">
          <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-white"><Palette size={16} />{t.colorsTitle}</div>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 xl:grid-cols-8">
            {ACCENT_OPTIONS.map((option) => (
              <button key={option.id} type="button" onClick={() => onUpdate({ accentTheme: option.id })} className={cn('theme-swatch rounded-2xl p-3 text-left', settings.accentTheme === option.id && 'is-active')} aria-pressed={settings.accentTheme === option.id}>
                <span className="mb-3 flex gap-1.5">{option.colors.map((color) => <span key={color} className="h-5 flex-1 rounded-full" style={{ background: color }} />)}</span>
                <span className="text-[11px] font-semibold text-zinc-300">{option.label[language]}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="border-t border-white/[.045] py-4">
          <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-white"><Type size={16} />{language === 'tr' ? 'Ana arayüz yazı tipi' : 'Main interface font'}</div>
          <div className="grid gap-2 md:grid-cols-3">
            {APPLICATION_FONT_OPTIONS.map((option) => (
              <button key={option.id} type="button" onClick={() => onUpdate({ interfaceFont: option.id })} className={cn('app-font-choice rounded-2xl p-3 text-left', settings.interfaceFont === option.id && 'is-active')} style={{ fontFamily: option.family }}>
                <span className="block text-sm font-semibold text-zinc-100">{option.label}</span>
                <span className="mt-1 block text-xs leading-5 text-zinc-400">{option.description[language]}</span>
              </button>
            ))}
          </div>
        </div>
      </SettingsSection>

      <SettingsSection title={t.appearance}>
        <SettingRow
          icon={<Languages size={18} />}
          title={t.language}
          description={language === 'tr' ? 'Arayüz, bildirimler ve işlem açıklamaları anında değişir.' : 'The interface, notifications, and operation explanations change instantly.'}
          control={<div className="flex rounded-xl bg-black/20 p-1">{(['tr', 'en'] as const).map((item) => <button key={item} type="button" onClick={() => onUpdate({ language: item })} className={cn('rounded-lg px-3 py-2 text-xs font-semibold transition-colors', language === item ? 'bg-white text-zinc-950' : 'text-zinc-500 hover:text-white')}>{item === 'tr' ? t.turkish : t.english}</button>)}</div>}
        />
        <SettingRow icon={<BellRing size={18} />} title={t.notifications} description={t.notificationsDescription} control={<Switch checked={settings.showNotifications} onCheckedChange={(checked) => onUpdate({ showNotifications: checked })} label={t.notifications} />} />
        <SettingRow icon={<Images size={18} />} title={language === 'tr' ? 'Pano görsel geçmişi' : 'Clipboard image history'} description={language === 'tr' ? 'Print Screen ve kopyalanan görselleri yalnızca bu bilgisayarda tutar. En fazla 12 kayıt saklanır.' : 'Keeps Print Screen and copied images only on this computer. Up to 12 items are stored.'} control={<Switch checked={settings.clipboardImageHistory} onCheckedChange={(checked) => onUpdate({ clipboardImageHistory: checked })} label={language === 'tr' ? 'Pano görsel geçmişi' : 'Clipboard image history'} />} />
        <SettingRow icon={<MonitorUp size={18} />} title={t.launchAtStartup} description={t.launchAtStartupDescription} control={<Switch checked={settings.launchAtStartup} onCheckedChange={(checked) => onUpdate({ launchAtStartup: checked })} label={t.launchAtStartup} />} />
      </SettingsSection>

      <SettingsSection title={t.widgetTitle} description={language === 'tr' ? 'Widget ana uygulamadan bağımsız renk, yazı tipi ve yüzey tasarımına sahiptir.' : 'The widget has independent color, font, and surface design settings.'}>
        <SettingRow
          icon={<PanelsTopLeft size={18} />}
          title={t.widgetEnabled}
          description={language === 'tr' ? 'Görev çubuğunda yer kaplamayan, yeniden boyutlandırılabilir raf penceresini gösterir.' : 'Shows a resizable shelf window without taking taskbar space.'}
          control={<Switch checked={widget.enabled} onCheckedChange={(checked) => onUpdate({ desktopWidget: { ...widget, enabled: checked } })} label={t.widgetEnabled} />}
        />

        <div className="grid gap-5 py-4 xl:grid-cols-[1fr_1fr]">
          <div>
            <div className="mb-3 text-sm font-semibold text-white">{t.widgetCorner}</div>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              {WIDGET_CORNERS.map((corner) => (
                <button key={corner} type="button" disabled={!widget.enabled} onClick={() => onUpdate({ desktopWidget: { ...widget, corner } })} className={cn('corner-choice rounded-2xl px-3 py-3 text-xs font-semibold', widget.corner === corner && 'is-active')}>
                  <CornerGlyph corner={corner} />
                  {cornerLabel(corner, language)}
                </button>
              ))}
            </div>
          </div>
          <div className="space-y-4">
            <WidgetChoiceGroup
              title={language === 'tr' ? 'Boyut' : 'Size'}
              options={[
                { label: language === 'tr' ? 'Küçük' : 'Small', value: '340×430', active: widget.width <= 360, onClick: () => onUpdate({ desktopWidget: { ...widget, width: 340, height: 430 } }) },
                { label: language === 'tr' ? 'Orta' : 'Medium', value: '420×560', active: widget.width > 360 && widget.width < 540, onClick: () => onUpdate({ desktopWidget: { ...widget, width: 420, height: 560 } }) },
                { label: language === 'tr' ? 'Büyük' : 'Large', value: '580×720', active: widget.width >= 540, onClick: () => onUpdate({ desktopWidget: { ...widget, width: 580, height: 720 } }) },
              ]}
            />
            <WidgetChoiceGroup
              title={language === 'tr' ? 'Saydamlık' : 'Opacity'}
              options={[
                { label: language === 'tr' ? 'Hafif' : 'Light', value: '58%', active: widget.opacity < .66, onClick: () => onUpdate({ desktopWidget: { ...widget, opacity: .58 } }) },
                { label: language === 'tr' ? 'Dengeli' : 'Balanced', value: '74%', active: widget.opacity >= .66 && widget.opacity < .82, onClick: () => onUpdate({ desktopWidget: { ...widget, opacity: .74 } }) },
                { label: language === 'tr' ? 'Yoğun' : 'Dense', value: '88%', active: widget.opacity >= .82, onClick: () => onUpdate({ desktopWidget: { ...widget, opacity: .88 } }) },
              ]}
            />
          </div>
        </div>

        <div className="mt-2 grid gap-5 xl:grid-cols-[1.15fr_.85fr]">
          <div>
            <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-white"><Palette size={16} />{language === 'tr' ? 'Widget rengi · 8 seçenek' : 'Widget color · 8 options'}</div>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              {ACCENT_OPTIONS.map((option) => (
                <button key={option.id} type="button" onClick={() => onUpdate({ desktopWidget: { ...widget, colorTheme: option.id } })} className={cn('theme-swatch rounded-2xl p-3 text-left', widget.colorTheme === option.id && 'is-active')} aria-pressed={widget.colorTheme === option.id}>
                  <span className="mb-2 flex gap-1.5">{option.colors.map((color) => <span key={color} className="h-4 flex-1 rounded-full" style={{ background: color }} />)}</span>
                  <span className="text-[10px] font-semibold text-zinc-300">{option.label[language]}</span>
                </button>
              ))}
            </div>
          </div>
          <div>
            <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-white"><Type size={16} />{language === 'tr' ? 'Widget yazı tipi · 5 seçenek' : 'Widget font · 5 options'}</div>
            <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-1">
              {WIDGET_FONT_OPTIONS.map((option) => (
                <button key={option.id} type="button" onClick={() => onUpdate({ desktopWidget: { ...widget, font: option.id } })} className={cn('widget-font-choice flex items-center justify-between rounded-xl px-3 py-2.5 text-left', widget.font === option.id && 'is-active')} style={{ fontFamily: option.family }}>
                  <span className="text-xs font-semibold text-zinc-200">{option.label}</span>
                  <span className="text-[11px] text-zinc-500">Raf 129</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-5">
          <div className="mb-3 text-sm font-semibold text-white">{language === 'tr' ? 'Widget görsel tasarımı · 3 seçenek' : 'Widget visual design · 3 options'}</div>
          <div className="grid gap-3 md:grid-cols-3">
            {WIDGET_DESIGN_OPTIONS.map((option) => (
              <button key={option.id} type="button" onClick={() => onUpdate({ desktopWidget: { ...widget, design: option.id } })} className={cn('widget-design-choice rounded-2xl p-4 text-left', widget.design === option.id && 'is-active')}>
                <WidgetDesignPreview design={option.id} />
                <div className="mt-3 text-sm font-semibold text-zinc-100">{option.label[language]}</div>
                <div className="mt-1 text-xs leading-5 text-zinc-400">{option.description[language]}</div>
              </button>
            ))}
          </div>
        </div>
      </SettingsSection>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <section className="settings-section rounded-[24px] p-5">
          <div className="mb-4 grid h-10 w-10 place-items-center rounded-xl accent-muted accent-text"><Keyboard size={18} /></div>
          <div className="text-sm font-semibold text-white">{t.shortcut}</div>
          <p className="mt-2 text-xs leading-5 text-zinc-400">{language === 'tr' ? 'Raflume arka plandayken düzenleme önizlemesini açar. Otomatik mod kapalıysa hiçbir öğe onay vermeden taşınmaz.' : 'Opens the organization preview while Raflume is in the background. When automatic mode is off, nothing moves before approval.'}</p>
          <kbd className="mt-3 inline-flex rounded-lg bg-black/30 px-3 py-2 font-mono text-xs text-zinc-300">Ctrl + Shift + O</kbd>
        </section>
        <section className="settings-section relative overflow-hidden rounded-[24px] p-5">
          <div className="mb-4 grid h-10 w-10 place-items-center rounded-xl bg-emerald-400/10 text-emerald-300"><ShieldCheck size={18} /></div>
          <div className="text-sm font-semibold text-white">{t.safety}</div>
          <p className="mt-2 text-xs leading-5 text-zinc-400">{t.safetyText}</p>
          <div className="mt-4 flex flex-wrap gap-2 text-[10px] font-semibold text-zinc-400"><span className="rounded-full bg-white/[.05] px-2.5 py-1">{t.safetyNeverDelete}</span><span className="rounded-full bg-white/[.05] px-2.5 py-1">{t.safetyNoOverwrite}</span><span className="rounded-full bg-white/[.05] px-2.5 py-1">{t.safetyBatchUndo}</span></div>
        </section>
      </div>

      <section className="about-strip flex flex-col gap-4 rounded-[24px] p-5 sm:flex-row sm:items-center">
        <BrandMark className="h-14 w-14 shrink-0" />
        <div className="min-w-0 flex-1"><div className="text-sm font-semibold text-white">{t.aboutTitle}</div><p className="mt-1.5 text-xs leading-5 text-zinc-400">{t.aboutDescription}</p></div>
        <div className="text-right text-[11px] text-zinc-500"><div>Raflume 1.6.5</div><div className="mt-1">MIT · by mertpivvo</div></div>
      </section>
    </div>
  );
}

function WidgetChoiceGroup({ title, options }: { title: string; options: Array<{ label: string; value: string; active: boolean; onClick: () => void }> }): JSX.Element {
  return <div><div className="mb-2 text-xs font-semibold text-zinc-300">{title}</div><div className="grid grid-cols-3 gap-1 rounded-xl bg-black/20 p-1">{options.map((option) => <button key={option.value} type="button" onClick={option.onClick} className={cn('rounded-lg px-2 py-2 text-center transition-colors', option.active ? 'bg-white text-zinc-950' : 'text-zinc-500 hover:text-zinc-200')}><span className="block text-[10px] font-semibold">{option.label}</span><span className="mt-0.5 block text-[9px] opacity-60">{option.value}</span></button>)}</div></div>;
}

function WidgetDesignPreview({ design }: { design: AppSettings['desktopWidget']['design'] }): JSX.Element {
  if (design === 'minimal') return <div className="h-20 rounded-lg bg-black/35 p-2 shadow-[inset_3px_0_var(--accent)]"><div className="mb-2 h-2 w-16 rounded bg-white/20" /><div className="space-y-1.5"><div className="h-3 border-b border-white/10" /><div className="h-3 border-b border-white/10" /><div className="h-3 border-b border-white/10" /></div></div>;
  if (design === 'shelf') return <div className="h-20 rounded-xl bg-black/30 p-2"><div className="mb-2 h-2 w-16 rounded accent-bg opacity-70" /><div className="space-y-2"><div className="h-4 rounded bg-white/[.07] shadow-[0_3px_0_-1px_var(--accent)]" /><div className="h-4 rounded bg-white/[.07] shadow-[0_3px_0_-1px_var(--accent)]" /></div></div>;
  return <div className="h-20 rounded-2xl bg-white/[.04] p-2 shadow-[inset_0_0_0_1px_rgba(255,255,255,.1)]"><div className="mb-2 h-2 w-16 rounded accent-bg opacity-70" /><div className="grid grid-cols-2 gap-2"><div className="h-10 rounded-xl bg-white/[.06]" /><div className="h-10 rounded-xl bg-white/[.04]" /></div></div>;
}

function CornerGlyph({ corner }: { corner: DesktopWidgetCorner }): JSX.Element {
  return <span className="mb-2 block h-8 rounded-lg bg-black/25 p-1"><span className={cn('block h-3 w-5 rounded accent-bg', corner.endsWith('right') && 'ml-auto', corner.startsWith('bottom') && 'mt-3')} /></span>;
}

function cornerLabel(corner: DesktopWidgetCorner, language: AppLanguage): string {
  const t = copy[language];
  const labels: Record<DesktopWidgetCorner, string> = { 'top-left': t.topLeft, 'top-right': t.topRight, 'bottom-left': t.bottomLeft, 'bottom-right': t.bottomRight };
  return labels[corner];
}
