// Scène pixel art animée de l'entreprise (canvas 192×108, agrandi en CSS).
// Le décor dépend du secteur et des améliorations ; les personnages et les
// pièces réagissent à l'activité réelle du moteur.

import { drawSprite, rect, PALETTE, look } from './sprites.js';
import { drawText } from './pixelfont.js';
import { DECOR } from './sceneDecor.js';
import { sectorModule } from '../engine/sectors/index.js';

export const W = 192;
export const H = 108;
export const FLOOR_Y = 62;

export class Scene {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    canvas.width = W;
    canvas.height = H;
    this.bg = document.createElement('canvas');
    this.bg.width = W;
    this.bg.height = H;
    this.bgKey = '';
    this.walkers = [];
    this.coins = [];
    this.t = 0;
    this.spawnAcc = 0;
    this.lastInflow = null;
    this.seq = 0;
    this.reduced = typeof matchMedia !== 'undefined' && matchMedia('(prefers-reduced-motion: reduce)').matches;
  }

  decor(state) {
    return DECOR[state.meta.sector] || DECOR.agence;
  }

  update(dt, state) {
    this.t += dt;
    const d = this.decor(state);
    const info = sectorModule(state).sceneInfo ? sectorModule(state).sceneInfo(state) : { activity: 0.5, customers: 2 };
    const speedOn = dt > 0;
    // Arrivée de clients proportionnelle à l'activité
    this.spawnAcc += dt * (0.15 + info.customers * 0.18);
    if (speedOn && this.spawnAcc > 1 && this.walkers.length < 7) {
      this.spawnAcc = 0;
      const target = d.target(state, this.seq);
      this.seq++;
      this.walkers.push({ id: `c${this.seq}`, x: d.doorX, y: d.doorY, tx: target.x, ty: target.y, phase: 'in', wait: 1.5 + Math.random() * 2.5, look: look(`c${this.seq}${state.time.day}`) });
    }
    for (const w of this.walkers) {
      const sp = 22 * dt;
      if (w.phase === 'in' || w.phase === 'out') {
        const dx = w.tx - w.x;
        const dy = w.ty - w.y;
        const dist = Math.hypot(dx, dy);
        if (dist < 1) {
          if (w.phase === 'in') w.phase = 'wait';
          else w.done = true;
        } else {
          w.x += (dx / dist) * Math.min(sp, dist);
          w.y += (dy / dist) * Math.min(sp, dist);
          w.flip = dx < 0;
        }
      } else if (w.phase === 'wait') {
        w.wait -= dt;
        if (w.wait <= 0) {
          w.phase = 'out';
          w.tx = d.doorX;
          w.ty = d.doorY;
        }
      }
    }
    this.walkers = this.walkers.filter((w) => !w.done);
    // Pièces quand de l'argent rentre
    const inflow = state.finance.month.inflow;
    if (this.lastInflow !== null && inflow > this.lastInflow) {
      const n = Math.min(3, 1 + Math.floor((inflow - this.lastInflow) / 100_000));
      for (let i = 0; i < n; i++) {
        const p = d.coinSpot(state);
        this.coins.push({ x: p.x + (Math.random() * 10 - 5), y: p.y, vy: -14 - Math.random() * 6, life: 1.4 });
      }
    }
    this.lastInflow = inflow;
    for (const c of this.coins) {
      c.y += c.vy * dt;
      c.vy += 12 * dt;
      c.life -= dt;
    }
    this.coins = this.coins.filter((c) => c.life > 0);
  }

  draw(state) {
    const ctx = this.ctx;
    const d = this.decor(state);
    const key = `${state.meta.sector}|${state.upgrades.owned.join(',')}|${state.world.weather}|${d.layoutKey ? d.layoutKey(state) : ''}`;
    if (key !== this.bgKey) {
      this.bgKey = key;
      const b = this.bg.getContext('2d');
      b.clearRect(0, 0, W, H);
      drawRoom(b, state, d);
      d.background(b, state);
      drawSign(b, state, d);
    }
    ctx.drawImage(this.bg, 0, 0);
    drawWeather(ctx, state, this.t, this.reduced);
    // Éléments animés du secteur (travailleurs, machines…)
    d.animate(ctx, state, this.t, this.reduced);
    // Clients (triés par profondeur)
    const sorted = [...this.walkers].sort((a, b) => a.y - b.y);
    for (const w of sorted) {
      const moving = w.phase !== 'wait';
      const frame = moving && !this.reduced && Math.floor(this.t * 6) % 2 ? 'person1' : 'person0';
      drawSprite(ctx, frame, Math.round(w.x - 3), Math.round(w.y - 11), w.look, w.flip);
    }
    for (const c of this.coins) {
      ctx.globalAlpha = Math.max(0, Math.min(1, c.life));
      drawSprite(ctx, 'coin', Math.round(c.x), Math.round(c.y));
      ctx.globalAlpha = 1;
    }
    if (state.status === 'bankrupt') {
      ctx.fillStyle = 'rgba(26,28,44,0.6)';
      ctx.fillRect(0, 0, W, H);
      drawText(ctx, 'FERMÉ', 78, 44, PALETTE.R, 1, PALETTE.k);
    }
  }
}

function drawRoom(b, state, d) {
  rect(b, 0, 0, W, FLOOR_Y, d.wall || 'm');
  rect(b, 0, FLOOR_Y - 2, W, 2, 'd');
  // Sol en damier discret
  for (let y = FLOOR_Y; y < H; y += 6)
    for (let x = 0; x < W; x += 6) rect(b, x, y, 6, 6, ((x + y) / 6) % 2 ? d.floor1 || 'W' : d.floor2 || 'B');
  // Fenêtre
  rect(b, 8, 10, 52, 34, 'd');
  rect(b, 10, 12, 48, 30, skyColor(state.world.weather));
  rect(b, 33, 12, 2, 30, 'd');
  rect(b, 10, 26, 48, 2, 'd');
  // Porte
  drawSprite(b, 'door', d.doorX - 4, FLOOR_Y - 16);
}

function drawSign(b, state, d) {
  const name = state.meta.companyName.toUpperCase().slice(0, 18);
  const w = name.length * 6 + 5;
  const x = Math.max(64, Math.min(W - w - 2, d.doorX - w + 8));
  rect(b, x, 2, w, 12, 'k');
  rect(b, x + 1, 3, w - 2, 10, d.signColor || 'n');
  drawText(b, name, x + 3, 3, PALETTE.y, 1);
}

function skyColor(wt) {
  return { soleil: 'c', canicule: 'o', nuageux: 'l', pluie: 'm', froid: 'C' }[wt] || 'c';
}

function drawWeather(ctx, state, t, reduced) {
  const wt = state.world.weather;
  ctx.save();
  ctx.beginPath();
  ctx.rect(10, 12, 48, 30);
  ctx.clip();
  if (wt === 'soleil' || wt === 'canicule') {
    rect(ctx, 44, 15, 8, 8, wt === 'canicule' ? 'R' : 'y');
    rect(ctx, 46, 13, 4, 12, wt === 'canicule' ? 'R' : 'y');
  }
  if (wt === 'nuageux' || wt === 'pluie') {
    const off = reduced ? 0 : Math.floor(t * 3) % 60;
    for (const cx of [4, 30, 56]) {
      const x = ((cx + off) % 60) + 4;
      rect(ctx, x, 16, 14, 5, 'w');
      rect(ctx, x + 3, 13, 8, 4, 'w');
    }
  }
  if (wt === 'pluie') {
    ctx.fillStyle = PALETTE.C;
    for (let i = 0; i < 14; i++) {
      const x = 10 + ((i * 37) % 48);
      const y = 12 + (((reduced ? 0 : t * 40) + i * 11) % 30);
      ctx.fillRect(x, y, 1, 3);
    }
  }
  if (wt === 'froid') {
    ctx.fillStyle = PALETTE.w;
    for (let i = 0; i < 12; i++) {
      const x = 10 + ((i * 29 + (reduced ? 0 : Math.floor(t * 4))) % 48);
      const y = 12 + (((reduced ? 0 : t * 8) + i * 7) % 30);
      ctx.fillRect(x, y, 1, 1);
    }
  }
  ctx.restore();
}

/** Petite scène décorative pour l'écran titre. */
export function drawLogoScene(canvas) {
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const w = canvas.width;
  const h = canvas.height;
  rect(ctx, 0, 0, w, h, 'n');
  for (let i = 0; i < 30; i++) rect(ctx, (i * 53) % w, (i * 29) % (h - 50), 1, 1, 'l');
  // Skyline belge : maisons à pignons + Atomium stylisé
  const base = h - 20;
  let x = 0;
  const cols = ['r', 'B', 'o', 'W', 'p', 'T'];
  let i = 0;
  while (x < w) {
    const bw = 18 + ((i * 7) % 10);
    const bh = 26 + ((i * 13) % 26);
    rect(ctx, x, base - bh, bw, bh, cols[i % cols.length]);
    for (let s = 0; s < bw / 2; s += 2) rect(ctx, x + s, base - bh - s / 2 - 1, bw - 2 * s, 2, cols[i % cols.length]);
    for (let wy = base - bh + 6; wy < base - 6; wy += 8)
      for (let wx = x + 3; wx < x + bw - 4; wx += 6) rect(ctx, wx, wy, 3, 4, (wx + wy) % 3 ? 'y' : 'd');
    x += bw;
    i++;
  }
  const ax = Math.floor(w * 0.72);
  const ay = base - 64;
  rect(ctx, ax + 9, ay + 8, 2, 60, 'l');
  for (const [dx, dy] of [[0, 0], [16, 0], [8, 8], [0, 16], [16, 16], [8, 24]]) {
    rect(ctx, ax + dx - 2 + 2, ay + dy, 8, 8, 'l');
    rect(ctx, ax + dx + 1 + 2, ay + dy + 1, 2, 2, 'w');
  }
  rect(ctx, 0, base, w, 20, 'd');
  rect(ctx, 0, base, w, 2, 'm');
  drawSprite(ctx, 'person0', 30, base + 2, { x: 'R', y: 'n', z: 'h', q: 's' });
  drawSprite(ctx, 'coin', 40, base + 4);
  drawSprite(ctx, 'coin', 46, base + 1);
}

/** Icône de secteur (32×32) pour l'écran de création. */
export function drawSectorIcon(canvas, sector) {
  const ctx = canvas.getContext('2d');
  ctx.clearRect(0, 0, 32, 32);
  const d = DECOR[sector];
  if (d && d.icon) d.icon(ctx);
}
