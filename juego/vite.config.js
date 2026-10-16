import { defineConfig } from 'vite';

// SINGLE=1 genera una versión con todo incrustado (para publicar como página única).
export default defineConfig({
  base: './',
  build: {
    target: 'es2020',
    chunkSizeWarningLimit: 12000,
    assetsInlineLimit: process.env.SINGLE ? 100_000_000 : 4096,
  },
});
