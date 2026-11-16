# Crédits

## Assets

Le jeu ne contient **aucun asset externe** : ni image, ni modèle 3D, ni son, ni police téléchargée.

| Élément | Source | Licence |
|---|---|---|
| Relief, biomes, rivière, lac | Généré par le code (`src/monde/terrain.js`) | MIT (ce projet) |
| Textures de sol, de peau, d'eau, de bruit | Générées par le code (`src/rendu/textures.js`) | MIT (ce projet) |
| Feuillages, écorce, empreintes | Dessinés par le code sur un canvas (`src/rendu/textures.js`) | MIT (ce projet) |
| Plantes (géométries) | Générées par le code (`src/monde/flore.js`) | MIT (ce projet) |
| Dinosaures, ptérosaures, poissons, libellules | Générés par le code (`src/creatures/`) | MIT (ce projet) |
| Sons et musique | Synthétisés en direct avec la Web Audio API (`src/audio/audio.js`) | MIT (ce projet) |
| Polices | Polices du système (Georgia, police système sans empattement) | — |
| Icône de l'onglet | SVG écrit à la main dans `index.html` | MIT (ce projet) |

Aucun nom, dessin ou son ne provient d'un film ou d'une autre œuvre protégée.

## Bibliothèques

| Bibliothèque | Usage | Licence |
|---|---|---|
| [Three.js](https://threejs.org) 0.170 | Moteur de rendu WebGL2 | MIT |
| Three.js — module `CSM` (exemples) | Ombres en cascade | MIT |
| Three.js — `BufferGeometryUtils` (exemples) | Fusion de géométries | MIT |
| [Vite](https://vitejs.dev) 5 | Serveur de développement et construction | MIT |

## Algorithmes et références

| Élément | Référence | Statut |
|---|---|---|
| Diffusion atmosphérique (ciel) | Modèle de Preetham, Shirley et Smits (1999), d'après l'exemple « Sky » de Three.js | Code adapté sous licence MIT |
| Bruit simplex 2D | Ken Perlin ; formulation de Stefan Gustavson | Algorithme public, réécrit |
| Générateur aléatoire mulberry32 | Tommy Ettinger | Domaine public |
| Tone mapping ACES (approximation) | Krzysztof Narkowicz | Formule publique (CC0) |
| Plan de coupe oblique (reflets) | Eric Lengyel, « Oblique View Frustum Depth Projection and Clipping » | Technique publiée, réécrite |
| Bruit à gradient entrelacé (grain, tramage) | Jorge Jimenez | Formule publique |

## Données scientifiques

Les fiches du carnet résument des connaissances paléontologiques générales (dates, dimensions, découvertes majeures). Les points débattus ou hypothétiques sont signalés dans le texte des fiches. Elles ont été rédigées pour ce projet et ne reprennent le texte d'aucune source.
