// Interface : HUD discret, écran-titre, pause, options, carnet de bord, mode photo, didacticiel.
// Tout est en HTML/CSS par-dessus le canvas 3D.
import './style.css';
import { CONFIG, NOMS_ACTIONS, TOUCHES_DEFAUT } from '../config.js';
import { Sauvegarde } from '../noyau/sauvegarde.js';
import { FICHES, FLORE_FICHES, OBSERVATIONS, SECTIONS } from '../science/fiches.js';
import { COMPETENCES } from '../joueur/joueur.js';
import { OBJECTIFS } from '../joueur/progression.js';
import { FILTRES } from '../joueur/photo.js';
import { NOMS_BIOMES, BIOME } from '../monde/terrain.js';

const $ = (s, racine = document) => racine.querySelector(s);
const CARDINAUX = [['N', 0, 1], ['NE', 45, 0], ['E', 90, 1], ['SE', 135, 0], ['S', 180, 1], ['SO', 225, 0], ['O', 270, 1], ['NO', 315, 0]];

export class Interface {
  constructor(jeu) {
    this.jeu = jeu;
    this.racine = $('#interface');
    this.racine.innerHTML = `
      <div id="hud" class="cache">
        <div id="minicarte"><canvas width="400" height="400"></canvas><b>N</b><small></small></div>
        <div id="etat"><div class="stade"></div><div class="jauge"><i></i></div><small></small></div>
        <div id="boussole">${CARDINAUX.map((c) => `<span class="${c[2] ? 'cardinal' : ''}">${c[0]}</span>`).join('')}<span class="repere">⌂</span><span class="repere">≈</span></div>
        <div id="observation" class="cache"><small>Observation en cours</small><b></b><span></span><div class="jauge"><i></i></div></div>
        <div id="besoins">
          ${['Santé', 'Faim', 'Soif', 'Énergie'].map((n) => `<div class="besoin"><span>${n}</span><div class="jauge"><i></i></div></div>`).join('')}
          <div id="souffle"><i></i></div>
        </div>
        <div id="objectif" class="cache"><small>Objectif</small><b></b><span></span><div class="jauge"><i></i></div></div>
        <div id="cible" class="cache"><b></b><span></span><div class="jauge"><i></i></div></div>
        <div id="invite" class="cache"></div>
        <div id="notes"></div>
        <div id="annonce"><b></b><span></span></div>
        <div id="tutoriel" class="cache"></div>
        <div id="fps" class="cache"></div>
      </div>
      <div class="bande haut"></div><div class="bande bas"></div>
      <div id="degats"></div><div id="fondu"></div><div id="flash"></div>
      <div id="mesure" class="cache">Mesure des performances de votre appareil…<br><small class="discret">3 secondes, une seule fois</small></div>
      <div id="photo" class="cache"></div>
      <div id="titre" class="ecran cache"></div>
      <div id="pause" class="ecran voile cache"></div>
      <div id="options" class="ecran voile cache"></div>
      <div id="emplacements" class="ecran voile cache"></div>
      <div id="carnet" class="ecran voile cache"></div>`;
    this.hud = $('#hud');
    this.jauges = [...this.racine.querySelectorAll('#besoins .besoin')];
    this.reperes = [...this.racine.querySelectorAll('#boussole span')];
    this.notes = $('#notes'); this.tAnnonce = 0; this.tHud = 0;
    $('#minicarte').addEventListener('pointerdown', (ev) => { ev.stopPropagation(); if (this.jeu.etat === 'jeu') this.basculerCarte(); });
    this.miniCarte = $('#minicarte canvas'); this.carteGrande = false; this.tCarte = 0; this.fondCarte = null;
    this.ongletCarnet = 'faune'; this.ficheChoisie = 'allosaurus'; this.floreChoisie = 'fougere';
    this.etapeTuto = -1; this.tTuto = 0; this.memoTuto = {};
    this._construireTitre(); this._construirePause(); this._construirePhoto();
  }

  // ------------------------------------------------------------ MESSAGES ----
  notifier(texte, type = '') {
    const n = document.createElement('div');
    n.className = 'note'; n.textContent = texte;
    this.notes.appendChild(n);
    while (this.notes.children.length > 4) this.notes.firstChild.remove();
    setTimeout(() => { n.style.opacity = 0; setTimeout(() => n.remove(), 700); }, 5200);
  }
  annoncer(titre, sous = '') {
    const a = $('#annonce');
    a.querySelector('b').textContent = titre; a.querySelector('span').textContent = sous;
    a.classList.add('visible'); clearTimeout(this._minAnnonce);
    this._minAnnonce = setTimeout(() => a.classList.remove('visible'), 4600);
  }
  flashDegats() { const d = $('#degats'); d.style.transition = 'none'; d.style.opacity = 1; requestAnimationFrame(() => { d.style.transition = 'opacity 0.9s'; d.style.opacity = 0; }); }
  flashPhoto() { const f = $('#flash'); f.classList.remove('actif'); void f.offsetWidth; f.classList.add('actif'); }
  fondu(noir) { $('#fondu').classList.toggle('noir', noir); }
  chargement(texte) { const c = $('#chargement-texte'); if (c) c.textContent = texte; }
  finChargement() { $('#chargement').classList.add('fini'); setTimeout(() => $('#chargement').remove(), 1500); }
  montrerMesure(oui) { $('#mesure').classList.toggle('cache', !oui); }
  _montrer(id, oui) { $('#' + id).classList.toggle('cache', !oui); }

  // ------------------------------------------------------------- TITRE ------
  _construireTitre() {
    const t = $('#titre');
    t.innerHTML = `<div class="titre-jeu">Allosaure</div><div class="sous-titre">Jurassique supérieur · il y a 150 millions d'années</div>
      <div class="boutons">
        <button class="bouton" data-a="continuer">Continuer</button>
        <button class="bouton" data-a="nouvelle">Nouvelle partie</button>
        <button class="bouton" data-a="charger">Charger une partie</button>
        <button class="bouton" data-a="options">Options</button>
        <button class="bouton" data-a="pleinEcran">Plein écran</button>
      </div>`;
    t.addEventListener('click', (e) => {
      const a = e.target.dataset.a; if (!a) return;
      this.jeu.audio.demarrer();
      if (a === 'continuer') this.jeu.chargerPartie(this.dernierEmplacement());
      else if (a === 'nouvelle') this.ouvrirEmplacements('nouvelle');
      else if (a === 'charger') this.ouvrirEmplacements('charger');
      else if (a === 'pleinEcran') this.jeu.basculerPleinEcran();
      else this.ouvrirOptions('titre');
    });
  }
  dernierEmplacement() {
    let meilleur = -1, date = 0;
    Sauvegarde.lister().forEach((r, i) => { if (r && r.date > date) { date = r.date; meilleur = i; } });
    return meilleur;
  }
  montrerTitre(oui) {
    this._montrer('titre', oui); this._montrer('hud', !oui);
    if (oui) { const d = this.dernierEmplacement(); $('#titre [data-a=continuer]').classList.toggle('cache', d < 0); $('#titre [data-a=charger]').classList.toggle('cache', d < 0); }
  }

  ouvrirEmplacements(mode) {
    const e = $('#emplacements'), liste = Sauvegarde.lister();
    e.innerHTML = `<div class="panneau" style="width:min(560px,94vw)"><h2>${mode === 'nouvelle' ? 'Nouvelle partie' : 'Charger une partie'}</h2>
      ${liste.map((r, i) => `<div class="emplacement"><div><b>Emplacement ${i + 1}</b><small>${r ? `${r.stade} · jour ${r.jour} · ${r.fiches} sections de carnet · ${new Date(r.date).toLocaleDateString('fr-BE')}` : 'Vide'}</small></div>
        <button class="bouton petit" data-i="${i}" data-a="choisir" ${mode === 'charger' && !r ? 'disabled' : ''}>${mode === 'nouvelle' ? (r ? 'Écraser' : 'Commencer') : 'Charger'}</button>
        <button class="bouton petit" data-i="${i}" data-a="effacer" ${r ? '' : 'disabled'}>Effacer</button></div>`).join('')}
      <div class="pied"><button class="bouton petit" data-a="retour">Retour</button></div></div>`;
    e.classList.remove('cache');
    e.onclick = (ev) => {
      const a = ev.target.dataset.a, i = +ev.target.dataset.i; if (!a) return;
      if (a === 'retour') e.classList.add('cache');
      else if (a === 'effacer') { if (confirm('Effacer définitivement l\'emplacement ' + (i + 1) + ' ?')) { Sauvegarde.effacer(i); this.ouvrirEmplacements(mode); this.montrerTitre(this.jeu.etat === 'titre'); } }
      else if (a === 'choisir') {
        if (mode === 'nouvelle' && liste[i] && !confirm('Remplacer la partie de l\'emplacement ' + (i + 1) + ' ?')) return;
        e.classList.add('cache');
        if (mode === 'nouvelle') this.jeu.nouvellePartie(i); else this.jeu.chargerPartie(i);
      }
    };
  }

  // ------------------------------------------------------------- PAUSE ------
  _construirePause() {
    const p = $('#pause');
    p.innerHTML = `<div class="boutons"><div class="titre-jeu" style="font-size:44px;margin-bottom:18px">Pause</div>
      <button class="bouton" data-a="reprendre">Reprendre</button>
      <button class="bouton" data-a="carnet">Carnet de bord</button>
      <button class="bouton" data-a="options">Options</button>
      <button class="bouton" data-a="sauver">Sauvegarder</button>
      <button class="bouton" data-a="quitter">Retour à l'écran-titre</button></div>`;
    p.addEventListener('click', (e) => {
      const a = e.target.dataset.a, jeu = this.jeu; if (!a) return;
      if (a === 'reprendre') jeu.reprendre();
      else if (a === 'carnet') { this._montrer('pause', false); this.ouvrirCarnet(); }
      else if (a === 'options') this.ouvrirOptions('pause');
      else if (a === 'sauver') { jeu.sauvegarder(); this.notifier('Partie sauvegardée.'); jeu.reprendre(); }
      else if (a === 'quitter') { jeu.sauvegarder(); jeu.retourTitre(); }
    });
  }
  montrerPause(oui) { this._montrer('pause', oui); }

  // ------------------------------------------------------------ OPTIONS -----
  ouvrirOptions(retour) {
    const jeu = this.jeu, o = $('#options'), Q = CONFIG.qualite, e = jeu.entrees, r = jeu.reglages;
    this._montrer('pause', false);
    const curseur = (id, v, min, max, pas) => `<input type="range" data-r="${id}" min="${min}" max="${max}" step="${pas}" value="${v}">`;
    const case_ = (id, v) => `<select data-r="${id}"><option value="1" ${v ? 'selected' : ''}>Oui</option><option value="0" ${v ? '' : 'selected'}>Non</option></select>`;
    o.innerHTML = `<div class="panneau"><h2>Options</h2>
      <h3>Graphismes</h3>
      <div class="ligne"><div>Qualité<small>« Bas » est prévu pour un Chromebook. « Ultra » pousse tout au maximum : réservé aux PC puissants.</small></div>
        <select data-r="qualite">${Q.ordre.map((n) => `<option value="${n}" ${n === jeu.qualite.niveau ? 'selected' : ''}>${Q.niveaux[n].nom} — ${Q.niveaux[n].description}</option>`).join('')}</select></div>
      <div class="ligne"><div>Résolution de l'image<small>« Automatique » baisse la résolution quand le jeu ralentit. Les modes « Douce » la fixent plus bas : image adoucie, même sur une machine rapide.</small></div>
        <select data-r="resolution">${Object.keys(Q.resolutions).map((id) => `<option value="${id}" ${id === jeu.qualite.resolution ? 'selected' : ''}>${Q.resolutions[id].nom} — ${Q.resolutions[id].aide}</option>`).join('')}</select></div>
      <div class="ligne"><div>Plein écran<small>Sur téléphone, verrouille aussi l'écran en mode paysage quand le navigateur le permet.</small></div><button class="bouton petit" data-a="pleinEcran">${jeu.enPleinEcran() ? 'Quitter le plein écran' : 'Passer en plein écran'}</button></div>
      <div class="ligne"><div>Afficher les images par seconde</div>${case_('fps', r.fps)}</div>
      <div class="ligne"><div>Test de performance<small>Choisit automatiquement le niveau adapté.</small></div><button class="bouton petit" data-a="mesurer">Relancer le test (3 s)</button></div>
      <h3>Audio</h3>
      <div class="ligne"><div>Volume général</div>${curseur('general', jeu.audio.volumes.general, 0, 1, 0.01)}</div>
      <div class="ligne"><div>Nature<small>Vent, eau, pluie, animaux.</small></div>${curseur('nature', jeu.audio.volumes.nature, 0, 1, 0.01)}</div>
      <div class="ligne"><div>Musique</div>${curseur('musique', jeu.audio.volumes.musique, 0, 1, 0.01)}</div>
      <h3>Caméra</h3>
      <div class="ligne"><div>Sensibilité</div>${curseur('sensibilite', jeu.cameraJeu.sensibilite, 0.3, 2.5, 0.05)}</div>
      <div class="ligne"><div>Inverser l'axe vertical</div>${case_('inverserY', jeu.cameraJeu.inverserY)}</div>
      <h3>Touches <small class="discret" style="text-transform:none;letter-spacing:0">— cliquez sur une touche puis appuyez sur la nouvelle (Échap pour annuler)</small></h3>
      ${Object.keys(NOMS_ACTIONS).map((a) => `<div class="ligne"><div>${NOMS_ACTIONS[a]}</div><button class="bouton petit" data-touche="${a}">${e.touches[a].map((c) => e.nomTouche(c)).join(' / ')}</button></div>`).join('')}
      <div class="ligne"><div>Autres<small>Échap : pause · molette : zoom · manette : sticks, A esquive, X mordre, B queue, Y rugir, RT courir</small></div><button class="bouton petit" data-a="touchesDefaut">Touches par défaut</button></div>
      <div class="pied"><button class="bouton petit" data-a="fermer">Fermer</button></div></div>`;
    o.classList.remove('cache');
    o.oninput = (ev) => {
      const id = ev.target.dataset.r, v = ev.target.value; if (!id) return;
      if (id === 'qualite') jeu.qualite.appliquer(v);
      else if (id === 'resolution') jeu.qualite.choisirResolution(v);
      else if (id === 'fps') r.fps = v === '1';
      else if (id === 'sensibilite') jeu.cameraJeu.sensibilite = +v;
      else if (id === 'inverserY') jeu.cameraJeu.inverserY = v === '1';
      else { jeu.audio.volumes[id] = +v; jeu.audio.appliquerVolumes(); }
      jeu.enregistrerReglages();
    };
    o.onclick = (ev) => {
      const a = ev.target.dataset.a, touche = ev.target.dataset.touche;
      if (touche) { ev.target.textContent = '…'; e.remapper(touche, () => { jeu.enregistrerReglages(); this.ouvrirOptions(retour); }); }
      else if (a === 'touchesDefaut') { e.touches = JSON.parse(JSON.stringify(TOUCHES_DEFAUT)); jeu.enregistrerReglages(); this.ouvrirOptions(retour); }
      else if (a === 'pleinEcran') { jeu.basculerPleinEcran(); setTimeout(() => { if (!o.classList.contains('cache')) this.ouvrirOptions(retour); }, 400); }
      else if (a === 'mesurer') { o.classList.add('cache'); jeu.mesurerPerformances(() => this.ouvrirOptions(retour)); }
      else if (a === 'fermer') { o.classList.add('cache'); if (retour === 'pause') this.montrerPause(true); }
    };
  }

  // ------------------------------------------------------------- CARNET -----
  ouvrirCarnet() { this.jeu.etat = 'carnet'; this.jeu.entrees.liberer(); this._dessinerCarnet(); }
  fermerCarnet() { $('#carnet').classList.add('cache'); this.jeu.reprendre(); }

  _dessinerCarnet() {
    const jeu = this.jeu, c = jeu.carnet, k = $('#carnet'), j = jeu.joueur;
    const onglets = [['faune', 'Faune'], ['flore', 'Flore'], ['observations', `Observations ${c.nbValides}/${OBSERVATIONS.length}`], ['competences', `Compétences${j.points ? ' (' + j.points + ')' : ''}`], ['parcours', 'Parcours'], ['carte', 'Carte']];
    let page = '';
    if (this.ongletCarnet === 'faune') {
      const f = FICHES[this.ficheChoisie], n = c.sections[this.ficheChoisie] || 0;
      page = `<div class="deux"><div class="liste">${Object.keys(FICHES).map((id) => { const s = c.sections[id] || 0; return `<button data-fiche="${id}" class="${id === this.ficheChoisie ? 'actif' : ''} ${s ? '' : 'inconnu'}">${s ? FICHES[id].nom : 'Espèce inconnue'}<small>${s}/6${c.photos[id] ? ' · photographiée' : ''}</small></button>`; }).join('')}</div>
        <div class="fiche">${n ? `<h4>${f.nom}</h4><div class="sci">${f.sci} — ${f.groupe}</div><dl>${SECTIONS.map((t, i) => `<dt>${t}</dt><dd class="${i < n ? '' : 'verrou'}">${i < n ? f.textes[i] : 'À découvrir : observez cette espèce plus longtemps, ou photographiez-la.'}</dd>`).join('')}</dl>`
    : '<p class="discret">Vous n\'avez pas encore rencontré cette espèce. Approchez-vous d\'un animal et gardez-le dans le champ de vision quelques secondes : sa fiche se remplira peu à peu.</p>'}</div></div>`;
    } else if (this.ongletCarnet === 'flore') {
      const f = FLORE_FICHES[this.floreChoisie], n = c.sectionsFlore(this.floreChoisie), titres = ['Identité', 'Description', 'Le saviez-vous ?'];
      page = `<div class="deux"><div class="liste">${Object.keys(FLORE_FICHES).map((id) => { const s = c.sectionsFlore(id); return `<button data-flore="${id}" class="${id === this.floreChoisie ? 'actif' : ''} ${s ? '' : 'inconnu'}">${s ? FLORE_FICHES[id].nom : 'Plante inconnue'}<small>${s}/3</small></button>`; }).join('')}</div>
        <div class="fiche">${n ? `<h4>${f.nom}</h4><div class="sci">${f.sci}</div><dl>${titres.map((t, i) => `<dt>${t}</dt><dd class="${i < n ? '' : 'verrou'}">${i < n ? f.textes[i] : 'À découvrir : restez un moment près de cette plante.'}</dd>`).join('')}</dl>` : '<p class="discret">Explorez les différents milieux pour découvrir cette plante.</p>'}
        <p class="discret" style="margin-top:22px">Au Jurassique, il n'existe ni herbe ni fleurs : le sol est couvert de fougères, de mousses et de prêles.</p></div></div>`;
    } else if (this.ongletCarnet === 'observations') {
      page = OBSERVATIONS.map((o) => `<div class="obs ${c.valides[o.id] ? 'faite' : ''}"><span class="coche">${c.valides[o.id] ? '✔' : '○'}</span><div><b>${o.titre}</b><small>${o.texte}</small></div></div>`).join('')
        + '<p class="discret">Pour valider un comportement, gardez l\'animal à l\'écran pendant quelques secondes, ou photographiez-le. Chaque observation fait grandir votre Allosaurus ; deux observations donnent un point de compétence.</p>';
    } else if (this.ongletCarnet === 'competences') {
      page = `<p class="discret">Points disponibles : <b>${j.points}</b>. Ils se gagnent en documentant des comportements et à chaque nouveau stade de croissance.</p>`
        + COMPETENCES.map((q) => `<div class="comp"><div><b>${q.nom}</b><small>${q.effet}</small></div>${j.a(q.id) ? '<span style="color:var(--ocre)">Acquise</span>' : `<button class="bouton petit" data-comp="${q.id}" ${j.points ? '' : 'disabled'}>Apprendre</button>`}</div>`).join('')
        + `<h3>Votre Allosaurus</h3><p class="discret">Stade : ${j.infosStade.nom} · longueur ≈ ${(8.5 * j.creature.echelle).toFixed(1)} m · masse ≈ ${Math.round(j.masse)} kg · marques de territoire : ${j.marques.length} · nid : ${j.nid ? 'établi' : 'aucun'}</p>`;
    } else if (this.ongletCarnet === 'parcours') {
      const pr = jeu.progression, st = pr.stats, cour = pr.courant;
      page = '<h3 style="margin-top:0">Objectifs</h3>' + OBJECTIFS.map((o) => { const fait = pr.faits[o.id], actif = cour === o;
        return `<div class="obs ${fait ? 'faite' : ''}" style="${!fait && !actif ? 'opacity:0.45' : ''}"><span class="coche">${fait ? '✔' : actif ? '➤' : '○'}</span><div><b>${o.titre}</b><small>${o.texte}${actif && o.but > 1 ? ' (' + Math.min(o.but, o.valeur(jeu)) + '/' + o.but + ')' : ''}</small></div></div>`; }).join('')
        + `<h3>Lieux remarquables ${pr.nbLieux}/${pr.lieux.length}</h3><p class="discret">${pr.lieux.map((l) => (pr.decouverts[l.id] ? l.nom : '· · ·')).join(' &nbsp;—&nbsp; ')}</p>`
        + `<h3>Statistiques</h3><p class="discret">Jours vécus : ${st.jours} · distance parcourue : ${(st.distance / 1000).toFixed(1)} km · proies abattues : ${st.proies} · attaques surprises : ${st.surprises} · poissons attrapés : ${st.poissons} · prédateurs repoussés : ${st.predateurs} · petits arbres renversés : ${st.arbres}</p>`;
    } else page = '<canvas id="carte" width="512" height="512"></canvas><p class="discret">Flèche blanche : vous · maison : nid · cercles : territoire marqué · losanges : lieux remarquables (« ? » avant leur découverte). Vert sombre : forêt vierge · vert clair : forêt de ginkgos · vert bleuté : conifères · beige : lande et plage. Le nord est en haut.</p>';
    k.innerHTML = `<div class="panneau"><h2>Carnet de bord</h2><div class="onglets">${onglets.map((o) => `<button class="onglet ${o[0] === this.ongletCarnet ? 'actif' : ''}" data-onglet="${o[0]}">${o[1]}</button>`).join('')}</div>
      <div class="pages">${page}</div><div class="pied"><button class="bouton petit" data-a="fermer">Fermer (${jeu.entrees.nomAction('carnet')})</button></div></div>`;
    k.classList.remove('cache');
    if (this.ongletCarnet === 'carte') this._dessinerCarte($('#carte'), 0, 0, CONFIG.monde.taille);
    k.onclick = (ev) => {
      const d = ev.target.closest('button'); if (!d) return;
      if (d.dataset.onglet) this.ongletCarnet = d.dataset.onglet;
      else if (d.dataset.fiche) this.ficheChoisie = d.dataset.fiche;
      else if (d.dataset.flore) this.floreChoisie = d.dataset.flore;
      else if (d.dataset.comp) { if (j.apprendre(d.dataset.comp)) { jeu.audio.carillon(); jeu.sauvegarder(); } }
      else if (d.dataset.a === 'fermer') { this.fermerCarnet(); return; }
      this._dessinerCarnet();
    };
  }

  /** Fond de carte (relief + biomes), calculé une seule fois : 1 pixel = 2 m. */
  preparerCarte() {
    const T = this.jeu.terrain, S = 1024, M = CONFIG.monde.taille;
    const c = document.createElement('canvas'); c.width = c.height = S;
    const g = c.getContext('2d'), img = g.createImageData(S, S);
    const teintes = { [BIOME.EAU]: [52, 84, 98], [BIOME.PLAGE]: [196, 178, 132], [BIOME.MARAIS]: [78, 96, 62], [BIOME.PLAINE]: [128, 140, 78], [BIOME.FORET_HUMIDE]: [84, 124, 58],
      [BIOME.FORET_CONIFERES]: [44, 78, 56], [BIOME.ROCAILLE]: [132, 124, 112], [BIOME.RIVE]: [100, 122, 80], [BIOME.FORET_VIERGE]: [34, 96, 44], [BIOME.LANDE]: [160, 140, 92] };
    for (let y = 0; y < S; y++) for (let x = 0; x < S; x++) {
      const wx = (x / S - 0.5) * M, wz = (y / S - 0.5) * M, h = T.hauteur(wx, wz);
      const t = teintes[T.biome(wx, wz)], relief = 0.82 + Math.max(-0.25, Math.min(0.45, (T.hauteur(wx - 5, wz - 5) - h) * 0.06)) + Math.min(0.2, Math.max(0, h) * 0.002);
      const i = (y * S + x) * 4, k = h < 0 ? Math.max(0.55, 1 + h * 0.04) : relief;
      img.data[i] = t[0] * k; img.data[i + 1] = t[1] * k; img.data[i + 2] = t[2] * k; img.data[i + 3] = 255;
    }
    g.putImageData(img, 0, 0);
    this.fondCarte = c;
  }

  /**
   * Dessine la carte dans un canvas. `etendue` = largeur de terrain visible (m), centrée sur (cx, cz).
   * Sert à la mini-carte, à sa version agrandie et à l'onglet « Carte » du carnet.
   */
  _dessinerCarte(canvas, cx, cz, etendue) {
    const jeu = this.jeu, g = canvas.getContext('2d'), L = canvas.width, M = CONFIG.monde.taille, F = this.fondCarte.width;
    const ech = L / etendue;                                   // pixels par mètre
    const X = (x) => (x - cx) * ech + L / 2, Z = (z) => (z - cz) * ech + L / 2;
    g.fillStyle = '#2d4a57'; g.fillRect(0, 0, L, L);
    const sx = (cx - etendue / 2 + M / 2) / M * F, sz = (cz - etendue / 2 + M / 2) / M * F, sl = etendue / M * F;
    g.imageSmoothingEnabled = true;
    g.drawImage(this.fondCarte, sx, sz, sl, sl, 0, 0, L, L);
    const j = jeu.joueur, c = j.creature;
    g.strokeStyle = 'rgba(217,181,106,0.85)'; g.fillStyle = 'rgba(217,181,106,0.13)'; g.lineWidth = 1.5;
    for (const m of j.marques) { g.beginPath(); g.arc(X(m.x), Z(m.z), CONFIG.joueur.rayonMarque * ech, 0, 6.3); g.fill(); g.stroke(); }
    // odeurs : visibles sur la carte quand la vision olfactive est active
    if (jeu.odorat.actif) {
      const portee = 150 * (j.a('odorat') ? 1.5 : 1);
      for (const a of jeu.ecosysteme.animaux) {
        if (!a.vivant || a.distJoueur > portee) continue;
        g.fillStyle = a.def.role === 'predateur' ? '#ff4630' : '#ffa52a';
        g.beginPath(); g.arc(X(a.x), Z(a.z), Math.max(2.5, a.def.rayon * 1.6), 0, 6.3); g.fill();
      }
      g.fillStyle = '#62e04e';
      for (const k of jeu.ecosysteme.carcasses) if (k.viande > 0 && Math.hypot(k.x - c.x, k.z - c.z) < portee * 1.6) { g.beginPath(); g.arc(X(k.x), Z(k.z), 3.5, 0, 6.3); g.fill(); }
    }
    // lieux remarquables : losange une fois découverts, « ? » sinon (sur la carte de l'île seulement)
    g.textAlign = 'center'; g.lineWidth = 3; g.strokeStyle = '#000';
    for (const l of jeu.progression.lieux) {
      const px = X(l.x), pz = Z(l.z), vu = jeu.progression.decouverts[l.id];
      if (px < 0 || pz < 0 || px > L || pz > L || (!vu && etendue < 1000)) continue;
      g.font = 'bold ' + Math.round(L / 26) + 'px sans-serif'; g.fillStyle = vu ? '#d9b56a' : 'rgba(241,234,217,0.75)';
      g.strokeText(vu ? '◆' : '?', px, pz + 5); g.fillText(vu ? '◆' : '?', px, pz + 5);
    }
    g.fillStyle = '#f1ead9'; g.strokeStyle = '#000'; g.lineWidth = 3; g.font = 'bold 22px sans-serif'; g.textAlign = 'center';
    if (j.nid) { g.strokeText('⌂', X(j.nid.x), Z(j.nid.z) + 7); g.fillText('⌂', X(j.nid.x), Z(j.nid.z) + 7); }
    // le joueur : une flèche orientée selon son cap
    g.save(); g.translate(X(c.x), Z(c.z)); g.rotate(Math.PI - c.cap);
    const t = L / 400;
    g.beginPath(); g.moveTo(0, -11 * t); g.lineTo(7 * t, 8 * t); g.lineTo(0, 4 * t); g.lineTo(-7 * t, 8 * t); g.closePath();
    g.fillStyle = '#fff'; g.lineWidth = 1.5; g.fill(); g.stroke(); g.restore();
  }

  /** Touche M : la mini-carte passe du voisinage (340 m) à l'île entière. */
  basculerCarte() { this.carteGrande = !this.carteGrande; this.hud.classList.toggle('carte-grande', this.carteGrande); this.tCarte = 0; }

  // ---------------------------------------------------------- MODE PHOTO ----
  _construirePhoto() {
    const p = $('#photo');
    p.innerHTML = `<b style="font-family:var(--serif);font-size:18px;font-weight:400">Mode photo</b>
      <div class="discret" style="margin-top:4px">Clic maintenu : regarder · touches de déplacement : voler · Espace / C : monter / descendre · molette : mise au point</div>
      <label>Champ de vision</label><input type="range" data-p="champ" min="14" max="90" step="1">
      <label>Mise au point (distance)</label><input type="range" data-p="focus" min="0.5" max="150" step="0.5">
      <label>Flou d'arrière-plan</label><input type="range" data-p="flou" min="0" max="2.5" step="0.05">
      <label>Inclinaison</label><input type="range" data-p="roulis" min="-0.6" max="0.6" step="0.01">
      <label>Filtre</label><select data-p="filtre">${FILTRES.map((f, i) => `<option value="${i}">${f}</option>`).join('')}</select>
      <div class="pied"><button class="bouton petit" data-a="capturer">Capturer (Entrée)</button><button class="bouton petit" data-a="quitter">Quitter</button></div>
      <div class="discret" style="margin-top:8px">H : masquer ce panneau. Une espèce cadrée voit sa fiche validée.</div>`;
    p.addEventListener('input', (e) => { const id = e.target.dataset.p; if (id) this.jeu.photo[id] = +e.target.value; });
    p.addEventListener('click', (e) => { const a = e.target.dataset.a; if (a === 'capturer') this.jeu.photo.capturer(); else if (a === 'quitter') this.jeu.photo.sortir(); });
  }
  montrerPhoto(oui) {
    this._montrer('photo', oui); document.body.classList.toggle('sans-hud', oui);
    if (oui) for (const el of $('#photo').querySelectorAll('[data-p]')) el.value = this.jeu.photo[el.dataset.p];
  }

  // ---------------------------------------------------------- DIDACTICIEL ---
  demarrerTutoriel() { this.etapeTuto = 0; this.tTuto = 0; this.memoTuto = {}; }
  _tutoriel(dt) {
    const jeu = this.jeu, e = jeu.entrees, j = jeu.joueur, k = (a) => `<kbd>${e.nomAction(a)}</kbd>`, t = $('#tutoriel'), m = this.memoTuto;
    if (this.etapeTuto < 0) { t.classList.add('cache'); return; }
    const etapes = [
      [`Vous êtes un jeune Allosaurus. Déplacez-vous avec ${k('avancer')}${k('gauche')}${k('reculer')}${k('droite')} ; la souris oriente la caméra (cliquez dans le jeu pour la capturer).`, () => { m.d = (m.d || 0) + Math.abs(j.creature.vitesse) * dt; return m.d > 10; }],
      [`Maintenez ${k('sprint')} pour courir : cela consomme votre souffle. ${k('allure')} alterne marche lente et petite foulée — la marche lente effraie moins les proies.`, () => j.creature.vitesse > j.infosStade.trot * 1.15 || this.tTuto > 14],
      [`${k('odorat')} active la vision olfactive : proies en orange, prédateurs en rouge, carcasses en vert, eau douce en bleu. Essayez.`, () => jeu.odorat.actif || this.tTuto > 20],
      [`Suivez l'odeur bleue jusqu'à l'eau, arrêtez-vous au bord et maintenez ${k('interagir')} pour boire. On mange de la même façon près d'une carcasse.`, () => j.interaction === 'boire' || this.tTuto > 60],
      [`Gardez un animal à l'écran quelques secondes pour remplir votre carnet de bord ${k('carnet')}. Le mode photo ${k('photo')} valide une fiche d'un seul cliché.`, () => jeu.carnet.nbSections > 3 || this.tTuto > 40],
      [`${k('morsure')} mordre · ${k('queue')} coup de queue · ${k('esquive')} esquiver · ${k('rugir')} rugir · ${k('reposer')} dormir · ${k('marquer')} marquer le territoire · ${k('nid')} établir le nid · ${k('carte')} agrandir la carte. Bonne exploration.`, () => this.tTuto > 16],
    ];
    if (jeu.tactile) {
      // sur écran tactile, les consignes parlent de gestes et de boutons, pas de touches
      const b = (t) => `<kbd>${t}</kbd>`;
      etapes[0][0] = 'Vous êtes un jeune Allosaurus. Posez le pouce gauche sur l\'écran pour faire apparaître la manette et vous déplacer ; glissez le doigt à droite pour tourner la caméra.';
      etapes[1][0] = 'Poussez la manette bien au-delà de son bord pour courir : cela consomme votre souffle. ' + b('Plus') + ' → ' + b('Allure') + ' alterne marche lente et petite foulée.';
      etapes[2][0] = b('Odorat') + ' active la vision olfactive : proies en orange, prédateurs en rouge, carcasses en vert, eau douce en bleu. Essayez.';
      etapes[3][0] = 'Suivez l\'odeur bleue jusqu\'à l\'eau, arrêtez-vous au bord et maintenez ' + b('Boire') + '. On mange de la même façon près d\'une carcasse.';
      etapes[4][0] = 'Gardez un animal à l\'écran quelques secondes pour remplir votre ' + b('Carnet') + '. Touchez la mini-carte pour l\'agrandir.';
      etapes[5][0] = b('Mordre') + ' ' + b('Queue') + ' ' + b('Esquive') + ' ' + b('Rugir') + ' en bas à droite ; dormir, marquer le territoire, établir le nid et le mode photo sont dans ' + b('Plus') + '. Bonne exploration.';
    }
    if (this.etapeTuto >= etapes.length) { this.etapeTuto = -1; jeu.reglages.tutorielFait = true; jeu.enregistrerReglages(); return; }
    this.tTuto += dt;
    if (this._tutoAffiche !== this.etapeTuto) {
      this._tutoAffiche = this.etapeTuto;
      t.innerHTML = etapes[this.etapeTuto][0] + '<button>Passer le didacticiel</button>';
      t.querySelector('button').onclick = () => { this.etapeTuto = etapes.length; };
    }
    t.classList.remove('cache');
    if (this.tTuto > 1.5 && etapes[this.etapeTuto][1]()) { this.etapeTuto++; this.tTuto = 0; }
  }

  // ----------------------------------------------------------------- HUD ----
  /** Met à jour le HUD. Les textes ne sont réécrits que quelques fois par seconde. */
  mettreAJour(dt) {
    const jeu = this.jeu, j = jeu.joueur;
    if (jeu.etat === 'titre') return;
    const v = [j.sante / j.santeMax, j.faim / 100, j.soif / 100, j.energie / 100];
    for (let i = 0; i < 4; i++) {
      this.jauges[i].lastElementChild.firstElementChild.style.transform = `scaleX(${Math.max(0, v[i]).toFixed(3)})`;
      this.jauges[i].classList.toggle('bas', v[i] < 0.25);
    }
    $('#souffle i').style.transform = `scaleX(${(j.souffle / CONFIG.joueur.souffleMax).toFixed(3)})`;
    // boussole
    const cap = Math.atan2(jeu.cameraJeu.avantX, -jeu.cameraJeu.avantZ) * 180 / Math.PI;
    const placer = (el, angle) => { let d = ((angle - cap + 540) % 360) - 180; el.style.transform = `translateX(${d * 2.2}px)`; el.style.opacity = Math.abs(d) < 75 ? 1 : 0; };
    for (let i = 0; i < 8; i++) placer(this.reperes[i], CARDINAUX[i][1]);
    const c = j.creature, vers = (p) => Math.atan2(p.x - c.x, -(p.z - c.z)) * 180 / Math.PI;
    if (j.nid) placer(this.reperes[8], vers(j.nid)); else this.reperes[8].style.opacity = 0;
    if (jeu.odorat.actif && jeu.odorat.eauProche) placer(this.reperes[9], vers(jeu.odorat.eauProche)); else this.reperes[9].style.opacity = 0;
    this._tutoriel(dt);
    // mini-carte : redessinée 6 fois par seconde
    this.tCarte -= dt;
    if (this.tCarte <= 0 && this.fondCarte) {
      this.tCarte = 0.16;
      if (this.carteGrande) this._dessinerCarte(this.miniCarte, 0, 0, CONFIG.monde.taille);
      else this._dessinerCarte(this.miniCarte, c.x, c.z, 340);
    }
    this.tHud -= dt;
    if (this.tHud > 0) return;
    this.tHud = 0.25;
    $('#minicarte small').textContent = jeu.tactile ? '' : jeu.entrees.nomAction('carte');
    const e = $('#etat');
    e.querySelector('.stade').textContent = 'Allosaurus ' + j.infosStade.nom.toLowerCase();
    e.querySelector('.jauge i').style.transform = `scaleX(${j.progression.toFixed(3)})`;
    e.querySelector('small').innerHTML = `Jour ${jeu.ciel.jourNumero} · ${jeu.ciel.texteHeure()} · ${jeu.meteo.nom}<br>${NOMS_BIOMES[jeu.terrain.biome(c.x, c.z)]}${j.enTerritoire ? ' · votre territoire' : ''}${j.repos ? ' · repos' : ''}`;
    const inv = $('#invite'), ctx = j.contexte;
    if (ctx && jeu.etat === 'jeu' && !j.repos) { inv.innerHTML = ctx.type === 'sale' ? ctx.texte : `<kbd>${jeu.entrees.nomAction('interagir')}</kbd> ${ctx.texte} <span class="discret">(maintenir)</span>`; inv.classList.remove('cache'); } else inv.classList.add('cache');
    // objectif en cours
    const ob = $('#objectif'), cour = jeu.progression.courant;
    if (cour && jeu.etat === 'jeu') {
      ob.classList.remove('cache'); ob.querySelector('b').textContent = cour.titre;
      const val = Math.min(cour.but, cour.valeur(jeu));
      ob.querySelector('span').textContent = cour.texte + (cour.but > 1 ? ' (' + val + '/' + cour.but + ')' : '');
      ob.querySelector('.jauge i').style.transform = `scaleX(${(val / cour.but).toFixed(2)})`;
    } else ob.classList.add('cache');
    // animal visé : le plus proche dans l'axe de la caméra
    const ci = $('#cible'); let vise = null, dMin = 45;
    const ax = jeu.cameraJeu.avantX, az = jeu.cameraJeu.avantZ;
    for (const a of jeu.ecosysteme.animaux) {
      if (!a.vivant || a.distJoueur > dMin + a.def.longueur) continue;
      const dx = a.x - c.x, dz = a.z - c.z, d = Math.hypot(dx, dz) || 1;
      if ((dx * ax + dz * az) / d > 0.9 && d - a.def.longueur * 0.4 < dMin) { dMin = d; vise = a; }
    }
    if (vise && jeu.etat === 'jeu') {
      const etats = { fuit: 'en fuite', alerte: 'en alerte', defend: 'sur la défensive', menace: 'menaçant', chasse: 'en chasse', dort: 'endormi', boit: 'boit', broute: 'broute', couve: 'couve', charogne: 'mange' };
      ci.classList.remove('cache'); ci.querySelector('b').textContent = vise.def.nom;
      ci.querySelector('span').textContent = (etats[vise.comportement] || 'calme') + ' · ' + Math.round(vise.distJoueur) + ' m';
      ci.classList.toggle('danger', vise.comportement === 'menace' || vise.comportement === 'defend');
      ci.querySelector('.jauge i').style.transform = `scaleX(${Math.max(0, vise.sante / vise.def.sante).toFixed(2)})`;
    } else ci.classList.add('cache');
    const o = $('#observation'), enc = jeu.carnet.enCours;
    if (enc) { o.classList.remove('cache'); o.querySelector('b').textContent = enc.espece; o.querySelector('span').textContent = enc.titre; o.querySelector('.jauge i').style.transform = `scaleX(${enc.ratio.toFixed(2)})`; } else o.classList.add('cache');
    const f = $('#fps');
    if (jeu.reglages.fps) { f.classList.remove('cache'); f.textContent = `${Math.round(jeu.qualite.fps)} img/s · ${jeu.infosRendu.appels} dessins · ${(jeu.infosRendu.triangles / 1000).toFixed(0)} k triangles · résolution ${Math.round(jeu.qualite.echelleActive * jeu.qualite.reglages.echelle * 100)} %`; } else f.classList.add('cache');
  }
}
