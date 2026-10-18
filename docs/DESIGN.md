# Entrepreneur Tycoon (Belgique) — Document de conception

> Version 1.0 — ce document décrit **ce qui est construit** et **pourquoi**. Les
> chiffres d'équilibrage exacts vivent dans `src/data/` ; ce document donne les
> formules et l'ordre de grandeur. Les résultats d'équilibrage sont dans
> `docs/BALANCE.md`, l'architecture V2 dans `docs/V2.md`.

---

## 1. Vision

Un jeu de gestion en temps réel (avec pause) où l'on crée une petite entreprise
belge, on la fait grandir, on survit aux échéances fiscales, puis on transforme
les bénéfices en **revenus passifs** jusqu'à la « liberté financière ».

Trois piliers :

1. **Comprendre** — chaque chiffre a un « pourquoi ? ». Le joueur voit les
   facteurs qui expliquent ses ventes, ses impôts, ses marges.
2. **Tension de trésorerie réaliste** — la TVA du trimestre, la régularisation
   des cotisations sociales et l'impôt annuel arrivent *après* que l'argent a
   été encaissé. Le classique « j'étais rentable mais j'ai fait faillite » doit
   pouvoir arriver, et être expliqué.
3. **Cinq métiers vraiment différents** — l'agence web vend des heures, la
   friterie gère du périssable, l'e-commerce achète du trafic, l'artisan
   planifie des chantiers, le centre scolaire vit au rythme des examens.

---

## 2. Architecture

```
index.html              point d'entrée (charge src/main.js, ou le bundle en file://)
styles/main.css         style pixel art
src/
  main.js               démarrage de l'interface
  engine/               LOGIQUE PURE — aucun DOM, aucun Date.now, aucun localStorage
  data/                 configuration : secteurs, fiscalité, événements, équilibrage
  storage/              SaveAdapter + LocalStorageAdapter (+ MemoryAdapter pour tests)
  ui/                   rendu DOM + canvas, lit l'état et envoie des actions
dist/tycoon.bundle.js   bundle « classique » pour l'ouverture en file:// (généré)
tests/                  node --test
tools/                  simulate.js (bots), bundle.js
docs/
```

### 2.1 Règles de dépendance (strictes)

| Couche    | Peut importer            | Ne peut PAS                                   |
|-----------|--------------------------|-----------------------------------------------|
| `data`    | rien (ou `data`)         | engine, ui, storage                           |
| `engine`  | `data`, `engine`         | DOM, `window`, `Date`, `Math.random`, storage |
| `storage` | `engine/migrations.js`   | ui, DOM (sauf l'adaptateur localStorage)      |
| `ui`      | tout                     | modifier l'état autrement que par `dispatch`  |

Un test (`tests/architecture.test.js`) vérifie automatiquement ces règles en
lisant les fichiers sources (pas de `document`, `window`, `Math.random`,
`Date.now`, `localStorage` dans `src/engine` et `src/data`).

### 2.2 Le moteur

API publique (`src/engine/index.js`) :

- `newGame(options) → state` — crée un état complet et sérialisable.
- `tick(state, dtDays, rng) → state` — avance le temps. `dtDays` est une durée
  en **jours de jeu** (fraction possible). Le moteur accumule les fractions et
  simule **jour par jour** : le résultat ne dépend donc pas de la façon dont le
  temps est découpé (60 petits ticks = 1 gros tick). Le `rng` est un générateur
  à graine (`createRng(seed)`), dont l'état est réécrit dans `state.rngState`
  après chaque tick : sauvegarder puis recharger donne exactement la même suite.
- `advance(state, dtDays)` — raccourci qui crée le rng depuis `state.rngState`.
- `applyAction(state, action) → {ok, message}` — toute décision du joueur
  passe par une action sérialisable (`{type: 'setPrice', value: 6500}`).
  Chaque action réussie est enregistrée dans `state.actionLog` avec le jour
  courant : c'est ce qui permettra en V2 de **rejouer** une partie côté serveur.
- `computeScore(state)` — pure, documentée (§ 12).
- Sélecteurs (`selectors.js`) : valeurs dérivées pour l'interface (patrimoine
  net, revenu passif, impôt estimé…).

Le moteur **mute** l'état qu'on lui passe (pour la performance : une simulation
de 20 ans = 7 200 jours). Il ne contient aucune référence circulaire, aucune
fonction, aucune `Date` : `JSON.stringify(state)` est toujours valide.

Déterminisme : même seed + mêmes actions aux mêmes jours ⇒ même partie.
Testé dans `tests/determinism.test.js`.

### 2.3 Le temps

- Calendrier simplifié : **12 mois de 30 jours** (année de 360 jours). Début le
  1er janvier 2026. Les jours de la semaine tournent normalement (le jour 0 est
  un jeudi, comme le 1/1/2026).
- Vitesses : pause, ×1, ×2, ×4. **1 mois ≈ 60 s à ×1** (`config.secondsPerMonth`).
- L'interface tourne à ~30 images/s ; le temps réel écoulé est converti en jours
  de jeu. Si l'onglet passe en arrière-plan, le delta est plafonné (pas de
  « rattrapage » de 3 mois d'un coup) et le jeu se met en pause automatiquement.

### 2.4 L'argent

Tous les montants sont des **centimes entiers** (`Number` entiers, sûrs jusqu'à
9·10¹³ €). Les multiplications passent par `money.mul(c, f)` qui arrondit
(`Math.round`). Aucun flottant n'est stocké comme montant. Affichage :
`Intl.NumberFormat('fr-BE')` → `12 345,67 €`.

### 2.5 Pourquoi un bundle pour file:// ?

Les navigateurs (Chrome en particulier) **refusent de charger des modules ES
depuis `file://`** (politique CORS). Pour respecter à la fois « modules ES »,
« aucune étape de build » et « fonctionne en ouvrant index.html » :

- en `http(s)://` (GitHub Pages, serveur local), `index.html` charge
  directement `src/main.js` en module ES ;
- en `file://`, il charge `dist/tycoon.bundle.js`, un fichier classique produit
  par `node tools/bundle.js` (un petit script maison sans dépendance) et
  **versionné dans le dépôt**. Un test échoue si le bundle n'est pas à jour, et
  le workflow GitHub Pages le régénère. Le joueur n'a jamais rien à installer.

---

## 3. État du jeu (résumé)

```
state = {
  meta: { saveVersion, gameId, seed, createdAt, sector, legal, difficulty, companyName, founderName },
  time: { day, frac, speedHint },
  rngState,
  cash,                     // compte professionnel (centimes)
  personal: { cash, livingCost, ... },
  company: { reputation, satisfaction, quality, price, marketing, ... },
  sector: { ...état propre au secteur },
  staff: { employees[], candidates[], founderActive },
  finance: { ledger mensuel, history[], dailyCash[], vat{}, ... },
  tax: { schedule[] (échéances), yearAcc{}, social{}, ... },
  loans[], overdraft{},
  competitors[],
  events: { cooldowns{}, pending[], scheduled[], log[] },
  upgrades: { owned[] },
  investments: { savings, etf, stocks, realEstate[] },
  modifiers[],              // effets temporaires (demande ×0,8 pendant 30 j…)
  stats: { compteurs pour les succès et le post-mortem },
  achievements: { unlocked{} },
  status: 'playing' | 'won' | 'sandbox' | 'bankrupt',
  actionLog[],
}
```

---

## 4. Modèle économique commun

### 4.1 Attractivité et part de marché

Chaque acteur (joueur ou concurrent) a une **attractivité** :

```
A = facteurPrix × facteurQualité × facteurRéputation × facteurMarketing × facteurEmplacement
facteurPrix       = (prixRéférence / prix) ^ élasticité          (élasticité 1,2 à 2,2 selon le secteur)
facteurQualité    = qualité ^ 0,8                                 (qualité 1 = moyenne du marché)
facteurRéputation = 0,5 + réputation / 100                        (réputation 0–100 → 0,5 à 1,5)
facteurMarketing  = 1 + 0,35 × ln(1 + budgetMensuel / budgetRéf)  (rendements décroissants)
```

Part du joueur = `A_joueur / (A_joueur + Σ A_concurrents + A_horsMarché)`.
`A_horsMarché` représente les clients qui renoncent (ou vont ailleurs) : si
tout le monde est cher, la demande totale baisse.

Demande servie = `tailleMarché × saisonnalité × conjoncture × modificateurs × part`,
plafonnée par la **capacité**. La demande perdue faute de capacité fait baisser
la satisfaction (« files d'attente », « délais »).

### 4.2 Panneau « pourquoi ? »

Chaque jour le secteur remplit `state.company.why` : la liste des facteurs
(nom, valeur, effet en %) qui expliquent la demande, plus les goulets
d'étranglement (capacité, stock, trésorerie). L'interface affiche ces facteurs
avec une explication en une phrase.

### 4.3 Réputation et satisfaction

- **Satisfaction** (0–100) : moyenne mobile de la qualité perçue par rapport au
  prix payé, des délais et des files.
- **Réputation** (0–100) : converge lentement vers la satisfaction
  (`rep += (sat − rep) × 0,01 par jour`) + chocs d'événements. Une réputation se
  construit en mois et se perd en jours (avis viral).

### 4.4 Conjoncture

Indice `economy` (≈ 0,8 à 1,15) en marche aléatoire lente qui revient vers 1,
déformé par les événements « crise » et « reprise ».

### 4.5 Météo

Chaque jour : soleil / nuageux / pluie / froid / canicule, tiré selon la
saison. Utilisée par la friterie (terrasse, envies), l'artisan (pannes de
chauffage en cas de froid) et un peu l'e-commerce.

---

## 5. Les cinq secteurs

Chaque secteur est un module `src/engine/sectors/<id>.js` avec la même
interface (`init`, `daily`, `monthly`, `actions`, `capacity`, `describe`) et un
fichier de données `src/data/sectors/<id>.js` (paramètres, améliorations,
rôles d'employés, sprites de scène).

### 5.1 Agence web / freelance digital — *vendre des heures*

- **Demandes de projets** (leads) : Poisson par jour ouvré, λ = marché × part.
  Types : site vitrine, e-shop, application web, refonte, audit SEO, identité
  visuelle. Chaque lead a des heures estimées, un budget horaire maximum du
  client, un délai.
- Le joueur fixe son **taux horaire** ; un lead est « gagnable » si le taux est
  sous le budget du client (probabilité continue). Politique d'acceptation :
  manuelle, « si capacité », « tout accepter ».
- **Capacité** = heures facturables par jour ouvré (fondateur 6 h + employés
  selon compétence). Les heures sont réparties sur les projets en cours (FIFO).
  Dépassement d'heures aléatoire (réduit par le chef de projet et les process).
- **Facturation à la livraison**, paiement à 30 jours, risque d'impayé (réduit
  par l'amélioration « Acompte de 30 % »).
- **Portfolio** : chaque projet livré de bonne qualité augmente la réputation.
- **Récurrent** : contrats de maintenance mensuels (amélioration), puis
  **SaaS** (gros projet interne de 600 h) avec abonnés, churn et coûts serveur.
  C'est la voie naturelle vers une entreprise qui tourne sans le fondateur.
- TVA 21 %.

### 5.2 Restaurant / friterie — *gérer du périssable*

- **Clients/jour** = marché du quartier × jour de semaine (vendredi/samedi
  forts, lundi faible) × météo × saison × part de marché.
- **Stock périssable** en lots datés (frites, viandes, sauces = « portions ») :
  durée de vie 4 jours. Commande automatique paramétrable (jours de stock
  visés) ; livraison le lendemain. Rupture = clients perdus ; surplus = gaspillage.
- **Qualité des ingrédients** (3 niveaux) : coût par portion vs qualité.
- **Capacité** = places assises × rotations + comptoir à emporter, limitée par le
  personnel en service (fondateur + employés). File d'attente → clients perdus.
- **Hygiène** (0–100) : baisse avec le volume, remonte avec le budget nettoyage
  et les améliorations. Contrôles **AFSCA** (amende, fermeture temporaire).
- **Emplacement** : rue secondaire → place animée → 2e établissement.
- TVA : nourriture 12 %, boissons 21 % (répartition paramétrable, simplifié).

### 5.3 E-commerce — *acheter du trafic*

- **Catalogue** de produits (coût d'achat, prix de référence, poids de demande,
  taux de retour). On en liste 2 au départ, plus avec les améliorations.
- **Trafic** = organique (réputation, SEO) + payant (`budgetPub / CPC`). Le CPC
  monte en novembre-décembre et avec le marketing des concurrents.
- **Conversion** = taux de base × facteur prix × qualité du site × réputation.
- **Stock** acheté à l'avance (paiement immédiat, livraison en 10 jours),
  réapprovisionnement automatique par point de commande. Rupture = ventes
  perdues. Coût de stockage mensuel.
- **Logistique** par commande, frais de paiement, **retours** (remboursement,
  70 % du produit revendable).
- Pics : Black Friday (fin novembre ×2,5), décembre, soldes de janvier.
- Indicateurs : CAC (coût d'acquisition client), panier moyen, taux de conversion.
- TVA 21 %.

### 5.4 Artisanat (plombier-chauffagiste ou électricien) — *planifier des chantiers*

- **Demandes de devis** : leads selon bouche-à-oreille, marketing, saison
  (pannes de chauffage en hiver pour le plombier).
- Le joueur fixe son **taux horaire** et sa **marge sur matériel** ; probabilité
  d'acceptation du devis selon prix vs marché et réputation.
- **Planning** : chaque ouvrier (fondateur inclus) traite un chantier à la fois ;
  durée selon la compétence. Il faut une **camionnette** par équipe, sinon la
  productivité chute.
- Coûts : matériel acheté au démarrage du chantier, déplacements par jour de
  chantier, usure/panne d'outillage.
- Paiement à la fin du chantier à 30 jours, litiges possibles (malfaçon).
- **Recommandations** : chaque chantier réussi alimente un stock de
  bouche-à-oreille qui génère des leads futurs.
- TVA : 6 % (rénovation de logement de plus de 10 ans pour un particulier) ou
  21 % (neuf, professionnels), selon le type de chantier.

### 5.5 Centre de soutien scolaire / formation — *le rythme scolaire*

- **Élèves** inscrits par abonnement mensuel. Inscriptions fortes à la rentrée
  (fin août/septembre en Fédération Wallonie-Bruxelles), avant les examens
  (novembre-décembre, mai-juin), creux en juillet-août.
- **Capacité** = min(enseignants × élèves par enseignant, places des locaux).
  Le fondateur enseigne.
- **Sessions d'examens** (fin janvier, fin juin) : taux de réussite = f(compétence
  des enseignants, taille des groupes, méthode). La **réputation dépend des
  résultats** : grosse hausse ou baisse après chaque session.
- Désinscriptions : churn mensuel + départ massif en fin d'année scolaire.
- **Stages** pendant les congés (amélioration) pour lisser les revenus d'été.
- Enseignants : étudiants-jobistes (bon marché, moins bons) ou enseignants
  diplômés (chers, meilleurs résultats).
- TVA : 21 % (simplifié — certaines formations peuvent être exemptées
  (art. 44 Code TVA), voir `fiscalite.js`).

---

## 6. Fiscalité belge (simplifiée)

Tous les taux sont dans `src/data/fiscalite.js`, avec source, année de
référence et mention « à vérifier ». Ce qui est modélisé :

| Mécanisme | Modèle | Moment |
|---|---|---|
| TVA | collectée sur les ventes, déductible sur les achats, déclaration **trimestrielle** ; solde payé (ou remboursé) le 20 du mois suivant le trimestre | trimestriel |
| Franchise TVA | option si CA < 25 000 €/an : pas de TVA facturée ni déductible ; sortie automatique au-delà | — |
| Cotisations sociales indépendant | 20,5 % jusqu'à 75 024,54 €, 14,16 % jusqu'à 110 562,42 €, minimum ≈ 890 €/trim. ; **provisoires** puis **régularisées** l'année suivante | trimestriel + régul. |
| IPP | barème progressif 25/40/45/50 %, quotité exemptée, additionnels communaux ≈ 7 % | annuel, payé en juin N+1 |
| ISOC (SRL) | 25 % ; 20 % sur les premiers 100 000 € si rémunération du dirigeant ≥ seuil | annuel, payé en juin N+1 |
| Rémunération du dirigeant (SRL) | coût déductible pour la société, IPP + cotisations pour le dirigeant, précompte professionnel retenu chaque mois | mensuel |
| Dividendes (SRL) | précompte mobilier 30 % (VVPR-bis 15 % à partir du 3e exercice) | à la décision |
| Coût employeur | brut × (1 + 25 % ONSS + 10 % autres charges approx.), réduction premier engagement | mensuel |
| Placements | TOB, précompte mobilier, exonérations, taxe plus-values 10 % (2026), taxe comptes-titres | à l'opération / annuel |

**Indépendant (personne physique)** : le bénéfice de l'activité est imposé à
l'IPP ; les cotisations sociales sont déductibles ; responsabilité **illimitée**
(le compte personnel renfloue automatiquement le compte pro en cas de trou, et
en cas de faillite le patrimoine personnel est saisi) ; coûts de démarrage et
de comptable faibles ; crédibilité moindre (taux de crédit +0,5 pt, pas
d'investisseurs).

**SRL** : la société paie l'ISOC ; le dirigeant se verse une rémunération
(réglable) et des dividendes ; responsabilité limitée (patrimoine personnel
protégé) ; frais de notaire et de comptable plus élevés ; crédibilité
supérieure (clients B2B, banques, investisseurs possibles).

**Amortissements** : les améliorations (matériel, locaux…) ne sont pas
déductibles en une fois : elles sont amorties linéairement sur 3 ans (simplifié).

**Ce qui n'est PAS modélisé** (signalé dans le jeu, encart « simplifié ») :
versements anticipés et majoration, frais professionnels forfaitaires de
l'indépendant, réserve de liquidation, cotisation distincte de 5 %, régimes
régionaux détaillés, avantages de toute nature, précompte professionnel exact
(on retient une estimation mensuelle régularisée en fin d'année), délais réels
d'enrôlement (on fixe l'échéance de l'impôt annuel au 30 juin N+1).

---

## 7. Employés

- Vivier de **candidats** renouvelé chaque mois (bouton « publier une offre »
  payant pour en avoir plus vite). Profil : prénom, rôle, compétence (1–100),
  salaire brut demandé, **caractère** (Fiable, Rapide, Perfectionniste, Râleur,
  Ambitieux, Loyal, Créatif, Distrait) qui modifie productivité, motivation ou
  qualité.
- **Coût employeur** mensuel = brut × facteur (cotisations patronales ≈ 25 % +
  autres charges ≈ 10 %, *approximation*). Le brut ne peut pas être sous le
  revenu minimum (RMMMG 2026).
- **Motivation** (0–100) : converge vers une cible qui dépend du salaire par
  rapport au marché, de la charge de travail, des primes, du caractère, des
  événements. Sous 25 : risque de démission quotidien.
- **Formation** : coût + quelques jours d'absence → +compétence.
- **Licenciement** : indemnité de préavis selon l'ancienneté (barème « statut
  unique », simplifié) + choc de motivation sur l'équipe.
- **Gérant** : rôle commun à tous les secteurs. Avec un gérant compétent, le
  fondateur peut **se retirer de l'opérationnel** : sa capacité de travail
  disparaît, mais le bénéfice de l'entreprise devient un revenu passif.

---

## 8. Financement

- **Prêt bancaire** : montant, durée (12–84 mois), taux = taux de base +
  prime de risque (réputation, ancienneté, endettement, statut). Mensualités
  constantes (annuités). Plafond selon le CA et le bénéfice. Refus possible.
- **Découvert** : limite selon le CA, intérêts journaliers sur le solde négatif.
- **Apport personnel** : virement du compte personnel vers le compte pro.
- **Investisseurs** (SRL uniquement) : un business angel propose X € contre Y %
  des parts ; il touche ensuite Y % des dividendes et du revenu passif
  d'entreprise, et réclame de la croissance.

### Faillite

Si la trésorerie pro passe sous la limite du découvert, l'entreprise est **en
défaut** : un compteur démarre. Au-delà du délai de grâce (selon la difficulté,
20 à 75 jours) sans revenir dans le vert → **faillite**. Pendant le défaut, les
salaires sont payés en retard (motivation en chute) et la réputation baisse.

---

## 9. Concurrents

2 à 4 concurrents IA par partie, tirés parmi des **stratégies** :

| Stratégie | Comportement |
|---|---|
| Bas prix | prix 15–25 % sous la référence, qualité moyenne-faible, casse ses prix si le joueur gagne des parts |
| Premium | prix +20–40 %, qualité haute, investit dans la qualité |
| Agressif marketing | gros budget pub, promos fréquentes |
| Suiveur | copie le prix et les améliorations du joueur avec retard |

Chaque mois : ils ajustent prix / qualité / marketing selon leur stratégie et la
part du joueur, encaissent un bénéfice simulé (part × marché × marge − coûts
fixes) et peuvent **faire faillite** (trésorerie < seuil). Un nouvel entrant peut
alors apparaître. Les **promos** sont des baisses de prix temporaires.
L'agressivité dépend de la difficulté.

---

## 10. Événements (82 événements)

Moteur : chaque jour, probabilité `p = base × fréquenceDifficulté` qu'un
événement survienne. On tire parmi les événements **éligibles** (secteur,
statut, conditions, jour minimum, **cooldown** propre et global) avec une
pondération. Certains déclenchent des **chaînes** (suite programmée N jours plus
tard). Effets **déclaratifs** (`{type: 'reputation', delta: -5}`) : l'interface
peut donc afficher les conséquences de chaque choix **avant** de choisir. Les
issues incertaines affichent leur probabilité.

Les événements avec choix mettent le jeu en pause jusqu'à la décision.

**Communs** : bouche-à-oreille, avis négatif viral, panne informatique, hausse
de l'énergie, grève nationale, contrôle fiscal, inspection sociale, subvention
régionale, crise économique (chaîne → reprise), reprise économique, canicule,
vague de froid, inondation, cambriolage, litige client, démission d'un employé
clé, maladie longue, conflit d'équipe, proposition de partenariat, business
angel (SRL), offre de crédit promo, hausse des taux BCE, indexation des
salaires, nouvelle réglementation, article dans la presse, salon
professionnel, demande de stage, faillite d'un fournisseur, erreur du
comptable, retard de paiement d'un gros client, cyberattaque, promo d'un
concurrent, nouveau concurrent, faillite d'un concurrent, épuisement du
dirigeant, prix « jeune entreprise », influenceur, travaux de voirie, hausse
des assurances, indexation du loyer, client mauvais payeur (chaîne →
recouvrement), épidémie de grippe, pénurie de main-d'œuvre, remboursement
d'impôt, coupure d'électricité, panne de la banque, opportunité de locaux,
mentor, demande de don (club local), remarque du réviseur.

**Agence web** : appel d'offres d'une commune, client qui change tout (scope
creep), faille de sécurité sur un site livré, l'IA fait baisser les prix du
marché, SaaS sur Product Hunt, panne de l'hébergeur.

**Friterie** : contrôle AFSCA, panne du frigo, passage d'un critique, mauvaise
récolte de pommes de terre, match des Diables Rouges / festival, suspicion
d'intoxication, plateforme de livraison.

**E-commerce** : préparation du Black Friday, grève des transporteurs,
conteneur bloqué, vague d'avis 5 étoiles, hausse du coût publicitaire,
contrefaçon, produit viral sur TikTok.

**Artisan** : panne de la camionnette, accident de chantier, primes régionales
à la rénovation, pénurie de matériaux, gros chantier d'un promoteur,
réclamation pour malfaçon.

**Soutien scolaire** : résultats record, réforme du calendrier scolaire, un
prof star veut te rejoindre, partenariat avec une école, plainte d'un parent,
cours en ligne gratuits.

**Statut** : lettre de la caisse d'assurances sociales (indépendant), pension
libre complémentaire PLCI (indépendant), caution personnelle exigée (SRL),
oubli du dépôt des comptes à la BNB (SRL).

La liste exacte (avec poids, cooldowns, choix et effets) est dans
`src/data/events.js`.

---

## 11. Investissements, revenu passif, victoire, défaite

### 11.1 Placements (compte personnel)

| Produit | Rendement simulé | Frais & fiscalité (simplifiés) |
|---|---|---|
| Compte d'épargne réglementé | taux annuel ≈ 1,5 % (varie avec la BCE) | intérêts exonérés jusqu'à 1 020 €/an puis 15 % |
| ETF monde (capitalisant) | ≈ 7 %/an, volatilité 15 % | TOB 0,12 % (max 1 300 €), frais courtier 0,1 %, taxe plus-values 10 % au-delà de 10 000 €/an |
| Actions (panier) | ≈ 8 %/an, volatilité 25 %, dividende 2,5 % | TOB 0,35 % (max 1 600 €), précompte 30 % (833 € exonérés), taxe plus-values 10 % |
| Immobilier locatif | prix +2 %/an ± volatilité, loyer indexé, vide locatif, entretien | droits d'enregistrement 12,5 %, crédit hypothécaire, précompte immobilier ≈ 1 mois de loyer/an, IPP approx. |

Les rendements sont mensuels, tirés d'une loi log-normale + chocs corrélés à la
conjoncture (krach possible). La taxe sur les comptes-titres (0,15 % au-delà de
1 M€) est appliquée sur la valeur moyenne annuelle.

### 11.2 Revenu passif mensuel net

```
passif = intérêts nets de l'épargne
       + 4 % × (valeur ETF + actions) / 12        (règle des 4 %, nette de taxe plus-values estimée)
       + loyers nets − mensualités hypothécaires − charges
       + part du fondateur × bénéfice net moyen (6 mois) de l'entreprise, SI un gérant
         la dirige et que le fondateur s'est retiré de l'opérationnel
```

La règle des 4 % est la convention de la « liberté financière » (on peut
retirer ~4 %/an d'un portefeuille diversifié sans l'épuiser) ; elle est
expliquée dans le glossaire.

### 11.3 Victoire

Moyenne du revenu passif sur 3 mois ≥ cible (Facile 2 000 €, Normal et
Réaliste 3 000 €, Difficile 3 500 €). Écran de bilan, puis **mode bac à sable**
illimité. Les succès restent débloquables.

### 11.4 Défaite et post-mortem

Faillite (§ 8). Le moteur tient des **compteurs de causes** : sorties de cash
des 120 derniers jours par catégorie (TVA, impôt annuel, régularisation
sociale, salaires, stock, remboursements de prêt, amendes, événements),
évolution du CA, marge, stock invendu, impayés. Le post-mortem classe les 3
causes principales et donne un **conseil pédagogique** par cause.

### 11.5 Succès

38 succès (`src/data/achievements.js`) : premiers 10 000 € de CA, premier
employé, 10 employés, survivre à un contrôle fiscal, première TVA payée, prêt
remboursé, premier bien immobilier, millionnaire, victoire sans crédit, un par
secteur, etc.

---

## 12. Score (`computeScore`)

```
base         = patrimoine net en € / 100
passif       = revenu passif mensuel € × 2
victoire     = 5 000 + 25 × max(0, 240 − mois pour gagner)   (si gagné)
succès       = 50 × nombre de succès
multiplicateur difficulté : Facile 0,8 — Normal 1 — Réaliste 1,25 — Difficile 1,5
faillite     : × 0,25
score = arrondi((base + passif + victoire + succès) × multiplicateurs), min 0
```

Pure, sans effet de bord, testée. Elle servira au classement V2.

---

## 13. Sauvegarde

- `SaveAdapter` : `save(slot, state)`, `load(slot)`, `list()`, `delete(slot)`,
  `export(slot) → string JSON`, `import(json, slot)`. Toutes asynchrones
  (Promise) pour qu'un adaptateur cloud puisse les implémenter.
- `LocalStorageAdapter` : 3 emplacements + 1 autosave, clé
  `entrepreneur-tycoon:slot:<n>`. Gère quota dépassé, JSON corrompu (message
  clair, la sauvegarde corrompue n'est pas écrasée silencieusement).
- Enveloppe : `{format:'entrepreneur-tycoon', saveVersion, savedAt, summary, state}`.
- `saveVersion` + `migrations.js` : liste de fonctions `v→v+1` appliquées en
  chaîne au chargement. Testé.
- Autosave toutes les 30 s de jeu réel (et en quittant la page).

---

## 14. Interface

- **Pixel art** généré en code : sprites décrits comme tableaux de chaînes
  (`"..aa.."`) + palette, dessinés sur `<canvas>` avec `image-rendering:
  pixelated`. Palette limitée de 24 couleurs.
- **Police pixel** : une police bitmap 5×7 maison (`ui/pixelfont.js`) dessine
  les titres, le logo et les chiffres de la scène ; le texte courant utilise une
  police monospace système (lisibilité).
- Écran principal : scène animée au centre (clients qui entrent, employés qui
  travaillent, pièces qui sautent quand l'argent rentre ; la scène change avec
  les améliorations), barre supérieure (trésorerie, date, vitesse, réputation,
  revenu passif), onglets : Entreprise, Finances, Équipe, Marché,
  Investissements, Événements, Stats, Succès.
- Graphiques canvas maison (lignes, barres, parts de marché).
- Popups de décision avec conséquences visibles, notifications discrètes,
  journal.
- Tutoriel court au premier lancement, infobulles pédagogiques (`?`) et
  glossaire.
- Raccourcis : Espace = pause, 1/2/3 = vitesse ×1/×2/×4, Échap = fermer.
- Sons WebAudio optionnels (désactivés par défaut).

---

## 15. Décisions prises (et pourquoi)

| # | Décision | Raison |
|---|---|---|
| 1 | Année de 360 jours (12 × 30) | Mois réguliers = trimestres réguliers, calculs lisibles. |
| 2 | Simulation au jour près | Assez fin pour les stocks et la trésorerie, assez rapide pour simuler des centaines de parties. |
| 3 | Le moteur mute l'état | Performance des simulations ; les tests clonent l'état quand nécessaire. |
| 4 | Effets d'événements déclaratifs | Aperçu automatique des conséquences, sérialisable, testable. |
| 5 | Impôt annuel exigible au 30 juin N+1 | Simplifie l'enrôlement réel (variable) tout en gardant le décalage qui crée la tension. |
| 6 | Cotisations sociales provisoires sur le minimum puis régularisation N+1 | Reproduit le « choc de régularisation » des starters ; le joueur peut augmenter ses provisionnels. |
| 7 | Placements uniquement sur le compte personnel | Oblige à sortir l'argent de la société (rémunération/dividendes, taxés) : leçon réaliste. |
| 8 | Revenu passif d'entreprise seulement avec gérant + retrait du fondateur | Un business où tu travailles n'est pas un revenu passif. |
| 9 | Bundle généré pour file:// | Contrainte navigateur (CORS) ; voir § 2.5. |
| 10 | TVA du soutien scolaire à 21 % | Exemption possible mais conditionnelle (art. 44) : on prend le cas le moins favorable, signalé. |
| 11 | Une seule police pixel bitmap pour les titres | Pas d'asset externe ; texte courant en monospace pour la lisibilité. |
| 12 | Coût employeur = brut × 1,35 | Approximation (ONSS ≈ 25 % + pécule, 13e mois, assurance, secrétariat social). |
| 13 | Les décisions d'événement pausent le moteur | Le joueur ne rate jamais une décision ; les bots décident instantanément. |
