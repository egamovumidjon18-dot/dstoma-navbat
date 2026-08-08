import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import { ErrorBoundary } from './components/ErrorBoundary';
import './index.css';

// v4 has no fetch handler at all (see public/sw.js) — it exists only so
// Chrome/Android consider the site installable as a PWA. The old v3 worker
// intercepted every request, including the /api/* calls the initial load
// depends on, and Safari has known bugs where SW-intercepted fetches can
// hang indefinitely — that's what got a Mac stuck on the loading screen.
// The browser's normal SW update flow replaces any old v3 registration.
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('/sw.js');
}

// Disable console.log in production
if (import.meta.env && import.meta.env.PROD) {
  console.log = () => {};
  console.info = () => {};
  console.debug = () => {};
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </StrictMode>,
);
