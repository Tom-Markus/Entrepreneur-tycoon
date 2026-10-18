// =============================================================================
//  FISCALITÉ BELGE — TOUS les taux, plafonds et seuils du jeu sont ici.
// =============================================================================
//
//  Année de référence : 2026 (revenus 2025-2026). Recherches effectuées en
//  octobre 2026 sur des sources secondaires (caisses sociales, secrétariats
//  sociaux, banques, Test-Achats, Wikifin, SPF Finances quand disponible).
//
//  ⚠️  CHAQUE VALEUR EST « À VÉRIFIER » avant tout usage réel. Le jeu est une
//  simulation pédagogique, pas un outil de calcul fiscal.
//
//  Légende des commentaires :
//    [source]  d'où vient le chiffre
//    [approx]  approximation volontaire faite pour le jeu (non officielle)
//    [incert]  valeur pour laquelle les sources divergent / réforme en cours
//
//  Montants en CENTIMES.
// =============================================================================

export const FISCALITE = {
  referenceYear: 2026,

  // ---------------------------------------------------------------------------
  // TVA
  // ---------------------------------------------------------------------------
  tva: {
    // [source] Code TVA : taux normal 21 %, intermédiaire 12 %, réduit 6 %.
    rates: { normal: 0.21, intermediaire: 0.12, reduit: 0.06 },
    // [source] Régime de franchise des petites entreprises : CA annuel < 25 000 €
    // (plafond inchangé depuis 2016 ; proposition parlementaire 2026 de le porter
    // progressivement à 30 000 € — [incert] non adoptée à notre connaissance).
    franchiseThreshold: 2_500_000,
    // [source] Déclaration trimestrielle pour les petites entreprises.
    // [incert] Échéance : le 20 du mois qui suit le trimestre (certaines sources
    // mentionnent le 25 depuis la réforme 2023). Le jeu utilise le 20.
    dueDayOfMonth: 20,
    // Restauration : [source] repas sur place 12 %, boissons alcoolisées 21 %.
    // [incert] L'accord budgétaire 2025-2026 prévoit : repas à emporter 6 % → 12 %,
    // boissons non alcoolisées en horeca 21 % → 12 % ; date d'entrée en vigueur
    // non confirmée. Le jeu applique 12 % sur la nourriture (sur place et à
    // emporter) et 21 % sur la part « boissons ».
    restaurantFood: 0.12,
    restaurantDrinks: 0.21,
    // [source] Rénovation d'un logement privé de plus de 10 ans facturée à un
    // particulier : 6 % (conditions cumulatives). Neuf / professionnels : 21 %.
    renovation: 0.06,
    // [incert] Soutien scolaire : exemption possible (art. 44 §2 Code TVA) pour
    // l'enseignement scolaire ou les leçons particulières données à titre
    // personnel ; un centre commercial non reconnu facture en principe 21 %.
    // Le jeu prend 21 % (cas le moins favorable).
    education: 0.21,
  },

  // ---------------------------------------------------------------------------
  // IPP — impôt des personnes physiques
  // ---------------------------------------------------------------------------
  ipp: {
    // [source] Barème revenus 2025 (exercice d'imposition 2026), brochure
    // « Fisc en poche » Xerius 2025 : 25 % jusqu'à 16 320 €, 40 % jusqu'à
    // 28 800 €, 45 % jusqu'à 49 840 €, 50 % au-delà.
    // [incert] Le gouvernement a gelé l'indexation de certains montants
    // jusqu'en 2030 ; le jeu garde ce barème pour toutes les années.
    brackets: [
      { upTo: 1_632_000, rate: 0.25 },
      { upTo: 2_880_000, rate: 0.4 },
      { upTo: 4_984_000, rate: 0.45 },
      { upTo: Infinity, rate: 0.5 },
    ],
    // [source] Quotité exemptée de base estimée à 10 910 € pour l'exercice 2026
    // (estimation Wolters Kluwer, « calculs personnels » de l'auteur) — [incert].
    // Mécanisme : réduction d'impôt égale à l'impôt calculé sur cette quotité
    // (donc au taux de la 1re tranche).
    quotiteExemptee: 1_091_000,
    // [approx] Additionnels communaux : varient de 0 à ~9 % selon la commune ;
    // moyenne retenue ≈ 7 %.
    centimesAdditionnels: 0.07,
  },

  // ---------------------------------------------------------------------------
  // Cotisations sociales de l'indépendant (INASTI / caisses d'assurances sociales)
  // ---------------------------------------------------------------------------
  social: {
    // [source] 2026 : 20,5 % jusqu'à 75 024,54 € de revenu net imposable,
    // 14,16 % de 75 024,54 € à 110 562,42 €, rien au-delà (SalaireClair, UCM).
    rate1: 0.205,
    ceiling1: 7_502_454,
    rate2: 0.1416,
    ceiling2: 11_056_242,
    // [source] Cotisation minimale à titre principal ≈ 890,42 €/trimestre hors
    // frais de gestion (≈ 917 € frais inclus selon MyFid) — [incert].
    minQuarterly: 89_042,
    // [approx] Frais de gestion de la caisse : 3 % à 4,5 % selon la caisse.
    fraisGestion: 0.035,
    // [approx] Le jeu calcule les provisionnelles sur le minimum les 3 premières
    // années (cas du starter), puis sur le revenu de l'année N-1 ; la
    // régularisation sur le revenu réel arrive au 3e trimestre de l'année N+1
    // (dans la réalité : souvent 2 à 3 ans plus tard).
    regularizationMonth: 8, // septembre (0 = janvier)
  },

  // ---------------------------------------------------------------------------
  // ISOC — impôt des sociétés (SRL)
  // ---------------------------------------------------------------------------
  isoc: {
    // [source] Taux normal 25 % ; taux réduit 20 % sur la première tranche de
    // 100 000 € pour les PME qui remplissent les conditions.
    normalRate: 0.25,
    reducedRate: 0.2,
    reducedBracket: 10_000_000,
    // [incert] Condition de rémunération du dirigeant : au moins 45 000 €
    // (ou le bénéfice imposable s'il est plus bas). L'accord budgétaire de
    // novembre 2025 relève ce seuil à 50 000 € (loi pas encore votée selon BNP
    // Paribas Fortis ; MyFid l'indique déjà applicable). Le jeu utilise 50 000 €.
    minDirectorPay: 5_000_000,
    // [source] Les nouvelles sociétés bénéficient du taux réduit pendant
    // leurs 4 premiers exercices même sans la condition de rémunération ?
    // [incert] (Accountable) — non modélisé : la condition s'applique toujours.
  },

  // ---------------------------------------------------------------------------
  // Dirigeant d'entreprise (SRL)
  // ---------------------------------------------------------------------------
  dirigeant: {
    // [source] Frais forfaitaires : 3 % des revenus nets, plafond 3 200 €
    // (revenus 2026, billy.tech) — [incert].
    fraisForfaitairesRate: 0.03,
    fraisForfaitairesMax: 320_000,
  },

  // ---------------------------------------------------------------------------
  // Dividendes et revenus mobiliers
  // ---------------------------------------------------------------------------
  dividendes: {
    // [source] Précompte mobilier 30 % (taux standard).
    precompte: 0.3,
    // [source] VVPR-bis : 20 % pour les dividendes du 2e exercice, 15 % à partir
    // du 3e (sous conditions d'apport en capital). [incert] passage à 18 %
    // annoncé à partir du 1/7/2026 (source unique, non confirmée).
    vvprbisYear2: 0.2,
    vvprbisYear3: 0.15,
    // [source] Exonération des dividendes d'actions : 833 € par an (revenus
    // 2025 et 2026), récupérable via la déclaration (max 249,90 €).
    exemption: 83_300,
  },

  // ---------------------------------------------------------------------------
  // Employeur
  // ---------------------------------------------------------------------------
  employeur: {
    // [source] Cotisations patronales de base ≈ 25 % du brut (secteur marchand).
    onssRate: 0.25,
    // [approx] Autres charges : pécule de vacances, prime de fin d'année,
    // assurance accidents du travail, médecine du travail, secrétariat social.
    autresCharges: 0.1,
    // [source] RMMMG (revenu minimum mensuel moyen garanti) au 1/4/2026 :
    // 2 189,81 € brut/mois (temps plein, 18 ans et plus).
    rmmmg: 218_981,
    // [source] Réduction « premiers engagements » à partir du 1/7/2026 :
    // 1er travailleur 2 000 €/trimestre (durée illimitée), 2e à 5e : 1 000 €/trim.
    // pendant 12 trimestres (Leforem, Partena).
    firstHireReduction: 200_000,
    nextHiresReduction: 100_000,
    nextHiresQuarters: 12,
    nextHiresMax: 5,
    // [source] Préavis (loi du 3/7/1978, art. 37/2, statut unique) — barème en
    // semaines selon l'ancienneté. [incert] barème reconstitué, à vérifier sur
    // emploi.belgique.be ; plafond de 52 semaines pour les contrats débutant
    // après le 1/6/2026.
    // [moisMinimum, semaines]
    noticeWeeks: [
      [0, 1], [3, 3], [4, 4], [5, 5], [6, 6], [9, 7], [12, 8], [15, 9], [18, 10], [21, 11],
      [24, 12], [36, 13], [48, 15], [60, 18], [72, 21], [84, 24], [96, 27], [108, 30], [120, 33],
    ],
    noticeMaxWeeks: 52,
  },

  // ---------------------------------------------------------------------------
  // Placements
  // ---------------------------------------------------------------------------
  epargne: {
    // [source] Compte d'épargne réglementé : intérêts exonérés jusqu'à 1 020 €
    // par personne (plafond gelé pour 2026), 15 % au-delà (Wikifin, Test-Achats).
    exemptInterest: 102_000,
    taxRate: 0.15,
  },
  tob: {
    // [source] Taxe sur les opérations de bourse : ETF enregistré dans l'EEE
    // (hors Belgique) 0,12 % (max 1 300 €/opération), actions 0,35 %
    // (max 1 600 €/opération). [incert] plafonds de 2018, fonds belges
    // capitalisants à 1,32 %.
    etf: { rate: 0.0012, max: 130_000 },
    actions: { rate: 0.0035, max: 160_000 },
  },
  plusValues: {
    // [source] Taxe sur les plus-values des actifs financiers : 10 % sur les
    // plus-values réalisées depuis le 1/1/2026, exonération de 10 000 €/an
    // (indexée ; report possible de 1 000 €/an non modélisé). Loi adoptée le
    // 3/4/2026, MB 21/4/2026 (Test-Achats, Jubel).
    rate: 0.1,
    exemption: 1_000_000,
  },
  tact: {
    // [source] Taxe annuelle sur les comptes-titres : 0,15 % si la valeur
    // moyenne dépasse 1 000 000 € (plafonnée à 10 % de l'excédent).
    rate: 0.0015,
    threshold: 100_000_000,
  },
  immobilier: {
    // [source] Droits d'enregistrement pour un bien qui n'est pas l'habitation
    // propre : 12,5 % en Wallonie et à Bruxelles, 12 % en Flandre. Le jeu prend 12,5 %.
    droitsEnregistrement: 0.125,
    // [approx] Notaire et frais divers ≈ 2 % du prix.
    fraisNotaire: 0.02,
    // [approx] Précompte immobilier ≈ 1 mois de loyer par an (dépend du revenu
    // cadastral et de la commune).
    precompteMoisLoyer: 1,
    // [approx] IPP sur les loyers d'un particulier : basé sur le revenu
    // cadastral indexé majoré de 40 %, pas sur le loyer réel ; approximé ici à
    // 8 % du loyer brut.
    ippSurLoyer: 0.08,
  },

  // ---------------------------------------------------------------------------
  // Création et frais administratifs
  // ---------------------------------------------------------------------------
  creation: {
    // [approx] Inscription BCE via un guichet d'entreprises ≈ 110 € (montant indexé).
    independant: 11_000,
    // [approx] Constitution d'une SRL : notaire + publication + plan financier
    // ≈ 1 500 € (aucun capital minimum depuis le CSA 2019, mais des capitaux
    // propres « suffisants » sont exigés).
    srl: 150_000,
  },
  // [approx] Honoraires de comptable mensuels moyens (marché, très variables).
  comptable: { independant: 9_000, srl: 22_500 },
};

/** Liste des simplifications affichées dans l'encart « simplifié » du jeu. */
export const SIMPLIFICATIONS = [
  'Calendrier de 12 mois de 30 jours ; impôt annuel (IPP/ISOC) exigible le 30 juin de l’année suivante.',
  'Pas de versements anticipés ni de majoration pour absence de versements anticipés.',
  'Cotisations sociales provisoires calculées sur le minimum les 3 premières années, régularisées en septembre de l’année suivante.',
  'Bénéfice de l’indépendant = recettes − charges réelles − amortissements − cotisations sociales (pas de frais forfaitaires).',
  'Les améliorations sont amorties sur 3 ans de façon linéaire.',
  'Coût employeur = brut × 1,35 (ONSS patronal ≈ 25 % + autres charges ≈ 10 %).',
  'Précompte professionnel du dirigeant estimé chaque mois puis régularisé à la fin de l’année.',
  'TVA soutien scolaire à 21 % (exemption possible selon les cas).',
  'Fiscalité immobilière approximée (précompte ≈ 1 mois de loyer, IPP ≈ 8 % du loyer).',
  'Taxe sur les plus-values : 10 % au-delà de 10 000 €/an, sans report d’exonération.',
  'Barèmes 2026 appliqués à toutes les années de jeu (pas d’indexation).',
];
