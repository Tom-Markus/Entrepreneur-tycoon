// Coût de la vie du dirigeant (après rémunération et impôts du mois).

import { endOfMonthLiving } from './owner.js';

export function monthEnd(state) {
  endOfMonthLiving(state);
}
