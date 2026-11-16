// Textures 100 % procédurales : aucune image externe n'est chargée.
// Tout est calculé au lancement (bruits mathématiques ou dessin sur un <canvas>).
import * as THREE from 'three';
import { fbmPeriodique, creerAlea, hacher, borner, lissage } from '../noyau/maths.js';

const T = 256; // côté des textures de sol

/** Construit une carte de normales (RG) à partir d'un champ de hauteur périodique. */
function normalesDepuisHauteur(h, taille, force, sortie, decalage) {
  for (let y = 0; y < taille; y++) {
    for (let x = 0; x < taille; x++) {
      const g = h[y * taille + ((x + taille - 1) % taille)], d = h[y * taille + ((x + 1) % taille)];
      const b = h[((y + taille - 1) % taille) * taille + x], ht = h[((y + 1) % taille) * taille + x];
      let nx = (g - d) * force, ny = (b - ht) * force;
      const l = Math.sqrt(nx * nx + ny * ny + 1);
      nx /= l; ny /= l;
      const i = decalage + (y * taille + x) * 4;
      sortie[i] = (nx * 0.5 + 0.5) * 255;
      sortie[i + 1] = (ny * 0.5 + 0.5) * 255;
      sortie[i + 2] = h[y * taille + x] * 255;
      sortie[i + 3] = 255;
    }
  }
}

/**
 * Quatre couches de sol (terre, boue, roche, sable) dans deux « tableaux de textures ».
 * albedos : couleur (linéaire) + rugosité dans le canal alpha. normales : relief.
 */
export function creerTexturesSol() {
  const n = T * T;
  const albedos = new Uint8Array(n * 4 * 4);
  const normales = new Uint8Array(n * 4 * 4);
  const h = new Float32Array(n);
  // [couleur sombre, couleur claire, rugosité] en espace linéaire
  const palettes = [
    [[0.060, 0.042, 0.026], [0.150, 0.105, 0.060], 0.92], // terre / humus
    [[0.045, 0.032, 0.022], [0.105, 0.078, 0.050], 0.42], // boue humide
    [[0.060, 0.055, 0.048], [0.170, 0.155, 0.130], 0.85], // roche
    [[0.270, 0.220, 0.150], [0.420, 0.360, 0.260], 0.90], // sable
  ];
  for (let c = 0; c < 4; c++) {
    for (let y = 0; y < T; y++) {
      for (let x = 0; x < T; x++) {
        const u = x / T, v = y / T;
        let val;
        if (c === 0) {            // terre : grumeaux + débris
          val = fbmPeriodique(u, v, 6, 5, 11) * 0.7 + fbmPeriodique(u, v, 40, 2, 12) * 0.3;
        } else if (c === 1) {     // boue : lisse, larges ondulations
          val = fbmPeriodique(u, v, 4, 3, 21) * 0.85 + fbmPeriodique(u, v, 28, 2, 22) * 0.15;
        } else if (c === 2) {     // roche : strates et fissures
          const d = fbmPeriodique(u, v, 4, 4, 31);
          const strate = Math.abs(Math.sin((v * 9 + d * 2.2) * Math.PI));
          val = strate * 0.45 + fbmPeriodique(u, v, 12, 4, 32) * 0.55;
        } else {                  // sable : rides de vent + grain
          const d = fbmPeriodique(u, v, 5, 3, 41);
          val = (Math.sin((u * 14 + d * 1.6) * Math.PI * 2) * 0.5 + 0.5) * 0.35
              + fbmPeriodique(u, v, 48, 2, 42) * 0.65;
        }
        h[y * T + x] = val;
        const p = palettes[c];
        const grain = hacher(x + c * 977, y) * 0.12 - 0.06;
        const t = borner(val * 1.25 - 0.12 + grain, 0, 1);
        const i = c * n * 4 + (y * T + x) * 4;
        // quelques aiguilles / brindilles ocre sur la terre
        const brindille = c === 0 && hacher(x * 3 + 5, y * 7 + 1) > 0.985 ? 0.12 : 0;
        albedos[i] = (p[0][0] + (p[1][0] - p[0][0]) * t + brindille) * 255;
        albedos[i + 1] = (p[0][1] + (p[1][1] - p[0][1]) * t + brindille * 0.7) * 255;
        albedos[i + 2] = (p[0][2] + (p[1][2] - p[0][2]) * t) * 255;
        albedos[i + 3] = borner(p[2] + (0.5 - val) * 0.15, 0, 1) * 255;
      }
    }
    normalesDepuisHauteur(h, T, [3.0, 1.6, 5.0, 2.2][c], normales, c * n * 4);
  }
  const fabriquer = (donnees) => {
    const tex = new THREE.DataArrayTexture(donnees, T, T, 4);
    tex.format = THREE.RGBAFormat; tex.type = THREE.UnsignedByteType;
    tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
    tex.minFilter = THREE.LinearMipmapLinearFilter; tex.magFilter = THREE.LinearFilter;
    tex.generateMipmaps = true; tex.needsUpdate = true;
    return tex;
  };
  return { albedos: fabriquer(albedos), normales: fabriquer(normales) };
}

function texDonnees(donnees, taille, srgb = false) {
  const tex = new THREE.DataTexture(donnees, taille, taille, THREE.RGBAFormat, THREE.UnsignedByteType);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.minFilter = THREE.LinearMipmapLinearFilter; tex.magFilter = THREE.LinearFilter;
  tex.generateMipmaps = true;
  if (srgb) tex.colorSpace = THREE.SRGBColorSpace;
  tex.needsUpdate = true;
  return tex;
}

/** Bruit générique : R = nuages (basse fréquence), G = détail, B = très fin, A = bruit blanc. */
export function creerTextureBruit() {
  const d = new Uint8Array(T * T * 4);
  for (let y = 0; y < T; y++) for (let x = 0; x < T; x++) {
    const u = x / T, v = y / T, i = (y * T + x) * 4;
    d[i] = fbmPeriodique(u, v, 4, 5, 51) * 255;
    d[i + 1] = fbmPeriodique(u, v, 10, 4, 52) * 255;
    d[i + 2] = fbmPeriodique(u, v, 32, 3, 53) * 255;
    d[i + 3] = hacher(x, y + 91) * 255;
  }
  return texDonnees(d, T);
}

/** Carte de normales de vaguelettes pour l'eau. */
export function creerNormaleEau() {
  const h = new Float32Array(T * T);
  for (let y = 0; y < T; y++) for (let x = 0; x < T; x++) {
    h[y * T + x] = fbmPeriodique(x / T, y / T, 5, 5, 61);
  }
  const d = new Uint8Array(T * T * 4);
  normalesDepuisHauteur(h, T, 9, d, 0);
  return texDonnees(d, T);
}

/**
 * Peau écailleuse : cellules de Worley périodiques.
 * Renvoie { normale, detail } (detail = variation de teinte par écaille, en niveaux de gris).
 */
export function creerTexturesPeau() {
  const S = 256, C = 20; // 20 × 20 écailles par tuile
  const alea = creerAlea(777);
  const px = new Float32Array(C * C), py = new Float32Array(C * C), teinte = new Float32Array(C * C);
  for (let i = 0; i < C * C; i++) { px[i] = 0.15 + alea() * 0.7; py[i] = 0.15 + alea() * 0.7; teinte[i] = alea(); }
  const h = new Float32Array(S * S);
  const detail = new Uint8Array(S * S * 4);
  for (let y = 0; y < S; y++) for (let x = 0; x < S; x++) {
    const gx = (x / S) * C, gy = (y / S) * C;
    const cx = Math.floor(gx), cy = Math.floor(gy);
    let d1 = 9, d2 = 9, id = 0;
    for (let oy = -1; oy <= 1; oy++) for (let ox = -1; ox <= 1; ox++) {
      const ix = (cx + ox + C) % C, iy = (cy + oy + C) % C, k = iy * C + ix;
      const dx = cx + ox + px[k] - gx, dy = cy + oy + py[k] - gy;
      const dd = Math.sqrt(dx * dx + dy * dy);
      if (dd < d1) { d2 = d1; d1 = dd; id = k; } else if (dd < d2) d2 = dd;
    }
    const bord = lissage(0.02, 0.22, d2 - d1);        // 0 dans les sillons, 1 sur l'écaille
    const bombe = bord * (1 - d1 * 0.6);
    h[y * S + x] = bombe;
    const i = (y * S + x) * 4;
    const v = (0.76 + bord * 0.2 + (teinte[id] - 0.5) * 0.12) * 255;
    detail[i] = detail[i + 1] = detail[i + 2] = borner(v, 0, 255); detail[i + 3] = 255;
  }
  const n = new Uint8Array(S * S * 4);
  normalesDepuisHauteur(h, S, 5.5, n, 0);
  return { normale: texDonnees(n, S), detail: texDonnees(detail, S) };
}

// ------------------------------------------------------------------ CANVAS --
function toile(l, h) {
  const c = document.createElement('canvas');
  c.width = l; c.height = h;
  return c;
}

function texToile(c, repete = false) {
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = tex.wrapT = repete ? THREE.RepeatWrapping : THREE.ClampToEdgeWrapping;
  tex.anisotropy = 4;
  return tex;
}

export const TUILES = { fougere: 0, cycas: 1, conifere: 2, ginkgo: 3, prele: 4, filament: 5, fougereMorte: 6, ecorce: 7, lycopode: 8, podocarpe: 9, osmonde: 10, ecorceMousse: 11,
  arbreConifere: 12, arbreAraucaria: 13, arbreFeuillu: 14, arbreGinkgo: 15 };   // silhouettes d'arbres entiers (vus de loin)
const COLONNES = 8, RANGEES = 2;
/** Coordonnées de texture d'une tuile de l'atlas : [u gauche, u droite, v bas, v haut]. */
export function uvTuile(tuile, marge = 0.02) {
  const col = tuile % COLONNES, rang = Math.floor(tuile / COLONNES);
  return [(col + marge) / COLONNES, (col + 1 - marge) / COLONNES, 1 - (rang + 1 - 0.012) / RANGEES, 1 - (rang + 0.012) / RANGEES];
}

/** Foliole allongée (utilisée pour les frondes). */
function foliole(g, x, y, angle, longueur, largeur, couleur) {
  g.save(); g.translate(x, y); g.rotate(angle);
  g.fillStyle = couleur;
  g.beginPath(); g.moveTo(0, 0);
  g.quadraticCurveTo(longueur * 0.45, -largeur, longueur, 0);
  g.quadraticCurveTo(longueur * 0.45, largeur, 0, 0);
  g.fill();
  g.strokeStyle = 'rgba(0,0,0,0.22)'; g.lineWidth = 0.6; g.beginPath(); g.moveTo(0, 0); g.lineTo(longueur * 0.95, 0); g.stroke();
  g.restore();
}

/** Fronde pennée (fougère ou cycadale) dessinée dans une tuile de 256 × 512. */
function dessinerFronde(g, x0, alea, opt) {
  const cx = x0 + 128;
  g.strokeStyle = opt.tige; g.lineWidth = opt.epaisseurTige; g.lineCap = 'round';
  g.beginPath(); g.moveTo(cx, 508); g.lineTo(cx, 14); g.stroke();
  const n = opt.paires;
  for (let i = 0; i < n; i++) {
    const t = i / (n - 1);                       // 0 = base, 1 = pointe
    const y = 498 - t * 480;
    const enveloppe = Math.sin(Math.PI * Math.pow(t, 0.75)) * 0.85 + 0.15 * (1 - t);
    const lon = opt.longueur * enveloppe * (0.9 + alea() * 0.2);
    for (const cote of [-1, 1]) {
      const nuance = opt.couleurs[Math.floor(alea() * opt.couleurs.length)];
      const ang = cote > 0 ? -opt.inclinaison - t * 0.35 : Math.PI + opt.inclinaison + t * 0.35;
      foliole(g, cx, y, ang + (alea() - 0.5) * 0.08, lon, opt.largeur * (0.8 + alea() * 0.4), nuance);
    }
  }
}

/** Atlas du feuillage : 2 rangées de 8 tuiles (voir TUILES). */
export function creerAtlasFeuillage() {
  const c = toile(384 * COLONNES, 768 * RANGEES);   // 384 × 768 pixels par tuile
  const g = c.getContext('2d');
  g.scale(1.5, 1.5);                                // les dessins ci-dessous restent écrits en 256 × 512
  const alea = creerAlea(4242);
  // 0 — fronde de fougère
  dessinerFronde(g, 0, alea, { tige: '#4a5a22', epaisseurTige: 5, paires: 26, longueur: 112, largeur: 9, inclinaison: 0.42,
    couleurs: ['#2f6b22', '#3c7c28', '#27591e', '#4a8a2e'] });
  // 1 — feuille de cycadale : folioles raides, étroites, vert sombre
  dessinerFronde(g, 256, alea, { tige: '#56602a', epaisseurTige: 6, paires: 34, longueur: 100, largeur: 4.5, inclinaison: 0.3,
    couleurs: ['#2c5a26', '#346630', '#27501f'] });
  // 2 — rameau de conifère : axe ligneux couvert d'écailles/aiguilles serrées
  {
    const x0 = 512, cx = x0 + 128;
    g.strokeStyle = '#4b3a25'; g.lineWidth = 7; g.beginPath(); g.moveTo(cx, 510); g.lineTo(cx, 20); g.stroke();
    for (let i = 0; i < 16; i++) {      // rameaux secondaires
      const t = i / 15, y = 495 - t * 450, lon = 105 * (1 - t * 0.55);
      for (const cote of [-1, 1]) {
        const ang = cote > 0 ? -0.55 : Math.PI + 0.55;
        const ex = cx + Math.cos(ang) * lon, ey = y + Math.sin(ang) * lon;
        g.strokeStyle = '#3d3320'; g.lineWidth = 3; g.beginPath(); g.moveTo(cx, y); g.lineTo(ex, ey); g.stroke();
        for (let k = 0; k < 16; k++) {  // aiguilles
          const s = k / 15, px = cx + (ex - cx) * s, py = y + (ey - y) * s;
          const teintes = ['#2a5a2c', '#316632', '#234d27', '#3a7238'];
          for (const sens of [-1, 1]) {
            foliole(g, px, py, ang + sens * 1.1 + (alea() - 0.5) * 0.3, 15 + alea() * 6, 3.2, teintes[Math.floor(alea() * 4)]);
          }
        }
      }
    }
  }
  // 3 — bouquet de feuilles de ginkgo (en éventail)
  {
    const x0 = 768;
    g.strokeStyle = '#5b4a30'; g.lineWidth = 5;
    g.beginPath(); g.moveTo(x0 + 128, 510); g.quadraticCurveTo(x0 + 110, 300, x0 + 135, 60); g.stroke();
    for (let i = 0; i < 46; i++) {
      const px = x0 + 28 + alea() * 200, py = 30 + alea() * 440;
      const r = 20 + alea() * 12, a0 = -Math.PI / 2 + (alea() - 0.5) * 1.6;
      const teintes = ['#7a9a32', '#88a83a', '#6b8c2c', '#97b044'];
      g.fillStyle = teintes[Math.floor(alea() * 4)];
      g.beginPath(); g.moveTo(px, py); g.arc(px, py, r, a0 - 0.8, a0 + 0.8); g.closePath(); g.fill();
      g.strokeStyle = 'rgba(60,80,20,0.5)'; g.lineWidth = 1;   // fente centrale typique du ginkgo
      g.beginPath(); g.moveTo(px + Math.cos(a0) * r * 0.55, py + Math.sin(a0) * r * 0.55);
      g.lineTo(px + Math.cos(a0) * r, py + Math.sin(a0) * r); g.stroke();
    }
  }
  // 4 — prêle : tige segmentée + verticilles de rameaux fins
  {
    const x0 = 1024;
    for (const [dx, haut] of [[70, 20], [128, 4], [190, 60]]) {
      const cx = x0 + dx;
      g.strokeStyle = '#5c8a3a'; g.lineWidth = 7; g.beginPath(); g.moveTo(cx, 510); g.lineTo(cx, haut + 10); g.stroke();
      for (let y = 490; y > haut + 20; y -= 34) {
        g.strokeStyle = '#2f3d1c'; g.lineWidth = 3; g.beginPath(); g.moveTo(cx - 4, y); g.lineTo(cx + 4, y); g.stroke();
        g.strokeStyle = '#6a9a44'; g.lineWidth = 1.6;
        const lon = 16 + (y - haut) * 0.085;
        for (let k = -4; k <= 4; k++) {
          if (k === 0) continue;
          g.beginPath(); g.moveTo(cx, y);
          g.lineTo(cx + k * lon * 0.27, y - lon * (1.0 - Math.abs(k) * 0.12)); g.stroke();
        }
      }
    }
  }
  // 5 — protofilaments (frange dorsale discrète)
  {
    const x0 = 1280;
    for (let i = 0; i < 420; i++) {
      const px = x0 + 6 + alea() * 244, hauteur = 120 + alea() * 330;
      const grad = g.createLinearGradient(0, 512, 0, 512 - hauteur);
      const clair = alea() > 0.5;
      grad.addColorStop(0, clair ? 'rgba(120,100,70,1)' : 'rgba(70,55,38,1)');
      grad.addColorStop(1, clair ? 'rgba(170,150,110,0.9)' : 'rgba(95,80,55,0.9)');
      g.strokeStyle = grad; g.lineWidth = 1.5 + alea() * 2;
      g.beginPath(); g.moveTo(px, 512);
      g.quadraticCurveTo(px + (alea() - 0.5) * 30, 512 - hauteur * 0.6, px + (alea() - 0.3) * 46, 512 - hauteur); g.stroke();
    }
  }
  // 6 — fronde morte (brune)
  dessinerFronde(g, 1536, alea, { tige: '#5a4426', epaisseurTige: 5, paires: 22, longueur: 96, largeur: 8, inclinaison: 0.55,
    couleurs: ['#6b4f2a', '#7a5a30', '#5a4224'] });
  // 7 — écorce fibreuse (opaque)
  {
    const x0 = 1792;
    g.fillStyle = '#4a3a28'; g.fillRect(x0, 0, 256, 512);
    for (let i = 0; i < 520; i++) {
      const px = x0 + alea() * 256, py = alea() * 512, lon = 20 + alea() * 70;
      const v = 40 + Math.floor(alea() * 60);
      g.strokeStyle = `rgb(${v + 30},${v + 12},${v - 8})`; g.lineWidth = 1 + alea() * 3;
      g.beginPath(); g.moveTo(px, py); g.lineTo(px + (alea() - 0.5) * 8, py + lon); g.stroke();
    }
  }
  // ----- Seconde rangée (décalée de 512 vers le bas) -----
  g.save(); g.translate(0, 512);
  // 8 — lycopodes et mousses : tapis de petites pousses dressées
  for (let i = 0; i < 150; i++) {
    const px = 14 + alea() * 228, base = 505 - alea() * 60, haut = 90 + alea() * 300;
    const teintes = ['#3d7a2c', '#4b8a34', '#2f6524', '#5c9a3a'];
    g.strokeStyle = teintes[Math.floor(alea() * 4)]; g.lineWidth = 3 + alea() * 3; g.lineCap = 'round';
    const fx = px + (alea() - 0.5) * 50;
    g.beginPath(); g.moveTo(px, base); g.quadraticCurveTo(px + (alea() - 0.5) * 20, base - haut * 0.5, fx, base - haut); g.stroke();
    for (let k = 0; k < 9; k++) {       // petites écailles le long de la pousse
      const s = k / 9, qx = px + (fx - px) * s, qy = base - haut * s;
      foliole(g, qx, qy, -0.6 - alea() * 0.5, 9, 2.2, teintes[Math.floor(alea() * 4)]);
      foliole(g, qx, qy, Math.PI + 0.6 + alea() * 0.5, 9, 2.2, teintes[Math.floor(alea() * 4)]);
    }
  }
  // 9 — rameau de podocarpe : feuilles larges, lancéolées, vert sombre brillant
  {
    const x0 = 256, cx = x0 + 128;
    g.strokeStyle = '#4a3b26'; g.lineWidth = 5; g.beginPath(); g.moveTo(cx, 510); g.quadraticCurveTo(cx - 14, 260, cx + 6, 16); g.stroke();
    for (let i = 0; i < 9; i++) {
      const t = i / 8, y = 480 - t * 440, lon = 96 * (1 - t * 0.45);
      for (const cote of [-1, 1]) {
        const ang = cote > 0 ? -0.7 + (alea() - 0.5) * 0.3 : Math.PI + 0.7 + (alea() - 0.5) * 0.3;
        const ex = cx + Math.cos(ang) * lon, ey = y + Math.sin(ang) * lon;
        g.strokeStyle = '#3f3423'; g.lineWidth = 2.5; g.beginPath(); g.moveTo(cx, y); g.lineTo(ex, ey); g.stroke();
        for (let k = 1; k <= 7; k++) {
          const s = k / 7, px = cx + (ex - cx) * s, py = y + (ey - y) * s;
          const teintes = ['#1f5a2a', '#27672f', '#1a4c24', '#2f7436'];
          for (const sens of [-1, 1]) foliole(g, px, py, ang + sens * (0.75 + alea() * 0.3), 30 + alea() * 12, 6.5, teintes[Math.floor(alea() * 4)]);
        }
      }
    }
  }
  // 10 — fronde d'osmonde : large, à folioles longues et arrondies, vert tendre
  dessinerFronde(g, 512, alea, { tige: '#5d6a2a', epaisseurTige: 6, paires: 17, longueur: 118, largeur: 15, inclinaison: 0.5,
    couleurs: ['#4f9230', '#5ea038', '#43842a', '#6aae42'] });
  // 11 — écorce couverte de mousse (opaque)
  {
    const x0 = 768;
    g.fillStyle = '#3c3324'; g.fillRect(x0, 0, 256, 512);
    for (let i = 0; i < 420; i++) {
      const px = x0 + alea() * 256, py = alea() * 512, v = 36 + Math.floor(alea() * 50);
      g.strokeStyle = `rgb(${v + 26},${v + 12},${v - 6})`; g.lineWidth = 1 + alea() * 3;
      g.beginPath(); g.moveTo(px, py); g.lineTo(px + (alea() - 0.5) * 8, py + 20 + alea() * 60); g.stroke();
    }
    for (let i = 0; i < 260; i++) {
      const teintes = ['rgba(52,96,36,0.75)', 'rgba(70,116,44,0.7)', 'rgba(40,78,30,0.8)'];
      g.fillStyle = teintes[Math.floor(alea() * 3)];
      g.beginPath(); g.ellipse(x0 + alea() * 256, alea() * 512, 6 + alea() * 16, 4 + alea() * 9, alea() * 3, 0, 6.3); g.fill();
    }
  }
  // 12 à 15 — silhouettes d'arbres entiers : de loin, un arbre est dessiné avec deux panneaux croisés
  {
    const verts = ['#1f5226', '#286030', '#1a4520', '#33703a'];
    const tronc = (x0, haut, l0) => { g.strokeStyle = '#4a3826'; g.lineCap = 'butt';
      for (let i = 0; i < 12; i++) { g.lineWidth = l0 * (1 - i / 13) + 1.5; g.beginPath(); g.moveTo(x0 + 128, 512 - i * (512 - haut) / 12); g.lineTo(x0 + 128, 512 - (i + 1) * (512 - haut) / 12 - 1); g.stroke(); } };
    // 12 — conifère conique
    tronc(1024, 14, 13);
    for (let i = 0; i < 17; i++) {
      const y = 410 - i * 23, w = 112 * (1 - i / 18.5) + 6;
      for (const cote of [-1, 1]) for (let k = 0; k < 13; k++) {
        const ang = cote > 0 ? 0.18 + alea() * 0.42 : Math.PI - 0.18 - alea() * 0.42;
        foliole(g, 1024 + 128, y + (alea() - 0.5) * 14, ang, w * (0.45 + alea() * 0.6), 7 + alea() * 4, verts[Math.floor(alea() * 4)]);
      }
    }
    // 13 — araucaria : fût nu, branches en chandelier dans la moitié haute
    tronc(1280, 22, 12);
    for (let i = 0; i < 8; i++) {
      const y = 270 - i * 30, w = 118 - i * 11;
      for (const cote of [-1, 1]) for (let k = 0; k < 3; k++) {
        const ex = 1280 + 128 + cote * w * (0.7 + alea() * 0.3), ey = y - 26 - alea() * 14;
        g.strokeStyle = verts[Math.floor(alea() * 4)]; g.lineWidth = 12 + alea() * 5; g.lineCap = 'round';
        g.beginPath(); g.moveTo(1280 + 128, y); g.quadraticCurveTo(1280 + 128 + cote * w * 0.55, y + 18, ex, ey); g.stroke();
        for (let q = 0; q < 6; q++) foliole(g, ex - cote * q * w * 0.12, ey + q * 5, -1.57 + (alea() - 0.5), 13, 4, verts[Math.floor(alea() * 4)]);
      }
    }
    // 14 et 15 — grands arbres à couronne ronde (podocarpe sombre, ginkgo vert-jaune)
    const couronneRonde = (x0, palette, nb, rayon) => {
      tronc(x0, 250, 15);
      g.strokeStyle = '#4a3826'; g.lineWidth = 6; g.lineCap = 'round';
      for (const dx of [-70, -32, 28, 68]) { g.beginPath(); g.moveTo(x0 + 128, 300); g.quadraticCurveTo(x0 + 128 + dx * 0.4, 230, x0 + 128 + dx, 150); g.stroke(); }
      for (let i = 0; i < nb; i++) {
        const a = alea() * 6.283, r = Math.sqrt(alea()), px = x0 + 128 + Math.cos(a) * r * 116, py = 172 + Math.sin(a) * r * 158;
        const clair = py < 150 ? 1 : 0;             // le haut de la couronne reçoit plus de lumière
        g.fillStyle = palette[Math.min(palette.length - 1, Math.floor(alea() * 3) + clair)];
        g.beginPath(); g.ellipse(px, py, rayon * (0.6 + alea() * 0.8), rayon * (0.4 + alea() * 0.5), alea() * 3, 0, 6.3); g.fill();
      }
    };
    couronneRonde(1536, ['#17401e', '#1f5226', '#286030', '#34743a'], 330, 15);
    couronneRonde(1792, ['#4f7a26', '#63902e', '#7aa638', '#93ba48'], 250, 12);
  }
  g.restore();
  // Ombrage peint : chaque feuillage est plus sombre vers sa base et légèrement moucheté,
  // ce qui donne du volume même sous une lumière plate.
  g.globalCompositeOperation = 'source-atop';
  for (const t of [0, 1, 2, 3, 4, 5, 6, 8, 9, 10]) {
    const tx = (t % COLONNES) * 256, ty = Math.floor(t / COLONNES) * 512;
    const grad = g.createLinearGradient(0, ty + 512, 0, ty);
    grad.addColorStop(0, 'rgba(0,10,0,0.42)'); grad.addColorStop(0.55, 'rgba(0,0,0,0)'); grad.addColorStop(1, 'rgba(255,255,160,0.10)');
    g.fillStyle = grad; g.fillRect(tx, ty, 256, 512);
    for (let i = 0; i < 260; i++) {
      g.fillStyle = alea() > 0.5 ? 'rgba(0,0,0,0.10)' : 'rgba(255,255,190,0.07)';
      g.beginPath(); g.arc(tx + alea() * 256, ty + alea() * 512, 3 + alea() * 9, 0, 6.3); g.fill();
    }
  }
  g.globalCompositeOperation = 'source-over';
  const tex = texToile(c);
  tex.anisotropy = 8;
  tex.minFilter = THREE.LinearMipmapLinearFilter;
  return tex;
}

/** Empreinte tridactyle de théropode (transparente, sombre au centre). */
export function creerTextureEmpreinte() {
  const c = toile(128, 128), g = c.getContext('2d');
  g.translate(64, 78);
  const doigt = (angle, lon, larg) => {
    g.save(); g.rotate(angle);
    const grad = g.createLinearGradient(0, 0, 0, -lon);
    grad.addColorStop(0, 'rgba(0,0,0,0.85)'); grad.addColorStop(1, 'rgba(0,0,0,0.55)');
    g.fillStyle = grad; g.beginPath();
    g.moveTo(-larg, 0); g.quadraticCurveTo(-larg * 1.1, -lon * 0.6, 0, -lon);
    g.quadraticCurveTo(larg * 1.1, -lon * 0.6, larg, 0); g.closePath(); g.fill(); g.restore();
  };
  g.filter = 'blur(2px)';
  doigt(0, 62, 11); doigt(-0.62, 50, 10); doigt(0.62, 50, 10);
  g.fillStyle = 'rgba(0,0,0,0.8)'; g.beginPath(); g.ellipse(0, 8, 17, 20, 0, 0, Math.PI * 2); g.fill();
  return texToile(c);
}

/** Disque flou pour les particules. */
export function creerTextureParticule() {
  const c = toile(64, 64), g = c.getContext('2d');
  const grad = g.createRadialGradient(32, 32, 0, 32, 32, 32);
  grad.addColorStop(0, 'rgba(255,255,255,1)'); grad.addColorStop(0.4, 'rgba(255,255,255,0.55)');
  grad.addColorStop(1, 'rgba(255,255,255,0)');
  g.fillStyle = grad; g.fillRect(0, 0, 64, 64);
  return texToile(c);
}
