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

export const DECOR = { agence };
