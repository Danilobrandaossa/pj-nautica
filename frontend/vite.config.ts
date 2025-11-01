import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    host: '0.0.0.0',
    port: 3005,
      proxy: {
        '/api': {
          target: 'http://localhost:3010',
          changeOrigin: true,
        },
      },
  },
  build: {
    sourcemap: false,
    chunkSizeWarningLimit: 600,
    // Use single bundle to avoid all circular dependency issues
    rollupOptions: {
      output: {
        manualChunks: undefined,
      },
    },
  },
});



