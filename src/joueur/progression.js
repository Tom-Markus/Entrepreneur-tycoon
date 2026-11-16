// Progression : objectifs guidés, lieux remarquables à découvrir et statistiques de la partie.
// Les objectifs s'enchaînent un par un : ils donnent un but sans jamais rien interdire.
import { CONFIG } from '../config.js';
import { LIEUX, BIOME } from '../monde/terrain.js';
import { FICHES } from '../science/fiches.js';

/** valeur(jeu) renvoie l'avancement actuel ; l'objectif est atteint quand il vaut `but`. */
export const OBJECTIFS = [
  { id: 'boire', titre: 'Se désaltérer', texte: 'Trouvez de l\'eau douce et buvez.', but: 1, valeur: (j) => (j.progression.stats.aBu ? 1 : 0), gain: 10 },
  { id: 'rencontres', titre: 'Premières rencontres', texte: 'Découvrez 3 espèces animales.', but: 3, valeur: (j) => especesConnues(j), gain: 15 },
  { id: 'peche', titre: 'Pêcheur', texte: 'Attrapez un poisson d\'un coup de mâchoires en eau peu profonde.', but: 1, valeur: (j) => j.progression.stats.poissons, gain: 15 },
  { id: 'explorer', titre: 'Explorateur', texte: 'Découvrez 3 lieux remarquables (voir la carte).', but: 3, valeur: (j) => j.progression.nbLieux, gain: 20 },
  { id: 'chasse', titre: 'Chasseur', texte: 'Abattez une proie. Approchez lentement : une attaque surprise fait double dégât.', but: 1, valeur: (j) => j.progression.stats.proies, gain: 25, point: true },
  { id: 'nid', titre: 'Un abri', texte: 'Établissez votre nid sur un sol sec et plat.', but: 1, valeur: (j) => (j.joueur.nid ? 1 : 0), gain: 15 },
  { id: 'naturaliste', titre: 'Naturaliste', texte: 'Documentez 4 comportements dans le carnet.', but: 4, valeur: (j) => j.carnet.nbValides, gain: 25 },
  { id: 'subadulte', titre: 'Grandir', texte: 'Atteignez le stade subadulte.', but: 1, valeur: (j) => (j.joueur.stade >= 1 ? 1 : 0), gain: 0, point: true },
  { id: 'territoire', titre: 'Maître des lieux', texte: 'Posez 4 marques de territoire.', but: 4, valeur: (j) => j.joueur.marques.length, gain: 25 },
  { id: 'photos', titre: 'Photographe', texte: 'Photographiez 3 espèces différentes.', but: 3, valeur: (j) => Object.keys(j.carnet.photos).length, gain: 30 },
  { id: 'tour', titre: 'Le tour de l\'île', texte: 'Découvrez tous les lieux remarquables.', but: 0, valeur: (j) => j.progression.nbLieux, gain: 40, point: true },
  { id: 'rival', titre: 'Face au rival', texte: 'Mettez en fuite ou terrassez un grand prédateur.', but: 1, valeur: (j) => j.progression.stats.predateurs, gain: 40, point: true },
  { id: 'adulte', titre: 'L\'âge adulte', texte: 'Atteignez le stade adulte.', but: 1, valeur: (j) => (j.joueur.stade >= 2 ? 1 : 0), gain: 0, point: true },
  { id: 'carnet', titre: 'Carnet complet', texte: 'Complétez les fiches de toutes les espèces animales.', but: 0, valeur: (j) => fichesCompletes(j), gain: 60, point: true },
];

function especesConnues(jeu) { let n = 0; for (const id in FICHES) if (id !== 'allosaurus' && jeu.carnet.sections[id]) n++; return n; }
function fichesCompletes(jeu) { let n = 0; for (const id in FICHES) if ((jeu.carnet.sections[id] || 0) >= 6) n++; return n; }

export class Progression {
  constructor(jeu) {
    this.jeu = jeu;
    this._creerLieux();
    OBJECTIFS.find((o) => o.id === 'tour').but = this.lieux.length;
    OBJECTIFS.find((o) => o.id === 'carnet').but = Object.keys(FICHES).length;
    this.reinitialiser();
  }

  /** Lieux remarquables : certains sont fixes, d'autres sont cherchés dans le relief généré. */
  _creerLieux() {
    const T = this.jeu.terrain;
    let sommet = { x: LIEUX.montagne.x, z: LIEUX.montagne.z, h: -1 }, plageNord = null, plageSud = null;
    for (let z = -1000; z <= 1000; z += 12) for (let x = -1000; x <= 1000; x += 12) {
      const h = T.hauteur(x, z);
      if (h > sommet.h && T.pente(x, z) < 0.7) sommet = { x, z, h };
      if (T.biome(x, z) === BIOME.PLAGE && h > 0.5) {
        if (!plageNord || z < plageNord.z) plageNord = { x, z };
        if (!plageSud || z > plageSud.z) plageSud = { x, z };
      }
    }
    const nurserie = this.jeu.ecosysteme.troupeaux.find((t) => t.nid);
    const r = LIEUX.riviere;
    this.lieux = [
      { id: 'lac', nom: 'Le Grand Lac', x: LIEUX.lac.x + 150, z: LIEUX.lac.z + 150, rayon: 90 },
      { id: 'marais', nom: 'Les Marais', x: LIEUX.marais.x, z: LIEUX.marais.z, rayon: 110 },
      { id: 'sommet', nom: 'Le Belvédère', x: sommet.x, z: sommet.z, rayon: 55 },
      { id: 'gorge', nom: 'La Gorge', x: r[1][0], z: r[1][1], rayon: 60 },
      { id: 'embouchure', nom: 'L\'Embouchure', x: r[8][0], z: r[8][1], rayon: 80 },
      { id: 'plaine', nom: 'La Grande Plaine', x: LIEUX.plaine.x, z: LIEUX.plaine.z, rayon: 80 },
    ];
    if (plageNord) this.lieux.push({ id: 'plageNord', nom: 'La Plage du Nord', x: plageNord.x, z: plageNord.z + 10, rayon: 70 });
    if (plageSud) this.lieux.push({ id: 'plageSud', nom: 'La Pointe Sud', x: plageSud.x, z: plageSud.z - 10, rayon: 70 });
    if (nurserie) this.lieux.push({ id: 'nurserie', nom: 'La Nurserie des Dryosaurus', x: nurserie.nid.x, z: nurserie.nid.z, rayon: 45 });
  }

  reinitialiser() {
    this.stats = { distance: 0, proies: 0, poissons: 0, predateurs: 0, aBu: false, surprises: 0, arbres: 0, jours: 1 };
    this.decouverts = {}; this.faits = {}; this.indice = 0; this.t = 0;
  }
  exporter() { return { stats: this.stats, decouverts: this.decouverts, faits: this.faits }; }
  importer(d) {
    this.reinitialiser();
    if (!d) return;
    Object.assign(this.stats, d.stats || {}); this.decouverts = d.decouverts || {}; this.faits = d.faits || {};
    this._avancer();
  }

  get nbLieux() { return Object.keys(this.decouverts).length; }
  /** Objectif en cours (ou null si tout est accompli). */
  get courant() { return OBJECTIFS[this.indice] || null; }
  _avancer() { this.indice = 0; while (this.indice < OBJECTIFS.length && this.faits[OBJECTIFS[this.indice].id]) this.indice++; }

  mettreAJour(dt) {
    const jeu = this.jeu, c = jeu.joueur.creature;
    this.stats.distance += Math.abs(c.vitesse) * dt;
    this.stats.jours = jeu.ciel.jourNumero;
    this.t -= dt;
    if (this.t > 0) return;
    this.t = 0.5;
    // Lieux remarquables
    for (const l of this.lieux) {
      if (this.decouverts[l.id] || Math.hypot(c.x - l.x, c.z - l.z) > l.rayon) continue;
      this.decouverts[l.id] = true;
      jeu.joueur.grandir(8);
      jeu.ui.annoncer(l.nom, 'Lieu découvert · ' + this.nbLieux + '/' + this.lieux.length);
      jeu.audio.carillon();
    }
    // Objectifs : tous ceux qui sont déjà remplis sont validés, dans l'ordre
    let o = this.courant, valides = 0;
    while (o && o.valeur(jeu) >= o.but && valides < 1) {
      this.faits[o.id] = true; valides++;
      jeu.joueur.grandir(o.gain);
      if (o.point) jeu.joueur.points++;
      jeu.ui.annoncer('Objectif atteint : ' + o.titre, (o.gain ? '+' + o.gain + ' croissance' : '') + (o.point ? (o.gain ? ' · ' : '') + '+1 point de compétence' : ''));
      jeu.audio.carillon();
      this._avancer(); o = this.courant;
      jeu.sauvegarder();
    }
  }
}
