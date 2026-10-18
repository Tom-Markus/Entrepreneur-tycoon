// Stratégies de bots pour la simulation headless (tools/simulate.js).
// Les bots n'utilisent QUE l'API publique du moteur (applyAction), comme un joueur.
//
//   passive    : ne touche à rien (doit échouer)
//   prudente   : grosse réserve, recrute tard, n'emprunte pas
//   agressive  : marketing fort, recrute tôt, emprunte
//   optimale   : heuristiques équilibrées (prix selon la capacité, réserves fiscales,
//                investissement de l'excédent, gérant puis retrait)

import { applyAction } from '../src/engine/index.js';
import { upgradeList, canBuyUpgrade } from '../src/engine/upgrades.js';
import { seatsAvailable, hasManager, monthlyPayroll, countRole } from '../src/engine/systems/staff.js';
import { taxLiabilities } from '../src/engine/selectors.js';
import { INVESTMENTS } from '../src/data/investments.js';
import { propertyQuote } from '../src/engine/systems/investments.js';
import { dateOf } from '../src/engine/calendar.js';

export const STRATEGIES = ['passive', 'prudente', 'agressive', 'optimale'];

const PROFILE = {
  prudente: { reserveMonths: 6, upgradeCashMult: 3, marketingShare: 0.03, hireBacklog: 1.6, priceStep: 0.03, loans: false, investShare: 0.5 },
  agressive: { reserveMonths: 1, upgradeCashMult: 1.2, marketingShare: 0.12, hireBacklog: 0.9, priceStep: 0.06, loans: true, investShare: 0.8 },
  optimale: { reserveMonths: 3, upgradeCashMult: 1.8, marketingShare: 0.06, hireBacklog: 1.15, priceStep: 0.04, loans: true, investShare: 0.85 },
};

function act(state, a) {
  return applyAction(state, a);
}

/** Charges mensuelles approximatives (pour les réserves). */
function monthlyBurn(state) {
  const h = state.finance.history.slice(-3);
  if (!h.length) return 300_000;
  return h.reduce((s, x) => s + x.outflow, 0) / h.length;
}

function avgProfit(state, n = 3) {
  const h = state.finance.history.slice(-n);
  if (!h.length) return 0;
  return h.reduce((s, x) => s + x.profit, 0) / h.length;
}

/** Résout un événement à choix : la plupart des bots prennent le choix « raisonnable ». */
export function decide(state, strategy, rng) {
  let guard = 0;
  while (state.events && state.events.pending.length && state.status !== 'bankrupt' && guard++ < 20) {
    const ev = state.events.pending[0];
    let choice = 0;
    if (strategy !== 'passive' && ev.botChoice != null) choice = ev.botChoice;
    else if (strategy !== 'passive') choice = rng ? Math.floor(rng() * ev.choices.length) : 0;
    const r = act(state, { type: 'decide', uid: ev.uid, choice });
    if (!r.ok) act(state, { type: 'decide', uid: ev.uid, choice: 0 });
  }
}

/** Décisions mensuelles d'un bot. */
export function monthly(state, strategy, adapter) {
  if (strategy === 'passive' || state.status === 'bankrupt') return;
  const P = PROFILE[strategy];
  const burn = monthlyBurn(state);
  const reserve = burn * P.reserveMonths + taxLiabilities(state);

  // 1) Prix et capacité (propres au secteur)
  if (adapter && adapter.monthly) adapter.monthly(state, P, strategy);

  // 2) Marketing proportionnel au CA
  const rev = state.finance.history.length ? state.finance.history[state.finance.history.length - 1].revenue : 0;
  const mkt = adapter && adapter.marketing ? adapter.marketing(state, P) : Math.max(15_000, rev * P.marketingShare);
  act(state, { type: 'setMarketing', value: Math.round(mkt / 100) * 100 });

  // 3) Recrutement
  if (adapter && adapter.wantsHire) {
    const role = adapter.wantsHire(state, P);
    if (role && seatsAvailable(state) > 0 && state.cash > reserve + monthlyPayroll(state)) {
      let cand = state.staff.candidates.filter((c) => c.role === role).sort((a, b) => b.skill - a.skill)[0];
      if (!cand && state.cash > reserve * 1.2) {
        act(state, { type: 'postJobAd', role });
        cand = state.staff.candidates.filter((c) => c.role === role).sort((a, b) => b.skill - a.skill)[0];
      }
      if (cand) act(state, { type: 'hire', id: cand.id });
    }
  }

  // 4) Améliorations
  const ups = upgradeList(state).filter((u) => canBuyUpgrade(state, u.id).ok);
  ups.sort((a, b) => (adapter?.upgradePriority?.(b) ?? 0) - (adapter?.upgradePriority?.(a) ?? 0) || a.cost - b.cost);
  for (const u of ups) {
    if (state.cash > reserve + u.cost * 1.21 * P.upgradeCashMult) act(state, { type: 'buyUpgrade', id: u.id });
  }

  // 5) Licencier si l'équipe coûte plus qu'elle ne rapporte durablement
  if (avgProfit(state, 3) < -monthlyPayroll(state) * 0.3 && state.staff.employees.length > 0 && state.cash < reserve) {
    const worst = [...state.staff.employees].filter((e) => e.role !== 'gerant').sort((a, b) => a.skill - b.skill)[0];
    if (worst) act(state, { type: 'fire', id: worst.id });
  }

  // 6) Rémunération du dirigeant : suit le bénéfice
  const profit = avgProfit(state, 6);
  const draw = Math.max(170_000, Math.min(profit * 0.55, 900_000));
  act(state, { type: 'setDraw', value: Math.round(draw / 1000) * 1000 });

  // 7) Gérant puis retrait de l'opérationnel quand l'entreprise est solide
  if (adapter && adapter.readyForManager && adapter.readyForManager(state) && !hasManager(state) && countRole(state, 'gerant') === 0) {
    let g = state.staff.candidates.filter((c) => c.role === 'gerant').sort((a, b) => b.skill - a.skill)[0];
    if (!g && state.cash > reserve) {
      act(state, { type: 'postJobAd', role: 'gerant' });
      g = state.staff.candidates.filter((c) => c.role === 'gerant').sort((a, b) => b.skill - a.skill)[0];
    }
    if (g && g.skill >= 40) act(state, { type: 'hire', id: g.id });
  }
  if (hasManager(state) && state.staff.founder.active && adapter && adapter.readyToRetire && adapter.readyToRetire(state)) act(state, { type: 'retire' });

  // 8) Sortir l'argent de la société (SRL : dividendes) puis placer l'excédent personnel
  if (state.meta.legal === 'srl' && dateOf(state.time.day).yearIdx >= 2 && state.tax.reserves > 0) {
    const free = state.cash - reserve * 1.5;
    const amt = Math.floor(Math.min(state.tax.reserves * 0.8, free) / 10_000) * 10_000;
    if (amt >= 100_000) act(state, { type: 'payDividend', amount: amt });
  }
  invest(state, strategy, P);
}

/** Placements du compte personnel selon la stratégie. */
export function invest(state, strategy) {
  const keep = state.personal.livingCost * 6;
  let surplus = state.personal.cash - keep;
  if (surplus < 200_000) return;
  const re = INVESTMENTS.realEstate.catalog;
  if (strategy !== 'prudente' && state.investments.realEstate.length < (strategy === 'agressive' ? 4 : 2)) {
    const down = strategy === 'agressive' ? 0.2 : 0.4;
    const target = re.find((x) => propertyQuote(state, x, down).cash < surplus * 0.8 && x.price >= 14_000_000);
    if (target && state.investments.etf.value > propertyQuote(state, target, down).cash * (strategy === 'agressive' ? 0 : 1)) {
      if (act(state, { type: 'buyProperty', id: target.id, downPct: down }).ok) surplus = state.personal.cash - keep;
    }
  }
  if (surplus < 200_000) return;
  if (strategy === 'prudente') {
    act(state, { type: 'deposit', amount: Math.round(surplus * 0.7) });
    act(state, { type: 'buyAsset', kind: 'etf', amount: Math.round(surplus * 0.3) });
  } else if (strategy === 'agressive') {
    act(state, { type: 'buyAsset', kind: 'stocks', amount: Math.round(surplus * 0.6) });
    act(state, { type: 'buyAsset', kind: 'etf', amount: Math.round(surplus * 0.35) });
  } else {
    act(state, { type: 'buyAsset', kind: 'etf', amount: Math.round(surplus * 0.85) });
    act(state, { type: 'deposit', amount: Math.round(surplus * 0.1) });
  }
}

