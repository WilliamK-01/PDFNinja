import React from 'react';
import ReactDOM from 'react-dom/client';
import { App } from '@/App';
import '@/styles/globals.css';
import { AppStateProvider } from '@/state/app-state';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <AppStateProvider>
      <App />
    </AppStateProvider>
  </React.StrictMode>
);
