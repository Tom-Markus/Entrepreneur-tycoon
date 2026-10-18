// Secteur 3 — E-commerce. Montants en centimes.
//
// Mécanique : on ACHÈTE du trafic (publicité) et du stock à l'avance.
// Marge = prix − coût d'achat − logistique − frais de paiement − retours ;
// rentable seulement si le coût d'acquisition client reste sous la marge.

export const ECOMMERCE = {
  id: 'ecommerce',
  label: 'E-commerce',
  icon: 'box',
  tagline: 'Une boutique en ligne qui livre toute la Belgique.',
  description:
    'Tu achètes ton stock à l’avance (livré en ≈ 12 jours), tu paies la publicité au clic et tu vis de ta marge. Surveille le coût d’acquisition client, les ruptures, les retours et les pics du Black Friday et des fêtes.',
  b2c: true,
  vatRate: 0.21,
  startCostExtra: 250_000, // site, photos, premier matériel d'emballage
  homeSeats: 2,

  elasticity: 2.0,
  marketingRef: 100_000, // budget pub mensuel de référence
  organicVisitors: 1_000, // visiteurs organiques/jour sur le marché (partagés)
  baseConversion: 0.03,
  cpc: 32, // coût par clic de base : 0,32 €
  cpcSaturation: 900, // au-delà de ≈ 900 clics/jour, les enchères coûtent de plus en plus cher
  paidConversion: 0.7, // un visiteur payé achète moins qu'un visiteur organique
  cpcSeason: [0.9, 0.85, 0.9, 0.95, 1, 1, 0.95, 0.95, 1, 1.05, 1.45, 1.3],
  seasonality: [1.1, 0.8, 0.9, 0.95, 1, 0.95, 0.9, 0.9, 1, 1.05, 1.5, 1.6],
  blackFriday: { month: 10, from: 23, to: 28, mult: 2.4 },
  itemsPerOrder: 1.35, // articles par commande en moyenne (panier)
  packing: 80, // emballage par commande
  paymentPct: 0.014,
  paymentFixed: 25,
  returnDelay: 12,
  returnResellable: 0.7,
  leadTime: 12, // délai fournisseur (jours)
  storageMonthlyPct: 0.02, // coût de stockage mensuel (% de la valeur du stock)
  founderOrders: 45, // commandes préparées/jour par le fondateur
  startSlots: 2,

  products: [
    { id: 'gourde', label: 'Gourde isotherme', cost: 700, ref: 2_490, weight: 1.2, returns: 0.04, ship: 420, vat: 0.21 },
    { id: 'yoga', label: 'Tapis de yoga', cost: 900, ref: 2_990, weight: 1, returns: 0.05, ship: 520, vat: 0.21 },
    { id: 'lampe', label: 'Lampe déco LED', cost: 1_100, ref: 3_490, weight: 1, returns: 0.06, ship: 480, vat: 0.21 },
    { id: 'chocolat', label: 'Coffret de pralines belges', cost: 800, ref: 2_490, weight: 1.1, returns: 0.01, ship: 450, vat: 0.06, season: { 11: 2.5, 1: 1.6, 3: 1.4 } },
    { id: 'bijou', label: 'Bracelet artisanal', cost: 600, ref: 2_990, weight: 0.8, returns: 0.07, ship: 300, vat: 0.21 },
    { id: 'jeu', label: 'Jeu de société', cost: 1_400, ref: 3_990, weight: 0.9, returns: 0.03, ship: 550, vat: 0.21, season: { 11: 2, 10: 1.3 } },
    { id: 'casque', label: 'Casque audio Bluetooth', cost: 1_800, ref: 5_990, weight: 0.9, returns: 0.09, ship: 520, vat: 0.21 },
    { id: 'sac', label: 'Sac à dos urbain', cost: 1_600, ref: 5_490, weight: 0.8, returns: 0.08, ship: 600, vat: 0.21, season: { 7: 1.6, 8: 1.4 } },
  ],

  roles: {
    logisticien: { id: 'logisticien', label: 'Logisticien·ne', baseSalary: 240_000, skillRange: [20, 80], orders: 70,
      desc: 'Prépare ≈ 70 commandes/jour.' },
    marketeur: { id: 'marketeur', label: 'Marketeur·se digital', baseSalary: 340_000, skillRange: [30, 90], cpcCut: 0.1, conv: 0.06,
      desc: 'Optimise les campagnes : coût par clic −10 %, conversion +6 % (max 2 comptent).' },
    service_client: { id: 'service_client', label: 'Service client', baseSalary: 245_000, skillRange: [20, 80], returnsCut: 0.2, sat: 6,
      desc: 'Moins de retours (−20 %) et des clients plus satisfaits.' },
  },

  fixedCosts: [
    { id: 'shop', label: 'Plateforme e-commerce', amount: 7_900, vat: 0.21, cat: 'logiciels' },
    { id: 'assurance', label: 'Assurance RC', amount: 3_500, vat: 0, cat: 'assurances' },
    { id: 'telecom', label: 'Internet & outils', amount: 5_000, perHead: 1_500, vat: 0.21, cat: 'logiciels' },
  ],

  upgrades: [
    { id: 'garage', cat: 'locaux', label: 'Garage de stockage', cost: 100_000, rent: 25_000, effects: { seats: 2, storageCut: 0.3 },
      desc: 'Plus de place pour le stock et 2 postes de travail.' },
    { id: 'entrepot', cat: 'locaux', label: 'Petit entrepôt', cost: 900_000, rent: 120_000, requires: ['garage'], effects: { seats: 6, ordersMult: 1.25, storageCut: 0.3 },
      desc: 'Préparation plus rapide (+25 %) et 6 postes de plus.' },
    { id: 'logistique_3pl', cat: 'locaux', label: 'Logisticien externe (3PL)', cost: 1_500_000, monthly: 40_000, requires: ['entrepot'], effects: { ordersAdd: 300, shipCut: 0.15, seats: 4 },
      desc: 'Un prestataire prépare 300 commandes/jour et négocie les transporteurs (−15 %).' },
    { id: 'imprimante', cat: 'materiel', label: 'Imprimante d’étiquettes & scanner', cost: 60_000, effects: { ordersMult: 1.15 },
      desc: '+15 % de commandes préparées par jour.' },
    { id: 'photo', cat: 'materiel', label: 'Studio photo produits', cost: 250_000, effects: { conv: 0.12 },
      desc: 'De belles photos : conversion +12 %.' },
    { id: 'slots1', cat: 'process', label: 'Élargir le catalogue (+2 produits)', cost: 200_000, effects: { slots: 2 },
      desc: 'Référencer 2 produits de plus.' },
    { id: 'slots2', cat: 'process', label: 'Catalogue complet (+4 produits)', cost: 600_000, requires: ['slots1'], effects: { slots: 4 },
      desc: 'Référencer tout le catalogue.' },
    { id: 'transporteurs', cat: 'process', label: 'Contrat transporteur négocié', cost: 150_000, effects: { shipCut: 0.15 },
      desc: '−15 % sur les frais d’expédition.' },
    { id: 'retours', cat: 'process', label: 'Guide des tailles & FAQ', cost: 80_000, effects: { returnsMult: 0.75 },
      desc: '−25 % de retours.' },
    { id: 'seo', cat: 'marque', label: 'Référencement naturel (SEO)', cost: 300_000, effects: { organicMult: 1.4 },
      desc: '+40 % de visiteurs gratuits.' },
    { id: 'avis', cat: 'marque', label: 'Widget d’avis clients vérifiés', cost: 120_000, monthly: 2_500, effects: { conv: 0.08, repTarget: 3 },
      desc: 'La preuve sociale rassure : conversion +8 %.' },
    { id: 'marque_propre', cat: 'marque', label: 'Ta propre marque', cost: 1_500_000, requires: ['seo'], minRep: 55, effects: { priceTolerance: 0.15, organicMult: 1.2 },
      desc: 'Les clients acceptent des prix 15 % plus élevés.' },
    { id: 'emailing', cat: 'automatisation', label: 'Emailing et fidélisation', cost: 250_000, monthly: 4_000, effects: { repeat: 0.15 },
      desc: '+15 % de commandes de clients fidèles (sans pub).' },
    { id: 'marketplace', cat: 'automatisation', label: 'Vendre aussi sur une marketplace', cost: 400_000, effects: { marketplace: 1 },
      desc: 'Beaucoup plus de visiteurs, mais 15 % de commission sur ces ventes.' },
    { id: 'reassort_auto', cat: 'automatisation', label: 'Réassort automatique intelligent', cost: 350_000, monthly: 3_000, effects: { smartReorder: 1 },
      desc: 'Les commandes fournisseur anticipent saisons et pics.' },
  ],
};
