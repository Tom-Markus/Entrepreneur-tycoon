// Paramètres économiques communs à tous les secteurs. Montants en centimes.

export const ECONOMY = {
  // Coût de la vie du dirigeant (loyer, nourriture, transport…) par mois. [approx]
  livingCost: 160_000,
  // Prélèvement / rémunération mensuel(le) par défaut du dirigeant.
  defaultDraw: 180_000,
  // Réputation et satisfaction de départ (0-100).
  startReputation: 25,
  startSatisfaction: 60,
  // Vitesse de convergence quotidienne de la réputation vers la satisfaction.
  reputationInertia: 0.006,
  // Facteur marketing : 1 + k × ln(1 + budget / budgetRéf).
  marketingK: 0.35,
  // Poids de l'option « hors marché » dans le partage de la demande.
  outsideOption: 0.55,
  // Attractivité totale des concurrents quand il n'y en a pas encore (phase 2).
  defaultCompetitorAttraction: 2,
  // Conjoncture : marche aléatoire autour de 1.
  economyVolatility: 0.004,
  economyMeanReversion: 0.01,
  economyMin: 0.7,
  economyMax: 1.2,
  // Découvert bancaire.
  overdraftRate: 0.095, // [approx] taux annuel débiteur d'un compte pro
  overdraftStart: 250_000, // 2 500 € autorisés au départ
  overdraftRevenueShare: 0.5, // limite ≈ 50 % du CA mensuel moyen
  overdraftMax: 5_000_000,
  // Durée d'amortissement des investissements (années).
  amortizationYears: 3,
  // Énergie de base mensuelle (électricité/chauffage) hors secteur. [approx]
  energyBase: 6_000,
  // Taux de l'épargne et des crédits (pilotés par la « BCE » du jeu).
  baseRate: 0.0225, // taux directeur simulé de départ
  // Inflation annuelle moyenne simulée (cible BCE ≈ 2 %) et sa volatilité. [approx]
  inflation: 0.02,
  inflationVol: 0.006,
};

/** Libellés des catégories comptables (revenus et dépenses). */
export const CATEGORIES = {
  // revenus
  ventes: 'Ventes',
  projets: 'Projets clients',
  maintenance: 'Contrats de maintenance',
  saas: 'Abonnements SaaS',
  chantiers: 'Chantiers',
  abonnements: 'Abonnements élèves',
  stages: 'Stages',
  subvention: 'Subventions',
  autres_revenus: 'Autres revenus',
  // dépenses déductibles
  salaires: 'Salaires (coût employeur)',
  remuneration: 'Rémunération du dirigeant',
  loyer: 'Loyer',
  energie: 'Énergie',
  marketing: 'Marketing',
  stock: 'Achats de stock',
  materiel: 'Matériel et fournitures',
  logistique: 'Logistique',
  logiciels: 'Logiciels et abonnements',
  assurances: 'Assurances',
  comptable: 'Comptable',
  frais_bancaires: 'Frais bancaires et de paiement',
  interets: 'Intérêts',
  amendes: 'Amendes et pénalités',
  evenements: 'Imprévus',
  formation: 'Formations',
  recrutement: 'Recrutement',
  licenciement: 'Indemnités de licenciement',
  deplacements: 'Déplacements',
  creances: 'Créances irrécouvrables',
  retours: 'Remboursements (retours)',
  investissement: 'Investissements (amortis)',
  autres: 'Autres charges',
  // flux non déductibles
  tva: 'TVA reversée',
  impot: 'Impôt (IPP / ISOC)',
  cotisations: 'Cotisations sociales',
  precompte: 'Précompte professionnel',
  remboursement: 'Remboursement de prêt (capital)',
  prelevement: 'Prélèvements / virements perso',
  dividende: 'Dividendes',
  pret: 'Prêts reçus',
  apport: 'Apports personnels',
  investisseur: 'Levée de fonds',
};
