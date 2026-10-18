// Écran titre : nouvelle partie, continuer, charger, importer.

import { esc } from '../dom.js';
import { eur } from '../format.js';
import { formatDate } from '../../engine/calendar.js';
import { SECTOR_DATA } from '../../engine/sectors/registry.js';
import { DIFFICULTIES } from '../../data/difficulty.js';
import { pixelTitle, mountPixelTitles } from '../pixelfont.js';
import { drawLogoScene } from '../scene.js';

export function slotLabel(slot) {
  return slot === 'auto' ? 'Autosauvegarde' : `Emplacement ${slot}`;
}

export function slotSummary(s) {
  if (s.empty) return '<span class="muted">Vide</span>';
  if (s.error) return `<span class="bad">${esc(s.error)}</span>`;
  const m = s.summary || {};
  const sector = SECTOR_DATA[m.sector];
  const status = m.status === 'bankrupt' ? ' · <span class="bad">faillite</span>' : m.status === 'won' || m.status === 'sandbox' ? ' · <span class="good">liberté financière</span>' : '';
  return `<strong>${esc(m.companyName || '?')}</strong> — ${esc(sector ? sector.label : m.sector)} · ${esc(DIFFICULTIES[m.difficulty]?.label || '')}<br>
    <span class="muted">${formatDate(m.day || 0)} · trésorerie ${eur(m.cash || 0, { decimals: false })}${status}</span>`;
}

export async function renderTitle(app) {
  let slots = [];
  let storageError = '';
  try {
    slots = await app.adapter.list();
  } catch (e) {
    storageError = e.message;
  }
  const auto = slots.find((s) => s.slot === 'auto' && !s.empty && !s.error);
  app.root.innerHTML = `
  <main class="title-screen">
    <canvas id="title-scene" class="title-scene" width="240" height="120" aria-hidden="true"></canvas>
    ${pixelTitle('ENTREPRENEUR TYCOON', 'logo', 4)}
    <p class="subtitle">Belgique — crée ta boîte, survis au fisc, atteins la liberté financière.</p>
    <div class="title-menu">
      ${auto ? `<button class="btn btn-primary" id="btn-continue">▶ Continuer : ${esc(auto.summary?.companyName || '')}</button>` : ''}
      <button class="btn ${auto ? '' : 'btn-primary'}" id="btn-new">✚ Nouvelle partie</button>
      <button class="btn" id="btn-load">📂 Charger / importer</button>
      <button class="btn" id="btn-about">ℹ À propos</button>
    </div>
    ${storageError ? `<p class="bad">${esc(storageError)} Tes parties ne pourront pas être sauvegardées.</p>` : ''}
    <p class="muted small">Raccourcis : Espace = pause · 1/2/3 = vitesse · Échap = fermer</p>
  </main>`;
  mountPixelTitles(app.root);
  drawLogoScene(document.getElementById('title-scene'));
  const cont = document.getElementById('btn-continue');
  if (cont) cont.addEventListener('click', () => app.loadFrom('auto'));
  document.getElementById('btn-new').addEventListener('click', () => app.showNewGame());
  document.getElementById('btn-load').addEventListener('click', () => openLoadDialog(app));
  document.getElementById('btn-about').addEventListener('click', () =>
    app.openModal({
      title: 'À propos',
      html: `<p>Entrepreneur Tycoon (Belgique) est un jeu de gestion pédagogique : trésorerie, TVA, impôts, employés, concurrence et investissements.</p>
      <p>Les règles fiscales sont <strong>simplifiées</strong> et doivent être vérifiées avant tout usage réel (voir l'encart « simplifié » dans l'onglet Finances).</p>
      <p class="muted">Pixel art, police et sons générés par le code. Aucune donnée n'est envoyée : tout est sauvegardé dans ton navigateur.</p>`,
    }),
  );
}

export async function openLoadDialog(app, { inGame = false } = {}) {
  const render = async () => {
    let slots = [];
    try {
      slots = await app.adapter.list();
    } catch (e) {
      return `<p class="bad">${esc(e.message)}</p>`;
    }
    return `<ul class="slot-list">${slots
      .map(
        (s) => `<li class="slot">
        <div class="slot-info"><span class="slot-name">${slotLabel(s.slot)}</span><div>${slotSummary(s)}</div></div>
        <div class="slot-actions">
          ${inGame && s.slot !== 'auto' ? `<button class="btn btn-small" data-slot-save="${s.slot}">Sauver ici</button>` : ''}
          ${!s.empty && !s.error ? `<button class="btn btn-small" data-slot-load="${s.slot}">Charger</button>` : ''}
          ${!s.empty && !s.error ? `<button class="btn btn-small" data-slot-export="${s.slot}">Exporter</button>` : ''}
          ${s.slot !== 'auto' ? `<button class="btn btn-small" data-slot-import="${s.slot}">Importer</button>` : ''}
          ${!s.empty ? `<button class="btn btn-small btn-danger" data-slot-delete="${s.slot}">Supprimer</button>` : ''}
        </div></li>`,
      )
      .join('')}</ul>
      <p class="muted small">L'export produit un fichier .json que tu peux réimporter sur un autre ordinateur.</p>`;
  };
  const modal = app.openModal({ title: inGame ? 'Sauvegardes' : 'Charger une partie', html: await render() });
  const refresh = async () => {
    const body = modal.querySelector('.modal-body');
    if (body) body.innerHTML = await render();
  };
  modal.addEventListener('click', async (e) => {
    const t = e.target.closest('button');
    if (!t) return;
    if (t.dataset.slotSave) {
      await app.saveTo(t.dataset.slotSave);
      refresh();
    } else if (t.dataset.slotLoad) app.loadFrom(t.dataset.slotLoad);
    else if (t.dataset.slotExport) app.exportSlot(t.dataset.slotExport);
    else if (t.dataset.slotImport) app.importFile(t.dataset.slotImport, refresh);
    else if (t.dataset.slotDelete) {
      if (confirm(`Supprimer définitivement « ${slotLabel(t.dataset.slotDelete)} » ?`)) {
        await app.adapter.delete(t.dataset.slotDelete);
        refresh();
      }
    }
  });
}
