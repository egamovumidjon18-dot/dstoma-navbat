import type { CapacitorConfig } from '@capacitor/cli';

// The native app ships the built web bundle (dist/) as local assets — screens
// load instantly instead of over the network — while all data (Firestore,
// API calls) still goes to the live server. getApiUrl() in src/services/api.ts
// already falls back to VITE_API_URL when window.location.origin isn't the
// real backend (e.g. Capacitor's capacitor://localhost scheme), so the native
// build must be built with VITE_API_URL=https://dstoma.online set.
const config: CapacitorConfig = {
  appId: 'online.dstoma.queue',
  appName: 'DStoma Queue',
  webDir: 'dist',
};

export default config;
