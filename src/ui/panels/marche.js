// Onglet Marché : concurrents, parts de marché, conjoncture.

import { esc, help } from '../dom.js';
import { pct, num } from '../format.js';
import { STRATEGIES } from '../../data/competitors.js';
import { ECONOMY } from '../../data/economy.js';
import { playerPriceIndex } from '../../engine/systems/competitors.js';
import { drawBars } from '../charts.js';

export const panel = {
  id: 'marche',
  label: 'Marché',
  icon: '📈',
  render(state) {
    const comps = state.competitors;
    const pa = state.company.attraction || 0;
    const total = pa + comps.reduce((s, c) => s + (c.attraction || 0), 0) + ECONOMY.outsideOption;
    const playerShare = total ? pa / total : 0;
    const rows = comps
      .map((c) => {
        const st = STRATEGIES[c.strategy];
        const promo = c.promoUntil > state.time.day;
        return `<tr class="${c.alive ? '' : 'dim'}"><td><strong>${esc(c.name)}</strong>${c.alive ? '' : ' <span class="bad">(faillite)</span>'}${promo ? ' <span class="tag warn">promo</span>' : ''}<br><span class="small muted" title="${esc(st.desc)}">${esc(st.label)}</span></td>
          <td class="num">${num(c.priceIdx * 100)}</td><td class="num">${num(c.quality * 100)}</td><td class="num">${num(c.reputation)}</td><td class="num">${pct(c.alive ? c.share : 0)}</td></tr>`;
      })
      .join('');
    return `
    <section class="card-block">
      <h3>Parts de marché ${help('Part de marché')}</h3>
      <canvas id="share-chart" class="chart" width="560" height="160" aria-label="Graphique des parts de marché"></canvas>
      <p class="small muted">« Hors marché » = clients qui renoncent ou vont ailleurs (${pct(ECONOMY.outsideOption / total)}).</p>
    </section>
    <section class="card-block">
      <h3>Concurrents</h3>
      <table class="table"><thead><tr><th>Nom</th><th class="num" title="100 = prix du marché">Prix</th><th class="num" title="100 = qualité moyenne">Qualité</th><th class="num">Réput.</th><th class="num">Part</th></tr></thead>
      <tbody><tr><td><strong>${esc(state.meta.companyName)}</strong> <span class="tag good">toi</span></td><td class="num">${num(playerPriceIndex(state) * 100)}</td><td class="num">${num(state.company.quality * 100)}</td><td class="num">${num(state.company.reputation)}</td><td class="num">${pct(playerShare)}</td></tr>${rows}</tbody></table>
      <p class="small muted">Chaque concurrent suit une stratégie : bas prix, premium, marketing agressif ou suiveur. Ils réagissent à tes parts de marché et peuvent faire faillite.</p>
    </section>
    <section class="card-block">
      <h3>Conjoncture</h3>
      <p>Indice économique : <strong>${num(state.world.economy * 100)}</strong> (100 = normal) · taux directeur BCE simulé : ${(state.world.baseRate * 100).toFixed(2).replace('.', ',')} %</p>
      ${state.modifiers.filter((m) => m.label).length ? `<h4>Effets en cours</h4><ul class="small">${state.modifiers.filter((m) => m.label).map((m) => `<li>${esc(m.label)} : ${m.mult !== 1 ? `${m.mult > 1 ? '+' : '−'}${Math.abs(Math.round((m.mult - 1) * 100))} % ` : ''}(${esc(m.key)}) jusqu'au jour ${m.until}</li>`).join('')}</ul>` : ''}
    </section>`;
  },
  mount(el, state) {
    const cv = el.querySelector('#share-chart');
    if (!cv) return;
    const pa = state.company.attraction || 0;
    const comps = state.competitors.filter((c) => c.alive);
    const total = pa + comps.reduce((s, c) => s + c.attraction, 0) + ECONOMY.outsideOption;
    drawBars(cv, [
      { label: 'Toi', value: pa / total, color: '#a7f070' },
      ...comps.map((c, i) => ({ label: c.name.slice(0, 14), value: c.attraction / total, color: ['#ef7d57', '#41a6f6', '#b13e53', '#ffcd75', '#73eff7'][i % 5] })),
      { label: 'Hors marché', value: ECONOMY.outsideOption / total, color: '#566c86' },
    ], { pct: true });
  },
};
