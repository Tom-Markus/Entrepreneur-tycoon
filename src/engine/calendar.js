// Calendrier simplifié : 12 mois de 30 jours (année de 360 jours).
// Le jour 0 est le jeudi 1er janvier 2026.

import { CONFIG } from '../data/config.js';

export const DAYS_PER_MONTH = 30;
export const MONTHS_PER_YEAR = 12;
export const DAYS_PER_YEAR = DAYS_PER_MONTH * MONTHS_PER_YEAR;

export const MONTH_NAMES = [
  'janvier', 'février', 'mars', 'avril', 'mai', 'juin',
  'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre',
];
export const MONTH_SHORT = ['janv.', 'févr.', 'mars', 'avr.', 'mai', 'juin', 'juil.', 'août', 'sept.', 'oct.', 'nov.', 'déc.'];
export const WEEKDAY_NAMES = ['lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi', 'dimanche'];

/** Décompose un numéro de jour en date de jeu. */
export function dateOf(day) {
  const d = Math.max(0, Math.floor(day));
  const yearIdx = Math.floor(d / DAYS_PER_YEAR);
  const inYear = d - yearIdx * DAYS_PER_YEAR;
  const month = Math.floor(inYear / DAYS_PER_MONTH); // 0..11
  const dom = inYear - month * DAYS_PER_MONTH + 1; // 1..30
  const weekday = (d + CONFIG.startWeekday) % 7; // 0 = lundi
  return {
    year: CONFIG.startYear + yearIdx,
    yearIdx,
    month,
    dom,
    weekday,
    quarter: Math.floor(month / 3), // 0..3
    dayOfYear: inYear,
  };
}

/** Numéro de jour pour (année d'index, mois 0-11, jour 1-30). */
export function dayOf(yearIdx, month, dom) {
  return yearIdx * DAYS_PER_YEAR + month * DAYS_PER_MONTH + (dom - 1);
}

export function isWeekend(day) {
  return dateOf(day).weekday >= 5;
}

export function formatDate(day) {
  const d = dateOf(day);
  return `${d.dom} ${MONTH_NAMES[d.month]} ${d.year}`;
}

export function formatMonth(monthIndex) {
  const yearIdx = Math.floor(monthIndex / 12);
  return `${MONTH_SHORT[monthIndex % 12]} ${CONFIG.startYear + yearIdx}`;
}

/** Index absolu du mois (0 = janvier de la première année). */
export function monthIndexOf(day) {
  return Math.floor(day / DAYS_PER_MONTH);
}
