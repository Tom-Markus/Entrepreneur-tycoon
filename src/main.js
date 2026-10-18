// Point d'entrée de l'interface.

import { App } from './ui/app.js';

function boot() {
  const root = document.getElementById('app');
  try {
    const app = new App(root);
    app.showTitle();
    // Accès console pour le débogage (aucune incidence sur le jeu).
    window.__tycoon = app;
  } catch (e) {
    root.innerHTML = `<p class="boot">Erreur au démarrage : ${String(e.message).replace(/</g, '&lt;')}</p>`;
    throw e;
  }
}

boot();
