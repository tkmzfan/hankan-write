import { defineConfig } from 'vite';
import path from 'path';

export default defineConfig({
  root: './',
  base: '/hankan-write/', // for GitHub Pages
  build: {
    outDir: 'dist',
    minify: false,
    emptyOutDir: true,
    rollupOptions: {
      input: {
        main: path.resolve(__dirname, 'index.html'),
        app: path.resolve(__dirname, 'main.html'),
      },
    },
  },
});