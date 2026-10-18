// Contrôles de l'artisan (onglet Entreprise).

import { esc, eurInput, selectInput, rangeInput, bar, help } from '../dom.js';
import { eur, num, pct } from '../format.js';
import { ARTISAN as D } from '../../data/sectors/artisan.js';
import { workforce, backlogDays, metier, vans, refPrice } from '../../engine/sectors/artisan.js';
import { formatDate } from '../../engine/calendar.js';

export function renderSector(state) {
  const s = state.sector;
  const m = metier(state);
  const quotes = s.quotes
    .slice(0, 8)
    .map((q) => `<li class="row"><div class="grow"><strong>${esc(q.label)}</strong> — devis ${eur(q.price, { decimals: false })} HT (TVA ${pct(q.vat)})<br><span class="small muted">Réponse du client le ${formatDate(q.decide)} · chances ≈ ${pct(q.p)}</span></div></li>`)
    .join('');
  const jobs = s.jobs
    .slice(0, 10)
    .map((j) => `<li class="row"><div class="grow"><strong>${esc(j.label)}</strong>${j.urgent ? ' <span class="tag warn">urgent</span>' : ''} — ${eur(j.price, { decimals: false })} HT<br>${bar(j.daysDone, j.daysTotal)} <span class="small muted">${num(j.daysDone, 1)} / ${num(j.daysTotal, 1)} jour(s)-homme · matériel ${eur(j.materials, { decimals: false })}${j.matPaid ? ' (payé)' : ''}</span></div></li>`)
    .join('');
  return `
  <section class="card-block">
    <h3>${esc(m.label)} — tes tarifs</h3>
    <div class="form-row">
      ${eurInput('rate', s.rate, { type: 'sector', name: 'setRate' }, { min: D.minRate / 100, max: D.maxRate / 100, label: `Taux horaire HT (marché ≈ ${eur(refPrice(state), { decimals: false })})` })}
      ${rangeInput('margin', Math.round(s.margin * 100), { type: 'sector', name: 'setMargin' }, { min: 0, max: 60, step: 1, label: 'Marge sur le matériel', display: `${Math.round(s.margin * 100)} %`, fmt: 'pct' })}
      ${selectInput('policy', s.policy, [{ value: 'capacite', label: 'Ne pas faire de devis si carnet plein' }, { value: 'tout', label: 'Répondre à toutes les demandes' }], { type: 'sector', name: 'setPolicy' }, { label: 'Demandes' })}
    </div>
    <p class="small muted">TVA à 6 % pour la rénovation d'un logement privé de plus de 10 ans, sinon 21 % ${help('TVA')}. Les dépannages sont payés sur place, les chantiers à 30 jours.</p>
    <p class="small">Équipe : ${num(workforce(state), 1)} jour(s)-homme par jour ouvré · ${vans(state)} camionnette(s) (2 ouvriers par camionnette) · carnet : ${num(backlogDays(state), 1)} jours-homme · bouche-à-oreille : ${num(s.wom, 1)} · contrats d'entretien : ${s.contracts}.</p>
  </section>
  <section class="card-block">
    <h3>Devis en attente (${s.quotes.length})</h3>
    ${quotes ? `<ul class="list">${quotes}</ul>` : '<p class="muted">Aucun devis en attente.</p>'}
  </section>
  <section class="card-block">
    <h3>Planning des chantiers (${s.jobs.length})</h3>
    ${jobs ? `<ul class="list">${jobs}</ul>` : '<p class="muted">Aucun chantier planifié.</p>'}
  </section>`;
}
