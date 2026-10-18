// Stratégies des concurrents IA.
// priceIdx = prix / prix de référence ; mkt = budget marketing en multiple du budget de référence.

export const STRATEGIES = {
  lowcost: {
    id: 'lowcost', label: 'Bas prix', desc: 'Casse les prix, qualité moyenne. Baisse encore ses prix si tu lui prends des clients.',
    priceIdx: 0.8, quality: 0.85, mkt: 0.8, rep: 40, margin: 0.18, promoChance: 0.06,
  },
  premium: {
    id: 'premium', label: 'Premium', desc: 'Cher mais excellent, soigne sa réputation.',
    priceIdx: 1.3, quality: 1.25, mkt: 1, rep: 55, margin: 0.32, promoChance: 0.02,
  },
  marketing: {
    id: 'marketing', label: 'Agressif en marketing', desc: 'Gros budget publicitaire et promotions fréquentes.',
    priceIdx: 0.98, quality: 0.95, mkt: 3, rep: 45, margin: 0.2, promoChance: 0.16,
  },
  suiveur: {
    id: 'suiveur', label: 'Suiveur', desc: 'Copie tes prix et ta qualité avec un temps de retard.',
    priceIdx: 1, quality: 1, mkt: 1.2, rep: 45, margin: 0.22, promoChance: 0.05,
  },
};

export const COMPETITOR_PARAMS = {
  startCashMonths: 6, // trésorerie de départ en mois de CA estimé
  bankruptCashMonths: -3, // faillite sous -3 mois de CA
  respawnDays: [150, 400], // délai avant l'arrivée d'un nouvel entrant
  promoDays: 14,
  promoDiscount: 0.82,
};
