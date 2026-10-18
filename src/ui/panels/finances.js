// Onglet Finances : compte de résultat, trésorerie, TVA.

import { esc, help, eurInput } from '../dom.js';
import { eur } from '../format.js';
import { CATEGORIES } from '../../data/economy.js';
import { formatMonth } from '../../engine/calendar.js';
import { receivablesTotal } from '../../engine/ledger.js';

function catRows(obj) {
  return Object.entries(obj)
    .filter(([, v]) => v)
    .sort((a, b) => b[1] - a[1])
    .map(([k, v]) => `<tr><td>${esc(CATEGORIES[k] || k)}</td><td class="num">${eur(v, { decimals: false })}</td></tr>`)
    .join('');
}

export const panel = {
  id: 'finances',
  label: 'Finances',
  icon: '💶',
  render(state) {
    const f = state.finance;
    const m = f.month;
    const hist = f.history.slice(-6).reverse();
    const vatDue = f.vat.collected - f.vat.deductible;
    return `
    <section class="card-block">
      <h3>Trésorerie ${help('Trésorerie')}</h3>
      <div class="stat-grid">
        <div><span class="muted">Compte pro</span><strong class="${state.cash < 0 ? 'bad' : ''}">${eur(state.cash)}</strong></div>
        <div><span class="muted">Découvert autorisé</span><strong>${eur(f.overdraftLimit, { decimals: false })}</strong></div>
        <div><span class="muted">Factures à encaisser</span><strong>${eur(receivablesTotal(state), { decimals: false })}</strong></div>
        <div><span class="muted">TVA du trimestre à reverser ${help('TVA')}</span><strong class="${vatDue > 0 ? 'warn' : ''}">${eur(vatDue, { decimals: false })}</strong></div>
      </div>
      ${eurInput('draw', state.personal.draw, { type: 'setDraw' }, { min: 0, max: 50000, step: 50, label: state.meta.legal === 'srl' ? 'Ta rémunération brute mensuelle' : 'Ton prélèvement mensuel' })}
    </section>
    <section class="card-block">
      <h3>Ce mois-ci ${help('Marge')}</h3>
      <table class="table"><tbody>
        <tr><th>Chiffre d'affaires HT</th><td class="num good">${eur(m.revenue, { decimals: false })}</td></tr>
        <tr><th>Charges</th><td class="num bad">${eur(m.expenses, { decimals: false })}</td></tr>
        <tr><th>Résultat (avant impôts)</th><td class="num">${eur(m.revenue - m.expenses, { decimals: false })}</td></tr>
      </tbody></table>
      <details><summary>Sorties de trésorerie par catégorie</summary><table class="table"><tbody>${catRows(m.byCat) || '<tr><td class="muted">Rien encore.</td></tr>'}</tbody></table></details>
    </section>
    <section class="card-block">
      <h3>Derniers mois</h3>
      <table class="table"><thead><tr><th>Mois</th><th class="num">CA</th><th class="num">Charges</th><th class="num">Résultat</th><th class="num">Trésorerie</th></tr></thead><tbody>
      ${hist.map((h) => `<tr><td>${formatMonth(h.m)}</td><td class="num">${eur(h.revenue, { decimals: false })}</td><td class="num">${eur(h.expenses, { decimals: false })}</td><td class="num ${h.profit < 0 ? 'bad' : 'good'}">${eur(h.profit, { decimals: false })}</td><td class="num">${eur(h.cash, { decimals: false })}</td></tr>`).join('') || '<tr><td colspan="5" class="muted">Pas encore d’historique.</td></tr>'}
      </tbody></table>
    </section>`;
  },
};
