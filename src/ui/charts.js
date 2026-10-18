// Graphiques légers dessinés sur canvas, sans bibliothèque.
// Le canvas est redimensionné à sa taille affichée × devicePixelRatio pour
// rester net ; les couleurs suivent la palette du jeu.

import { eurShort, pct as fmtPct, num } from './format.js';

const AXIS = '#566c86';
const TEXT = '#94b0c2';
const GRID = '#29366f';
const FONT = '11px ui-monospace, Menlo, Consolas, monospace';

function setup(canvas) {
  const dpr = Math.min(2, (typeof window !== 'undefined' && window.devicePixelRatio) || 1);
  const cssW = canvas.clientWidth || canvas.width;
  const cssH = Math.round((cssW * canvas.height) / canvas.width) || canvas.height;
  if (!canvas.dataset.baseH) {
    canvas.dataset.baseW = canvas.width;
    canvas.dataset.baseH = canvas.height;
  }
  const ratio = Number(canvas.dataset.baseH) / Number(canvas.dataset.baseW);
  const h = Math.round(cssW * ratio);
  canvas.width = Math.round(cssW * dpr);
  canvas.height = Math.round(h * dpr);
  canvas.style.height = `${h}px`;
  const ctx = canvas.getContext('2d');
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.clearRect(0, 0, cssW, h);
  ctx.font = FONT;
  return { ctx, w: cssW, h };
}

function niceStep(range) {
  const raw = range / 4;
  const mag = Math.pow(10, Math.floor(Math.log10(Math.max(raw, 1e-9))));
  const n = raw / mag;
  return (n < 1.5 ? 1 : n < 3 ? 2 : n < 7 ? 5 : 10) * mag;
}

/**
 * Courbes.
 * @param {HTMLCanvasElement} canvas
 * @param {{labels:string[], series:{name:string, color:string, values:number[], dashed?:boolean}[]}} data
 * @param {{format?:'eur'|'pct'|'num', zero?:boolean}} opts
 */
export function drawLines(canvas, data, opts = {}) {
  const { ctx, w, h } = setup(canvas);
  const fmt = opts.format === 'pct' ? (v) => fmtPct(v) : opts.format === 'num' ? (v) => num(v) : (v) => eurShort(v);
  const padL = 58;
  const padR = 10;
  const padT = 10;
  const padB = 22;
  const all = data.series.flatMap((s) => s.values).filter(Number.isFinite);
  if (!all.length) {
    ctx.fillStyle = TEXT;
    ctx.fillText('Pas encore de données', padL, h / 2);
    return;
  }
  let min = Math.min(...all, opts.zero === false ? Infinity : 0);
  let max = Math.max(...all, opts.zero === false ? -Infinity : 0);
  if (min === max) max = min + 1;
  const step = niceStep(max - min);
  min = Math.floor(min / step) * step;
  max = Math.ceil(max / step) * step;
  const n = Math.max(...data.series.map((s) => s.values.length));
  const x = (i) => padL + (n <= 1 ? 0 : (i * (w - padL - padR)) / (n - 1));
  const y = (v) => padT + (1 - (v - min) / (max - min)) * (h - padT - padB);
  // Grille
  ctx.strokeStyle = GRID;
  ctx.lineWidth = 1;
  ctx.fillStyle = TEXT;
  ctx.textAlign = 'right';
  ctx.textBaseline = 'middle';
  for (let v = min; v <= max + step / 2; v += step) {
    const yy = Math.round(y(v)) + 0.5;
    ctx.beginPath();
    ctx.moveTo(padL, yy);
    ctx.lineTo(w - padR, yy);
    ctx.stroke();
    ctx.fillText(fmt(v), padL - 4, yy);
  }
  if (min < 0 && max > 0) {
    ctx.strokeStyle = AXIS;
    ctx.beginPath();
    ctx.moveTo(padL, Math.round(y(0)) + 0.5);
    ctx.lineTo(w - padR, Math.round(y(0)) + 0.5);
    ctx.stroke();
  }
  // Étiquettes X (quelques-unes)
  ctx.textAlign = 'center';
  ctx.textBaseline = 'top';
  const every = Math.max(1, Math.ceil(n / 6));
  for (let i = 0; i < n; i += every) if (data.labels[i]) ctx.fillText(data.labels[i], x(i), h - padB + 6);
  // Séries
  for (const s of data.series) {
    ctx.strokeStyle = s.color;
    ctx.lineWidth = 2;
    ctx.setLineDash(s.dashed ? [4, 3] : []);
    ctx.beginPath();
    let started = false;
    s.values.forEach((v, i) => {
      if (!Number.isFinite(v)) return;
      if (!started) ctx.moveTo(x(i), y(v));
      else ctx.lineTo(x(i), y(v));
      started = true;
    });
    ctx.stroke();
  }
  ctx.setLineDash([]);
}

/** Barres horizontales (ex. parts de marché). items = [{label, value, color}] */
export function drawBars(canvas, items, opts = {}) {
  const { ctx, w, h } = setup(canvas);
  const padL = 110;
  const rowH = Math.min(24, (h - 6) / Math.max(1, items.length));
  const max = Math.max(...items.map((i) => i.value), 1e-9);
  ctx.textBaseline = 'middle';
  items.forEach((it, i) => {
    const yy = 4 + i * rowH;
    ctx.fillStyle = TEXT;
    ctx.textAlign = 'right';
    ctx.fillText(it.label, padL - 6, yy + rowH / 2);
    const bw = Math.max(1, ((w - padL - 60) * it.value) / max);
    ctx.fillStyle = it.color;
    ctx.fillRect(padL, yy + 3, bw, rowH - 6);
    ctx.fillStyle = '#f4f4f4';
    ctx.textAlign = 'left';
    ctx.fillText(opts.pct ? fmtPct(it.value) : eurShort(it.value), padL + bw + 6, yy + rowH / 2);
  });
}

/** Barres verticales empilées (ex. composition du revenu passif). */
export function drawColumns(canvas, data, opts = {}) {
  const { ctx, w, h } = setup(canvas);
  const padL = 58;
  const padB = 22;
  const padT = 8;
  const n = data.labels.length;
  if (!n) return;
  const totals = data.labels.map((_, i) => data.series.reduce((s, se) => s + Math.max(0, se.values[i] || 0), 0));
  const max = Math.max(...totals, opts.target || 0, 1);
  const bw = Math.max(2, (w - padL - 10) / n - 2);
  const y = (v) => padT + (1 - v / max) * (h - padT - padB);
  ctx.fillStyle = TEXT;
  ctx.textAlign = 'right';
  ctx.textBaseline = 'middle';
  ctx.fillText(eurShort(max), padL - 4, padT);
  ctx.fillText(eurShort(0), padL - 4, h - padB);
  data.labels.forEach((lab, i) => {
    let acc = 0;
    const xx = padL + i * (bw + 2);
    for (const se of data.series) {
      const v = Math.max(0, se.values[i] || 0);
      if (!v) continue;
      ctx.fillStyle = se.color;
      ctx.fillRect(xx, y(acc + v), bw, y(acc) - y(acc + v));
      acc += v;
    }
  });
  if (opts.target) {
    ctx.strokeStyle = '#ffcd75';
    ctx.setLineDash([5, 3]);
    ctx.beginPath();
    ctx.moveTo(padL, y(opts.target));
    ctx.lineTo(w - 4, y(opts.target));
    ctx.stroke();
    ctx.setLineDash([]);
  }
  ctx.textAlign = 'center';
  ctx.textBaseline = 'top';
  const every = Math.max(1, Math.ceil(n / 6));
  for (let i = 0; i < n; i += every) ctx.fillText(data.labels[i], padL + i * (bw + 2) + bw / 2, h - padB + 6);
}

/** Légende HTML pour un graphique. */
export function legend(series) {
  return `<div class="chart-legend">${series.map((s) => `<span style="--c:${s.color}">${s.name}</span>`).join('')}</div>`;
}
