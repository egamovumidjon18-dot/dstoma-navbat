import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import { ErrorBoundary } from './components/ErrorBoundary';
import './index.css';

// Service worker removed: it intercepted every request (including all /api/*
// data fetches the app's initial load depends on), and Safari has known bugs
// where SW-intercepted fetches can hang indefinitely (neither resolve nor
// reject), leaving the app stuck on the loading screen forever — matches a
// symptom reported exclusively on Safari/macOS. Unregister any previously
// installed worker and clear its caches for returning visitors.
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.getRegistrations().then(regs => {
    regs.forEach(reg => reg.unregister());
  });
}
if ('caches' in window) {
  caches.keys().then(keys => keys.forEach(k => caches.delete(k)));
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
