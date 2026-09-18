import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig} from 'vite';

export default defineConfig(() => {
  return {
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      port: 5173,
      proxy: {
        '/api': 'http://localhost:3001',
      },
      // HMR is disabled via the DISABLE_HMR env var when file watching is unwanted.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching with DISABLE_HMR=true to reduce CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
