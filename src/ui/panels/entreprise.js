// Onglet Entreprise : contrôles du secteur, marketing, améliorations.

import { esc, actBtn, eurInput, help } from '../dom.js';
import { eur } from '../format.js';
import { upgradeList, canBuyUpgrade, hasUpgrade } from '../../engine/upgrades.js';
import { sectorData } from '../../engine/sectors/registry.js';
import { SECTOR_UI } from '../sectorui/index.js';

const CATS = { locaux: 'Locaux', materiel: 'Matériel', process: 'Process', marque: 'Marque', automatisation: 'Automatisation' };

export function renderUpgrades(state) {
  const list = upgradeList(state);
  return Object.entries(CATS)
    .map(([cat, label]) => {
      const items = list.filter((u) => u.cat === cat);
      if (!items.length) return '';
      return `<div class="upg-cat"><h4>${label}</h4><ul class="upg-list">${items
        .map((u) => {
          const owned = hasUpgrade(state, u.id);
          const c = owned ? { ok: false } : canBuyUpgrade(state, u.id);
          const monthly = (u.rent || 0) + (u.monthly || 0);
          return `<li class="upg ${owned ? 'owned' : c.ok ? 'buyable' : 'locked'}">
            <div class="grow"><strong>${esc(u.label)}</strong> <span class="muted small">${eur(u.cost, { decimals: false })} HT${monthly ? ` + ${eur(monthly, { decimals: false })}/mois` : ''}</span><br>
            <span class="small">${esc(u.desc)}</span>${!owned && !c.ok && c.reason ? `<br><span class="small muted">🔒 ${esc(c.reason)}</span>` : ''}</div>
            ${owned ? '<span class="tag good">✔ Acquis</span>' : actBtn('Acheter', { type: 'buyUpgrade', id: u.id }, { cls: 'btn-small', disabled: !c.ok })}
          </li>`;
        })
        .join('')}</ul></div>`;
    })
    .join('');
}

export const panel = {
  id: 'entreprise',
  label: 'Entreprise',
  icon: '🏢',
  render(state) {
    const sd = sectorData(state);
    const ui = SECTOR_UI[state.meta.sector];
    return `
    ${ui ? ui.renderSector(state) : ''}
    <section class="card-block">
      <h3>Marketing ${help('Marketing')}</h3>
      ${eurInput('marketing', state.company.marketing, { type: 'setMarketing' }, { min: 0, max: 50000, step: 50, label: `Budget mensuel HT (référence du secteur : ${eur(sd.marketingRef, { decimals: false })})` })}
      <p class="muted small">Dépensé chaque jour. Rendements décroissants : les premiers euros rapportent le plus.</p>
    </section>
    <section class="card-block">
      <h3>Améliorations ${help('Amortissement')}</h3>
      <p class="muted small">Les investissements sont payés tout de suite mais amortis fiscalement sur 3 ans.</p>
      ${renderUpgrades(state)}
    </section>`;
  },
};
