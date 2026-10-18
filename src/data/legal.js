// Statuts juridiques proposés à la création. Détails chiffrés dans fiscalite.js.

export const LEGAL = {
  independant: {
    id: 'independant',
    label: 'Indépendant (personne physique)',
    pros: [
      'Démarrage rapide et bon marché (≈ 110 € d’inscription)',
      'Comptable moins cher (≈ 90 €/mois)',
      'Tu prélèves librement sur le compte pro',
    ],
    cons: [
      'Bénéfice taxé à l’IPP (jusqu’à 50 %)',
      'Responsabilité illimitée : ton patrimoine perso répond des dettes',
      'Moins crédible : crédit plus cher, pas d’investisseurs',
    ],
  },
  srl: {
    id: 'srl',
    label: 'Société (SRL)',
    pros: [
      'Impôt des sociétés : 20 % sur les premiers 100 000 € (sous conditions)',
      'Responsabilité limitée : ton patrimoine perso est protégé',
      'Plus crédible : clients B2B, banques, investisseurs',
    ],
    cons: [
      'Création plus chère (notaire ≈ 1 500 €), comptable ≈ 225 €/mois',
      'Pour sortir l’argent : rémunération (IPP) ou dividendes (précompte)',
      'Rémunération ≥ 50 000 €/an exigée pour le taux réduit',
    ],
  },
};
