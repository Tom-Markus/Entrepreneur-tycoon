// Sons chiptune générés par WebAudio (aucun fichier). Désactivés par défaut.

const SOUNDS = {
  click: [[660, 0.03, 'square']],
  coin: [[988, 0.05, 'square'], [1319, 0.09, 'square']],
  good: [[523, 0.06, 'triangle'], [659, 0.06, 'triangle'], [784, 0.1, 'triangle']],
  bad: [[330, 0.09, 'sawtooth'], [247, 0.14, 'sawtooth']],
  event: [[440, 0.06, 'square'], [554, 0.06, 'square']],
  win: [[523, 0.1, 'square'], [659, 0.1, 'square'], [784, 0.1, 'square'], [1047, 0.25, 'square']],
  lose: [[392, 0.15, 'triangle'], [330, 0.15, 'triangle'], [262, 0.35, 'triangle']],
};

class Chiptune {
  constructor() {
    this.enabled = false;
    this.ctx = null;
    this.lastPlay = 0;
  }

  setEnabled(on) {
    this.enabled = !!on;
    if (this.enabled) this._ensure();
  }

  _ensure() {
    if (this.ctx) return this.ctx;
    const AC = typeof window !== 'undefined' && (window.AudioContext || window.webkitAudioContext);
    if (!AC) return null;
    try {
      this.ctx = new AC();
    } catch {
      this.ctx = null;
    }
    return this.ctx;
  }

  play(name) {
    if (!this.enabled) return;
    const ctx = this._ensure();
    const seq = SOUNDS[name];
    if (!ctx || !seq) return;
    if (ctx.state === 'suspended') ctx.resume();
    const now = ctx.currentTime;
    if (now - this.lastPlay < 0.04) return; // évite les rafales
    this.lastPlay = now;
    let t = now;
    for (const [freq, dur, type] of seq) {
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      o.type = type;
      o.frequency.value = freq;
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(0.08, t + 0.01);
      g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
      o.connect(g).connect(ctx.destination);
      o.start(t);
      o.stop(t + dur + 0.02);
      t += dur * 0.9;
    }
  }
}

export const audio = new Chiptune();
