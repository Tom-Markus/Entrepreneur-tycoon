// Secteur 4 — Artisan du bâtiment (plombier-chauffagiste ou électricien). Montants en centimes.
//
// Mécanique : des DEVIS et un PLANNING. Les demandes arrivent selon le
// bouche-à-oreille et la saison ; chaque devis est accepté ou non ; les
// chantiers occupent des ouvriers (une camionnette par équipe de deux) ;
// matériel acheté au démarrage, paiement à la fin.

const PLOMBIER_JOBS = [
  { id: 'depannage', label: 'Dépannage (fuite, débouchage)', days: 0.4, materials: 3_500, weight: 5, urgent: true, payNow: true, renoShare: 0.7 },
  { id: 'entretien', label: 'Entretien de chaudière', days: 0.3, materials: 1_500, weight: 3, payNow: true, renoShare: 0.8, season: { 8: 1.5, 9: 1.7, 10: 1.5 } },
  { id: 'chauffe_eau', label: 'Remplacement de chauffe-eau', days: 1, materials: 65_000, weight: 2, renoShare: 0.8 },
  { id: 'chaudiere', label: 'Installation de chaudière', days: 2, materials: 280_000, weight: 1.5, renoShare: 0.75, season: { 0: 1.8, 1: 1.5, 9: 1.4, 10: 1.7, 11: 1.9 } },
  { id: 'sdb', label: 'Rénovation de salle de bain', days: 8, materials: 450_000, weight: 1, renoShare: 0.85 },
  { id: 'pac', label: 'Pompe à chaleur', days: 3, materials: 900_000, weight: 0.8, renoShare: 0.8, requires: 'certif' },
];

const ELEC_JOBS = [
  { id: 'depannage', label: 'Dépannage électrique', days: 0.4, materials: 2_000, weight: 5, urgent: true, payNow: true, renoShare: 0.7 },
  { id: 'conformite', label: 'Mise en conformité (RGIE)', days: 2.5, materials: 60_000, weight: 2, renoShare: 0.85 },
  { id: 'borne', label: 'Borne de recharge', days: 1, materials: 110_000, weight: 1.5, renoShare: 0.6, trend: 0.15 },
  { id: 'renovation', label: 'Rénovation électrique complète', days: 9, materials: 380_000, weight: 0.9, renoShare: 0.85 },
  { id: 'domotique', label: 'Installation domotique', days: 4, materials: 200_000, weight: 0.8, renoShare: 0.6, requires: 'formation' },
  { id: 'photovoltaique', label: 'Panneaux photovoltaïques', days: 3, materials: 600_000, weight: 1, renoShare: 0.7, requires: 'certif', season: { 3: 1.4, 4: 1.5, 5: 1.4 } },
];

export const ARTISAN = {
  id: 'artisan',
  label: 'Artisan du bâtiment',
  icon: 'wrench',
  tagline: 'Plombier-chauffagiste ou électricien.',
  description:
    'Chaque demande devient un devis : prix trop haut, le client refuse ; trop bas, tu travailles pour rien. Planifie tes ouvriers (une camionnette par équipe de deux), achète le matériel au démarrage et fais tourner le bouche-à-oreille. TVA à 6 % pour la rénovation de logements de plus de 10 ans.',
  b2c: false,
  startCostExtra: 450_000, // acompte sur une camionnette d'occasion, outillage
  homeSeats: 4,
  metiers: {
    plombier: { id: 'plombier', label: 'Plombier-chauffagiste', jobs: PLOMBIER_JOBS, seasonality: [1.35, 1.25, 1, 0.9, 0.85, 0.8, 0.8, 0.85, 1, 1.1, 1.25, 1.4] },
    electricien: { id: 'electricien', label: 'Électricien', jobs: ELEC_JOBS, seasonality: [1, 1, 1.05, 1.05, 1, 0.95, 0.85, 0.85, 1.05, 1.05, 1, 0.95] },
  },

  refRate: 5_500, // 55 €/h HT
  minRate: 2_500,
  maxRate: 15_000,
  refMargin: 0.2,
  hoursPerDay: 8,
  billableRatio: 0.72, // part du temps réellement facturable (trajets, devis, administratif)
  elasticity: 1.4,
  marketingRef: 40_000,
  marketLeads: 3.5, // demandes/jour ouvré sur le marché local
  weekendLeads: 0.35, // part des dépannages le week-end
  baseAccept: 0.62,
  urgentFee: 4_500, // forfait de déplacement des dépannages
  travelPerDay: 2_500, // carburant + usure par jour de chantier
  paymentDays: 30,
  defaultProb: 0.035,
  lateProb: 0.2,
  vanMonthly: 30_000, // assurance, carburant fixe, entretien par camionnette
  maintenanceContract: { fee: 1_400, signProb: 0.45, churnMonthly: 0.02, daysPerMonth: 0.03 },
  womDecayMonthly: 0.03,

  roles: {
    ouvrier: { id: 'ouvrier', label: 'Ouvrier·ère qualifié·e', baseSalary: 290_000, skillRange: [30, 85], speed: 1,
      desc: 'Une journée de chantier par jour ouvré (selon la compétence).' },
    apprenti: { id: 'apprenti', label: 'Apprenti·e', baseSalary: 175_000, skillRange: [12, 40], speed: 0.55,
      desc: 'Moins rapide, mais bon marché et progresse vite.' },
    planificateur: { id: 'planificateur', label: 'Secrétariat & planning', baseSalary: 250_000, skillRange: [25, 80], max: 2, accept: 0.08,
      desc: 'Répond vite aux clients : +8 % de devis acceptés, chantiers mieux organisés.' },
  },

  fixedCosts: [
    { id: 'assurance', label: 'Assurance RC & décennale', amount: 14_000, vat: 0, cat: 'assurances' },
    { id: 'telecom', label: 'Téléphone & logiciel de facturation', amount: 6_000, vat: 0.21, cat: 'logiciels' },
    { id: 'vehicule', label: 'Camionnette (assurance, entretien)', amount: 30_000, vat: 0.21, cat: 'deplacements' },
    { id: 'outils', label: 'Petit outillage & EPI', amount: 5_000, perHead: 2_500, vat: 0.21, cat: 'materiel' },
  ],

  upgrades: [
    { id: 'atelier', cat: 'locaux', label: 'Atelier-dépôt', cost: 400_000, rent: 60_000, effects: { seats: 4, materialCut: 0.08 },
      desc: 'Stocker le matériel acheté en gros : −8 % sur les matériaux, 4 places de plus.' },
    { id: 'depot', cat: 'locaux', label: 'Grand dépôt et bureau', cost: 1_500_000, rent: 150_000, requires: ['atelier'], effects: { seats: 10, speedMult: 1.05 },
      desc: '10 places de plus, logistique plus fluide.' },
    { id: 'camionnette2', cat: 'materiel', label: '2e camionnette', cost: 2_800_000, monthly: 30_000, effects: { vans: 1 },
      desc: 'Une équipe de plus sur la route (2 ouvriers par camionnette).' },
    { id: 'camionnette3', cat: 'materiel', label: '3e et 4e camionnettes', cost: 5_200_000, monthly: 60_000, requires: ['camionnette2'], effects: { vans: 2 },
      desc: 'Deux équipes de plus.' },
    { id: 'outillage', cat: 'materiel', label: 'Outillage professionnel', cost: 350_000, effects: { speedMult: 1.12, quality: 0.04 },
      desc: 'Chantiers 12 % plus rapides.' },
    { id: 'camera', cat: 'materiel', label: 'Caméra thermique & détecteurs', cost: 180_000, effects: { quality: 0.06 },
      desc: 'Diagnostics précis : moins de malfaçons.' },
    { id: 'devis_logiciel', cat: 'process', label: 'Logiciel de devis en ligne', cost: 120_000, monthly: 3_500, effects: { accept: 0.08 },
      desc: 'Devis envoyés le jour même : +8 % d’acceptation.' },
    { id: 'planning', cat: 'process', label: 'Planification optimisée', cost: 200_000, effects: { speedMult: 1.08, travelCut: 0.15 },
      desc: 'Moins de trajets inutiles.' },
    { id: 'certif', cat: 'process', label: 'Certification « installateur agréé primes »', cost: 300_000, minRep: 40, effects: { unlock: 1, repTarget: 4 },
      desc: 'Débloque pompes à chaleur / photovoltaïque et rassure les clients.' },
    { id: 'formation', cat: 'process', label: 'Formation domotique', cost: 150_000, effects: { unlock: 1 },
      desc: 'Débloque les chantiers domotiques (électricien).' },
    { id: 'site_avis', cat: 'marque', label: 'Site web + avis Google', cost: 150_000, effects: { leadsMult: 1.18 },
      desc: '+18 % de demandes.' },
    { id: 'lettrage', cat: 'marque', label: 'Lettrage des véhicules', cost: 80_000, effects: { leadsMult: 1.08, repTarget: 2 },
      desc: 'Ta camionnette devient une pub roulante.' },
    { id: 'contrats', cat: 'automatisation', label: 'Contrats d’entretien annuels', cost: 120_000, effects: { contracts: 1 },
      desc: 'Revenu récurrent : les clients paient un abonnement d’entretien.' },
    { id: 'stock_camion', cat: 'automatisation', label: 'Stock embarqué dans les camionnettes', cost: 250_000, effects: { travelCut: 0.3, speedMult: 1.05 },
      desc: 'Moins d’allers-retours au fournisseur.' },
  ],
};
