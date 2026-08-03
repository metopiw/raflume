/// <reference types="vite/client" />

import type { DesktopOrganizerApi } from '../shared/types';

declare global {
  interface Window {
    desktopOrganizer: DesktopOrganizerApi;
  }
}

export {};
