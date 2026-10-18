// Décors de scène par secteur. Chaque décor fournit :
//   background(ctx, state)            décor statique (mis en cache)
//   animate(ctx, state, t, reduced)   éléments animés (travailleurs…)
//   target(state, i) → {x, y}         où vont les clients
//   coinSpot(state) → {x, y}          d'où partent les pièces
//   doorX, doorY                      entrée des clients
//   icon(ctx)                         icône 32×32

import { drawSprite, rect, look } from './sprites.js';
import { hasUpgrade } from '../engine/upgrades.js';

const FY = 62;

// --- Agence web ------------------------------------------------------------------

function agenceDesks(state) {
  const n = state.staff.employees.length + (state.staff.founder.active ? 1 : 0);
  const seats = hasUpgrade(state, 'plateau') ? 12 : hasUpgrade(state, 'bureau') ? 8 : hasUpgrade(state, 'coworking') ? 5 : 2;
  const count = Math.max(2, Math.min(12, Math.max(n, Math.min(seats, n + 1))));
  const out = [];
  for (let i = 0; i < count; i++) {
    const row = i < 6 ? 0 : 1;
    const col = i % 6;
    out.push({ x: 64 + col * 17 - row * 4, y: FY + 8 + row * 20 });
  }
  return out;
}

const agence = {
  wall: 'l',
  floor1: 'm',
  floor2: 'd',
  signColor: 'b',
  doorX: 182,
  doorY: FY + 30,
  layoutKey: (s) => `${s.staff.employees.length}|${s.staff.founder.active}`,
  background(b, state) {
    if (hasUpgrade(state, 'coworking')) drawSprite(b, 'poster', 66, 20);
    if (hasUpgrade(state, 'bureau')) {
      drawSprite(b, 'poster', 100, 18);
      drawSprite(b, 'table', 14, FY + 30);
    }
    if (hasUpgrade(state, 'plateau')) drawSprite(b, 'coffee', 150, FY - 8);
    if (hasUpgrade(state, 'cloud') || hasUpgrade(state, 'saas')) drawSprite(b, 'server', 140, FY - 8);
    drawSprite(b, 'plant', 2, FY - 6);
    if (hasUpgrade(state, 'coworking')) drawSprite(b, 'plant', 125, FY - 6);
    for (const d of agenceDesks(state)) drawSprite(b, 'desk', d.x, d.y);
  },
  animate(ctx, state, t, reduced) {
    const desks = agenceDesks(state);
    const people = [];
    if (state.staff.founder.active) people.push('founder');
    for (const e of state.staff.employees) people.push(e.id);
    const act = state.company.capacityUse || 0;
    people.forEach((id, i) => {
      const d = desks[i];
      if (!d) return;
      const bob = !reduced && act > 0.2 && Math.floor(t * 4 + i) % 3 === 0 ? 1 : 0;
      drawSprite(ctx, 'sitting', d.x + 4, d.y - 5 + bob, id === 'founder' ? { x: 'R', y: 'n', z: 'h', q: 's' } : look(id));
      // écran qui scintille quand on travaille
      if (act > 0.1 && !reduced && Math.floor(t * 3 + i * 2) % 4 === 0) rect(ctx, d.x + 5, d.y + 1, 4, 1, 'w');
    });
  },
  target(state, i) {
    if (hasUpgrade(state, 'bureau')) return { x: 24 + (i % 3) * 5, y: FY + 34 };
    return { x: 40 + (i % 4) * 6, y: FY + 40 };
  },
  coinSpot() {
    return { x: 120, y: FY + 6 };
  },
  icon(ctx) {
    rect(ctx, 4, 6, 24, 16, 'd');
    rect(ctx, 6, 8, 20, 12, 'C');
    rect(ctx, 8, 10, 8, 2, 'b');
    rect(ctx, 8, 14, 12, 2, 'w');
    rect(ctx, 2, 22, 28, 4, 'l');
    rect(ctx, 12, 23, 8, 1, 'm');
  },
};

// --- Aide commune ------------------------------------------------------------------

function staffIds(state) {
  const ids = [];
  if (state.staff.founder.active) ids.push('founder');
  for (const e of state.staff.employees) ids.push(e.id);
  return ids;
}

const FOUNDER_LOOK = { x: 'R', y: 'n', z: 'h', q: 's' };

/** Dessine les employés debout à des positions données (petite animation de travail). */
function drawStanding(ctx, state, positions, t, reduced, apron = null) {
  staffIds(state).forEach((id, i) => {
    const p = positions[i];
    if (!p) return;
    const lk = id === 'founder' ? { ...FOUNDER_LOOK } : look(id);
    if (apron) lk.x = apron;
    const act = state.company.capacityUse || 0;
    const frame = !reduced && act > 0.15 && Math.floor(t * 5 + i) % 4 === 0 ? 'person1' : 'person0';
    drawSprite(ctx, frame, p.x, p.y - 11 + (frame === 'person1' ? 0 : 0), lk, i % 2 === 1);
  });
}

// --- Friterie -------------------------------------------------------------------------

const restaurant = {
  wall: 'y',
  floor1: 'w',
  floor2: 'l',
  signColor: 'r',
  doorX: 182,
  doorY: FY + 34,
  layoutKey: (s) => `${s.staff.employees.length}|${s.staff.founder.active}`,
  background(b, state) {
    // carrelage mural
    for (let y = 4; y < FY - 2; y += 6) for (let x = 64; x < 176; x += 6) rect(b, x, y, 5, 5, (x + y) % 12 ? 'w' : 'F');
    drawSprite(b, 'menu', 70, 18);
    drawSprite(b, 'menu', 86, 18);
    drawSprite(b, 'fryer', 104, FY - 8);
    drawSprite(b, 'fryer', 116, FY - 8);
    if (hasUpgrade(state, 'friteuse')) drawSprite(b, 'fryer', 128, FY - 8);
    if (hasUpgrade(state, 'chambre_froide')) rect(b, 142, FY - 22, 14, 22, 'l');
    drawSprite(b, 'counter', 64, FY + 8);
    drawSprite(b, 'counter', 92, FY + 8);
    if (hasUpgrade(state, 'salle')) {
      drawSprite(b, 'table2', 12, FY + 30);
      drawSprite(b, 'table2', 30, FY + 36);
    }
    if (hasUpgrade(state, 'terrasse')) drawSprite(b, 'parasol', 150, FY + 22);
    if (hasUpgrade(state, 'enseigne')) rect(b, 64, 2, 2, 12, 'R');
    drawSprite(b, 'plant', 2, FY - 6);
  },
  animate(ctx, state, t, reduced) {
    const pos = [];
    for (let i = 0; i < 8; i++) pos.push({ x: 70 + i * 13, y: FY + 6 });
    drawStanding(ctx, state, pos, t, reduced, 'w');
    // vapeur des friteuses
    if (!reduced && (state.company.capacityUse || 0) > 0.1) {
      for (let i = 0; i < 3; i++) {
        const yy = FY - 12 - ((t * 10 + i * 5) % 14);
        rect(ctx, 108 + i * 6, Math.round(yy), 1, 2, 'w');
      }
    }
    const t0 = state.sector.today;
    if (t0 && t0.served > 0) drawSprite(ctx, 'cone', 96, FY + 2);
  },
  target(state, i) {
    return { x: 76 + (i % 6) * 9, y: FY + 32 + (i % 2) * 6 };
  },
  coinSpot() {
    return { x: 96, y: FY + 4 };
  },
  icon(ctx) {
    rect(ctx, 8, 4, 16, 6, 'y');
    for (let i = 0; i < 6; i++) rect(ctx, 9 + i * 2, 2 + (i % 2), 1, 8, 'F');
    rect(ctx, 6, 10, 20, 4, 'w');
    rect(ctx, 8, 14, 16, 14, 'R');
    rect(ctx, 10, 16, 12, 2, 'w');
    rect(ctx, 10, 20, 12, 2, 'w');
  },
};

// --- E-commerce ---------------------------------------------------------------------

const ecommerce = {
  wall: 'm',
  floor1: 'd',
  floor2: 'm',
  signColor: 'G',
  doorX: 182,
  doorY: FY + 34,
  layoutKey: (s) => `${s.staff.employees.length}|${s.staff.founder.active}|${Math.min(6, Math.round(Object.values(s.sector.stock).reduce((a, b) => a + b, 0) / 60))}`,
  background(b, state) {
    const big = hasUpgrade(state, 'entrepot');
    const shelves = big ? 5 : hasUpgrade(state, 'garage') ? 3 : 2;
    for (let i = 0; i < shelves; i++) drawSprite(b, 'shelf', 66 + i * 18, FY - 9);
    const stock = Object.values(state.sector.stock).reduce((a, c) => a + c, 0);
    const boxes = Math.min(18, Math.round(stock / 20));
    for (let i = 0; i < boxes; i++) drawSprite(b, 'box', 66 + (i % 9) * 7, FY + 34 - Math.floor(i / 9) * 5);
    drawSprite(b, 'table', 12, FY + 18);
    drawSprite(b, 'laptop', 16, FY + 14);
    if (hasUpgrade(state, 'logistique_3pl')) drawSprite(b, 'van', 150, FY + 20, { b: 'G' });
  },
  animate(ctx, state, t, reduced) {
    const pos = [{ x: 22, y: FY + 18 }];
    for (let i = 0; i < 10; i++) pos.push({ x: 70 + (i % 6) * 15, y: FY + 22 + Math.floor(i / 6) * 14 });
    drawStanding(ctx, state, pos, t, reduced);
    // colis qui partent
    const n = state.sector.today.shipped || 0;
    if (!reduced && n > 0) {
      const k = Math.min(4, Math.ceil(n / 10));
      for (let i = 0; i < k; i++) {
        const x = 120 + (((t * 25) + i * 18) % 60);
        drawSprite(ctx, 'box', Math.round(x), FY + 40);
      }
    }
  },
  target(state, i) {
    return { x: 150 + (i % 3) * 6, y: FY + 34 };
  },
  coinSpot() {
    return { x: 24, y: FY + 8 };
  },
  icon(ctx) {
    rect(ctx, 4, 10, 24, 18, 'W');
    rect(ctx, 4, 10, 24, 4, 'B');
    rect(ctx, 14, 10, 4, 18, 'y');
    rect(ctx, 22, 4, 8, 6, 'G');
    rect(ctx, 24, 2, 4, 2, 'G');
  },
};

// --- Artisan -------------------------------------------------------------------------

const artisan = {
  wall: 'W',
  floor1: 'm',
  floor2: 'd',
  signColor: 'b',
  doorX: 182,
  doorY: FY + 34,
  layoutKey: (s) => `${s.staff.employees.length}|${s.staff.founder.active}`,
  background(b, state) {
    // établi et outils au mur
    rect(b, 66, 26, 60, 3, 'B');
    for (let i = 0; i < 7; i++) rect(b, 70 + i * 8, 18, 2, 8, i % 2 ? 'l' : 'm');
    drawSprite(b, 'pipe', 130, 20);
    drawSprite(b, 'toolbox', 70, FY - 6);
    drawSprite(b, 'table', 80, FY + 6);
    const vans = 1 + (hasUpgrade(state, 'camionnette2') ? 1 : 0) + (hasUpgrade(state, 'camionnette3') ? 2 : 0);
    for (let i = 0; i < Math.min(vans, 3); i++) drawSprite(b, 'van', 8 + i * 30, FY + 30, hasUpgrade(state, 'lettrage') ? { b: 'R' } : null);
    drawSprite(b, 'plant', 2, FY - 6);
  },
  animate(ctx, state, t, reduced) {
    // les ouvriers sont « sur chantier » quand ils travaillent : on n'en montre que quelques-uns à l'atelier
    const act = state.company.capacityUse || 0;
    const pos = [{ x: 90, y: FY + 6 }, { x: 108, y: FY + 6 }, { x: 126, y: FY + 18 }, { x: 140, y: FY + 18 }];
    const ids = staffIds(state);
    const inShop = Math.max(1, Math.round(ids.length * (1 - act * 0.7)));
    ids.slice(0, Math.min(inShop, pos.length)).forEach((id, i) => {
      const lk = id === 'founder' ? { ...FOUNDER_LOOK, x: 'b' } : { ...look(id), x: 'b' };
      const frame = !reduced && act > 0.15 && Math.floor(t * 5 + i) % 4 === 0 ? 'person1' : 'person0';
      drawSprite(ctx, frame, pos[i].x, pos[i].y - 11, lk);
    });
    // camionnette qui part / revient
    if (!reduced && act > 0.3) {
      const x = 190 - ((t * 20) % 260);
      drawSprite(ctx, 'van', Math.round(x), FY + 44, hasUpgrade(state, 'lettrage') ? { b: 'R' } : null);
    }
  },
  target(state, i) {
    return { x: 120 + (i % 3) * 8, y: FY + 34 };
  },
  coinSpot() {
    return { x: 30, y: FY + 26 };
  },
  icon(ctx) {
    rect(ctx, 6, 22, 20, 6, 'm');
    rect(ctx, 14, 6, 4, 18, 'l');
    rect(ctx, 10, 4, 12, 4, 'l');
    rect(ctx, 8, 2, 4, 4, 'l');
    rect(ctx, 20, 2, 4, 4, 'l');
    rect(ctx, 22, 20, 6, 8, 'R');
  },
};

// --- Soutien scolaire -------------------------------------------------------------------

const soutien = {
  wall: 'G',
  floor1: 'W',
  floor2: 'B',
  signColor: 'p',
  doorX: 182,
  doorY: FY + 34,
  layoutKey: (s) => `${s.staff.employees.length}|${s.staff.founder.active}|${Math.min(12, Math.round(s.sector.students / 6))}`,
  background(b, state) {
    drawSprite(b, 'board', 70, 16);
    if (hasUpgrade(state, 'tableaux')) rect(b, 96, 18, 22, 12, 'C');
    drawSprite(b, 'books', 150, FY - 4);
    drawSprite(b, 'books', 156, FY - 4);
    const desks = Math.min(12, Math.max(2, Math.round(state.sector.students / 6)));
    for (let i = 0; i < desks; i++) drawSprite(b, 'schoolDesk', 66 + (i % 6) * 18, FY + 14 + Math.floor(i / 6) * 16);
    drawSprite(b, 'plant', 2, FY - 6);
  },
  animate(ctx, state, t, reduced) {
    // élèves assis
    const desks = Math.min(12, Math.max(2, Math.round(state.sector.students / 6)));
    const seated = Math.min(desks * 2, Math.ceil(state.sector.students / 3));
    for (let i = 0; i < seated; i++) {
      const d = i % desks;
      const x = 67 + (d % 6) * 18 + (i >= desks ? 5 : 0);
      const y = FY + 14 + Math.floor(d / 6) * 16;
      const bob = !reduced && Math.floor(t * 2 + i) % 7 === 0 ? 1 : 0;
      drawSprite(ctx, 'sitting', x, y - 6 + bob, look(`el${i}`));
    }
    // profs au tableau
    const pos = [{ x: 64, y: FY + 6 }, { x: 122, y: FY + 6 }, { x: 140, y: FY + 6 }, { x: 40, y: FY + 20 }];
    drawStanding(ctx, state, pos, t, reduced);
  },
  target(state, i) {
    return { x: 30 + (i % 3) * 8, y: FY + 36 };
  },
  coinSpot() {
    return { x: 90, y: FY - 6 };
  },
  icon(ctx) {
    rect(ctx, 4, 6, 24, 18, 'B');
    rect(ctx, 6, 8, 20, 14, 'T');
    rect(ctx, 8, 10, 10, 1, 'w');
    rect(ctx, 8, 13, 14, 1, 'w');
    rect(ctx, 8, 16, 8, 1, 'w');
    rect(ctx, 10, 24, 12, 4, 'R');
  },
};

export const DECOR = { agence, restaurant, ecommerce, artisan, soutien };
