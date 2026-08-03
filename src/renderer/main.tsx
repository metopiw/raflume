import React from 'react';
import ReactDOM from 'react-dom/client';
import { App } from './app';
import { DesktopWidget } from './desktop-widget';
import './styles.css';

async function bootstrap(): Promise<void> {
  const searchParams = new URLSearchParams(window.location.search);
  const mockRequested = searchParams.get('mock') === '1';
  const surface = searchParams.get('surface');
  if (surface === 'widget') document.documentElement.dataset.surface = 'widget';
  if ((import.meta.env.DEV || mockRequested) && typeof window.desktopOrganizer === 'undefined') {
    await import('./dev-mock');
  }

  ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
    <React.StrictMode>
      {surface === 'widget' ? <DesktopWidget /> : <App />}
    </React.StrictMode>,
  );
}

void bootstrap();
