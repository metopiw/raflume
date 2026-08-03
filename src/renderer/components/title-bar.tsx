import { Minus, Square, X } from 'lucide-react';

export function TitleBar(): JSX.Element {
  return (
    <div className="titlebar flex h-10 shrink-0 items-center justify-end bg-[#05060b]/88 px-2 backdrop-blur-3xl">
      <div className="no-drag flex items-center gap-0.5">
        <button className="window-button" aria-label="Minimize" onClick={() => void window.desktopOrganizer.minimizeWindow()}><Minus size={15} /></button>
        <button className="window-button" aria-label="Maximize" onClick={() => void window.desktopOrganizer.toggleMaximizeWindow()}><Square size={12} /></button>
        <button className="window-button hover:!bg-red-500 hover:!text-white" aria-label="Close" onClick={() => void window.desktopOrganizer.closeWindow()}><X size={15} /></button>
      </div>
    </div>
  );
}
