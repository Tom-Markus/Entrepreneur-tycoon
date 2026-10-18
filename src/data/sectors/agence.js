// Secteur 1 — Agence web / freelance digital. Montants en centimes.
//
// Mécanique : on vend des HEURES. Les demandes de projets arrivent, le joueur
// fixe son taux horaire, accepte ou refuse ; la capacité (heures/jour) est le
// goulet. Récurrent possible : maintenance, puis SaaS.

export const AGENCE = {
  id: 'agence',
  label: 'Agence web',
  icon: 'laptop',
  tagline: 'Sites, e-shops et applis pour les PME belges.',
  description:
    'Tu vends ton temps : chaque projet consomme des heures. Fixe ton taux horaire, choisis tes clients, recrute des développeurs, puis construis du récurrent (maintenance, SaaS) pour ne plus dépendre de tes heures.',
  vatRate: 0.21,
  b2c: false,
  startCostExtra: 150_000, // ordinateur, logiciels, site perso (investissement de départ)

  // Prix
  refRate: 6_500, // taux horaire de référence du marché : 65 €/h HT
  minRate: 2_500,
  maxRate: 20_000,
  elasticity: 1.4,

  // Demande : demandes de projets par jour ouvré pour tout le marché local.
  marketLeads: 1.4,
  seasonality: [1.1, 1.05, 1.05, 1, 1, 0.95, 0.7, 0.55, 1.15, 1.1, 1.05, 0.8],
  leadExpiryDays: 6,
  marketingRef: 50_000, // 500 €/mois = budget marketing « de référence »

  // Capacité
  founderHours: 5.5, // heures facturables par jour ouvré (le reste : devis, administratif, prospection)
  homeSeats: 2, // places de travail sans bureau (fondateur + 1 à distance)

  // Paiement
  paymentDays: 30,
  defaultProb: 0.045, // probabilité d'impayé par facture
  lateProb: 0.2, // probabilité de retard de paiement (15-45 j)

  projectTypes: [
    { id: 'audit', label: 'Audit SEO', hours: [12, 24], budget: 0.95, weight: 3, deadline: 15 },
    { id: 'vitrine', label: 'Site vitrine', hours: [30, 60], budget: 1, weight: 5, deadline: 30 },
    { id: 'identite', label: 'Identité visuelle + site', hours: [50, 90], budget: 1.05, weight: 2, deadline: 40 },
    { id: 'refonte', label: 'Refonte de site', hours: [40, 80], budget: 1, weight: 3, deadline: 40 },
    { id: 'eshop', label: 'Boutique en ligne', hours: [90, 160], budget: 1.1, weight: 3, deadline: 60 },
    { id: 'appweb', label: 'Application web sur mesure', hours: [200, 400], budget: 1.2, weight: 1, deadline: 120, minRep: 40 },
  ],
  clientNames: [
    'Boulangerie Lemaire', 'Garage Peeters', 'Cabinet Dr Maes', 'Asbl Les Coccinelles', 'Brasserie du Coin',
    'Immo Wavre', 'Fleuriste Rosalie', 'Commune de Ciney', 'Avocats Dubois & Lambert', 'Club de tennis de Uccle',
    'Chocolaterie Mertens', 'Kiné Santé Liège', 'Startup Gantoise', 'Hôtel des Ardennes', 'Librairie Pages',
    'Salon Coiff’Hair', 'PME Logistique Anvers', 'Vignoble du Hainaut', 'École de musique Do Ré', 'Cave à bières Houblon',
  ],

  // Récurrent
  maintenance: { signProb: 0.32, fee: [6_000, 20_000], hoursPerMonth: 1.5, churnMonthly: 0.025 },
  saas: {
    devHours: 600,
    defaultPrice: 2_900, // 29 €/mois HT
    minPrice: 900,
    maxPrice: 15_000,
    baseNewPerDay: 0.12,
    churnMonthly: 0.045,
    serverCostPerSub: 300,
    serverCostBase: 5_000,
    supportHoursPerSub: 0.08,
    potential: 1_100, // marché d'un SaaS de niche belge
    elasticity: 1.5,
  },

  roles: {
    developpeur: {
      id: 'developpeur', label: 'Développeur·se', baseSalary: 380_000, skillRange: [30, 85],
      hours: 5.5, desc: 'Produit des heures facturables (≈ 5,5 h/jour).',
    },
    designer: {
      id: 'designer', label: 'Designer UX/UI', baseSalary: 340_000, skillRange: [30, 85],
      hours: 4.5, quality: 0.05, desc: 'Produit des heures et améliore la qualité (max 3 comptent).',
    },
    commercial: {
      id: 'commercial', label: 'Commercial·e', baseSalary: 360_000, skillRange: [30, 85],
      leads: 0.18, desc: 'Rend l’agence plus visible (+18 % d’attractivité chacun, rendements décroissants).',
    },
    chef_projet: {
      id: 'chef_projet', label: 'Chef·fe de projet', baseSalary: 450_000, skillRange: [40, 90], max: 2,
      overrun: 0.7, prod: 0.06, desc: 'Réduit les dépassements d’heures et organise l’équipe (+6 % de productivité).',
    },
  },

  fixedCosts: [
    { id: 'logiciels', label: 'Logiciels & outils', amount: 4_500, perHead: 1_500, vat: 0.21, cat: 'logiciels' },
    { id: 'telecom', label: 'Internet & téléphone', amount: 6_000, vat: 0.21, cat: 'logiciels' },
    { id: 'hebergement', label: 'Hébergement', amount: 2_500, vat: 0.21, cat: 'logiciels' },
    { id: 'assurance', label: 'Assurance RC professionnelle', amount: 4_000, vat: 0, cat: 'assurances' },
  ],

  upgrades: [
    // Locaux
    { id: 'coworking', cat: 'locaux', label: 'Espace de coworking', cost: 50_000, rent: 35_000, effects: { seats: 4, leadsMult: 1.03 },
      desc: '5 places de travail, une adresse pro. Loyer 350 €/mois.' },
    { id: 'bureau', cat: 'locaux', label: 'Bureau en centre-ville', cost: 800_000, rent: 150_000, requires: ['coworking'], effects: { seats: 8, leadsMult: 1.1, quality: 0.03 },
      desc: '12 places, salle de réunion pour les clients. Loyer 1 500 €/mois.' },
    { id: 'plateau', cat: 'locaux', label: 'Grand plateau', cost: 2_500_000, rent: 350_000, requires: ['bureau'], effects: { seats: 18, leadsMult: 1.1, motivation: 4 },
      desc: '30 places, cuisine, terrasse. Loyer 3 500 €/mois.' },
    // Matériel
    { id: 'laptops', cat: 'materiel', label: 'Ordinateurs performants', cost: 350_000, effects: { prodMult: 1.04 },
      desc: '+4 % de productivité pour toute l’équipe.' },
    { id: 'suite_creative', cat: 'materiel', label: 'Suite créative', cost: 120_000, monthly: 6_000, effects: { quality: 0.07 },
      desc: 'Qualité +7 %. Abonnement 60 €/mois.' },
    { id: 'cloud', cat: 'materiel', label: 'Infrastructure cloud', cost: 250_000, monthly: 12_000, effects: { maintChurnMult: 0.7 },
      desc: 'Hébergement fiable : moins de résiliations de maintenance. Requis pour le SaaS.' },
    // Process
    { id: 'acompte', cat: 'process', label: 'Acompte de 30 % à la signature', cost: 30_000, effects: { defaultMult: 0.4, deposit: 0.3 },
      desc: 'Moins d’impayés et du cash dès la signature.' },
    { id: 'agile', cat: 'process', label: 'Méthode agile & outil de suivi', cost: 150_000, monthly: 4_000, effects: { overrunMult: 0.6 },
      desc: 'Les dépassements d’heures diminuent fortement.' },
    { id: 'offre_maintenance', cat: 'process', label: 'Offre de maintenance', cost: 80_000, effects: { unlockMaintenance: 1 },
      desc: 'Propose un contrat mensuel après chaque projet : du revenu récurrent.' },
    { id: 'tests_auto', cat: 'process', label: 'Tests automatisés & revue de code', cost: 250_000, requires: ['agile'], effects: { quality: 0.08, overrunMult: 0.85 },
      desc: 'Qualité +8 %, encore moins de dépassements.' },
    // Marque
    { id: 'portfolio', cat: 'marque', label: 'Portfolio en ligne soigné', cost: 120_000, effects: { leadsMult: 1.12, repTarget: 4 },
      desc: 'Plus de demandes, meilleure image.' },
    { id: 'seo_agence', cat: 'marque', label: 'Référencement de l’agence', cost: 250_000, requires: ['portfolio'], effects: { leadsMult: 1.2 },
      desc: '+20 % de demandes de projets.' },
    { id: 'grands_comptes', cat: 'marque', label: 'Références grands comptes', cost: 600_000, requires: ['seo_agence'], minRep: 50, effects: { budgetMult: 1.1, bigProjects: 1 },
      desc: 'Clients prêts à payer +10 %, plus de gros projets.' },
    // Automatisation
    { id: 'composants', cat: 'automatisation', label: 'Bibliothèque de composants', cost: 300_000, effects: { prodMult: 1.06 },
      desc: 'Réutiliser son code : +6 % de productivité.' },
    { id: 'ia_dev', cat: 'automatisation', label: 'Assistants IA de développement', cost: 400_000, monthly: 10_000, requires: ['composants'], effects: { prodMult: 1.08 },
      desc: '+8 % de productivité. Abonnement 100 €/mois.' },
    { id: 'saas', cat: 'automatisation', label: 'Développer un SaaS', cost: 500_000, requires: ['cloud', 'agile'], effects: { unlockSaas: 1 },
      desc: 'Lance un projet interne de 600 h. Une fois en ligne, des abonnés paient chaque mois.' },
    { id: 'saas_growth', cat: 'automatisation', label: 'Moteur de croissance SaaS', cost: 800_000, requires: ['saas'], requiresFlag: 'saasLive', effects: { saasGrowthMult: 1.7 },
      desc: 'Onboarding, parrainage, contenu : +70 % de nouveaux abonnés.' },
  ],
};
