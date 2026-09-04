import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  build: {
    // 98.css ships `@media (not(hover))`, which is invalid CSS and which lightningcss
    // (Vite's default minifier) rejects outright. esbuild passes it through untouched.
    cssMinify: 'esbuild',
    rollupOptions: {
      output: {
        // Keep the 3D stack in its own chunk so the 2D fallback never downloads it.
        manualChunks: (id: string) =>
          /node_modules\/(three|@react-three|postprocessing|@use-gesture|maath|stats-gl)/.test(id)
            ? 'three'
            : undefined,
      },
    },
  },
});
