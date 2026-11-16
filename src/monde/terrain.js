// Terrain procédural : relief, biomes, textures de sol et chargement par morceaux (« chunks »).
// Le relief est calculé une fois au lancement dans une grille de hauteurs (1 point / 2 m),
// puis l'affichage est découpé en morceaux de 128 m chargés selon la distance à la caméra.
import * as THREE from 'three';
import { CONFIG } from '../config.js';
import { Bruit, lissage, melanger, borner } from '../noyau/maths.js';
import { creerTexturesSol } from '../rendu/textures.js';

const M = CONFIG.monde;
const N = M.resolution;              // points par côté
const PAS = M.taille / (N - 1);      // 2 m
const DEMI = M.taille / 2;

// Identifiants des biomes
export const BIOME = { EAU: 0, PLAGE: 1, MARAIS: 2, PLAINE: 3, FORET_HUMIDE: 4, FORET_CONIFERES: 5, ROCAILLE: 6, RIVE: 7, FORET_VIERGE: 8, LANDE: 9 };
export const NOMS_BIOMES = ['Eau', 'Plage', 'Marais', 'Plaine à fougères', 'Forêt de ginkgos', 'Forêt de conifères', 'Falaises', 'Rive', 'Forêt vierge', 'Lande à cycadales'];

// Repères géographiques du monde (x vers l'est, z vers le sud)
export const LIEUX = {
  montagne: { x: 430, z: -430, rayon: 420 },
  plaine: { x: -80, z: 300, rayon: 460 },
  marais: { x: 430, z: 470, rayon: 260 },
  lac: { x: -380, z: -180, rayon: 185 },
  riviere: [[470, -500], [300, -400], [80, -330], [-200, -250], [-380, -180], [-470, 10], [-500, 230], [-600, 470], [-760, 680], [-960, 860]],
  depart: { x: -235, z: 40 },
};

/** Distance d'un point à un segment. */
function distSegment(px, pz, ax, az, bx, bz) {
  const dx = bx - ax, dz = bz - az;
  const t = borner(((px - ax) * dx + (pz - az) * dz) / (dx * dx + dz * dz), 0, 1);
  const qx = ax + dx * t - px, qz = az + dz * t - pz;
  return Math.sqrt(qx * qx + qz * qz);
}

export class Terrain {
  constructor(scene, ombres, texBruit) {
    this.scene = scene; this.ombres = ombres;
    this.hauteurs = new Float32Array(N * N);
    this.sols = new Uint8Array(N * N * 4);      // R boue, G roche, B sable, A mousse
    this.biomes = new Uint8Array(N * N);
    this.pointsEau = [];                        // berges d'eau douce où l'on peut boire
    this.bruit = new Bruit(M.graine);
    this.bruit2 = new Bruit(M.graine + 77);
    this._generer();
    this._creerTextures(texBruit);
    this._creerMateriau();
    this._preparerChunks();
    this.distanceVue = 600;
  }

  // ------------------------------------------------------------ GÉNÉRATION --
  rayonIle(x, z) {
    const a = Math.atan2(z, x);
    return 900 + 70 * this.bruit.bruit2(Math.cos(a) * 1.5 + 9, Math.sin(a) * 1.5 - 4);
  }

  distRiviere(x, z) {
    const b = this.bruit2;
    const qx = x + b.bruit2(x * 0.006, z * 0.006) * 28, qz = z + b.bruit2(x * 0.006 + 40, z * 0.006 - 17) * 28;
    const r = LIEUX.riviere;
    let d = 1e9;
    for (let i = 0; i < r.length - 1; i++) d = Math.min(d, distSegment(qx, qz, r[i][0], r[i][1], r[i + 1][0], r[i + 1][1]));
    return d;
  }

  _masques(x, z, m) {
    const b = this.bruit;
    const dM = Math.hypot(x - LIEUX.montagne.x, z - LIEUX.montagne.z);
    m.mont = 1 - lissage(120, LIEUX.montagne.rayon, dM + b.bruit2(x * 0.004, z * 0.004) * 60);
    const dP = Math.hypot(x - LIEUX.plaine.x, z - LIEUX.plaine.z);
    m.plaine = (1 - lissage(180, LIEUX.plaine.rayon, dP)) * (1 - m.mont);
    const dMa = Math.hypot(x - LIEUX.marais.x, z - LIEUX.marais.z) + b.bruit2(x * 0.007 + 3, z * 0.007) * 55;
    m.marais = 1 - lissage(LIEUX.marais.rayon * 0.55, LIEUX.marais.rayon, dMa);
    m.dLac = Math.hypot(x - LIEUX.lac.x, (z - LIEUX.lac.z) * 1.25) + b.bruit2(x * 0.008 - 8, z * 0.008 + 2) * 40;
    m.dRiv = this.distRiviere(x, z);
    const d = Math.hypot(x, z);
    m.cote = lissage(this.rayonIle(x, z) - 300, this.rayonIle(x, z) + 40, d);
  }

  _calculerHauteur(x, z, m) {
    const b = this.bruit;
    this._masques(x, z, m);
    const base = b.fbm(x * 0.0019, z * 0.0019, 5);
    let h = 15 + base * 24;
    // Montagnes en terrasses (falaises)
    if (m.mont > 0) {
      const mont = this.bruit2.crete(x * 0.0042, z * 0.0042, 4) * 105 * m.mont + m.mont * 22;
      h += mont;
      const pas = 17, p = h / pas, f = Math.floor(p);
      const terr = (f + lissage(0.3, 0.7, p - f)) * pas;
      h = melanger(h, terr, m.mont * 0.8);
    }
    // Grande plaine centrale, légèrement vallonnée
    h = melanger(h, 6.5 + base * 3.5, m.plaine * 0.86);
    // Micro-relief
    h += b.bruit2(x * 0.021, z * 0.021) * 1.1 + b.bruit2(x * 0.075, z * 0.075) * 0.22;
    // Marais : patchwork d'eau peu profonde et de boue
    if (m.marais > 0) {
      const fin = b.bruit2(x * 0.03, z * 0.03) * 0.55 + b.bruit2(x * 0.11, z * 0.11) * 0.18;
      h = melanger(h, -0.12 + fin, m.marais);
    }
    // Plaine inondable puis lit de la rivière
    const plaineInond = lissage(120, 26, m.dRiv);
    h = melanger(h, 1.1 + b.bruit2(x * 0.03 + 5, z * 0.03) * 0.5, plaineInond * 0.92);
    h = melanger(h, -2.7, lissage(13, 4.5, m.dRiv));
    // Lac
    const r = LIEUX.lac.rayon;
    h = melanger(h, Math.min(h, 1.3), lissage(r + 110, r + 15, m.dLac));
    h = melanger(h, -8, lissage(r + 10, r - 90, m.dLac));
    // Côte : l'île plonge dans la mer
    h = h * (1 - m.cote) - 17 * m.cote * m.cote;
    return h;
  }

  _generer() {
    const H = this.hauteurs, m = {};
    const cote = new Float32Array(N * N), marais = new Float32Array(N * N), plaine = new Float32Array(N * N);
    const rive = new Float32Array(N * N);
    for (let j = 0; j < N; j++) {
      const z = -DEMI + j * PAS;
      for (let i = 0; i < N; i++) {
        const x = -DEMI + i * PAS, k = j * N + i;
        H[k] = this._calculerHauteur(x, z, m);
        cote[k] = m.cote; marais[k] = m.marais; plaine[k] = m.plaine;
        rive[k] = Math.max(lissage(60, 14, m.dRiv), lissage(LIEUX.lac.rayon + 60, LIEUX.lac.rayon + 5, m.dLac));
      }
    }
    // Nature du sol et biomes
    const S = this.sols, B = this.biomes, b = this.bruit2;
    for (let j = 0; j < N; j++) {
      const z = -DEMI + j * PAS;
      for (let i = 0; i < N; i++) {
        const x = -DEMI + i * PAS, k = j * N + i, h = H[k];
        const hg = H[j * N + Math.max(0, i - 1)], hd = H[j * N + Math.min(N - 1, i + 1)];
        const hb = H[Math.max(0, j - 1) * N + i], hh = H[Math.min(N - 1, j + 1) * N + i];
        const pente = Math.hypot(hd - hg, hh - hb) / (2 * PAS);
        const n = b.fbm(x * 0.011, z * 0.011, 3);
        let roche = lissage(0.62, 1.05, pente + n * 0.12) + lissage(95, 125, h) * 0.6;
        let sable = lissage(0.25, 0.6, cote[k]) * lissage(4.5, 2.0, h) * (1 - marais[k]);
        sable = Math.max(sable, lissage(0.9, 0.2, h) * lissage(0.3, 0.9, rive[k]) * 0.35 * (n > 0 ? 1 : 0.3));
        let boue = Math.max(marais[k] * lissage(0.9, 0.2, h), lissage(1.5, 0.3, h) * rive[k]);
        if (h < 0) boue = Math.max(boue, (1 - cote[k]) * 0.8);
        roche = borner(roche, 0, 1); sable = borner(sable * (1 - roche), 0, 1);
        boue = borner(boue * (1 - roche) * (1 - sable), 0, 1);
        // Deux grandeurs décident du milieu, comme dans la nature : l'humidité et la sécheresse du sol.
        // Elles varient lentement (taches de 150 à 400 m) : on traverse donc une mosaïque de biomes.
        const hum = this.bruit.fbm(x * 0.0046 + 11, z * 0.0046 - 7, 3) * 1.25 + rive[k] * 0.55 - Math.max(0, h - 12) * 0.012;
        const sec = b.fbm(x * 0.0038 - 3, z * 0.0038 + 21, 3) * 1.25;
        let biome;
        if (h < 0) biome = marais[k] > 0.5 ? BIOME.MARAIS : BIOME.EAU;
        else if (sable > 0.45) biome = BIOME.PLAGE;
        else if (marais[k] > 0.5) biome = BIOME.MARAIS;
        else if (roche > 0.5) biome = BIOME.ROCAILLE;
        else if (rive[k] > 0.45 && h < 3.5) biome = BIOME.RIVE;
        else if (h > 38 + n * 10) biome = BIOME.FORET_CONIFERES;                 // hauteurs fraîches
        else if (hum > 0.2) biome = BIOME.FORET_VIERGE;                          // fonds humides : jungle dense
        else if (plaine[k] > 0.4 && hum < 0.02) biome = sec > 0.22 ? BIOME.LANDE : BIOME.PLAINE;
        else if (hum > -0.1) biome = BIOME.FORET_HUMIDE;
        else biome = sec > 0.18 ? BIOME.LANDE : BIOME.FORET_CONIFERES;
        B[k] = biome;
        // Tapis végétal : épais en forêt vierge, clairsemé sur la lande (sol nu, sableux)
        let humidite = borner(0.55 + n * 0.5 + rive[k] * 0.4 + marais[k] * 0.3, 0, 1);
        if (biome === BIOME.FORET_VIERGE) humidite = 1;
        else if (biome === BIOME.LANDE) { humidite *= 0.3; sable = Math.max(sable, 0.22 + n * 0.12); }
        else if (biome === BIOME.FORET_CONIFERES) humidite *= 0.75;
        const mousse = borner((1 - roche * 1.4 - sable * 1.5 - boue * 0.6) * humidite, 0, 1) * (h > 0.2 ? 1 : 0);
        S[k * 4] = boue * 255; S[k * 4 + 1] = roche * 255; S[k * 4 + 2] = sable * 255; S[k * 4 + 3] = mousse * 255;
        // Points d'eau douce (berge, pas la mer)
        if (i % 6 === 0 && j % 6 === 0 && h > -0.35 && h < 0.05 && cote[k] < 0.12 && pente < 0.3
          && (hg < -0.3 || hd < -0.3 || hb < -0.3 || hh < -0.3 || H[k + 3] < -0.4 || H[k - 3] < -0.4)) {
          this.pointsEau.push({ x, z });
        }
      }
    }
    this._cote = cote;
  }

  // ------------------------------------------------------------- REQUÊTES ---
  /** Altitude du sol en un point quelconque (interpolation bilinéaire). */
  hauteur(x, z) {
    let gx = (x + DEMI) / PAS, gz = (z + DEMI) / PAS;
    gx = gx < 0 ? 0 : gx > N - 1.001 ? N - 1.001 : gx;
    gz = gz < 0 ? 0 : gz > N - 1.001 ? N - 1.001 : gz;
    const i = gx | 0, j = gz | 0, fx = gx - i, fz = gz - j, k = j * N + i, H = this.hauteurs;
    const a = H[k], b = H[k + 1], c = H[k + N], d = H[k + N + 1];
    return a + (b - a) * fx + (c - a) * fz + (a - b - c + d) * fx * fz;
  }

  /** Normale du sol (vecteur unitaire) écrite dans `sortie`. */
  normale(x, z, sortie) {
    const e = 1.2;
    sortie.set(this.hauteur(x - e, z) - this.hauteur(x + e, z), 2 * e, this.hauteur(x, z - e) - this.hauteur(x, z + e));
    return sortie.normalize();
  }

  /** Pente locale (tangente de l'angle). */
  pente(x, z) {
    const e = 1.5;
    return Math.hypot(this.hauteur(x + e, z) - this.hauteur(x - e, z), this.hauteur(x, z + e) - this.hauteur(x, z - e)) / (2 * e);
  }

  _indice(x, z) {
    const i = borner(Math.round((x + DEMI) / PAS), 0, N - 1), j = borner(Math.round((z + DEMI) / PAS), 0, N - 1);
    return j * N + i;
  }
  biome(x, z) { return this.biomes[this._indice(x, z)]; }
  /** Part de boue / roche / sable / mousse (0..1) au point donné. */
  boue(x, z) { return this.sols[this._indice(x, z) * 4] / 255; }
  roche(x, z) { return this.sols[this._indice(x, z) * 4 + 1] / 255; }
  sable(x, z) { return this.sols[this._indice(x, z) * 4 + 2] / 255; }
  /** Vrai si l'eau à cet endroit est salée (mer). */
  eauSalee(x, z) { return this._cote[this._indice(x, z)] > 0.12; }
  /** Vrai si un animal terrestre peut se tenir ici. */
  praticable(x, z, profondeurMax = 0.25) {
    return this.hauteur(x, z) > -profondeurMax && this.pente(x, z) < M.penteMax * 0.8 && Math.abs(x) < DEMI - 30 && Math.abs(z) < DEMI - 30;
  }
  /** Point d'eau douce le plus proche (ou null). */
  eauLaPlusProche(x, z) {
    let meilleur = null, dMin = 1e12;
    for (const p of this.pointsEau) {
      const d = (p.x - x) * (p.x - x) + (p.z - z) * (p.z - z);
      if (d < dMin) { dMin = d; meilleur = p; }
    }
    return meilleur;
  }

  // ------------------------------------------------------------- TEXTURES ---
  _creerTextures(texBruit) {
    const sol = creerTexturesSol();
    this.texSol = new THREE.DataTexture(this.sols, N, N, THREE.RGBAFormat, THREE.UnsignedByteType);
    this.texSol.magFilter = this.texSol.minFilter = THREE.LinearFilter;
    this.texSol.needsUpdate = true;
    // Hauteurs en demi-flottants : utilisées par le shader de l'eau (profondeur, écume)
    const demi = new Uint16Array(N * N);
    for (let i = 0; i < N * N; i++) demi[i] = THREE.DataUtils.toHalfFloat(borner(this.hauteurs[i], -60, 300));
    this.texHauteurs = new THREE.DataTexture(demi, N, N, THREE.RedFormat, THREE.HalfFloatType);
    this.texHauteurs.magFilter = this.texHauteurs.minFilter = THREE.LinearFilter;
    this.texHauteurs.needsUpdate = true;
    // Conversion position monde → coordonnées de texture
    this.echelleUV = 1 / (PAS * N);
    this.decalageUV = (DEMI / PAS + 0.5) / N;
    this.uniformes = {
      uSplat: { value: this.texSol }, uAlbedos: { value: sol.albedos }, uNormales: { value: sol.normales },
      uBruit: { value: texBruit }, uPluie: { value: 0 }, uTemps: { value: 0 }, uJour: { value: 1 },
      uEchSplat: { value: this.echelleUV }, uDecSplat: { value: this.decalageUV },
    };
  }

  _creerMateriau() {
    const mat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.9, metalness: 0 });
    mat.defines = { NORMALES_SOL: 1, CAUSTIQUES: 1 };
    mat.userData.cle = 'terrain_11';
    mat.userData.surCompilation = (shader) => {
      Object.assign(shader.uniforms, this.uniformes);
      shader.vertexShader = shader.vertexShader
        .replace('#include <common>', '#include <common>\nvarying vec3 vPosMonde;\nvarying vec3 vNormMonde;')
        .replace('#include <begin_vertex>', '#include <begin_vertex>\nvPosMonde = (modelMatrix * vec4(transformed, 1.0)).xyz;\nvNormMonde = normal;');
      shader.fragmentShader = shader.fragmentShader
        .replace('#include <common>', `#include <common>
          precision highp sampler2DArray;
          varying vec3 vPosMonde; varying vec3 vNormMonde;
          uniform sampler2D uSplat; uniform sampler2D uBruit;
          uniform sampler2DArray uAlbedos; uniform sampler2DArray uNormales;
          uniform float uPluie, uTemps, uJour, uEchSplat, uDecSplat;`)
        .replace('#include <map_fragment>', `
          vec4 sp = texture2D(uSplat, vPosMonde.xz * uEchSplat + uDecSplat);
          float wB = sp.r, wR = sp.g, wS = sp.b, wT = max(0.0, 1.0 - sp.r - sp.g - sp.b);
          vec2 uvD = vPosMonde.xz * 0.21;
          vec2 uvR = (vPosMonde.xz + vPosMonde.y * vec2(0.45, 0.6)) * 0.09;
          vec4 aT = texture(uAlbedos, vec3(uvD, 0.0));
          vec4 aB = texture(uAlbedos, vec3(uvD * 0.6, 1.0));
          vec4 aR = texture(uAlbedos, vec3(uvR, 2.0));
          vec4 aS = texture(uAlbedos, vec3(uvD * 0.8, 3.0));
          float macro = texture2D(uBruit, vPosMonde.xz * 0.0031).r;
          float macro2 = texture2D(uBruit, vPosMonde.xz * 0.023).g;
          // Tapis de mousses et de petites fougères : le sol du Jurassique n'a pas d'herbe
          vec3 mousse = mix(vec3(0.022, 0.07, 0.014), vec3(0.06, 0.125, 0.022), macro2);
          float fin = texture2D(uBruit, vPosMonde.xz * 0.37).b;
          aT.rgb = mix(aT.rgb, mousse * (0.25 + aT.g * 9.0) * (0.55 + fin * 0.9), sp.a * 0.88);
          vec4 alb = aT * wT + aB * wB + aR * wR + aS * wS;
          alb.rgb *= 0.72 + 0.56 * macro;
          // grain très fin, visible seulement de près : évite l'aspect flou sous les pattes
          float grainFin = texture2D(uBruit, vPosMonde.xz * 1.9).b * 0.6 + texture2D(uBruit, vPosMonde.xz * 5.3).a * 0.4;
          alb.rgb *= 0.7 + 0.6 * grainFin;
          float humide = (1.0 - smoothstep(-0.1, 0.9, vPosMonde.y)) * (1.0 - wS * 0.6);
          humide = max(humide, uPluie * 0.65);
          alb.rgb *= mix(1.0, 0.58, humide);
          float rugositeSol = mix(alb.a, 0.16, humide * 0.85);
          #ifdef CAUSTIQUES
          if (vPosMonde.y < 0.0) {
            float c1 = texture2D(uBruit, vPosMonde.xz * 0.11 + uTemps * 0.031).g;
            float c2 = texture2D(uBruit, vPosMonde.xz * 0.13 - uTemps * 0.027 + 0.5).g;
            float ca = pow(clamp(1.0 - abs(c1 - c2) * 5.0, 0.0, 1.0), 4.0);
            alb.rgb *= 1.0 + ca * 1.6 * exp(vPosMonde.y * 0.45) * uJour;
          }
          #endif
          diffuseColor.rgb = alb.rgb;`)
        .replace('#include <roughnessmap_fragment>', 'float roughnessFactor = rugositeSol;')
        .replace('#include <normal_fragment_maps>', `#include <normal_fragment_maps>
          #ifdef NORMALES_SOL
          {
            vec2 nd = (texture(uNormales, vec3(uvD, 0.0)).xy * wT + texture(uNormales, vec3(uvD * 0.6, 1.0)).xy * wB
                     + texture(uNormales, vec3(uvR, 2.0)).xy * wR + texture(uNormales, vec3(uvD * 0.8, 3.0)).xy * wS) * 2.0 - 1.0;
            vec3 nM = normalize(normalize(vNormMonde) + vec3(nd.x, 0.0, nd.y) * 1.25);
            normal = normalize((viewMatrix * vec4(nM, 0.0)).xyz);
          }
          #endif`);
    };
    this.materiau = this.ombres.enregistrer(mat);
  }

  reglerQualite(q) {
    this.distanceVue = q.distanceVue;
    const d = {};
    if (q.normalesTerrain) d.NORMALES_SOL = 1;
    if (q.caustiques) d.CAUSTIQUES = 1;
    this.materiau.defines = d;
    this.materiau.userData.cle = 'terrain_' + (q.normalesTerrain ? 1 : 0) + (q.caustiques ? 1 : 0);
  }

  // --------------------------------------------------------------- CHUNKS ---
  _preparerChunks() {
    const C = M.tailleChunk, nb = M.taille / C;
    this.nbChunks = nb;
    this.chunks = [];
    for (let cz = 0; cz < nb; cz++) for (let cx = 0; cx < nb; cx++) {
      this.chunks.push({ cx, cz, x: -DEMI + (cx + 0.5) * C, z: -DEMI + (cz + 0.5) * C, lod: -1, maille: null });
    }
    this.reserve = [[], [], [], []];   // géométries libres, par niveau de détail (recyclage)
    this.index = [null, null, null, null];
    this.fileConstruction = [];
  }

  _indexPour(lod) {
    if (this.index[lod]) return this.index[lod];
    const n = (M.tailleChunk / PAS) >> lod, l = n + 1, idx = [];
    for (let j = 0; j < n; j++) for (let i = 0; i < n; i++) {
      const a = j * l + i, b = a + 1, c = a + l, d = c + 1;
      idx.push(a, c, b, b, c, d);
    }
    // Jupes : une bande verticale sous chaque bord, pour masquer les raccords entre niveaux de détail
    const base = l * l;
    const bord = (k, cote) => cote === 0 ? k : cote === 1 ? n * l + k : cote === 2 ? k * l : k * l + n;
    for (let cote = 0; cote < 4; cote++) for (let k = 0; k < n; k++) {
      const a = bord(k, cote), b = bord(k + 1, cote), c = base + cote * l + k, d = c + 1;
      idx.push(a, b, c, b, d, c, a, c, b, b, c, d);   // deux faces : visible des deux côtés
    }
    return (this.index[lod] = new THREE.BufferAttribute(new Uint32Array(idx), 1));
  }

  _construire(chunk, lod) {
    const pasGrille = 1 << lod, n = (M.tailleChunk / PAS) >> lod, l = n + 1;
    let geo = this.reserve[lod].pop();
    if (!geo) {
      geo = new THREE.BufferGeometry();
      const nbSommets = l * l + 4 * l;
      geo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(nbSommets * 3), 3));
      geo.setAttribute('normal', new THREE.BufferAttribute(new Float32Array(nbSommets * 3), 3));
      geo.setIndex(this._indexPour(lod));
      geo.boundingSphere = new THREE.Sphere();
    }
    const P = geo.attributes.position.array, Nn = geo.attributes.normal.array, H = this.hauteurs;
    const i0 = chunk.cx * (M.tailleChunk / PAS), j0 = chunk.cz * (M.tailleChunk / PAS);
    let hMin = 1e9, hMax = -1e9, v = 0;
    for (let j = 0; j <= n; j++) for (let i = 0; i <= n; i++) {
      const gi = i0 + i * pasGrille, gj = j0 + j * pasGrille, k = gj * N + gi, h = H[k];
      P[v] = -DEMI + gi * PAS; P[v + 1] = h; P[v + 2] = -DEMI + gj * PAS;
      const hg = H[gj * N + Math.max(0, gi - 1)], hd = H[gj * N + Math.min(N - 1, gi + 1)];
      const hb = H[Math.max(0, gj - 1) * N + gi], hh = H[Math.min(N - 1, gj + 1) * N + gi];
      const nx = hg - hd, ny = 2 * PAS, nz = hb - hh, inv = 1 / Math.sqrt(nx * nx + ny * ny + nz * nz);
      Nn[v] = nx * inv; Nn[v + 1] = ny * inv; Nn[v + 2] = nz * inv;
      if (h < hMin) hMin = h; if (h > hMax) hMax = h;
      v += 3;
    }
    const chute = 2 + pasGrille * 2.5;
    for (let cote = 0; cote < 4; cote++) for (let k = 0; k <= n; k++) {
      const src = (cote === 0 ? k : cote === 1 ? n * l + k : cote === 2 ? k * l : k * l + n) * 3;
      P[v] = P[src]; P[v + 1] = P[src + 1] - chute; P[v + 2] = P[src + 2];
      Nn[v] = Nn[src]; Nn[v + 1] = Nn[src + 1]; Nn[v + 2] = Nn[src + 2];
      v += 3;
    }
    geo.attributes.position.needsUpdate = true; geo.attributes.normal.needsUpdate = true;
    geo.boundingSphere.center.set(chunk.x, (hMin + hMax) / 2, chunk.z);
    geo.boundingSphere.radius = Math.hypot(M.tailleChunk * 0.71, (hMax - hMin) / 2 + chute);
    if (!chunk.maille) {
      chunk.maille = new THREE.Mesh(geo, this.materiau);
      chunk.maille.receiveShadow = true;
      chunk.maille.matrixAutoUpdate = false;
      this.scene.add(chunk.maille);
    } else {
      this.reserve[chunk.lod].push(chunk.maille.geometry);
      chunk.maille.geometry = geo;
    }
    chunk.maille.visible = true;
    chunk.lod = lod;
  }

  /** Charge / décharge / change le détail des morceaux selon la position de la caméra. */
  mettreAJour(cam, temps) {
    this.uniformes.uTemps.value = temps;
    let budget = 2;   // au plus 2 constructions par image, pour éviter les à-coups
    for (const c of this.chunks) {
      const d = Math.hypot(c.x - cam.x, c.z - cam.z);
      let lod = d < 230 ? 0 : d < 470 ? 1 : d < 820 ? 2 : 3;
      if (d > this.distanceVue + 140) lod = -1;
      if (lod === c.lod) continue;
      if (lod === -1) {
        if (c.maille) { c.maille.visible = false; }
        c.lodCache = c.lod; c.lod = -1; continue;
      }
      if (c.maille && c.lod === -1 && c.lodCache === lod) { c.maille.visible = true; c.lod = lod; continue; }
      if (budget <= 0) continue;
      if (c.lod === -1 && c.maille) c.lod = c.lodCache;
      this._construire(c, lod); budget--;
    }
  }

  /** Construit immédiatement tous les morceaux visibles (au chargement). */
  toutCharger(cam) { for (let i = 0; i < 140; i++) this.mettreAJour(cam, 0); }
}
