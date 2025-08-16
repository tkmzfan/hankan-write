import { defineConfig } from 'vite';

export default defineConfig({
  root: './',
  base: '/hankan-write/', // for GitHub Pages
  build: {
    outDir: 'dist',
    minify: false,
    emptyOutDir: true,
  },
});