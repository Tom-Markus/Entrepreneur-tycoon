// Entrées : clavier, souris et manette (Gamepad API), avec touches reconfigurables.
// On utilise les codes PHYSIQUES des touches (KeyW = la touche en haut à gauche des lettres),
// donc ZQSD sur un clavier AZERTY et WASD sur un QWERTY fonctionnent sans réglage.
import { TOUCHES_DEFAUT } from '../config.js';

// Boutons de manette (disposition standard) → actions
const MANETTE = { 0: 'esquive', 1: 'queue', 2: 'morsure', 3: 'rugir', 4: 'odorat', 5: 'interagir', 7: 'sprint', 10: 'sprint', 12: 'carnet', 13: 'reposer', 14: 'marquer', 15: 'photo' };

export class Entrees {
  constructor(canvas) {
    this.canvas = canvas;
    this.touches = JSON.parse(JSON.stringify(TOUCHES_DEFAUT));
    this.enfoncees = new Set();      // codes actuellement enfoncés
    this.pressees = new Set();       // actions déclenchées pendant cette image
    this.manetteAvant = {};
    this.sourisX = 0; this.sourisY = 0; this.molette = 0;
    this.axeX = 0; this.axeY = 0; this.camX = 0; this.camY = 0;   // manette
    this.capture = null;             // fonction en attente d'une touche (remappage)
    this.verrouille = false;         // pointeur capturé par le jeu
    this.surPause = null; this.surPremierGeste = null;
    this.dispositions = null;        // noms réels des touches selon le clavier de l'utilisateur
    if (navigator.keyboard && navigator.keyboard.getLayoutMap) navigator.keyboard.getLayoutMap().then((m) => { this.dispositions = m; }).catch(() => {});

    addEventListener('keydown', (e) => {
      if (this.capture) { e.preventDefault(); const f = this.capture; this.capture = null; f(e.code === 'Escape' ? null : e.code); return; }
      if (e.target && (e.target.tagName === 'INPUT' || e.target.tagName === 'SELECT')) return;
      if (['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Tab'].includes(e.code)) e.preventDefault();
      if (e.repeat) return;
      this.enfoncees.add(e.code);
      this._presser(e.code);
      if (e.code === 'Escape' && this.surPause) this.surPause();
    });
    addEventListener('keyup', (e) => this.enfoncees.delete(e.code));
    addEventListener('blur', () => this.enfoncees.clear());
    canvas.addEventListener('mousedown', (e) => {
      const code = 'Souris' + e.button;
      if (this.capture) { const f = this.capture; this.capture = null; f(code); return; }
      this.enfoncees.add(code); this._presser(code);
    });
    addEventListener('mouseup', (e) => this.enfoncees.delete('Souris' + e.button));
    addEventListener('mousemove', (e) => { if (this.verrouille || this.glisser) { this.sourisX += e.movementX; this.sourisY += e.movementY; } });
    canvas.addEventListener('wheel', (e) => { this.molette += Math.sign(e.deltaY); e.preventDefault(); }, { passive: false });
    canvas.addEventListener('contextmenu', (e) => e.preventDefault());
    document.addEventListener('pointerlockchange', () => { this.verrouille = document.pointerLockElement === canvas; if (this.surVerrou) this.surVerrou(this.verrouille); });
  }

  _presser(code) {
    for (const action in this.touches) if (this.touches[action].includes(code)) this.pressees.add(action);
  }

  verrouiller() { if (!this.verrouille && this.canvas.requestPointerLock) { try { const p = this.canvas.requestPointerLock(); if (p && p.catch) p.catch(() => {}); } catch (e) { /* refusé */ } } }
  liberer() { if (document.pointerLockElement) document.exitPointerLock(); }

  /** L'action est-elle maintenue ? */
  actif(action) {
    const t = this.touches[action];
    if (t) for (let i = 0; i < t.length; i++) if (this.enfoncees.has(t[i])) return true;
    return !!this.manetteActifs && this.manetteActifs[action] === true;
  }
  /** L'action vient-elle d'être déclenchée (une seule fois par appui) ? */
  vientDe(action) { return this.pressees.has(action); }

  /** Lit la manette. À appeler une fois par image, avant la logique de jeu. */
  lireManette() {
    this.axeX = this.axeY = this.camX = this.camY = 0;
    this.manetteActifs = null; this.pauseManette = false;
    const pads = navigator.getGamepads ? navigator.getGamepads() : [];
    for (const pad of pads) {
      if (!pad || !pad.connected) continue;
      const zone = (v) => (Math.abs(v) < 0.18 ? 0 : v);
      this.axeX = zone(pad.axes[0] || 0); this.axeY = zone(pad.axes[1] || 0);
      this.camX = zone(pad.axes[2] || 0); this.camY = zone(pad.axes[3] || 0);
      this.manetteActifs = {};
      for (const i in MANETTE) {
        const b = pad.buttons[i], appuye = !!b && (b.pressed || b.value > 0.5), action = MANETTE[i];
        if (appuye) this.manetteActifs[action] = true;
        if (appuye && !this.manetteAvant[i]) this.pressees.add(action);
        this.manetteAvant[i] = appuye;
      }
      const start = pad.buttons[9] && pad.buttons[9].pressed;
      if (start && !this.manetteAvant.start && this.surPause) this.surPause();
      this.manetteAvant.start = start;
      break;
    }
  }

  /** À appeler en fin d'image : remet à zéro ce qui ne vaut que pour une image. */
  finImage() { this.pressees.clear(); this.sourisX = 0; this.sourisY = 0; this.molette = 0; }

  /** Nom lisible d'une touche (« Z », « Clic gauche », « Maj »…). */
  nomTouche(code) {
    if (!code) return '—';
    if (code === 'Souris0') return 'Clic gauche';
    if (code === 'Souris1') return 'Clic molette';
    if (code === 'Souris2') return 'Clic droit';
    const speciaux = { Space: 'Espace', ShiftLeft: 'Maj', ShiftRight: 'Maj droite', ControlLeft: 'Ctrl', AltLeft: 'Alt', ArrowUp: '↑', ArrowDown: '↓', ArrowLeft: '←', ArrowRight: '→', Enter: 'Entrée', Tab: 'Tab' };
    if (speciaux[code]) return speciaux[code];
    if (this.dispositions && this.dispositions.get(code)) return this.dispositions.get(code).toUpperCase();
    return code.replace('Key', '').replace('Digit', '');
  }
  nomAction(action) { return this.nomTouche(this.touches[action][0]); }

  /** Attend la prochaine touche et l'affecte à l'action. */
  remapper(action, fin) {
    this.capture = (code) => { if (code) this.touches[action] = [code]; fin(); };
  }
}
