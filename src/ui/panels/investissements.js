// Onglet Investissements : revenu passif, épargne, bourse, immobilier.

import { esc, help, actBtn, bar } from '../dom.js';
import { eur, pct } from '../format.js';
import { INVESTMENTS as I } from '../../data/investments.js';
import { savingsRate, tradeFees, propertyQuote, mortgageRate } from '../../engine/systems/investments.js';
import { passiveIncome } from '../../engine/selectors.js';
import { hasManager } from '../../engine/systems/staff.js';
import { drawLines } from '../charts.js';
import { PART_LABELS } from '../screens/end.js';
import { toast } from '../toast.js';

const form = { amount: 100_000, down: 0.2 };

function amountField() {
  return `<label class="field"><span>Montant (€)</span><input type="number" id="inv-amount" min="100" step="100" value="${form.amount / 100}"></label>`;
}

export const panel = {
  id: 'investissements',
  label: 'Placements',
  icon: '💹',
  render(state) {
    const inv = state.investments;
    const p = passiveIncome(state);
    const parts = Object.entries(p.parts);
    const gainEtf = inv.etf.value - inv.etf.basis;
    const gainSt = inv.stocks.value - inv.stocks.basis;
    const manager = hasManager(state);
    const props = inv.realEstate
      .map((x) => {
        const occupied = x.vacantUntil <= state.time.day;
        return `<li class="row"><div class="grow"><strong>${esc(x.label)}</strong> ${occupied ? '<span class="tag good">loué</span>' : '<span class="tag warn">vide</span>'}<br>
          <span class="small">Valeur ${eur(x.value, { decimals: false })} · loyer ${eur(x.rent, { decimals: false })}/mois · crédit restant ${eur(x.mortgage.remaining, { decimals: false })} (mensualité ${eur(x.mortgage.payment, { decimals: false })})</span></div>
          <button type="button" class="btn btn-small" data-act='${esc(JSON.stringify({ type: 'sellProperty', id: x.id }))}' data-confirm="Vendre ce bien ? (frais d'agence 3 %)">Vendre</button></li>`;
      })
      .join('');
    const catalog = I.realEstate.catalog
      .map((c) => {
        const q = propertyQuote(state, c, form.down);
        const yieldGross = (c.rent * 12) / c.price;
        const cashflow = c.rent - (c.price * (c.maintenance || I.realEstate.maintenancePct)) / 12 - c.rent / 12 - q.payment - c.rent * 0.08;
        return `<li class="row"><div class="grow"><strong>${esc(c.label)}</strong> — ${eur(c.price, { decimals: false })}<br>
          <span class="small">Loyer ${eur(c.rent, { decimals: false })}/mois · rendement brut ${pct(yieldGross, 1)} · à payer : ${eur(q.cash, { decimals: false })} (dont ${eur(q.fees, { decimals: false })} de droits et notaire) · crédit ${eur(q.loan, { decimals: false })} → ${eur(q.payment, { decimals: false })}/mois · cash-flow ≈ <span class="${cashflow >= 0 ? 'good' : 'bad'}">${eur(Math.round(cashflow), { decimals: false })}/mois</span></span></div>
          ${actBtn('Acheter', { type: 'buyProperty', id: c.id, downPct: form.down }, { cls: 'btn-small', disabled: q.cash > state.personal.cash })}</li>`;
      })
      .join('');
    return `
    <section class="card-block">
      <h3>Revenu passif ${help('Revenu passif')}</h3>
      <p>Moyenne 3 mois : <strong class="${p.total >= p.target ? 'good' : ''}">${eur(p.total, { decimals: false })}/mois</strong> sur un objectif de ${eur(p.target, { decimals: false })}/mois <span class="muted small">(${eur(state.passiveTarget, { decimals: false })} de 2026, indexés sur l'inflation)</span>.</p>
      <p>${bar(Math.max(0, p.total), p.target)} ${pct(Math.max(0, p.total) / Math.max(1, p.target))}</p>
      <table class="table"><tbody>${parts.map(([k, v]) => `<tr><td>${esc(PART_LABELS[k] || k)}</td><td class="num ${v < 0 ? 'bad' : ''}">${eur(v, { decimals: false })}/mois</td></tr>`).join('')}</tbody></table>
      <p class="small muted">${state.staff.founder.active ? `Ton entreprise ne compte pas encore : il faut ${manager ? 'te retirer de l’opérationnel (onglet Équipe)' : 'recruter un·e gérant·e puis te retirer de l’opérationnel'} ${help('Gérant')}.` : 'Ton entreprise tourne sans toi : son bénéfice net compte comme revenu passif.'} La bourse compte pour 4 %/an de sa valeur ${help('Règle des 4 %')}.</p>
      <canvas id="passive-chart" class="chart" width="560" height="150" aria-label="Évolution du revenu passif"></canvas>
    </section>

    <section class="card-block">
      <h3>Ton compte personnel : ${eur(state.personal.cash, { decimals: false })}</h3>
      ${amountField()}
      <p class="small muted">Les placements se font avec ton argent personnel : sors d'abord l'argent de l'entreprise (prélèvement, rémunération ou dividendes, onglet Finances).</p>
    </section>

    <section class="card-block">
      <h3>Épargne réglementée ${help('Intérêts composés')}</h3>
      <p>Solde : <strong>${eur(inv.savings, { decimals: false })}</strong> · taux ${pct(savingsRate(state), 2)}/an · intérêts exonérés jusqu'à 1 020 €/an.</p>
      <div class="btns"><button type="button" class="btn btn-small" data-ui="inv" data-arg="deposit">Déposer</button><button type="button" class="btn btn-small" data-ui="inv" data-arg="withdraw">Retirer</button></div>
    </section>

    <section class="card-block">
      <h3>Bourse ${help('ETF')}</h3>
      <table class="table"><thead><tr><th>Placement</th><th class="num">Valeur</th><th class="num">Plus-value</th><th></th></tr></thead><tbody>
        <tr><td>${esc(I.etf.label)}<br><span class="small muted">≈ ${pct(I.etf.annualReturn)}/an en moyenne, volatilité ${pct(I.etf.annualVol)}</span></td><td class="num">${eur(inv.etf.value, { decimals: false })}</td><td class="num ${gainEtf < 0 ? 'bad' : 'good'}">${eur(gainEtf, { decimals: false })}</td>
          <td><div class="btns"><button type="button" class="btn btn-small" data-ui="inv" data-arg="buy:etf">Acheter</button><button type="button" class="btn btn-small" data-ui="inv" data-arg="sell:etf">Vendre</button></div></td></tr>
        <tr><td>${esc(I.stocks.label)}<br><span class="small muted">≈ ${pct(I.stocks.annualReturn)}/an, volatilité ${pct(I.stocks.annualVol)}, dividende ${pct(I.stocks.dividendYield, 1)}</span></td><td class="num">${eur(inv.stocks.value, { decimals: false })}</td><td class="num ${gainSt < 0 ? 'bad' : 'good'}">${eur(gainSt, { decimals: false })}</td>
          <td><div class="btns"><button type="button" class="btn btn-small" data-ui="inv" data-arg="buy:stocks">Acheter</button><button type="button" class="btn btn-small" data-ui="inv" data-arg="sell:stocks">Vendre</button></div></td></tr>
      </tbody></table>
      <p class="small muted">Frais sur ${eur(form.amount, { decimals: false })} : ETF ${eur(tradeFees('etf', form.amount))} · actions ${eur(tradeFees('stocks', form.amount))} (TOB + courtage) ${help('TOB')}. Plus-values taxées à 10 % au-delà de 10 000 €/an ${help('Taxe sur les plus-values')}. Rendements simulés, pas des prévisions.</p>
      <canvas id="market-chart" class="chart" width="560" height="140" aria-label="Indices boursiers"></canvas>
    </section>

    <section class="card-block">
      <h3>Immobilier locatif ${help('Droits d’enregistrement')}</h3>
      <label class="field"><span>Apport personnel (le reste en crédit hypothécaire à ${pct(mortgageRate(state), 2)} sur ${I.realEstate.mortgageYears} ans)</span>
        <select id="inv-down">${[0.2, 0.4, 0.6, 1].map((d) => `<option value="${d}" ${d === form.down ? 'selected' : ''}>${pct(d)}${d === 1 ? ' (sans crédit)' : ''}</option>`).join('')}</select></label>
      ${props ? `<h4>Tes biens</h4><ul class="list">${props}</ul>` : ''}
      <h4>À vendre</h4>
      <ul class="list">${catalog}</ul>
      <p class="small muted">Frais à l'achat : droits d'enregistrement 12,5 % + notaire ≈ 2 %. Précompte immobilier ≈ 1 mois de loyer/an, entretien ≈ 1 %/an, vide locatif possible ${help('Précompte immobilier')}.</p>
    </section>`;
  },
  mount(el, state) {
    const a = el.querySelector('#inv-amount');
    if (a) a.addEventListener('input', () => (form.amount = Math.max(0, Math.round(Number(a.value) * 100) || 0)));
    const d = el.querySelector('#inv-down');
    if (d) d.addEventListener('change', () => (form.down = Number(d.value)));
    const pc = el.querySelector('#passive-chart');
    if (pc) {
      const h = state.passive.history.slice(-36);
      const target = passiveIncome(state).target;
      drawLines(pc, { labels: h.map(() => ''), series: [{ name: 'Revenu passif', color: '#a7f070', values: h }, { name: 'Objectif', color: '#ffcd75', values: h.map(() => target), dashed: true }] });
    }
    const mc = el.querySelector('#market-chart');
    if (mc) {
      const h = state.investments.history.slice(-36);
      drawLines(mc, { labels: h.map(() => ''), series: [{ name: 'ETF', color: '#41a6f6', values: h.map((x) => x.etf) }, { name: 'Actions', color: '#ef7d57', values: h.map((x) => x.stocks) }, { name: 'Épargne', color: '#a7f070', values: h.map((x) => x.savings) }] });
    }
  },
  ui(cmd, arg, app) {
    if (cmd !== 'inv') return;
    const input = document.getElementById('inv-amount');
    const amount = input ? Math.round(Number(input.value) * 100) : form.amount;
    if (!(amount > 0)) return toast('Montant invalide.', 'bad');
    form.amount = amount;
    const [op, kind] = arg.split(':');
    if (op === 'deposit') app.dispatch({ type: 'deposit', amount });
    if (op === 'withdraw') app.dispatch({ type: 'withdraw', amount });
    if (op === 'buy') app.dispatch({ type: 'buyAsset', kind, amount });
    if (op === 'sell') app.dispatch({ type: 'sellAsset', kind, amount });
  },
  live: false,
};

