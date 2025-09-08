import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react({
      // Enable fast refresh for better development experience
      fastRefresh: true,
      // Optimize JSX runtime
      jsxRuntime: 'automatic',
    })
  ],
  resolve: {
    alias: {
      'shared-components': path.resolve(__dirname, '../shared-components/src'),
      'reconciliation-tool': path.resolve(__dirname, '../reconciliation-tool/src'),
    },
  },
  optimizeDeps: {
    // Pre-bundle these dependencies for faster loading
    include: [
      'react',
      'react-dom',
      'react-router-dom',
      'lucide-react',
      'papaparse',
      'xlsx'
    ],
    // Force re-optimization when these change
    force: false,
  },
  build: {
    // Optimize build performance
    target: 'esnext',
    minify: 'esbuild',
    sourcemap: false, // Disable sourcemaps in dev for speed
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          router: ['react-router-dom'],
          utils: ['lucide-react', 'papaparse', 'xlsx']
        }
      }
    }
  },
  server: {
    // Optimize dev server
    hmr: {
      overlay: false // Disable error overlay for faster startup
    },
    // Enable faster file watching
    watch: {
      usePolling: false,
      ignored: ['**/node_modules/**', '**/.git/**']
    }
  },
  esbuild: {
    // Optimize esbuild for faster builds
    target: 'esnext',
    logLevel: 'error'
  }
});