# Allosaure — Jurassique supérieur

Simulation d'exploration à la troisième personne : vous incarnez un **Allosaurus**, du juvénile à l'adulte, dans un monde ouvert d'environ 4 km² il y a 150 millions d'années. Explorez, observez la faune pour remplir votre carnet scientifique, buvez, chassez, dormez, marquez votre territoire.

Tout le jeu est **procédural** : aucun fichier image, modèle 3D ou son n'est chargé. Le relief, les plantes, les dinosaures, les textures, les bruits et la musique sont calculés par le programme.

![Aperçu du jeu](docs/apercu.png)

## Jouer en ligne

👉 **https://tom-markus.github.io/Entrepreneur-tycoon/**

Le site est reconstruit automatiquement à chaque modification de la branche `main` (GitHub Actions → GitHub Pages).
Si le lien affiche une erreur 404 : dans le dépôt GitHub, ouvrez **Settings → Pages** et choisissez **Source : GitHub Actions**, puis relancez le workflow dans l'onglet **Actions**.

## Jouer en local

Il faut [Node.js](https://nodejs.org) (version 18 ou plus récente). Dans un terminal, depuis le dossier du projet :

```bash
npm install
```

```bash
npm run dev
```

Ouvrez ensuite l'adresse affichée (en général `http://localhost:5173`) dans Chrome.
Pour fabriquer la version finale (dossier `dist/`) : `npm run build`.

## Contrôles

Les touches sont repérées par leur **position** sur le clavier : ZQSD sur un clavier AZERTY belge ou français, WASD sur un QWERTY. Tout se reconfigure dans **Options → Touches**.

| Action | Clavier / souris | Manette |
|---|---|---|
| Se déplacer | Z Q S D (ou flèches) | Stick gauche |
| Regarder | Souris (cliquer dans le jeu pour la capturer) | Stick droit |
| Zoom | Molette | — |
| Courir | Maj gauche | RT / clic du stick gauche |
| Marche lente ↔ petite foulée | Tab | (inclinaison du stick) |
| Esquiver | Espace | A |
| Mordre | Clic gauche | X |
| Coup de queue | Clic droit ou F | B |
| Rugir | R | Y |
| Boire / manger (maintenir) | E | RB |
| Se reposer / dormir | X | Croix bas |
| Vision olfactive | V | LB |
| Carnet de bord | J | Croix haut |
| Mode photo | P | Croix droite |
| Marquer le territoire | T | Croix gauche |
| Établir le nid | N | — |
| Caméra cinématique | C | — |
| Pause | Échap | Start |

**Mode photo** : clic maintenu pour regarder, touches de déplacement pour voler, Espace/C pour monter/descendre, molette pour la mise au point, Entrée pour enregistrer l'image (PNG), H pour masquer le panneau.

## Comment jouer

- **Besoins** (en bas à gauche) : santé, faim, soif, énergie. La pression est faible : la faim et la soif ne tuent jamais, elles affaiblissent seulement. Si la santé tombe à zéro, vous vous réveillez au nid.
- **Boire** : allez au bord d'une eau douce (lac, rivière, marais) et maintenez E. L'eau de mer est imbuvable.
- **Manger** : chassez de petites proies (Dryosaurus, Compsognathus), pêchez d'un coup de mâchoires en eau peu profonde, ou profitez d'une carcasse (maintenez E).
- **Vision olfactive** (V) : proies en orange, prédateurs en rouge, carcasses en vert, eau douce en bleu.
- **Carnet** (J) : gardez un animal à l'écran pour débloquer sa fiche section par section ; documentez les comportements (abreuvage, nidification, chasse…). Une photo valide la fiche d'un coup.
- **Croissance** : manger et observer fait grandir votre Allosaurus (juvénile → subadulte → adulte). Les observations donnent des points de compétence (onglet « Compétences » du carnet).
- **Territoire et nid** : T pose une marque (vous récupérez votre souffle plus vite dans votre territoire), N établit le nid (point de réveil, meilleur repos).
- **Sauvegarde** : automatique toutes les minutes, 3 emplacements, stockée dans le navigateur.

## Réglages de qualité

Au premier lancement, un test de 3 secondes choisit le niveau adapté à votre appareil. Vous pouvez le changer dans **Options → Graphismes**, sans redémarrer.

| Niveau | Ce qui est activé |
|---|---|
| **Bas** | Résolution 60 %, pas d'ombres, végétation clairsemée, vue à 420 m |
| **Moyen** | Résolution 75 %, ombres à 2 cascades, halo lumineux, rayons du soleil, reliefs du sol, vue à 620 m |
| **Élevé** | Pleine résolution, anticrénelage ×4, ombres à 3 cascades, occlusion ambiante, profondeur de champ, reflets réels sur l'eau |
| **Ultra** | Comme Élevé, ombres 2048, nuages plus fins, végétation maximale, vue à 1100 m |

La **résolution dynamique** (activée par défaut) baisse légèrement la netteté quand le jeu passe sous 30 images/s. L'option « Afficher les images par seconde » montre aussi le nombre de commandes de dessin et de triangles.

## Organisation du code

Le code est en JavaScript (modules), commenté en français. Tous les réglages chiffrés sont dans **`src/config.js`**.

```
src/
  principal.js   point d'entrée : création des systèmes et boucle de jeu
  config.js      TOUS les paramètres (vitesses, masses, distances, qualité, touches…)
  noyau/         maths et bruit, entrées clavier/souris/manette, sauvegarde, qualité + benchmark
  rendu/         textures procédurales, ombres en cascade, post-traitement
  monde/         terrain, ciel, météo, eau, flore, végétation, particules, empreintes
  creatures/     espèces (données), constructeur de maillages, animation par cinématique inverse, IA, petite faune
  joueur/        Allosaurus du joueur, caméra, vision olfactive, mode photo
  science/       fiches et carnet de bord
  audio/         sons et musique synthétisés
  interface/     HUD et menus
```

Techniques utilisées : instancing et deux niveaux de détail pour la végétation, tri des plantes par cases de 64 m avec élimination hors champ, terrain découpé en morceaux chargés à la demande (4 niveaux de détail), réserves d'objets recyclés (particules, empreintes, géométries de terrain), aucune allocation dans la boucle de jeu pour les systèmes principaux, résolution dynamique.

## Ce qui a été testé

- Le jeu a été lancé et piloté automatiquement dans Chromium (Playwright) : écran-titre, nouvelle partie, déplacement, course, rugissement, morsure, esquive, vision olfactive, marquage, nid, carnet (tous les onglets), mode photo avec téléchargement du PNG, repos, caméra cinématique, pause, options, changement de qualité à chaud, sauvegarde puis « Continuer ». **Aucune erreur dans la console** aux quatre niveaux de qualité (Bas, Moyen, Élevé, Ultra).
- L'IA a tourné 7,5 minutes simulées avec événements forcés (attaques, morts, fuites, réapparitions) : aucune exception, aucune position invalide. La logique de jeu (joueur + IA + faune + carnet) coûte environ **0,25 ms par image**.
- Charge de rendu mesurée près du lac : Bas ≈ 65 commandes de dessin / 190 000 triangles ; Moyen ≈ 110 / 280 000 ; Élevé ≈ 230 / 850 000 ; Ultra ≈ 300 / 1 100 000. Ces deux derniers niveaux visent les ordinateurs dotés d'une vraie carte graphique.

## Limites connues

Ces points sont approximatifs ou incomplets ; ils sont listés ici plutôt que cachés.

- **Performances non vérifiées sur un vrai Chromebook.** Les tests ont été faits sur une machine **sans carte graphique** (rendu logiciel, 10 à 27 images/s en « Bas »), ce qui ne permet pas de conclure pour un Chromebook HP. La cible de 30 images/s en « Moyen » est donc un **objectif de conception, pas une mesure**. Si c'est trop lent : passez en « Bas » (le benchmark le fera de lui-même).
- **Style visuel** : les modèles sont procéduraux et donc stylisés (formes simples, peu de polygones). C'est cohérent et lisible, mais ce n'est pas du photoréalisme.
- **Eau** : une seule nappe au niveau 0 (la rivière n'a pas de pente). La réfraction est approchée par la transparence et la couleur selon la profondeur, sans déformation de l'image du fond. Les reflets réels n'existent qu'en Élevé/Ultra ; en dessous, l'eau reflète seulement le ciel.
- **Éclairage** : rendu PBR sans carte d'environnement (lumière du ciel + soleil) ; occlusion ambiante simple calculée à l'écran ; nuages « pseudo-volumétriques » (couches superposées), pas de vrai volume.
- **Animation** : cinématique inverse à deux os par patte. Sur les pentes fortes, un pied peut flotter ou s'enfoncer un peu ; la nage est rudimentaire.
- **Stades de croissance** : une même forme d'Allosaurus, modulée (taille, tête plus grosse, filaments et rayures chez le jeune, crêtes chez l'adulte).
- **Écosystème** : les animaux ne sont pas sauvegardés (ils reprennent leur domaine au chargement). Les collisions sont des cercles ; les animaux contournent le relief et l'eau, mais de façon simple. Le Brachiosaurus n'atteint pas réellement les branches qu'il broute.
- **Carnet** : pas de test d'occultation (un animal caché derrière un arbre mais dans le cadre compte comme observé). En mode photo, la validation porte sur les animaux à moins de 170 m du dinosaure.
- **Manette** : tout le jeu est jouable, mais les menus se pilotent à la souris ou au clavier.
- **Audio** : entièrement synthétisé, donc simple. La voix des dinosaures est une interprétation (personne ne sait à quoi elle ressemblait).
- **Exactitude scientifique** : l'écosystème est *composite*. La plupart des espèces viennent de la formation de Morrison (Amérique du Nord) ; Compsognathus et Rhamphorhynchus vivaient à la même époque mais en Europe. Les couleurs, les filaments de l'Allosaurus juvénile et du Dryosaurus, et la vie en groupe des Compsognathus sont des hypothèses, signalées comme telles dans les fiches.
- **Petits arbres renversables** : seules les cycadales et les jeunes fougères arborescentes tombent, et seulement sous un animal d'au moins 500 kg lancé à plus de 3,5 m/s.

## Licence

Code sous licence MIT (voir `LICENSE`). Sources et licences de tout ce qui est utilisé : voir `CREDITS.md`.
