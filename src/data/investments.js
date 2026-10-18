// Placements du compte personnel. Rendements SIMULÉS (pas des prévisions !).
// Les frais et taxes viennent de fiscalite.js. Montants en centimes.

export const INVESTMENTS = {
  savings: {
    label: 'Compte d’épargne réglementé',
    // [approx] taux de base + prime de fidélité ≈ 0,55 × taux directeur + 0,4 %
    rateFromBase: 0.55,
    rateAdd: 0.004,
  },
  etf: {
    label: 'ETF actions monde (capitalisant)',
    annualReturn: 0.07, // [approx] moyenne historique long terme des actions mondiales
    annualVol: 0.15,
    brokerFee: 0.001, // frais de courtage
    brokerMin: 100,
  },
  stocks: {
    label: 'Panier d’actions individuelles',
    annualReturn: 0.08,
    annualVol: 0.25,
    beta: 1.1, // sensibilité au marché
    dividendYield: 0.025,
    brokerFee: 0.002,
    brokerMin: 200,
  },
  crash: {
    monthlyProb: 0.004, // ≈ un krach tous les 20 ans
    drop: [0.18, 0.35],
  },
  safeWithdrawalRate: 0.04, // règle des 4 % (revenu passif « bourse »)
  realEstate: {
    mortgageSpread: 0.013, // taux hypothécaire = taux directeur + 1,3 % [approx]
    mortgageYears: 20,
    minDownPayment: 0.2, // apport minimum (hors frais)
    appreciation: 0.02, // hausse annuelle moyenne des prix [approx]
    appreciationVol: 0.03,
    maintenancePct: 0.01, // entretien annuel (% de la valeur)
    vacancyProbYearly: 0.15, // probabilité qu'un locataire parte dans l'année
    vacancyMonths: [1, 3],
    sellFeePct: 0.03, // agence immobilière à la revente
    rentIndexation: 0.02, // indexation annuelle des loyers
    catalog: [
      { id: 'studio', label: 'Studio à Liège', price: 14_500_000, rent: 65_000 },
      { id: 'appart', label: 'Appartement 2 chambres à Namur', price: 23_000_000, rent: 95_000 },
      { id: 'maison', label: 'Maison 3 façades à Charleroi', price: 21_000_000, rent: 105_000, maintenance: 0.015 },
      { id: 'ixelles', label: 'Appartement à Ixelles (Bruxelles)', price: 34_000_000, rent: 135_000 },
      { id: 'immeuble', label: 'Immeuble de rapport (4 logements) à Mons', price: 62_000_000, rent: 300_000, maintenance: 0.015 },
    ],
  },
};
