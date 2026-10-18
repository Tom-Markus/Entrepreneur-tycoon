// Actions communes à tous les secteurs. Les actions propres à un secteur
// passent par { type: 'sector', name, ...params }.

import { registerActions } from './actions.js';
import { sectorModule } from './sectors/index.js';
import { buyUpgrade } from './upgrades.js';
import * as staff from './systems/staff.js';
import { personalOut, receive } from './ledger.js';
import { clamp } from './money.js';
import { log } from './log.js';

registerActions({
  sector(state, a, rng) {
    const m = sectorModule(state);
    const h = m.actions && m.actions[a.name];
    if (!h) return { ok: false, message: `Action de secteur inconnue : ${a.name}` };
    return h(state, a, rng) || { ok: true };
  },
  setMarketing(state, a) {
    const v = Math.round(Number(a.value));
    if (!Number.isFinite(v)) return { ok: false, message: 'Valeur invalide.' };
    state.company.marketing = clamp(v, 0, 5_000_000);
    return { ok: true };
  },
  buyUpgrade(state, a) {
    const r = buyUpgrade(state, a.id);
    if (!r.ok) return { ok: false, message: r.reason };
    const m = sectorModule(state);
    if (m.onUpgrade) m.onUpgrade(state, a.id);
    return { ok: true };
  },
  hire(state, a) {
    return staff.hire(state, a.id);
  },
  fire(state, a) {
    return staff.fire(state, a.id);
  },
  train(state, a) {
    return staff.train(state, a.id);
  },
  raise(state, a) {
    return staff.raise(state, a.id, a.pct || 0.05);
  },
  postJobAd(state, a, rng) {
    return staff.postJobAd(state, rng, a.role);
  },
  setDraw(state, a) {
    const v = Math.round(Number(a.value));
    if (!Number.isFinite(v)) return { ok: false, message: 'Valeur invalide.' };
    state.personal.draw = clamp(v, 0, 5_000_000);
    return { ok: true };
  },
  /** Apport personnel : compte perso → compte pro. */
  apport(state, a) {
    const v = Math.round(Number(a.value));
    if (!(v > 0)) return { ok: false, message: 'Montant invalide.' };
    if (v > state.personal.cash) return { ok: false, message: 'Pas assez d’argent sur ton compte personnel.' };
    personalOut(state, v, 'apport');
    receive(state, v, 'apport');
    state.stats.apports = (state.stats.apports || 0) + v;
    log(state, 'info', `Apport personnel de ${(v / 100).toFixed(0)} € dans l'entreprise.`);
    return { ok: true };
  },
  /** Le fondateur se retire de l'opérationnel (nécessite un gérant). */
  retire(state) {
    if (!state.staff.founder.active) return { ok: false, message: 'Tu es déjà retiré·e de l’opérationnel.' };
    if (!staff.hasManager(state)) return { ok: false, message: 'Il faut d’abord recruter un·e gérant·e compétent·e.' };
    state.staff.founder.active = false;
    state.stats.retiredDay = state.time.day;
    log(state, 'good', 'Tu te retires de l’opérationnel : ton gérant dirige désormais l’entreprise.', true);
    return { ok: true };
  },
  unretire(state) {
    if (state.staff.founder.active) return { ok: false, message: 'Tu travailles déjà dans l’entreprise.' };
    if (staff.seatsAvailable(state) <= 0) return { ok: false, message: 'Plus de place dans les locaux.' };
    state.staff.founder.active = true;
    log(state, 'info', 'Tu reprends du service dans l’entreprise.');
    return { ok: true };
  },
});
