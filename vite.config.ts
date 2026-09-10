/// <reference types="vitest" />
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  optimizeDeps: {
    exclude: ['lucide-react'],
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/test/setup.ts',
    // Excluded explicitly: without this vitest also collects the dependency tree under
    // node_modules and dist.
    exclude: ['node_modules', 'dist'],
  },
  build: {
    rollupOptions: {
      output: {
        // Vendor code changes far less often than application code, so splitting it out means a
        // normal deploy only invalidates the app chunks and returning users keep the cached
        // framework. recharts is separated because it is the single largest dependency and is used
        // by one page -- bundling it with the framework would drag ~400 kB into every first load.
        manualChunks: {
          'vendor-react': ['react', 'react-dom', 'react-router-dom'],
          'vendor-query': ['@tanstack/react-query', 'zustand'],
          'vendor-charts': ['recharts'],
          'vendor-forms': ['react-hook-form', '@hookform/resolvers', 'zod'],
        },
      },
    },
  },
});
