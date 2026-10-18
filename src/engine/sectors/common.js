// Briques communes aux secteurs.

import { DIFFICULTIES } from '../../data/difficulty.js';
import { attractiveness, playerShare } from '../demand.js';
import { modMult } from '../modifiers.js';
import { economyIndex } from '../systems/core.js';

/** HT à partir d'un prix TTC (B2C). En franchise TVA, HT = TTC. */
export function htFromTtc(state, ttc, vatRate) {
  if (state.finance.franchise) return ttc;
  return Math.round(ttc / (1 + vatRate));
}

export function diffOf(state) {
  return DIFFICULTIES[state.meta.difficulty];
}

/** Attractivité + part de marché du joueur pour un prix donné. */
export function playerMarket(state, D, price, ref, extra = 1) {
  const att = attractiveness({
    price,
    refPrice: ref,
    elasticity: D.elasticity,
    quality: state.company.quality,
    reputation: state.company.reputation,
    marketing: state.company.marketing,
    marketingRef: D.marketingRef,
    extra: extra * modMult(state, 'attraction'),
  });
  const share = playerShare(state, att.value);
  state.company.share = share;
  state.company.attraction = att.value;
  return { att, share, eco: economyIndex(state), ev: modMult(state, 'demand') };
}

/** Lignes du panneau « pourquoi ? » communes. */
export function baseWhy(m, priceHint) {
  return [
    { label: 'Part de marché', value: m.share, kind: 'pct' },
    { label: 'Prix', value: m.att.parts.prix, hint: priceHint },
    { label: 'Qualité', value: m.att.parts.qualite, hint: 'Qualité perçue face au marché.' },
    { label: 'Réputation', value: m.att.parts.reputation, hint: 'Satisfaction accumulée des clients.' },
    { label: 'Marketing', value: m.att.parts.marketing, hint: 'Rendements décroissants.' },
    { label: 'Conjoncture', value: m.eco, hint: 'Indice économique général.' },
    { label: 'Événements', value: m.ev, hint: 'Effets temporaires en cours.' },
  ];
}

/** Productivité globale (événements). */
export function prodMod(state) {
  return modMult(state, 'productivity');
}
