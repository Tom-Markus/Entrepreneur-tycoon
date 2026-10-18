// Contrôles propres à l'agence web (onglet Entreprise).

import { esc, actBtn, eurInput, selectInput, bar, help } from '../dom.js';
import { eur, num } from '../format.js';
import { AGENCE as D } from '../../data/sectors/agence.js';
import { hoursPerDay, backlogHours, leadAffordable, recurringRevenue, refPrice } from '../../engine/sectors/agence.js';
import { formatDate } from '../../engine/calendar.js';

export function renderSector(state) {
  const s = state.sector;
  const cap = hoursPerDay(state);
  const backlog = backlogHours(state);
  const leads = s.leads
    .map((l) => {
      const ok = leadAffordable(state, l);
      return `<li class="row ${ok ? '' : 'dim'}">
        <div class="grow"><strong>${esc(l.label)}</strong> — ${esc(l.client)}<br>
        <span class="muted small">${l.hours} h · budget max ${eur(l.budget, { decimals: false })}/h · prix à ton taux : ${eur(l.hours * s.rate, { decimals: false })} HT · délai ${l.deadline} j · expire le ${formatDate(l.expires)}</span></div>
        ${actBtn('Accepter', { type: 'sector', name: 'acceptLead', id: l.id }, { cls: 'btn-small btn-primary', title: ok ? '' : 'Ton taux dépasse son budget : il refusera.' })}
        ${actBtn('Refuser', { type: 'sector', name: 'declineLead', id: l.id }, { cls: 'btn-small' })}
      </li>`;
    })
    .join('');
  const projects = s.projects
    .map((p) => {
      const late = !p.internal && state.time.day > p.deadlineDay;
      return `<li class="row"><div class="grow"><strong>${esc(p.label)}</strong> — ${esc(p.client)} ${late ? '<span class="bad">(en retard)</span>' : ''}<br>
        ${bar(p.done, p.hoursReal)} <span class="muted small">${num(p.done)} / ${num(p.hoursReal)} h ${p.hoursReal > p.hoursEst * 1.05 ? `(estimé ${p.hoursEst} h : dépassement !)` : ''}${p.internal ? '' : ` · ${eur(p.price, { decimals: false })} HT · échéance ${formatDate(p.deadlineDay)}`}</span></div></li>`;
    })
    .join('');
  const saas = s.saas.status === 'none' ? '' : `
    <h3>SaaS ${help('SaaS')}</h3>
    ${s.saas.status === 'dev' ? '<p>En développement (voir projets).</p>' : `
      <p><strong>${num(s.saas.subscribers)}</strong> abonnés · revenu mensuel ${eur(s.saas.subscribers * s.saas.price, { decimals: false })} HT</p>
      ${eurInput('saas-price', s.saas.price, { type: 'sector', name: 'setSaasPrice' }, { min: D.saas.minPrice / 100, max: D.saas.maxPrice / 100, label: 'Prix de l’abonnement (HT/mois)' })}`}`;
  return `
  <section class="card-block">
    <h3>Ton offre</h3>
    <div class="form-row">
      ${eurInput('rate', s.rate, { type: 'sector', name: 'setRate' }, { min: D.minRate / 100, max: D.maxRate / 100, label: `Taux horaire HT (marché ≈ ${eur(refPrice(state), { decimals: false })})` })}
      ${selectInput('policy', s.policy, [
        { value: 'capacite', label: 'Accepter si j’ai la capacité' },
        { value: 'tout', label: 'Tout accepter' },
        { value: 'manuel', label: 'Je décide moi-même' },
      ], { type: 'sector', name: 'setPolicy' }, { label: 'Nouvelles demandes' })}
    </div>
    <p class="muted small">Capacité : ${num(cap, 1)} h facturables/jour ouvré · carnet : ${num(backlog)} h (≈ ${num(backlog / Math.max(1, cap * 21), 1)} mois) · récurrent : ${eur(recurringRevenue(state), { decimals: false })}/mois · ${s.maint.contracts.length} contrat(s) de maintenance.</p>
  </section>
  <section class="card-block">
    <h3>Demandes de projets (${s.leads.length})</h3>
    ${leads ? `<ul class="list">${leads}</ul>` : '<p class="muted">Aucune demande en attente. Le marketing, la réputation et les commerciaux en amènent plus.</p>'}
  </section>
  <section class="card-block">
    <h3>Projets en cours (${s.projects.length})</h3>
    ${projects ? `<ul class="list">${projects}</ul>` : '<p class="muted">Aucun projet en cours.</p>'}
  </section>
  ${saas ? `<section class="card-block">${saas}</section>` : ''}`;
}
