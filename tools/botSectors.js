// Comportements de bot propres à chaque secteur (prix, recrutement, priorités).

import { applyAction } from '../src/engine/index.js';
import * as agence from '../src/engine/sectors/agence.js';
import * as restaurant from '../src/engine/sectors/restaurant.js';
import * as ecommerce from '../src/engine/sectors/ecommerce.js';
import * as artisan from '../src/engine/sectors/artisan.js';
import * as soutien from '../src/engine/sectors/soutien.js';
import { RESTAURANT } from '../src/data/sectors/restaurant.js';
import { ECOMMERCE } from '../src/data/sectors/ecommerce.js';
import { SOUTIEN } from '../src/data/sectors/soutien.js';
import { countRole } from '../src/engine/systems/staff.js';

const sector = (state, name, extra) => applyAction(state, { type: 'sector', name, ...extra });

function avgProfit(state, n) {
  const h = state.finance.history.slice(-n);
  return h.length ? h.reduce((s, x) => s + x.profit, 0) / h.length : 0;
}

export const SECTOR_BOTS = {
  agence: {
    monthly(state, P) {
      const s = state.sector;
      const cap = Math.max(1, agence.hoursPerDay(state));
      const months = agence.backlogHours(state) / (cap * 21);
      let rate = s.rate;
      if (months > 1.3) rate *= 1 + P.priceStep;
      else if (months < 0.4) rate *= 1 - P.priceStep;
      applyAction(state, { type: 'sector', name: 'setRate', value: Math.round(rate / 100) * 100 });
      if (s.policy !== 'capacite') applyAction(state, { type: 'sector', name: 'setPolicy', value: 'capacite' });
    },
    wantsHire(state, P) {
      const cap = Math.max(1, agence.hoursPerDay(state));
      const months = agence.backlogHours(state) / (cap * 21);
      const devs = countRole(state, 'developpeur') + countRole(state, 'designer');
      if (months > P.hireBacklog) {
        if (devs >= 4 && countRole(state, 'chef_projet') === 0) return 'chef_projet';
        if (state.company.quality < 0.95 && countRole(state, 'designer') < 2) return 'designer';
        return 'developpeur';
      }
      if (months < 0.5 && devs >= 2 && countRole(state, 'commercial') < Math.ceil(devs / 3)) return 'commercial';
      return null;
    },
    upgradePriority(u) {
      return { portfolio: 9, acompte: 8, offre_maintenance: 8, coworking: 7, laptops: 6, agile: 6, seo_agence: 5, composants: 5, cloud: 4, saas: 4, bureau: 3 }[u.id] || 1;
    },
    readyForManager(state) {
      return avgProfit(state, 6) > 900_000 && state.staff.employees.length >= 3;
    },
    readyToRetire(state) {
      return state.staff.employees.length >= 4;
    },
  },

  restaurant: {
    monthly(state, P) {
      const s = state.sector;
      const lost = s.stats.lost;
      const caps = restaurant.capacities(state);
      const avg = s.recent.reduce((a, b) => a + b, 0) / Math.max(1, s.recent.length);
      let price = s.price;
      if (avg > caps.total * 1.15) price *= 1 + P.priceStep;
      else if (avg < caps.total * 0.5) price *= 1 - P.priceStep / 2;
      sector(state, 'setPrice', { value: Math.round(Math.min(price, RESTAURANT.refPrice * 1.35) / 10) * 10 });
      if (s.hygiene < 70) sector(state, 'setCleaning', { value: s.cleaning + 5_000 });
      else if (s.hygiene > 92 && s.cleaning > 10_000) sector(state, 'setCleaning', { value: s.cleaning - 2_500 });
      s._lastLost = lost;
    },
    wantsHire(state, P) {
      const caps = restaurant.capacities(state);
      const t = state.sector.recent.reduce((a, b) => a + b, 0) / Math.max(1, state.sector.recent.length);
      if (t > caps.total * (0.85 + (P.hireBacklog - 1) * 0.5)) return caps.kitchen < caps.counter ? 'cuisinier' : 'vendeur';
      if (state.sector.hygiene < 55 && countRole(state, 'plongeur') === 0) return 'plongeur';
      return null;
    },
    upgradePriority(u) {
      return { double_cuisson: 9, haccp: 8, friteuse: 7, salle: 7, enseigne: 6, prevision: 5, terrasse: 5, sauce_maison: 5, place: 4, chambre_froide: 3 }[u.id] || 1;
    },
    readyForManager(state) {
      return avgProfit(state, 6) > 700_000 && state.staff.employees.length >= 3;
    },
    readyToRetire(state) {
      return state.staff.employees.length >= 4;
    },
  },

  ecommerce: {
    monthly(state, P, strategy) {
      const s = state.sector;
      // Catalogue : remplir les emplacements avec les produits à meilleure marge
      const ranked = [...ECOMMERCE.products].sort((a, b) => (b.ref / (1 + b.vat) - b.cost - b.ship) - (a.ref / (1 + a.vat) - a.cost - a.ship));
      for (const p of ranked) {
        if (s.listed.length >= ecommerce.slots(state)) break;
        if (!s.listed.includes(p.id)) sector(state, 'listProduct', { id: p.id });
      }
      if (!s.reorder) sector(state, 'setReorder', { value: true });
    },
    marketing(state, P) {
      // La publicité n'est rentable que si le coût d'acquisition reste sous la marge
      const t = state.sector.today;
      const rev = state.finance.history.length ? state.finance.history[state.finance.history.length - 1].revenue : 0;
      return Math.max(40_000, rev * (P.marketingShare + 0.08));
    },
    wantsHire(state, P) {
      const cap = ecommerce.orderCapacity(state);
      const t = state.sector.today;
      if ((t.sold || 0) + state.sector.backlog > cap * 0.8 * P.hireBacklog) return 'logisticien';
      if (state.staff.employees.length >= 2 && countRole(state, 'marketeur') === 0) return 'marketeur';
      if (state.staff.employees.length >= 4 && countRole(state, 'service_client') === 0) return 'service_client';
      return null;
    },
    upgradePriority(u) {
      return { slots1: 9, photo: 8, seo: 8, avis: 7, transporteurs: 6, retours: 6, imprimante: 5, garage: 5, emailing: 5, slots2: 4, reassort_auto: 4, marketplace: 3 }[u.id] || 1;
    },
    readyForManager(state) {
      return avgProfit(state, 6) > 600_000 && state.staff.employees.length >= 2;
    },
    readyToRetire(state) {
      return state.staff.employees.length >= 3;
    },
  },

  artisan: {
    monthly(state, P) {
      const s = state.sector;
      const cap = Math.max(0.5, artisan.workforce(state));
      const months = artisan.backlogDays(state) / (cap * 21);
      let rate = s.rate;
      if (months > 1.2) rate *= 1 + P.priceStep;
      else if (months < 0.3) rate *= 1 - P.priceStep;
      sector(state, 'setRate', { value: Math.round(rate / 100) * 100 });
    },
    wantsHire(state, P) {
      const cap = Math.max(0.5, artisan.workforce(state));
      const months = artisan.backlogDays(state) / (cap * 21);
      if (months > P.hireBacklog * 0.8) {
        const workers = countRole(state, 'ouvrier') + countRole(state, 'apprenti') + 1;
        if (workers >= artisan.vans(state) * 2) return null; // il faut d'abord une camionnette
        return countRole(state, 'ouvrier') <= countRole(state, 'apprenti') ? 'ouvrier' : 'apprenti';
      }
      if (state.staff.employees.length >= 3 && countRole(state, 'planificateur') === 0) return 'planificateur';
      return null;
    },
    upgradePriority(u) {
      return { site_avis: 9, outillage: 8, devis_logiciel: 7, lettrage: 7, planning: 6, camionnette2: 6, contrats: 5, certif: 5, camera: 4, atelier: 4, stock_camion: 4 }[u.id] || 1;
    },
    readyForManager(state) {
      return avgProfit(state, 6) > 900_000 && state.staff.employees.length >= 3;
    },
    readyToRetire(state) {
      return state.staff.employees.length >= 4;
    },
  },

  soutien: {
    monthly(state, P) {
      const s = state.sector;
      const cap = soutien.capacity(state);
      if (s.students > cap.total * 0.95) sector(state, 'setPrice', { value: Math.round(Math.min(s.price * (1 + P.priceStep), SOUTIEN.refPrice * 1.5) / 100) * 100 });
      else if (s.students < cap.total * 0.4 && s.price > SOUTIEN.refPrice * 0.8) sector(state, 'setPrice', { value: Math.round((s.price * (1 - P.priceStep / 2)) / 100) * 100 });
      const g = soutien.expectedSuccess(state) < 0.7 ? s.groupSize - 1 : s.groupSize < 7 ? s.groupSize + 1 : s.groupSize;
      sector(state, 'setGroupSize', { value: g });
    },
    wantsHire(state, P) {
      const cap = soutien.capacity(state);
      if (state.sector.students > cap.teach * (0.75 + (P.hireBacklog - 1) * 0.3) && cap.teach <= cap.seats) return soutien.expectedSuccess(state) < 0.72 ? 'enseignant' : 'etudiant';
      if (state.staff.employees.length >= 4 && countRole(state, 'coordinateur') === 0) return 'coordinateur';
      return null;
    },
    upgradePriority(u) {
      return { methode: 9, suivi_parents: 8, flyers: 7, salle2: 7, stages: 6, blocus: 6, temoignages: 5, tableaux: 4, centre: 3 }[u.id] || 1;
    },
    readyForManager(state) {
      return avgProfit(state, 6) > 600_000 && state.staff.employees.length >= 3;
    },
    readyToRetire(state) {
      return state.staff.employees.length >= 4;
    },
  },
};
