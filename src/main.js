// Point d'entrée de l'interface (phase 1 : squelette qui tourne).

import { newGame, advance } from './engine/index.js';
import { formatDate } from './engine/calendar.js';
import { GameLoop } from './ui/loop.js';
import { CONFIG } from './data/config.js';

const app = document.getElementById('app');
const state = newGame({ createdAt: new Date().toISOString() });
let speedIdx = 1;

app.innerHTML = `<h1>Entrepreneur Tycoon</h1><p id="date"></p><p id="speed"></p>`;
const dateEl = document.getElementById('date');
const speedEl = document.getElementById('speed');

const loop = new GameLoop({
  getSpeed: () => CONFIG.speeds[speedIdx],
  onAdvance: (dt) => advance(state, dt),
  onFrame: () => {
    dateEl.textContent = formatDate(state.time.day);
    speedEl.textContent = speedIdx === 0 ? 'Pause' : `Vitesse ×${CONFIG.speeds[speedIdx]}`;
  },
});
loop.start();

document.addEventListener('keydown', (e) => {
  if (e.code === 'Space') {
    speedIdx = speedIdx === 0 ? 1 : 0;
    e.preventDefault();
  }
  if (e.key === '1') speedIdx = 1;
  if (e.key === '2') speedIdx = 2;
  if (e.key === '3') speedIdx = 3;
});
