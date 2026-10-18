// Application : écrans, boucle temps réel, sauvegardes, raccourcis clavier.
// L'interface ne modifie JAMAIS l'état directement : tout passe par dispatch().

import { newGame, tick, applyAction, createRng } from '../engine/index.js';
import { CONFIG } from '../data/config.js';
import { LocalStorageAdapter } from '../storage/LocalStorageAdapter.js';
import { GameLoop } from './loop.js';
import { toast } from './toast.js';
import { openModal, closeModal, isModalOpen } from './modal.js';
import { renderTitle } from './screens/title.js';
import { renderNewGame } from './screens/newgame.js';
import { GameScreen } from './screens/game.js';
import { renderEnd } from './screens/end.js';
import { audio } from './audio.js';

const SETTINGS_KEY = 'entrepreneur-tycoon:settings';

function loadSettings() {
  try {
    return { sound: false, tutorialDone: false, ...JSON.parse(localStorage.getItem(SETTINGS_KEY) || '{}') };
  } catch {
    return { sound: false, tutorialDone: false };
  }
}

export class App {
  constructor(root) {
    this.root = root;
    this.adapter = new LocalStorageAdapter();
    this.settings = loadSettings();
    audio.setEnabled(this.settings.sound);
    this.state = null;
    this.slot = null; // emplacement de la partie en cours
    this.speedIdx = 0;
    this.screen = null;
    this.game = null;
    this.lastAutosave = 0;
    this.loop = new GameLoop({
      getSpeed: () => this.currentSpeed(),
      onAdvance: (dt) => this.advance(dt),
      onFrame: (dt) => this.frame(dt),
    });
    this._bindGlobal();
  }

  saveSettings() {
    try {
      localStorage.setItem(SETTINGS_KEY, JSON.stringify(this.settings));
    } catch {
      /* stockage indisponible : réglages non mémorisés */
    }
  }

  // --- Écrans ---------------------------------------------------------------

  showTitle() {
    this.stopGame();
    this.screen = 'title';
    renderTitle(this);
  }

  showNewGame() {
    this.screen = 'newgame';
    renderNewGame(this);
  }

  startNewGame(opts) {
    const createdAt = new Date().toISOString();
    const gameId = typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `g-${Date.now().toString(36)}`;
    this.state = newGame({ ...opts, createdAt, gameId });
    this.slot = 'auto';
    this.enterGame();
    this.autosave();
  }

  enterGame() {
    this.screen = 'game';
    this.speedIdx = 0;
    this.game = new GameScreen(this);
    this.game.mount();
    this.loop.start();
    if (!this.settings.tutorialDone) this.game.startTutorial();
  }

  stopGame() {
    this.loop.stop();
    if (this.game) this.game.unmount();
    this.game = null;
  }

  showEnd() {
    this.speedIdx = 0;
    renderEnd(this);
  }

  // --- Temps ----------------------------------------------------------------

  currentSpeed() {
    if (!this.state || this.screen !== 'game' || isModalOpen()) return 0;
    if (this.state.status === 'bankrupt') return 0;
    return CONFIG.speeds[this.speedIdx];
  }

  setSpeed(idx) {
    this.speedIdx = Math.max(0, Math.min(CONFIG.speeds.length - 1, idx));
    if (this.game) this.game.updateHeader();
  }

  togglePause() {
    if (this.speedIdx === 0) this.setSpeed(this.prevSpeed || 1);
    else {
      this.prevSpeed = this.speedIdx;
      this.setSpeed(0);
    }
  }

  advance(dtDays) {
    const s = this.state;
    const rng = createRng(s.rngState);
    const before = s.status;
    tick(s, dtDays, rng);
    if (s.events && s.events.pending.length && this.game) this.game.showDecision();
    if (before !== s.status) this.onStatusChange(before, s.status);
  }

  frame(dtSec) {
    if (this.game) this.game.frame(dtSec);
    if (this.screen === 'game' && this.currentSpeed() > 0) {
      this.lastAutosave += dtSec;
      if (this.lastAutosave >= CONFIG.autosaveSeconds) {
        this.lastAutosave = 0;
        this.autosave();
      }
    }
  }

  onStatusChange(before, after) {
    if (after === 'bankrupt' || after === 'won') {
      audio.play(after === 'won' ? 'win' : 'lose');
      this.autosave();
      this.showEnd();
    }
  }

  // --- Actions --------------------------------------------------------------

  /** Envoie une action au moteur. Affiche le message d'erreur éventuel. */
  dispatch(action, { quiet = false } = {}) {
    if (!this.state) return { ok: false };
    const res = applyAction(this.state, action);
    if (!res.ok && res.message && !quiet) toast(res.message, 'bad');
    if (res.ok && !quiet) audio.play('click');
    if (this.game) this.game.refresh(true);
    return res;
  }

  // --- Sauvegardes ----------------------------------------------------------

  async autosave() {
    if (!this.state) return;
    try {
      await this.adapter.save('auto', this.state, new Date().toISOString());
      if (this.slot && this.slot !== 'auto') await this.adapter.save(this.slot, this.state, new Date().toISOString());
    } catch (e) {
      toast(`Autosauvegarde impossible : ${e.message}`, 'bad');
    }
  }

  async saveTo(slot) {
    try {
      await this.adapter.save(slot, this.state, new Date().toISOString());
      this.slot = slot;
      toast(`Partie sauvegardée (emplacement ${slot}).`, 'good');
    } catch (e) {
      toast(e.message, 'bad');
    }
  }

  async loadFrom(slot) {
    try {
      this.state = await this.adapter.load(slot);
      this.slot = slot;
      closeModal(true);
      this.stopGame();
      if (this.state.status === 'bankrupt') {
        this.enterGame();
        this.showEnd();
      } else this.enterGame();
      toast('Partie chargée.', 'good');
    } catch (e) {
      toast(`Chargement impossible : ${e.message}`, 'bad');
    }
  }

  async exportSlot(slot) {
    try {
      const json = await this.adapter.export(slot);
      const blob = new Blob([json], { type: 'application/json' });
      const a = document.createElement('a');
      const name = JSON.parse(json).summary?.companyName || 'partie';
      a.href = URL.createObjectURL(blob);
      a.download = `entrepreneur-tycoon-${name.replace(/[^a-z0-9]+/gi, '-').toLowerCase()}.json`;
      document.body.appendChild(a);
      a.click();
      setTimeout(() => {
        URL.revokeObjectURL(a.href);
        a.remove();
      }, 1000);
    } catch (e) {
      toast(e.message, 'bad');
    }
  }

  async exportCurrent() {
    await this.autosave();
    await this.exportSlot('auto');
  }

  importFile(slot, onDone) {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'application/json,.json';
    input.addEventListener('change', async () => {
      const file = input.files && input.files[0];
      if (!file) return;
      try {
        const text = await file.text();
        await this.adapter.import(text, slot);
        toast(`Sauvegarde importée dans l'emplacement ${slot}.`, 'good');
        if (onDone) onDone();
      } catch (e) {
        toast(`Import impossible : ${e.message}`, 'bad');
      }
    });
    input.click();
  }

  // --- Événements globaux -----------------------------------------------------

  _bindGlobal() {
    document.addEventListener('keydown', (e) => {
      const tag = (e.target && e.target.tagName) || '';
      const typing = tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT';
      if (e.key === 'Escape') {
        if (closeModal()) e.preventDefault();
        return;
      }
      if (this.screen !== 'game' || typing || isModalOpen()) return;
      if (e.code === 'Space') {
        e.preventDefault();
        this.togglePause();
      } else if (e.key === '1') this.setSpeed(1);
      else if (e.key === '2') this.setSpeed(2);
      else if (e.key === '3') this.setSpeed(3);
    });
    document.addEventListener('visibilitychange', () => {
      if (document.hidden && this.screen === 'game') {
        if (this.speedIdx > 0) {
          this.prevSpeed = this.speedIdx;
          this.setSpeed(0);
          this.pausedByHide = true;
        }
        this.autosave();
      }
    });
    window.addEventListener('pagehide', () => {
      if (this.state && this.screen === 'game') {
        try {
          this.adapter.save('auto', this.state, new Date().toISOString());
        } catch {
          /* rien */
        }
      }
    });
  }

  openModal(o) {
    return openModal(o);
  }
}
