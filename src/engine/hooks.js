// Registre ordonné des systèmes du moteur.
// Chaque système peut exposer : init(state, opts, diff, rng), daily(state, rng),
// monthEnd(state, rng), quarterEnd(state, rng), yearEnd(state, rng), endOfDay(state, rng).
// L'ordre du tableau est l'ordre d'exécution (important pour le déterminisme) :
//   monde → entreprise → concurrents → secteur → équipe → événements → prêts → dirigeant → fiscalité → coût de la vie → finance → fin de partie

import * as core from './systems/core.js';
import * as company from './systems/company.js';
import * as competitors from './systems/competitors.js';
import * as sector from './systems/sector.js';
import * as events from './events.js';
import * as staff from './systems/staff.js';
import * as loans from './systems/loans.js';
import * as owner from './systems/owner.js';
import * as tax from './systems/tax.js';
import * as living from './systems/living.js';
import * as finance from './systems/finance.js';
import * as endgame from './systems/endgame.js';
import './commonActions.js';

export const SYSTEMS = [core, company, competitors, sector, staff, events, loans, owner, tax, living, finance, endgame];

export function initHooks() {
  return SYSTEMS.filter((s) => s.init).map((s) => s.init);
}
