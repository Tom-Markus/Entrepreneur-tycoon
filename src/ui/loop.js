// Boucle temps réel : convertit le temps écoulé en jours de jeu et appelle
// le moteur. Vise ~30 images/s (largement suffisant, économe pour Chromebook).

import { CONFIG } from '../data/config.js';
import { DAYS_PER_MONTH } from '../engine/calendar.js';

export class GameLoop {
  /**
   * @param {object} p
   * @param {() => number} p.getSpeed multiplicateur courant (0 = pause)
   * @param {(dtDays:number) => void} p.onAdvance
   * @param {(dtSec:number) => void} p.onFrame appelé à chaque image (rendu)
   */
  constructor({ getSpeed, onAdvance, onFrame }) {
    this.getSpeed = getSpeed;
    this.onAdvance = onAdvance;
    this.onFrame = onFrame;
    this.last = 0;
    this.running = false;
    this.frameInterval = 1000 / 30;
    this.acc = 0;
    this._raf = this._raf.bind(this);
  }

  start() {
    if (this.running) return;
    this.running = true;
    this.last = performance.now();
    requestAnimationFrame(this._raf);
  }

  stop() {
    this.running = false;
  }

  _raf(now) {
    if (!this.running) return;
    requestAnimationFrame(this._raf);
    let dtMs = now - this.last;
    if (dtMs < this.frameInterval - 1) return; // limite à ~30 fps
    this.last = now;
    // Onglet en arrière-plan ou machine lente : on plafonne le delta.
    dtMs = Math.min(dtMs, 250);
    const dtSec = dtMs / 1000;
    const speed = this.getSpeed();
    if (speed > 0) {
      const daysPerSec = DAYS_PER_MONTH / CONFIG.secondsPerMonth;
      const dtDays = Math.min(dtSec * daysPerSec * speed, CONFIG.maxDaysPerFrame);
      this.onAdvance(dtDays);
    }
    this.onFrame(dtSec);
  }
}
