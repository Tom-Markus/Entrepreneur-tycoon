// Onglet Stats : graphiques (trésorerie, CA et charges, marge, parts de marché, patrimoine).

import { drawLines, drawBars, legend } from '../charts.js';
import { eur, pct, num } from '../format.js';
import { formatMonth } from '../../engine/calendar.js';
import { netWorth } from '../../engine/selectors.js';
import { computeScore } from '../../engine/score.js';
import { CATEGORIES } from '../../data/economy.js';

const COLORS = { cash: '#41a6f6', rev: '#a7f070', exp: '#ef7d57', profit: '#ffcd75', share: '#73eff7', nw: '#a7f070', passive: '#ffcd75', rep: '#e43b44' };

export const panel = {
  id: 'stats',
  label: 'Stats',
  icon: '📊',
  render(state) {
    const sc = computeScore(state);
    const h = state.finance.history;
    const last12 = h.slice(-12);
    const rev12 = last12.reduce((s, x) => s + x.revenue, 0);
    const prof12 = last12.reduce((s, x) => s + x.profit, 0);
    return `
    <section class="card-block">
      <h3>En un coup d'œil</h3>
      <div class="stat-grid">
        <div><span class="muted">Patrimoine net</span><strong>${eur(netWorth(state), { decimals: false })}</strong></div>
        <div><span class="muted">CA 12 derniers mois</span><strong>${eur(rev12, { decimals: false })}</strong></div>
        <div><span class="muted">Marge nette 12 mois</span><strong>${rev12 ? pct(prof12 / rev12) : '—'}</strong></div>
        <div><span class="muted">CA cumulé</span><strong>${eur(state.finance.totals.revenue, { decimals: false })}</strong></div>
        <div><span class="muted">Score</span><strong>${num(sc.total)}</strong></div>
        <div><span class="muted">Ancienneté</span><strong>${num(state.time.day / 360, 1)} an(s)</strong></div>
      </div>
    </section>
    <section class="card-block"><h3>Trésorerie (180 derniers jours)</h3><canvas id="ch-cash" class="chart" width="560" height="150"></canvas></section>
    <section class="card-block"><h3>Chiffre d'affaires et charges (mensuels)</h3><canvas id="ch-rev" class="chart" width="560" height="160"></canvas>
      ${legend([{ name: 'CA', color: COLORS.rev }, { name: 'Charges', color: COLORS.exp }, { name: 'Résultat', color: COLORS.profit }])}</section>
    <section class="card-block"><h3>Marge nette (%)</h3><canvas id="ch-margin" class="chart" width="560" height="120"></canvas></section>
    <section class="card-block"><h3>Part de marché et réputation</h3><canvas id="ch-share" class="chart" width="560" height="130"></canvas>
      ${legend([{ name: 'Part de marché', color: COLORS.share }])}</section>
    <section class="card-block"><h3>Patrimoine net et revenu passif</h3><canvas id="ch-nw" class="chart" width="560" height="150"></canvas>
      ${legend([{ name: 'Patrimoine net', color: COLORS.nw }])}
      <canvas id="ch-passive" class="chart" width="560" height="110"></canvas>${legend([{ name: 'Revenu passif mensuel', color: COLORS.passive }])}</section>
    <section class="card-block"><h3>Où va l'argent (12 derniers mois)</h3><canvas id="ch-out" class="chart" width="560" height="200"></canvas></section>`;
  },
  mount(el, state) {
    const h = state.finance.history.slice(-36);
    const labels = h.map((x) => formatMonth(x.m));
    const dc = state.finance.dailyCash;
    drawLines(el.querySelector('#ch-cash'), { labels: dc.map(() => ''), series: [{ name: 'Trésorerie', color: COLORS.cash, values: dc }] });
    drawLines(el.querySelector('#ch-rev'), {
      labels,
      series: [
        { name: 'CA', color: COLORS.rev, values: h.map((x) => x.revenue) },
        { name: 'Charges', color: COLORS.exp, values: h.map((x) => x.expenses) },
        { name: 'Résultat', color: COLORS.profit, values: h.map((x) => x.profit), dashed: true },
      ],
    });
    drawLines(el.querySelector('#ch-margin'), { labels, series: [{ name: 'Marge', color: COLORS.profit, values: h.map((x) => (x.revenue > 0 ? x.profit / x.revenue : NaN)) }] }, { format: 'pct' });
    drawLines(el.querySelector('#ch-share'), { labels, series: [{ name: 'Part', color: COLORS.share, values: h.map((x) => x.share) }] }, { format: 'pct' });
    drawLines(el.querySelector('#ch-nw'), { labels, series: [{ name: 'Patrimoine', color: COLORS.nw, values: h.map((x) => (x.netWorth == null ? NaN : x.netWorth)) }] });
    drawLines(el.querySelector('#ch-passive'), { labels, series: [{ name: 'Passif', color: COLORS.passive, values: h.map((x) => (x.passive == null ? NaN : x.passive)) }] });
    const outs = {};
    for (const x of state.finance.history.slice(-12)) for (const [k, v] of Object.entries(x.byCat || {})) outs[k] = (outs[k] || 0) + v;
    const top = Object.entries(outs).sort((a, b) => b[1] - a[1]).slice(0, 8);
    const pal = ['#ef7d57', '#41a6f6', '#ffcd75', '#a7f070', '#b13e53', '#73eff7', '#94b0c2', '#5d275d'];
    drawBars(el.querySelector('#ch-out'), top.map(([k, v], i) => ({ label: (CATEGORIES[k] || k).slice(0, 16), value: v, color: pal[i % pal.length] })));
  },
};
