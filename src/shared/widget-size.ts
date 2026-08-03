export const WIDGET_SIZE_LIMITS = {
  minWidth: 320,
  minHeight: 380,
  maxWidth: 760,
  maxHeight: 900,
} as const;

export interface WidgetSize {
  width: number;
  height: number;
}

export function clampWidgetSize(width: number, height: number): WidgetSize {
  return {
    width: Math.min(WIDGET_SIZE_LIMITS.maxWidth, Math.max(WIDGET_SIZE_LIMITS.minWidth, Math.round(width))),
    height: Math.min(WIDGET_SIZE_LIMITS.maxHeight, Math.max(WIDGET_SIZE_LIMITS.minHeight, Math.round(height))),
  };
}

export function clampWidgetOpacity(value: number): number {
  return Math.min(0.92, Math.max(0.52, Number(value.toFixed(2))));
}
