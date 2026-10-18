// Secteur 2 — Friterie / snack. Montants en centimes.
//
// Mécanique : du PÉRISSABLE et de l'affluence. Les clients dépendent du jour,
// de la météo, de la saison et de l'emplacement ; le stock (portions) se
// périme en 4 jours ; la capacité dépend du personnel en service ; l'hygiène
// est contrôlée par l'AFSCA.

export const RESTAURANT = {
  id: 'restaurant',
  label: 'Friterie / snack',
  icon: 'fries',
  tagline: 'Frites, fricadelles et sauce andalouse.',
  description:
    'Tu gères un commerce de bouche : achète tes portions chaque jour (elles se périment en 4 jours), adapte-toi à la météo et au week-end, évite les files d’attente avec assez de personnel, et garde une cuisine impeccable pour l’AFSCA.',
  b2c: true,
  // TVA : nourriture 12 %, boissons 21 % (25 % du ticket) → taux moyen (voir fiscalite.js)
  drinksShare: 0.25,
  purchaseVat: 0.06, // achats de denrées alimentaires
  startCostExtra: 600_000, // friteuses, frigo, comptoir
  homeSeats: 4, // personnes qui tiennent derrière le comptoir au départ
  staffSeatKey: 'staffSeats',

  refPrice: 1_150, // ticket moyen de référence TTC : 11,50 €
  minPrice: 500,
  maxPrice: 3_000,
  elasticity: 1.6,
  marketingRef: 40_000,

  marketClients: 275, // clients potentiels par jour dans le quartier (tous acteurs confondus)
  weekday: [0, 0.8, 0.95, 0.95, 1.35, 1.45, 1.0], // fermé le lundi (jour de repos classique)
  seasonality: [0.9, 0.9, 0.95, 1, 1.05, 1.1, 1.15, 1.1, 1, 0.95, 0.95, 1.05],
  weather: { soleil: 1.1, nuageux: 1, pluie: 0.85, froid: 1.05, canicule: 0.85 },

  ingredients: [
    { level: 1, label: 'Standard (surgelé)', cost: 260, quality: 0.88 },
    { level: 2, label: 'Bonne (patates fraîches, sauces maison)', cost: 300, quality: 1.04 },
    { level: 3, label: 'Premium (Bintje locale, bœuf belge)', cost: 430, quality: 1.2 },
  ],
  shelfLife: 4, // jours
  founderService: 60, // clients/jour que le fondateur sert seul (cuisine + comptoir)
  equipment: 150, // clients/jour que l'équipement de départ (2 friteuses) permet de servir
  wasteCostPerPortion: 0,
  energyBase: 45_000, // friteuses : énergie mensuelle de base
  deliveryCommission: 0.3,

  roles: {
    cuisinier: { id: 'cuisinier', label: 'Cuisinier·ère', baseSalary: 260_000, skillRange: [25, 85], service: 90, quality: 0.04,
      desc: '+90 clients/jour de capacité et meilleure qualité.' },
    vendeur: { id: 'vendeur', label: 'Vendeur·se au comptoir', baseSalary: 235_000, skillRange: [20, 80], service: 110,
      desc: '+110 clients/jour de capacité : moins de files d’attente.' },
    plongeur: { id: 'plongeur', label: 'Commis / plongeur', baseSalary: 220_000, skillRange: [15, 60], hygiene: 0.6, service: 30,
      desc: 'Nettoyage et aide : l’hygiène remonte plus vite (+30 clients/jour).' },
  },

  fixedCosts: [
    { id: 'loyer', label: 'Loyer (rue secondaire)', amount: 110_000, vat: 0, cat: 'loyer' },
    { id: 'assurance', label: 'Assurances (RC, incendie)', amount: 9_000, vat: 0, cat: 'assurances' },
    { id: 'caisse', label: 'Caisse enregistreuse & terminal', amount: 4_500, vat: 0.21, cat: 'logiciels' },
    { id: 'divers', label: 'Emballages, sauces, divers', amount: 18_000, perHead: 2_000, vat: 0.21, cat: 'materiel' },
  ],

  upgrades: [
    { id: 'salle', cat: 'locaux', label: 'Petite salle (12 places)', cost: 600_000, rent: 25_000, effects: { attraction: 0.06, equipment: 30, staffSeats: 2 },
      desc: 'Les clients peuvent s’asseoir : +6 % d’attractivité.' },
    { id: 'terrasse', cat: 'locaux', label: 'Terrasse', cost: 350_000, rent: 8_000, effects: { sunBonus: 0.15 },
      desc: '+15 % de clients les jours de soleil (taxe communale de terrasse incluse).' },
    { id: 'place', cat: 'locaux', label: 'Déménager sur la place du marché', cost: 2_500_000, rent: 140_000, requires: ['salle'], effects: { marketMult: 1.5, staffSeats: 3, equipment: 60 },
      desc: 'Emplacement n°1 : +50 % de clients potentiels. Loyer +1 400 €/mois.' },
    { id: 'second', cat: 'locaux', label: 'Ouvrir un 2e établissement', cost: 6_000_000, rent: 160_000, requires: ['place'], minRep: 60, effects: { marketMult: 1.75, equipment: 180, staffSeats: 6 },
      desc: 'Un autre quartier : +75 % de marché. Il faudra du personnel en plus.' },
    { id: 'friteuse', cat: 'materiel', label: 'Friteuses professionnelles', cost: 450_000, effects: { equipmentMult: 1.4, quality: 0.04 },
      desc: '+40 % de capacité de l’équipement, frites plus croustillantes.' },
    { id: 'chambre_froide', cat: 'materiel', label: 'Chambre froide', cost: 550_000, effects: { shelfLife: 2 },
      desc: 'Les portions se conservent 2 jours de plus : moins de gaspillage.' },
    { id: 'cuisine_inox', cat: 'materiel', label: 'Cuisine inox aux normes', cost: 900_000, effects: { hygieneRegen: 0.8, quality: 0.03 },
      desc: 'Hygiène bien plus facile à maintenir (AFSCA).' },
    { id: 'double_cuisson', cat: 'process', label: 'Double cuisson à la belge', cost: 80_000, effects: { quality: 0.07 },
      desc: 'Le secret des vraies frites belges : qualité +7 %.' },
    { id: 'haccp', cat: 'process', label: 'Plan HACCP et formation hygiène', cost: 120_000, effects: { hygieneRegen: 0.5, afscaBonus: 10 },
      desc: 'Procédures d’hygiène : contrôles AFSCA bien plus sereins.' },
    { id: 'prevision', cat: 'process', label: 'Logiciel de prévision des stocks', cost: 200_000, monthly: 3_000, effects: { forecast: 1 },
      desc: 'Commande selon la météo et le jour : moins de ruptures et de gaspillage.' },
    { id: 'enseigne', cat: 'marque', label: 'Enseigne lumineuse et déco rétro', cost: 250_000, effects: { attraction: 0.08, repTarget: 3 },
      desc: 'On te remarque de loin : +8 % d’attractivité.' },
    { id: 'sauce_maison', cat: 'marque', label: 'Sauce maison signature', cost: 150_000, requires: ['double_cuisson'], effects: { repTarget: 6, quality: 0.04 },
      desc: 'Les clients viennent de loin pour ta sauce.' },
    { id: 'caisse_auto', cat: 'automatisation', label: 'Bornes de commande', cost: 1_200_000, monthly: 6_000, requires: ['salle'], effects: { serviceMult: 1.3, equipmentMult: 1.15 },
      desc: '+30 % de capacité de service sans personnel en plus.' },
    { id: 'click_collect', cat: 'automatisation', label: 'Click & collect', cost: 300_000, monthly: 2_500, effects: { rainProtect: 0.6, attraction: 0.04 },
      desc: 'Commande en ligne : la pluie fait moins fuir les clients.' },
  ],
};
