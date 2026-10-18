// Onglet Finances : trésorerie, échéancier fiscal, compte de résultat,
// financement (prêts, investisseurs), rémunération et dividendes.

import { esc, help, eurInput, actBtn } from '../dom.js';
import { eur, pct } from '../format.js';
import { CATEGORIES } from '../../data/economy.js';
import { SIMPLIFICATIONS } from '../../data/fiscalite.js';
import { formatMonth, formatDate } from '../../engine/calendar.js';
import { receivablesTotal } from '../../engine/ledger.js';
import { estimateYearTax, quarterlySocial, provisionalBase, STARTER_YEARS } from '../../engine/systems/tax.js';
import { loanOffer, totalDebt, valuation } from '../../engine/systems/loans.js';
import { monthlyWithholding } from '../../engine/taxmath.js';
import { annuity } from '../../engine/money.js';
import { dateOf } from '../../engine/calendar.js';

function catRows(obj) {
  return Object.entries(obj)
    .filter(([, v]) => v)
    .sort((a, b) => b[1] - a[1])
    .map(([k, v]) => `<tr><td>${esc(CATEGORIES[k] || k)}</td><td class="num">${eur(v, { decimals: false })}</td></tr>`)
    .join('');
}

let loanForm = { amount: 1_000_000, months: 48 };

export const panel = {
  id: 'finances',
  label: 'Finances',
  icon: '💶',
  render(state) {
    const f = state.finance;
    const m = f.month;
    const srl = state.meta.legal === 'srl';
    const vatDue = f.vat.collected - f.vat.deductible;
    const est = estimateYearTax(state);
    const sched = state.tax.schedule.slice(0, 8);
    const offer = loanOffer(state, loanForm.months);
    const pay = annuity(Math.min(loanForm.amount, Math.max(offer.max, 0)) || loanForm.amount, offer.rate, loanForm.months);
    const hist = f.history.slice(-6).reverse();
    const yearIdx = dateOf(state.time.day).yearIdx;
    const inv = state.offers.investor;
    return `
    <section class="card-block">
      <h3>Trésorerie ${help('Trésorerie')}</h3>
      <div class="stat-grid">
        <div><span class="muted">Compte pro</span><strong class="${state.cash < 0 ? 'bad' : ''}">${eur(state.cash, { decimals: false })}</strong></div>
        <div><span class="muted">Découvert autorisé ${help('Découvert')}</span><strong>${eur(f.overdraftLimit, { decimals: false })}</strong></div>
        <div><span class="muted">Factures à encaisser ${help('Créance')}</span><strong>${eur(receivablesTotal(state), { decimals: false })}</strong></div>
        <div><span class="muted">TVA du trimestre ${help('TVA')}</span><strong class="${vatDue > 0 ? 'warn' : 'good'}">${vatDue >= 0 ? 'à reverser ' : 'à récupérer '}${eur(Math.abs(vatDue), { decimals: false })}</strong></div>
        <div><span class="muted">Impôt estimé ${dateOf(state.time.day).year} ${help(srl ? 'ISOC' : 'IPP')}</span><strong class="warn">${eur(est.company, { decimals: false })}</strong></div>
        <div><span class="muted">Dettes bancaires</span><strong>${eur(totalDebt(state), { decimals: false })}</strong></div>
      </div>
      ${f.franchise ? '<p class="small">Régime de franchise TVA actif : tu ne factures pas de TVA (et ne la récupères pas).</p>' : ''}
      <p class="small muted">💡 Conseil : garde de côté la TVA du trimestre + l'impôt estimé (${eur(vatDue + est.company, { decimals: false })} au total aujourd'hui).</p>
    </section>

    <section class="card-block">
      <h3>Échéancier</h3>
      ${sched.length ? `<table class="table"><thead><tr><th>Date</th><th>Quoi</th><th class="num">Montant</th><th>Compte</th></tr></thead><tbody>
        ${sched.map((x) => `<tr><td>${formatDate(x.dueDay)}</td><td>${esc(x.label)}</td><td class="num ${x.amount < 0 ? 'good' : 'bad'}">${x.amount < 0 ? 'remb. ' : ''}${eur(Math.abs(x.amount), { decimals: false })}</td><td class="muted small">${x.payer === 'personal' ? 'perso' : 'pro'}</td></tr>`).join('')}
      </tbody></table>` : '<p class="muted">Aucune échéance programmée.</p>'}
      <p class="small muted">La TVA est déclarée chaque trimestre (payée le 20 du mois suivant). L'impôt annuel est calculé au 31 décembre et payé le 30 juin suivant.</p>
    </section>

    <section class="card-block">
      <h3>Toi et ta rémunération ${help(srl ? 'Précompte professionnel' : 'Cotisations sociales')}</h3>
      ${eurInput('draw', state.personal.draw, { type: 'setDraw' }, { min: 0, max: 50000, step: 50, label: srl ? 'Rémunération brute mensuelle (charge de la société)' : 'Prélèvement mensuel (non déductible : ton bénéfice est taxé à l’IPP)' })}
      ${srl ? `<p class="small">Précompte professionnel estimé : ${eur(monthlyWithholding(state.personal.draw), { decimals: false })}/mois. Taux réduit ISOC (20 %) seulement si ta rémunération annuelle ≥ 50 000 € (ou ≥ au bénéfice) ${help('ISOC')}.</p>` : ''}
      <p class="small">Cotisations sociales provisoires : <strong>${eur(quarterlySocial(state), { decimals: false })}/trimestre</strong> (base ${eur(provisionalBase(state), { decimals: false })}/an${yearIdx < STARTER_YEARS ? ', minimum « starter »' : ''}). Payées par ${srl ? 'toi (compte perso)' : 'l’entreprise'}.</p>
      ${!srl && est.regul > 0 ? `<p class="small warn">⚠ Au rythme actuel, régularisation estimée : ${eur(est.regul, { decimals: false })} (payable en septembre de l’année suivante). ${help('Régularisation')}</p>` : ''}
      ${eurInput('socialbase', state.tax.social.chosenBase, { type: 'setSocialBase' }, { min: 0, max: 500000, step: 1000, label: 'Augmenter volontairement la base de mes provisionnelles (€/an, 0 = automatique)' })}
      <p class="muted small">Payer plus de provisionnelles maintenant évite le choc de la régularisation plus tard.</p>
      <p class="small">Compte perso : <strong>${eur(state.personal.cash, { decimals: false })}</strong> · coût de la vie : ${eur(state.personal.livingCost, { decimals: false })}/mois.</p>
      <div class="btns">${[100_000, 500_000, 1_000_000].map((v) => actBtn(`Apport perso ${eur(v, { decimals: false })}`, { type: 'apport', value: v }, { cls: 'btn-small', disabled: state.personal.cash < v })).join('')}</div>
    </section>

    ${srl ? `<section class="card-block">
      <h3>Dividendes ${help('Dividendes')}</h3>
      <p class="small">Bénéfices reportés distribuables : <strong>${eur(state.tax.reserves, { decimals: false })}</strong>. Précompte mobilier cette année : ${pct(yearIdx <= 0 ? 0.3 : yearIdx === 1 ? 0.2 : 0.15)} ${help('VVPR-bis')}. Tu détiens ${pct(state.ownership.founder)} des parts.</p>
      <div class="btns">${[0.25, 0.5, 1].map((p) => {
        const amt = Math.floor(Math.min(state.tax.reserves * p, Math.max(0, state.cash)) / 10_000) * 10_000;
        return actBtn(`Distribuer ${eur(amt, { decimals: false })}`, { type: 'payDividend', amount: amt }, { cls: 'btn-small', disabled: amt < 10_000 });
      }).join('')}</div>
    </section>` : ''}

    <section class="card-block">
      <h3>Financement ${help('Prêt bancaire')}</h3>
      <p class="small">La banque te propose aujourd'hui : jusqu'à <strong>${eur(offer.max, { decimals: false })}</strong> à <strong>${(offer.rate * 100).toFixed(2).replace('.', ',')} %</strong>/an.</p>
      <div class="form-row">
        <label class="field"><span>Montant (€)</span><input type="number" id="loan-amount" min="1000" step="1000" value="${loanForm.amount / 100}"></label>
        <label class="field"><span>Durée (mois)</span><select id="loan-months">${[12, 24, 36, 48, 60, 84].map((n) => `<option ${n === loanForm.months ? 'selected' : ''}>${n}</option>`).join('')}</select></label>
        <button type="button" class="btn btn-small" data-ui="requestLoan">Demander</button>
      </div>
      <p class="small muted">Mensualité estimée : ${eur(pay, { decimals: false })} · intérêts déductibles, capital non ${help('Mensualité')}</p>
      ${state.loans.length ? `<table class="table"><thead><tr><th>Prêt</th><th class="num">Reste</th><th class="num">Mensualité</th><th class="num">Taux</th><th></th></tr></thead><tbody>
        ${state.loans.map((l) => `<tr><td>${eur(l.principal, { decimals: false })} · ${l.monthsLeft}/${l.months} mois</td><td class="num">${eur(l.remaining, { decimals: false })}</td><td class="num">${eur(l.payment, { decimals: false })}</td><td class="num">${(l.rate * 100).toFixed(2).replace('.', ',')} %</td><td>${actBtn('Rembourser', { type: 'repayLoan', id: l.id }, { cls: 'btn-small', title: 'Remboursement anticipé : indemnité de 3 mois d’intérêts' })}</td></tr>`).join('')}
      </tbody></table>` : ''}
      ${srl ? `<h4>Investisseurs ${help('Business angel')}</h4>
        ${inv ? `<p><strong>${esc(inv.name)}</strong> propose <strong>${eur(inv.amount, { decimals: false })}</strong> contre <strong>${pct(inv.stake)}</strong> des parts (valorisation ${eur(Math.round(inv.amount / inv.stake), { decimals: false })}). Offre valable jusqu'au ${formatDate(inv.expires)}. En échange, ils attendent ≈ 5 %/an de dividendes.</p>
          <div class="btns">${actBtn('Accepter', { type: 'acceptInvestor' }, { cls: 'btn-small btn-primary' })}${actBtn('Refuser', { type: 'declineInvestor' }, { cls: 'btn-small' })}</div>`
          : `<p class="small muted">Valorisation estimée de ta société : ${eur(valuation(state), { decimals: false })}.</p>${actBtn('Chercher un investisseur', { type: 'seekInvestor' }, { cls: 'btn-small' })}`}
        ${state.ownership.investors.length ? `<p class="small">Associés : ${state.ownership.investors.map((i) => `${esc(i.name)} (${pct(i.stake)})`).join(', ')}.</p>` : ''}` : '<p class="small muted">En indépendant, pas d’investisseurs possibles : il faudrait une société.</p>'}
    </section>

    <section class="card-block">
      <h3>Ce mois-ci ${help('Marge')}</h3>
      <table class="table"><tbody>
        <tr><th>Chiffre d'affaires HT</th><td class="num good">${eur(m.revenue, { decimals: false })}</td></tr>
        <tr><th>Charges déductibles</th><td class="num bad">${eur(m.expenses, { decimals: false })}</td></tr>
        <tr><th>Résultat avant impôts</th><td class="num">${eur(m.revenue - m.expenses, { decimals: false })}</td></tr>
      </tbody></table>
      <details><summary>Sorties de trésorerie par catégorie</summary><table class="table"><tbody>${catRows(m.byCat) || '<tr><td class="muted">Rien encore.</td></tr>'}</tbody></table></details>
    </section>

    <section class="card-block">
      <h3>Derniers mois</h3>
      <table class="table"><thead><tr><th>Mois</th><th class="num">CA</th><th class="num">Charges</th><th class="num">Résultat</th><th class="num">Trésorerie</th></tr></thead><tbody>
      ${hist.map((h) => `<tr><td>${formatMonth(h.m)}</td><td class="num">${eur(h.revenue, { decimals: false })}</td><td class="num">${eur(h.expenses, { decimals: false })}</td><td class="num ${h.profit < 0 ? 'bad' : 'good'}">${eur(h.profit, { decimals: false })}</td><td class="num">${eur(h.cash, { decimals: false })}</td></tr>`).join('') || '<tr><td colspan="5" class="muted">Pas encore d’historique.</td></tr>'}
      </tbody></table>
    </section>

    ${state.tax.results.length ? `<section class="card-block">
      <h3>Bilans annuels</h3>
      <table class="table"><thead><tr><th>Année</th><th class="num">Résultat</th><th class="num">${srl ? 'ISOC' : 'IPP'}</th><th class="num">Régul. cotis.</th></tr></thead><tbody>
      ${[...state.tax.results].reverse().slice(0, 8).map((r) => `<tr><td>${r.year}</td><td class="num">${eur(r.operating, { decimals: false })}</td><td class="num">${eur(srl ? r.isoc : r.ipp, { decimals: false })}${srl && !r.reduced && r.taxable > 0 ? ' <span class="warn small">(25 %)</span>' : ''}</td><td class="num">${eur(r.regul || 0, { decimals: false })}</td></tr>`).join('')}
      </tbody></table></section>` : ''}

    <section class="card-block">
      <details><summary>⚠ Fiscalité simplifiée — ce que le jeu ne modélise pas exactement</summary>
      <ul class="small">${SIMPLIFICATIONS.map((x) => `<li>${esc(x)}</li>`).join('')}</ul>
      <p class="small muted">Tous les taux sont dans src/data/fiscalite.js avec leur source et la mention « à vérifier ». Ne pas utiliser pour une vraie déclaration.</p></details>
    </section>`;
  },
  mount(el) {
    // Mémorise la saisie du formulaire de prêt (le panneau est re-rendu régulièrement).
    const a = el.querySelector('#loan-amount');
    const mo = el.querySelector('#loan-months');
    if (a) a.addEventListener('input', () => (loanForm.amount = Math.round(Number(a.value) * 100) || 0));
    if (mo) mo.addEventListener('change', () => (loanForm.months = Number(mo.value)));
  },
  ui(cmd, arg, app) {
    if (cmd === 'requestLoan') {
      const a = Math.round(Number(document.getElementById('loan-amount').value) * 100);
      const mo = Number(document.getElementById('loan-months').value);
      loanForm = { amount: a, months: mo };
      app.dispatch({ type: 'requestLoan', amount: a, months: mo });
    }
  },
};
