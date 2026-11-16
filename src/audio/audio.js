// Audio 100 % synthétisé (Web Audio API) : aucun fichier son.
// - Nature : vent, feuillages, eau, pluie, insectes, tonnerre, voix et pas des animaux (spatialisés).
// - Musique : nappes d'ambiance génératives, très discrètes.
// Trois volumes : général, nature, musique.
// Note scientifique : on ignore la voix réelle des dinosaures. Les sons graves et « bouche fermée »
// choisis ici s'inspirent des crocodiles et des grands oiseaux, leurs plus proches parents actuels.
import { CONFIG } from '../config.js';
import { ESPECES } from '../creatures/especes.js';

const ACCORDS = [[146.83, 220, 349.23], [130.81, 196, 329.63], [174.61, 261.63, 440], [196, 293.66, 493.88], [110, 164.81, 261.63]];

export class Audio {
  constructor() {
    this.ctx = null;
    this.volumes = { ...CONFIG.audio };
    this.voixActives = 0; this.tMusique = 4; this.tGrillon = 0; this.tPas = 0; this.accord = 0;
  }

  /** À appeler après un geste de l'utilisateur (exigence des navigateurs). */
  demarrer() {
    if (this.ctx) { if (this.ctx.state === 'suspended') this.ctx.resume(); return; }
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    const ctx = (this.ctx = new AC());
    this.general = ctx.createGain(); this.general.connect(ctx.destination);
    this.nature = ctx.createGain(); this.nature.connect(this.general);
    this.musique = ctx.createGain(); this.musique.connect(this.general);
    // écho léger pour la musique
    this.echo = ctx.createDelay(1.5); this.echo.delayTime.value = 0.63;
    const retour = ctx.createGain(); retour.gain.value = 0.42;
    this.echo.connect(retour); retour.connect(this.echo); this.echo.connect(this.musique);
    // 2 secondes de bruit blanc, réutilisées partout
    this.bruit = ctx.createBuffer(1, ctx.sampleRate * 2, ctx.sampleRate);
    const d = this.bruit.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    this.boucles = {
      vent: this._boucle('lowpass', 480, 0.3), feuilles: this._boucle('bandpass', 3400, 0.7),
      eau: this._boucle('bandpass', 950, 0.6), pluie: this._boucle('highpass', 1700, 0.5), insectes: this._boucle('bandpass', 5200, 9),
    };
    // trémolo des insectes
    const lfo = ctx.createOscillator(), lfoG = ctx.createGain();
    lfo.frequency.value = 34; lfoG.gain.value = 0.012; lfo.connect(lfoG); lfoG.connect(this.boucles.insectes.gain.gain); lfo.start();
    this.appliquerVolumes();
  }

  _boucle(type, freq, q) {
    const ctx = this.ctx, src = ctx.createBufferSource(), filtre = ctx.createBiquadFilter(), gain = ctx.createGain();
    src.buffer = this.bruit; src.loop = true; src.playbackRate.value = 0.8 + Math.random() * 0.4;
    filtre.type = type; filtre.frequency.value = freq; filtre.Q.value = q; gain.gain.value = 0;
    src.connect(filtre); filtre.connect(gain); gain.connect(this.nature); src.start();
    return { filtre, gain };
  }

  appliquerVolumes() {
    if (!this.ctx) return;
    this.general.gain.value = this.volumes.general; this.nature.gain.value = this.volumes.nature; this.musique.gain.value = this.volumes.musique * 0.6;
  }
  pause(oui) { if (this.ctx) { if (oui) this.ctx.suspend(); else this.ctx.resume(); } }

  /** Sortie spatialisée : renvoie le nœud auquel brancher un son situé en (x, y, z). */
  _sortie(source, portee = 8) {
    if (!source) return this.nature;
    const p = this.ctx.createPanner();
    p.panningModel = 'equalpower'; p.distanceModel = 'inverse'; p.refDistance = portee; p.maxDistance = 500; p.rolloffFactor = 1.1;
    p.positionX.value = source.x; p.positionY.value = (source.y || 0) + 1; p.positionZ.value = source.z;
    p.connect(this.nature);
    return p;
  }

  _rafale(sortie, type, f0, f1, duree, volume, q = 0.8, delai = 0) {
    // bruit filtré avec enveloppe : sert aux pas, éclaboussures, impacts, tonnerre…
    const ctx = this.ctx, t = ctx.currentTime + delai, src = ctx.createBufferSource(), f = ctx.createBiquadFilter(), g = ctx.createGain();
    src.buffer = this.bruit; src.loop = true;
    f.type = type; f.Q.value = q; f.frequency.setValueAtTime(f0, t); f.frequency.exponentialRampToValueAtTime(Math.max(20, f1), t + duree);
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(Math.max(0.0002, volume), t + Math.min(0.03, duree * 0.2)); g.gain.exponentialRampToValueAtTime(0.0001, t + duree);
    src.connect(f); f.connect(g); g.connect(sortie);
    src.start(t, Math.random()); src.stop(t + duree + 0.05);
  }

  _ton(sortie, type, f0, f1, duree, volume, delai = 0) {
    const ctx = this.ctx, t = ctx.currentTime + delai, o = ctx.createOscillator(), g = ctx.createGain();
    o.type = type; o.frequency.setValueAtTime(f0, t); o.frequency.exponentialRampToValueAtTime(Math.max(20, f1), t + duree);
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(volume, t + Math.min(0.02, duree * 0.3)); g.gain.exponentialRampToValueAtTime(0.0001, t + duree);
    o.connect(g); g.connect(sortie); o.start(t); o.stop(t + duree + 0.05);
  }

  /** Voix d'un animal. type : 'rugir' | 'grogne' | 'appel' | 'cri' | 'alerte'. */
  jouerVoix(espece, type, source, echelle = 1) {
    if (!this.ctx || this.voixActives >= 5) return;
    if (source && this.ecoute && Math.hypot(source.x - this.ecoute.x, source.z - this.ecoute.z) > 320) return;
    const ctx = this.ctx, def = ESPECES[espece] || { voix: 800, longueur: 1 };
    const R = { rugir: [1.7, 1, 0.5], grogne: [0.9, 0.85, 0.3], appel: [1.3, 1.2, 0.3], cri: [0.4, 1.6, 0.35], alerte: [0.28, 1.9, 0.25] }[type];
    const f = def.voix / Math.sqrt(Math.max(0.3, echelle)) * R[1], duree = R[0], t = ctx.currentTime;
    const sortie = this._sortie(source, 5 + def.longueur * 1.5);
    const g = ctx.createGain(), filtre = ctx.createBiquadFilter();
    filtre.type = 'lowpass'; filtre.frequency.value = Math.min(6000, f * 7); filtre.Q.value = 2;
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(R[2], t + duree * 0.18); g.gain.setValueAtTime(R[2], t + duree * 0.55); g.gain.exponentialRampToValueAtTime(0.0001, t + duree);
    filtre.connect(g); g.connect(sortie);
    for (const [mult, forme] of [[1, 'sawtooth'], [1.505, 'square'], [0.5, 'sine']]) {
      const o = ctx.createOscillator(), og = ctx.createGain();
      o.type = forme; og.gain.value = mult === 1 ? 0.6 : 0.25;
      o.frequency.setValueAtTime(f * mult * 0.85, t); o.frequency.linearRampToValueAtTime(f * mult * 1.12, t + duree * 0.3); o.frequency.linearRampToValueAtTime(f * mult * 0.7, t + duree);
      o.connect(og); og.connect(filtre); o.start(t); o.stop(t + duree + 0.1);
    }
    if (def.voix < 400) {       // grondement rauque des gros animaux : modulation d'amplitude
      const lfo = ctx.createOscillator(), lg = ctx.createGain();
      lfo.frequency.value = 22 + Math.random() * 12; lg.gain.value = R[2] * 0.5; lfo.connect(lg); lg.connect(g.gain); lfo.start(t); lfo.stop(t + duree + 0.1);
      this._rafale(sortie, 'bandpass', f * 5, f * 3, duree, R[2] * 0.35, 1.2);
    }
    this.voixActives++;
    setTimeout(() => { this.voixActives--; }, duree * 1000 + 150);
  }

  /** Bruit de pas. masse en kg ; mou = sol meuble (0..1) ; eau = pied dans l'eau. */
  pas(source, masse, mou, eau) {
    if (!this.ctx) return;
    const v = Math.min(0.9, 0.06 + Math.log10(Math.max(10, masse)) * 0.11), sortie = this._sortie(source, 4 + Math.log10(masse + 10) * 3);
    if (eau) { this._rafale(sortie, 'bandpass', 1500, 600, 0.35, v * 0.5, 0.7); return; }
    this._rafale(sortie, 'lowpass', 220 + (1 - mou) * 260, 60, 0.22, v, 0.6);
    if (masse > 300) this._ton(sortie, 'sine', 70, 34, 0.3, v * 0.9);
  }
  plouf(force) { if (this.ctx) { this._rafale(this.nature, 'bandpass', 1900, 500, 0.6, 0.35 * force, 0.6); this._rafale(this.nature, 'lowpass', 400, 90, 0.4, 0.3 * force); } }
  impact(force) { if (this.ctx) { this._rafale(this.nature, 'lowpass', 500, 70, 0.25, 0.6 * force); this._ton(this.nature, 'sine', 95, 40, 0.25, 0.5 * force); } }
  claquement(echelle) { if (this.ctx) { this._rafale(this.nature, 'bandpass', 1400 / Math.sqrt(echelle), 500, 0.09, 0.4, 2, 0.24); this._ton(this.nature, 'square', 160 / echelle, 80, 0.06, 0.12, 0.24); } }
  sifflement() { if (this.ctx) this._rafale(this.nature, 'bandpass', 500, 2600, 0.4, 0.25, 3); }
  craquement() { if (this.ctx) for (let i = 0; i < 5; i++) this._rafale(this.nature, 'bandpass', 900 + Math.random() * 1800, 400, 0.07, 0.4, 3, i * 0.06 + Math.random() * 0.04); }
  souffleNez() { if (this.ctx) this._rafale(this.nature, 'bandpass', 700, 1500, 0.5, 0.2, 1.5); }
  declic() { if (this.ctx) { this._rafale(this.general, 'highpass', 3000, 2000, 0.04, 0.3); this._rafale(this.general, 'highpass', 2500, 1800, 0.05, 0.25, 1, 0.09); } }
  carillon() { if (this.ctx) { this._ton(this.musique, 'sine', 587.33, 587.33, 0.9, 0.16); this._ton(this.musique, 'sine', 880, 880, 1.2, 0.12, 0.14); } }
  tonnerre(distance) {
    if (!this.ctx) return;
    const delai = Math.min(4, distance / 340), v = Math.max(0.25, 1.1 - distance / 900);
    this._rafale(this.nature, 'lowpass', 300, 45, 4.5, v, 0.4, delai);
    this._rafale(this.nature, 'lowpass', 900, 80, 0.5, v * 0.7, 0.4, delai);
    this._ton(this.nature, 'sine', 55, 28, 3, v * 0.5, delai);
  }

  /**
   * Ambiances continues. env = { vent, pluie, jour, eau (0..1 proximité), foret (0..1), danger }.
   * `camera` sert d'oreilles pour les sons spatialisés.
   */
  mettreAJour(dt, camera, env) {
    if (!this.ctx || this.ctx.state !== 'running') return;
    const ctx = this.ctx, t = ctx.currentTime, B = this.boucles, regler = (b, v) => b.gain.gain.setTargetAtTime(v, t, 0.6);
    regler(B.vent, 0.035 + env.vent * 0.16);
    B.vent.filtre.frequency.setTargetAtTime(380 + env.vent * 500 + Math.sin(t * 0.3) * 120, t, 0.5);
    regler(B.feuilles, env.vent * env.foret * 0.07 * (0.6 + 0.4 * Math.sin(t * 0.7)));
    regler(B.eau, env.eau * 0.14 * (0.75 + 0.25 * Math.sin(t * 1.3)));
    regler(B.pluie, env.pluie * 0.3);
    regler(B.insectes, 0.016 * env.jour * (1 - env.pluie) * (0.5 + env.foret * 0.5));
    // Oreilles
    const l = ctx.listener, p = camera.position;
    this.ecoute = p;
    if (l.positionX) {
      l.positionX.value = p.x; l.positionY.value = p.y; l.positionZ.value = p.z;
      const e = camera.matrixWorld.elements;
      l.forwardX.value = -e[8]; l.forwardY.value = -e[9]; l.forwardZ.value = -e[10]; l.upX.value = e[4]; l.upY.value = e[5]; l.upZ.value = e[6];
    }
    // Stridulations nocturnes (des sauterelles chantaient déjà au Jurassique)
    this.tGrillon -= dt;
    if (env.jour < 0.25 && env.pluie < 0.3 && this.tGrillon <= 0) {
      this.tGrillon = 0.5 + Math.random() * 2.2;
      const f = 3800 + Math.random() * 900, pan = ctx.createStereoPanner ? ctx.createStereoPanner() : null;
      let sortie = this.nature;
      if (pan) { pan.pan.value = Math.random() * 2 - 1; pan.connect(this.nature); sortie = pan; }
      for (let i = 0; i < 3; i++) this._ton(sortie, 'sine', f, f, 0.05, 0.025 + Math.random() * 0.02, i * 0.085);
    }
    // Musique générative : un accord tenu de temps en temps
    this.tMusique -= dt;
    if (this.tMusique <= 0 && this.volumes.musique > 0.01) {
      this.tMusique = 13 + Math.random() * 9;
      this.accord = (this.accord + 1 + Math.floor(Math.random() * 2)) % ACCORDS.length;
      const notes = ACCORDS[this.accord], grave = env.jour < 0.3 ? 0.5 : 1;
      notes.forEach((n, i) => {
        const o = ctx.createOscillator(), g = ctx.createGain(), d = 11 + Math.random() * 4, debut = t + i * 1.4;
        o.type = i === 2 ? 'triangle' : 'sine'; o.frequency.value = n * grave; o.detune.value = (Math.random() - 0.5) * 9;
        g.gain.setValueAtTime(0.0001, debut); g.gain.linearRampToValueAtTime(i === 2 ? 0.035 : 0.06, debut + 4.5); g.gain.linearRampToValueAtTime(0.0001, debut + d);
        o.connect(g); g.connect(this.musique); g.connect(this.echo); o.start(debut); o.stop(debut + d + 0.1);
      });
    }
  }
}
