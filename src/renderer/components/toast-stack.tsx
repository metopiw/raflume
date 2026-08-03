import { AlertCircle, CheckCircle2, Info, X } from 'lucide-react';
import type { NotificationPayload } from '../../shared/types';
import { cn } from '../lib/utils';

interface ToastStackProps {
  notifications: NotificationPayload[];
  onDismiss: (id: string) => void;
}

export function ToastStack({ notifications, onDismiss }: ToastStackProps): JSX.Element {
  return (
    <div className="pointer-events-none fixed bottom-5 right-5 z-50 flex w-[360px] flex-col gap-2">
      {notifications.map((notification) => {
        const Icon = notification.kind === 'success' ? CheckCircle2 : notification.kind === 'error' ? AlertCircle : Info;
        return (
          <div key={notification.id} className="pointer-events-auto animate-slide-up rounded-2xl border border-white/10 bg-zinc-950/90 p-4 shadow-2xl backdrop-blur-2xl">
            <div className="flex gap-3">
              <Icon className={cn('mt-0.5 shrink-0', notification.kind === 'success' ? 'text-emerald-400' : notification.kind === 'error' ? 'text-red-400' : 'text-violet-400')} size={18} />
              <div className="min-w-0 flex-1">
                <div className="text-sm font-semibold text-white">{notification.title}</div>
                <div className="mt-1 text-xs leading-relaxed text-zinc-400">{notification.message}</div>
              </div>
              <button type="button" className="text-zinc-600 hover:text-white" onClick={() => onDismiss(notification.id)}><X size={15} /></button>
            </div>
          </div>
        );
      })}
    </div>
  );
}
