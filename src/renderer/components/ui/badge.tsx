import type React from 'react';
import { cn } from '../../lib/utils';

export function Badge({ className, ...props }: React.HTMLAttributes<HTMLSpanElement>): JSX.Element {
  return <span className={cn('inline-flex items-center rounded-full bg-white/[.06] px-2.5 py-1 text-[11px] font-semibold text-zinc-300', className)} {...props} />;
}
