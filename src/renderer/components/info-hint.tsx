import { CircleHelp } from 'lucide-react';
import { useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

interface InfoHintProps {
  title: string;
  text: string;
}

interface TooltipPosition {
  left: number;
  top: number;
}

export function InfoHint({ title, text }: InfoHintProps): JSX.Element {
  const buttonRef = useRef<HTMLButtonElement>(null);
  const [visible, setVisible] = useState(false);
  const [position, setPosition] = useState<TooltipPosition>({ left: 16, top: 16 });

  useLayoutEffect(() => {
    if (!visible || !buttonRef.current) return;
    const rect = buttonRef.current.getBoundingClientRect();
    const width = 288;
    const viewportPadding = 14;
    const preferredLeft = rect.left + rect.width / 2 - width / 2;
    const left = Math.min(Math.max(preferredLeft, viewportPadding), window.innerWidth - width - viewportPadding);
    const top = Math.min(rect.bottom + 10, window.innerHeight - 170);
    setPosition({ left, top });
  }, [visible]);

  return (
    <span className="inline-flex">
      <button
        ref={buttonRef}
        type="button"
        aria-label={title}
        aria-expanded={visible}
        onMouseEnter={() => setVisible(true)}
        onMouseLeave={() => setVisible(false)}
        onFocus={() => setVisible(true)}
        onBlur={() => setVisible(false)}
        className="grid h-6 w-6 place-items-center rounded-lg text-zinc-600 transition-colors hover:bg-white/[.06] hover:text-zinc-200"
      >
        <CircleHelp size={15} />
      </button>
      {visible && createPortal(
        <span
          role="tooltip"
          className="pointer-events-none fixed z-[200] w-72 rounded-2xl bg-[#151722]/96 p-3.5 text-left shadow-[0_22px_70px_rgba(0,0,0,.55)] backdrop-blur-2xl"
          style={{ left: position.left, top: position.top }}
        >
          <span className="block text-xs font-semibold text-white">{title}</span>
          <span className="mt-1.5 block text-[11px] leading-5 text-zinc-400">{text}</span>
        </span>,
        document.body,
      )}
    </span>
  );
}
