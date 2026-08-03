import { useEffect, useState } from 'react';
import type {
  AppSettings,
  AppSnapshot,
  NotificationPayload,
  OperationResult,
  OrganizationPreview,
} from '../shared/types';
import { OrganizationResultDialog, OrganizationPreviewDialog } from './components/organization-modal';
import { Sidebar, type ViewName } from './components/sidebar';
import { TitleBar } from './components/title-bar';
import { ToastStack } from './components/toast-stack';
import { copy } from './lib/i18n';
import { DashboardPage } from './pages/dashboard-page';
import { FilesPage } from './pages/files-page';
import { HistoryPage } from './pages/history-page';
import { SettingsPage } from './pages/settings-page';

export function App(): JSX.Element {
  const [snapshot, setSnapshot] = useState<AppSnapshot | null>(null);
  const [view, setView] = useState<ViewName>('dashboard');
  const [busy, setBusy] = useState(false);
  const [notifications, setNotifications] = useState<NotificationPayload[]>([]);
  const [preview, setPreview] = useState<OrganizationPreview | null>(null);
  const [lastResult, setLastResult] = useState<OperationResult | null>(null);

  const language = snapshot?.settings.language ?? 'tr';
  const t = copy[language];
  const accent = snapshot?.settings.accentTheme ?? 'violet';
  const interfaceFont = snapshot?.settings.interfaceFont ?? 'segoe-variable';

  const addLocalError = (error: unknown): void => {
    const message = error instanceof Error ? error.message : t.operationFailed;
    const notification: NotificationPayload = { id: crypto.randomUUID(), kind: 'error', title: t.operationFailed, message };
    setNotifications((current) => [notification, ...current].slice(0, 4));
  };

  useEffect(() => {
    let mounted = true;
    const load = async (): Promise<void> => {
      try {
        const initial = await window.desktopOrganizer.getSnapshot();
        if (mounted) setSnapshot(initial);
      } catch (error) {
        if (mounted) addLocalError(error);
      }
    };

    void load();
    const removeSnapshotListener = window.desktopOrganizer.onSnapshotUpdated((next) => setSnapshot(next));
    const removeNotificationListener = window.desktopOrganizer.onNotification((notification) => {
      setNotifications((current) => [notification, ...current].slice(0, 4));
      window.setTimeout(() => setNotifications((current) => current.filter((item) => item.id !== notification.id)), 5200);
    });
    const removePreviewListener = window.desktopOrganizer.onPreviewRequested(() => {
      void window.desktopOrganizer.previewOrganization()
        .then((nextPreview) => setPreview(nextPreview))
        .catch((error: unknown) => addLocalError(error));
    });

    return () => {
      mounted = false;
      removeSnapshotListener();
      removeNotificationListener();
      removePreviewListener();
    };
  }, []);

  const runOperation = async (operation: () => Promise<OperationResult>): Promise<OperationResult | null> => {
    setBusy(true);
    try {
      const result = await operation();
      if (!result.success) addLocalError(new Error(result.message));
      return result;
    } catch (error) {
      addLocalError(error);
      return null;
    } finally {
      setBusy(false);
    }
  };

  const updateSettings = async (patch: Partial<AppSettings>): Promise<void> => {
    const previous = snapshot;
    if (previous) {
      setSnapshot({
        ...previous,
        settings: {
          ...previous.settings,
          ...patch,
          watchedLocations: {
            ...previous.settings.watchedLocations,
            ...(patch.watchedLocations ?? {}),
          },
          organizationRules: {
            ...previous.settings.organizationRules,
            ...(patch.organizationRules ?? {}),
          },
          desktopWidget: {
            ...previous.settings.desktopWidget,
            ...(patch.desktopWidget ?? {}),
          },
        },
      });
    }
    try {
      const next = await window.desktopOrganizer.updateSettings(patch);
      setSnapshot(next);
    } catch (error) {
      if (previous) setSnapshot(previous);
      addLocalError(error);
    }
  };

  const refresh = async (): Promise<void> => {
    try {
      setSnapshot(await window.desktopOrganizer.refreshFiles());
    } catch (error) {
      addLocalError(error);
    }
  };

  const openOrganizationPreview = async (): Promise<void> => {
    setBusy(true);
    try {
      setPreview(await window.desktopOrganizer.previewOrganization());
    } catch (error) {
      addLocalError(error);
    } finally {
      setBusy(false);
    }
  };

  const confirmOrganization = async (): Promise<void> => {
    const result = await runOperation(() => window.desktopOrganizer.organizeNow());
    if (!result) return;
    setPreview(null);
    if ((result.movedCount ?? 0) > 0) setLastResult(result);
  };

  const undoLastBatch = async (closeResultAfterSuccess = false): Promise<void> => {
    const result = await runOperation(() => window.desktopOrganizer.undoLastMove());
    if (result?.success && closeResultAfterSuccess) setLastResult(null);
  };

  const openFolder = async (folderPath: string): Promise<void> => {
    try {
      const result = await window.desktopOrganizer.openFolder(folderPath);
      if (!result.success) addLocalError(new Error(result.message));
    } catch (error) {
      addLocalError(error);
    }
  };

  let content: JSX.Element;
  if (!snapshot) {
    content = <div className="grid h-full place-items-center"><div className="h-8 w-8 animate-spin rounded-full border-2 border-white/15 border-t-white" /></div>;
  } else if (view === 'files') {
    content = <FilesPage snapshot={snapshot} language={language} onRefresh={() => void refresh()} />;
  } else if (view === 'history') {
    content = <HistoryPage snapshot={snapshot} language={language} onUndo={() => void undoLastBatch()} />;
  } else if (view === 'settings') {
    content = <SettingsPage settings={snapshot.settings} language={language} onUpdate={(patch) => void updateSettings(patch)} />;
  } else {
    content = (
      <DashboardPage
        snapshot={snapshot}
        language={language}
        busy={busy}
        onOrganize={() => void openOrganizationPreview()}
        onUndo={() => void undoLastBatch()}
        onRefresh={() => void refresh()}
        onAutomaticModeChange={(checked) => void updateSettings({ automaticMode: checked })}
        onOpenFiles={() => setView('files')}
        onOpenFolder={(folderPath) => void openFolder(folderPath)}
        onError={(message) => addLocalError(new Error(message))}
      />
    );
  }

  return (
    <div className="flex h-screen min-w-[1040px] flex-col overflow-hidden bg-[#07080d] text-zinc-100" data-accent={accent} data-font={interfaceFont}>
      <TitleBar />
      <div className="flex min-h-0 flex-1">
        <Sidebar language={language} currentView={view} onViewChange={setView} automaticMode={snapshot?.settings.automaticMode ?? false} protectedMoveCount={snapshot?.stats.protectedMoveCount ?? 0} />
        <main className="relative min-w-0 flex-1 overflow-y-auto overflow-x-hidden">
          <div className="app-ambient pointer-events-none fixed inset-0 top-10" />
          <div className="relative min-h-full">{content}</div>
        </main>
      </div>
      <ToastStack notifications={notifications} onDismiss={(id) => setNotifications((current) => current.filter((item) => item.id !== id))} />

      {preview && (
        <OrganizationPreviewDialog
          preview={preview}
          language={language}
          busy={busy}
          onClose={() => setPreview(null)}
          onConfirm={() => void confirmOrganization()}
        />
      )}
      {lastResult && (
        <OrganizationResultDialog
          result={lastResult}
          language={language}
          busy={busy}
          onClose={() => setLastResult(null)}
          onUndo={() => void undoLastBatch(true)}
          onOpenFolder={(folderPath) => void openFolder(folderPath)}
        />
      )}
    </div>
  );
}
