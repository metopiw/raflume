import type { DesktopWidgetCorner } from './types';

export interface WorkArea {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface WindowSize {
  width: number;
  height: number;
}

export interface WindowPosition {
  x: number;
  y: number;
}

export function calculateWidgetPosition(
  workArea: WorkArea,
  size: WindowSize,
  corner: DesktopWidgetCorner,
  margin = 22,
): WindowPosition {
  const left = workArea.x + margin;
  const right = workArea.x + workArea.width - size.width - margin;
  const top = workArea.y + margin;
  const bottom = workArea.y + workArea.height - size.height - margin;

  return {
    x: corner.endsWith('right') ? right : left,
    y: corner.startsWith('bottom') ? bottom : top,
  };
}
