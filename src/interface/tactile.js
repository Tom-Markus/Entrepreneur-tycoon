// Commandes tactiles (téléphone, tablette) :
//  - moitié gauche de l'écran : manette virtuelle, qui apparaît sous le pouce (pousser à fond = courir) ;
//  - moitié droite : glisser le doigt pour tourner la caméra ;
//  - boutons d'action en bas à droite, raccourcis en haut à droite, le reste dans le menu « Plus ».
// Les boutons passent par le même système d'actions que le clavier : aucun code de jeu n'est dupliqué.
const RAYON = 52;      // course de la manette virtuelle, en pixels
const BOUTONS = [
  // [action, texte, classe]
  ['morsure', 'Mordre', 'grand b-morsure'], ['esquive', 'Esquive', 'b-esquive'], ['queue', 'Queue', 'b-queue'],
  ['rugir', 'Rugir', 'b-rugir'], ['interagir', 'Boire', 'b-interagir'],
];
const RACCOURCIS = [['pause', 'II'], ['pleinEcran', '⛶'], ['carnet', 'Carnet'], ['odorat', 'Odorat'], ['plus', 'Plus']];
const PLUS = [['reposer', 'Dormir'], ['marquer', 'Marquer'], ['nid', 'Nid'], ['photo', 'Photo'], ['cinematique', 'Ciné'], ['allure', 'Allure']];

/** Garde le doigt « attaché » à la zone même s'il en sort. Certains navigateurs refusent : on continue sans. */
function capturer(element, id) { try { element.setPointerCapture(id); } catch (e) { /* capture implicite du tactile */ } }

export class Tactile {
  constructor(jeu) {
    this.jeu = jeu; this.actif = false;
    this.jx = 0; this.jy = 0; this.course = false;
    this.doigtManette = null; this.doigtCamera = null; this.ox = 0; this.oy = 0; this.cx = 0; this.cy = 0;
    const racine = document.createElement('div');
    racine.id = 'tactile'; racine.className = 'cache';
    racine.innerHTML = `<div class="t-zone t-gauche"></div><div class="t-zone t-droite"></div>
      <div class="t-manette cache"><i></i></div>
      <div class="t-actions">${BOUTONS.map((b) => `<button class="t-b ${b[2]}" data-t="${b[0]}">${b[1]}</button>`).join('')}</div>
      <div class="t-haut">${RACCOURCIS.map((b) => `<button class="t-b petit" data-t="${b[0]}">${b[1]}</button>`).join('')}</div>
      <div class="t-plus cache">${PLUS.map((b) => `<button class="t-b petit" data-t="${b[0]}">${b[1]}</button>`).join('')}</div>`;
    document.getElementById('interface').prepend(racine);
    this.racine = racine;
    this.manette = racine.querySelector('.t-manette'); this.pommeau = this.manette.firstElementChild;
    this.boutonInteragir = racine.querySelector('[data-t=interagir]');
    this.menuPlus = racine.querySelector('.t-plus');
    this._brancher();
    // Les commandes n'apparaissent qu'au premier contact d'un doigt : un PC à écran tactile garde son interface normale.
    addEventListener('pointerdown', (e) => { if (e.pointerType === 'touch') this.activer(); }, { capture: true });
    if (matchMedia('(pointer: coarse)').matches && !matchMedia('(pointer: fine)').matches) this.activer();
  }

  activer() {
    if (this.actif) return;
    this.actif = true; this.jeu.tactile = true;
    this.jeu.entrees.sansVerrou = true; this.jeu.entrees.liberer();
    document.body.classList.add('tactile');
    this.jeu.redimensionner();
  }

  _brancher() {
    const e = this.jeu.entrees, gauche = this.racine.querySelector('.t-gauche'), droite = this.racine.querySelector('.t-droite');
    // --- Manette virtuelle ---
    gauche.addEventListener('pointerdown', (ev) => {
      if (this.doigtManette !== null) return;
      this.doigtManette = ev.pointerId; this.ox = ev.clientX; this.oy = ev.clientY;
      capturer(gauche, ev.pointerId);
      this.manette.classList.remove('cache');
      this.manette.style.transform = `translate(${ev.clientX - RAYON}px, ${ev.clientY - RAYON}px)`;
      this.pommeau.style.transform = 'translate(0px, 0px)';
      ev.preventDefault();
    });
    gauche.addEventListener('pointermove', (ev) => {
      if (ev.pointerId !== this.doigtManette) return;
      let dx = ev.clientX - this.ox, dy = ev.clientY - this.oy;
      const d = Math.hypot(dx, dy);
      this.course = d > RAYON * 1.25;                       // pousser nettement au-delà du bord = courir
      if (d > RAYON) { dx *= RAYON / d; dy *= RAYON / d; }
      this.jx = dx / RAYON; this.jy = dy / RAYON;
      this.pommeau.style.transform = `translate(${dx}px, ${dy}px)`;
      this.manette.classList.toggle('course', this.course);
    });
    const lacher = (ev) => {
      if (ev.pointerId !== this.doigtManette) return;
      this.doigtManette = null; this.jx = this.jy = 0; this.course = false;
      this.manette.classList.add('cache'); this.manette.classList.remove('course');
    };
    gauche.addEventListener('pointerup', lacher); gauche.addEventListener('pointercancel', lacher);
    // --- Caméra ---
    droite.addEventListener('pointerdown', (ev) => {
      if (this.doigtCamera !== null) return;
      this.doigtCamera = ev.pointerId; this.cx = ev.clientX; this.cy = ev.clientY;
      capturer(droite, ev.pointerId); ev.preventDefault();
    });
    droite.addEventListener('pointermove', (ev) => {
      if (ev.pointerId !== this.doigtCamera) return;
      e.sourisX += (ev.clientX - this.cx) * 2.2; e.sourisY += (ev.clientY - this.cy) * 2.2;
      this.cx = ev.clientX; this.cy = ev.clientY;
    });
    const lacherCam = (ev) => { if (ev.pointerId === this.doigtCamera) this.doigtCamera = null; };
    droite.addEventListener('pointerup', lacherCam); droite.addEventListener('pointercancel', lacherCam);
    // --- Boutons ---
    for (const b of this.racine.querySelectorAll('[data-t]')) {
      const action = b.dataset.t;
      b.addEventListener('pointerdown', (ev) => {
        ev.preventDefault(); ev.stopPropagation();
        b.classList.add('enfonce');
        this.jeu.audio.demarrer();
        if (action === 'pause') this.jeu.mettreEnPause();
        else if (action === 'pleinEcran') this.jeu.basculerPleinEcran();
        else if (action === 'plus') this.menuPlus.classList.toggle('cache');
        else { e.appuiTactile(action, true); if (PLUS.some((p) => p[0] === action)) this.menuPlus.classList.add('cache'); }
      });
      const fin = () => { b.classList.remove('enfonce'); e.appuiTactile(action, false); };
      b.addEventListener('pointerup', fin); b.addEventListener('pointercancel', fin); b.addEventListener('pointerleave', fin);
      b.addEventListener('contextmenu', (ev) => ev.preventDefault());
    }
  }

  /** À appeler à chaque image : transmet la manette virtuelle et adapte l'affichage à l'état du jeu. */
  mettreAJour() {
    if (!this.actif) return;
    const jeu = this.jeu, e = jeu.entrees, enJeu = jeu.etat === 'jeu', photo = jeu.etat === 'photo';
    this.racine.classList.toggle('cache', !enJeu && !photo);
    this.racine.classList.toggle('mode-photo', photo);
    if (!enJeu && !photo) { this.jx = this.jy = 0; this.course = false; return; }
    if (this.doigtManette !== null) { e.axeX = this.jx; e.axeY = this.jy; }
    e.tenirTactile('sprint', this.course);
    // le bouton d'interaction prend le nom de l'action possible (ou s'efface s'il n'y a rien à faire)
    const ctx = jeu.joueur.contexte, utile = enJeu && ctx && ctx.type !== 'sale';
    this.boutonInteragir.classList.toggle('discret', !utile);
    const texte = utile ? ctx.texte : 'Boire';
    if (this.boutonInteragir.textContent !== texte) this.boutonInteragir.textContent = texte;
  }
}
