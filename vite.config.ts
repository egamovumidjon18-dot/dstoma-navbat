import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig} from 'vite';

export default defineConfig(() => {
  return {
    plugins: [react(), tailwindcss()],
    build: {
      chunkSizeWarningLimit: 1500,
      rollupOptions: {
        output: {
          // Keep the heavy, rarely-changing libraries in their own cached
          // chunks so a code change doesn't force every visitor to re-download
          // charts / PDF / animation machinery along with it.
          manualChunks: {
            recharts: ['recharts'],
            pdf: ['jspdf', 'jspdf-autotable'],
            motion: ['motion'],
            maps: ['@vis.gl/react-google-maps'],
          },
        },
      },
    },
    define: {
      'process.env.GOOGLE_MAPS_PLATFORM_KEY': JSON.stringify(process.env.GOOGLE_MAPS_PLATFORM_KEY || '')
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modifyâfile watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
