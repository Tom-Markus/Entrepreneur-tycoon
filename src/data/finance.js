// Paramètres de financement (banque, investisseurs). Montants en centimes. [approx]
// Les taux sont indicatifs (marché belge 2025-2026 pour un crédit professionnel
// de PME : ≈ 4 à 7 %) et évoluent avec le « taux directeur » du jeu.

export const FINANCE = {
  loan: {
    baseSpread: 0.025, // marge de la banque au-dessus du taux directeur
    independantPremium: 0.005, // personne physique : un peu plus cher
    minMonths: 12,
    maxMonths: 84,
    startupMax: { independant: 1_500_000, srl: 2_500_000 }, // prêt de démarrage sans historique
    revenueMultiple: 6, // plafond ≈ 6 mois de CA moyen
    maxTotalDebt: 50_000_000,
    maxDebtServiceShare: 0.35, // mensualités ≤ 35 % du CA mensuel moyen
    earlyRepaymentMonthsOfInterest: 3, // indemnité de remploi (simplifiée)
  },
  investor: {
    // Valorisation pré-money ≈ max(CA annuel × 1, bénéfice annuel × 6)
    revenueMultiple: 1,
    profitMultiple: 6,
    minValuation: 5_000_000,
    stakes: [0.1, 0.15, 0.2, 0.25],
    maxInvestorShare: 0.49,
    expectedYield: 0.05, // dividende annuel attendu (% de l'investissement)
    offerDays: 30,
  },
};
