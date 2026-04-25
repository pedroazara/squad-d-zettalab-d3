import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

const devApiProxyTarget = process.env.VITE_DEV_API_PROXY_TARGET || 'http://127.0.0.1:8000';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes('node_modules')) {
            return;
          }

          if (id.includes('recharts')) {
            return 'vendor-charts';
          }

          if (
            id.includes('@radix-ui') ||
            id.includes('lucide-react') ||
            id.includes('class-variance-authority') ||
            id.includes('tailwind-merge')
          ) {
            return 'vendor-ui';
          }

          return 'vendor-core';
        },
      },
    },
  },
  server: {
    port: 4173,
    proxy: {
      '/auth': {
        target: devApiProxyTarget,
        changeOrigin: true,
      },
      '/regions': {
        target: devApiProxyTarget,
        changeOrigin: true,
      },
      '/risk': {
        target: devApiProxyTarget,
        changeOrigin: true,
      },
      '/fires': {
        target: devApiProxyTarget,
        changeOrigin: true,
      },
      '/fauna': {
        target: devApiProxyTarget,
        changeOrigin: true,
      },
      '/reports': {
        target: devApiProxyTarget,
        changeOrigin: true,
      },
      '/users': {
        target: devApiProxyTarget,
        changeOrigin: true,
      },
      '/climate': {
        target: devApiProxyTarget,
        changeOrigin: true,
      },
      '/health': {
        target: devApiProxyTarget,
        changeOrigin: true,
      },
    },
  },
});
