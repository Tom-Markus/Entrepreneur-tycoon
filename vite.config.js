import { defineConfig } from 'vite';

// `base: './'` rend tous les chemins relatifs : le jeu fonctionne aussi bien
// en local que sur GitHub Pages (https://<compte>.github.io/<depot>/).
export default defineConfig({
  base: './',
  build: { target: 'es2020', chunkSizeWarningLimit: 1500 },
  server: { host: true },
});
