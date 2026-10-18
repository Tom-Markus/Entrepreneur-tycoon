// Modèle de demande commun : attractivité et part de marché.
// Voir docs/DESIGN.md § 4.1.

import { ECONOMY } from '../data/economy.js';

/** Facteur prix : (prixRéf / prix) ^ élasticité, borné pour éviter les extrêmes. */
export function priceFactor(price, refPrice, elasticity) {
  if (price <= 0) return 3;
  const f = Math.pow(refPrice / price, elasticity);
  return Math.max(0.02, Math.min(3, f));
}

export function qualityFactor(q) {
  return Math.pow(Math.max(0.1, q), 0.8);
}

export function reputationFactor(rep) {
  return 0.5 + Math.max(0, Math.min(100, rep)) / 100;
}

/** Rendements décroissants : 1 + k × ln(1 + budget / référence). */
export function marketingFactor(monthlyBudget, ref) {
  return 1 + ECONOMY.marketingK * Math.log(1 + Math.max(0, monthlyBudget) / Math.max(1, ref));
}

/**
 * Attractivité d'un acteur.
 * @returns {{value:number, parts:object}} parts = facteurs pour le « pourquoi ? »
 */
export function attractiveness({ price, refPrice, elasticity, quality, reputation, marketing, marketingRef, extra = 1 }) {
  const parts = {
    prix: priceFactor(price, refPrice, elasticity),
    qualite: qualityFactor(quality),
    reputation: reputationFactor(reputation),
    marketing: marketingFactor(marketing, marketingRef),
    autres: extra,
  };
  return { value: parts.prix * parts.qualite * parts.reputation * parts.marketing * parts.autres, parts };
}

/** Somme de l'attractivité des concurrents vivants (ou valeur par défaut). */
export function competitorAttraction(state) {
  const list = state.competitors || [];
  if (!list.length) return ECONOMY.defaultCompetitorAttraction;
  let s = 0;
  for (const c of list) if (c.alive) s += c.attraction || 0;
  return s;
}

/** Part du joueur = A / (A + Σ concurrents + hors marché). */
export function playerShare(state, playerA) {
  const comp = competitorAttraction(state);
  const total = playerA + comp + ECONOMY.outsideOption;
  return total > 0 ? playerA / total : 0;
}
