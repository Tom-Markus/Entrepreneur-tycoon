// Comportements de bot propres à chaque secteur (prix, recrutement, priorités).

import { applyAction } from '../src/engine/index.js';
import * as agence from '../src/engine/sectors/agence.js';
import { countRole } from '../src/engine/systems/staff.js';

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
};
