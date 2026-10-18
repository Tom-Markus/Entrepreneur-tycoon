// Post-mortem pédagogique : pourquoi l'entreprise a-t-elle fait faillite ?
// On regarde les sorties de cash des 4 derniers mois par catégorie, la
// rentabilité et l'évolution de l'activité, puis on classe les causes.

import { CATEGORIES } from '../data/economy.js';
import { ADVICE } from '../data/advice.js';

function sumCats(history, n) {
  const out = {};
  for (const h of history.slice(-n)) for (const [k, v] of Object.entries(h.byCat || {})) out[k] = (out[k] || 0) + v;
  return out;
}

export function buildPostMortem(state) {
  const h = state.finance.history;
  // On inclut le mois en cours (pas encore dans l'historique).
  const current = { ...state.finance.month, byCat: state.finance.month.byCat };
  const recent = [...h.slice(-3), current];
  const outs = sumCats(recent, 4);
  const revenue = recent.reduce((s, x) => s + (x.revenue || 0), 0);
  const expenses = recent.reduce((s, x) => s + (x.expenses || 0), 0);
  const causes = [];

  const add = (id, weight, detail) => causes.push({ id, weight, detail, ...ADVICE[id] });

  const taxLike = (outs.tva || 0);
  if (taxLike > 0) add('tva', taxLike, `${fmt(taxLike)} de TVA reversée sur la période.`);
  if (outs.impot) add('impot', outs.impot * 1.2, `${fmt(outs.impot)} d'impôt annuel payé.`);
  if (outs.cotisations) add('cotisations', outs.cotisations, `${fmt(outs.cotisations)} de cotisations sociales.`);
  if (revenue < expenses) add('rentabilite', (expenses - revenue) * 1.5, `Charges ${fmt(expenses)} pour ${fmt(revenue)} de CA : l'activité perdait de l'argent.`);
  const payroll = outs.salaires || 0;
  if (payroll > revenue * 0.55 && payroll > 0) add('salaires', payroll * 0.6, `Les salaires représentaient ${Math.round((payroll / Math.max(1, revenue)) * 100)} % du CA.`);
  if (outs.remboursement || outs.interets) add('dette', (outs.remboursement || 0) + (outs.interets || 0), `${fmt((outs.remboursement || 0) + (outs.interets || 0))} de remboursements et intérêts.`);
  if (outs.stock && outs.stock > revenue * 0.5) add('stock', outs.stock * 0.6, `${fmt(outs.stock)} immobilisés dans le stock.`);
  if (outs.investissement) add('investissement', outs.investissement * 0.8, `${fmt(outs.investissement)} investis en améliorations sur la période.`);
  if (outs.amendes || outs.evenements) add('imprevus', (outs.amendes || 0) + (outs.evenements || 0), `${fmt((outs.amendes || 0) + (outs.evenements || 0))} d'amendes et d'imprévus.`);
  if (outs.prelevement || outs.remuneration) {
    const d = (outs.prelevement || 0) + (outs.remuneration || 0);
    if (d > revenue * 0.4) add('prelevements', d * 0.7, `Tu t'es versé ${fmt(d)} alors que l'entreprise ne le permettait pas.`);
  }
  if (state.stats.badDebts > 0) add('impayes', state.stats.badDebts * 0.8, `${fmt(state.stats.badDebts)} de factures jamais payées.`);
  const prev = h.slice(-9, -3);
  if (prev.length >= 3) {
    const a = prev.reduce((s, x) => s + x.revenue, 0) / prev.length;
    const b = revenue / recent.length;
    if (b < a * 0.7) add('demande', (a - b) * 2, `Ton chiffre d'affaires mensuel est passé de ${fmt(a)} à ${fmt(b)}.`);
  }
  if (!causes.length) add('rentabilite', 1, 'Les recettes ne couvraient pas les dépenses.');
  causes.sort((x, y) => y.weight - x.weight);
  const top = causes.slice(0, 3);
  const totalOut = Object.values(outs).reduce((s, v) => s + v, 0);
  return {
    day: state.time.day,
    causes: top,
    outflows: Object.entries(outs)
      .map(([k, v]) => ({ cat: k, label: CATEGORIES[k] || k, amount: v, pct: totalOut ? v / totalOut : 0 }))
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 8),
    revenue,
    expenses,
    legal: state.meta.legal,
    seized: state.endgame.seized || 0,
  };
}

function fmt(c) {
  return `${Math.round(c / 100).toLocaleString('fr-BE')} €`;
}
