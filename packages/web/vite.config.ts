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
    port: 3007,
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      },
    },
  },
  build: {
    outDir: 'dist',
    sourcemap: true,
    rollupOptions: {
      output: {
        // Enable chunk hashing for cache busting
        entryFileNames: 'assets/[name]-[hash].js',
        chunkFileNames: 'assets/[name]-[hash].js',
        assetFileNames: 'assets/[name]-[hash].[ext]',
        // Manual chunk configuration for better code splitting
        manualChunks: {
          // Core React vendor bundle
          'vendor-react': [
            'react',
            'react-dom',
            'react-router-dom',
          ],
          // Charts library (recharts is typically large)
          'vendor-charts': [
            'recharts',
          ],
          // UI utilities
          'vendor-ui': [
            'lucide-react',
            'clsx',
          ],
          // TanStack Query for state management
          'vendor-query': [
            '@tanstack/react-query',
          ],
        },
      },
    },
    // Warn if any chunk exceeds 500KB (before gzip)
    chunkSizeWarningLimit: 500,
  },
});
