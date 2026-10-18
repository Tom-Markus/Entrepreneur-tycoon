// Niveaux de difficulté. Montants en centimes.

export const DIFFICULTIES = {
  facile: {
    id: 'facile',
    label: 'Facile',
    description: 'Gros capital de départ, événements rares et doux, concurrents tranquilles.',
    startingCapital: 3_500_000, // 35 000 €
    eventFrequency: 0.7,
    eventSeverity: 0.7,
    competitorAggression: 0.7,
    competitorCount: [2, 2],
    taxRigor: 0.5, // probabilité relative des contrôles et sévérité des amendes
    passiveTarget: 200_000, // 2 000 €/mois
    graceDays: 75,
    marketMult: 1.15,
    scoreMult: 0.8,
  },
  normal: {
    id: 'normal',
    label: 'Normal',
    description: "L'expérience prévue : il faut gérer sa trésorerie, mais on pardonne quelques erreurs.",
    startingCapital: 2_000_000, // 20 000 €
    eventFrequency: 1,
    eventSeverity: 1,
    competitorAggression: 1,
    competitorCount: [2, 3],
    taxRigor: 1,
    passiveTarget: 300_000, // 3 000 €/mois
    graceDays: 60,
    marketMult: 1,
    scoreMult: 1,
  },
  realiste: {
    id: 'realiste',
    label: 'Réaliste',
    description: 'Capital modeste, fisc rigoureux, concurrence réelle. La majorité des entreprises ne survivent pas.',
    startingCapital: 1_200_000, // 12 000 €
    eventFrequency: 1.1,
    eventSeverity: 1.15,
    competitorAggression: 1.15,
    competitorCount: [3, 3],
    taxRigor: 1.2,
    passiveTarget: 300_000,
    graceDays: 45,
    marketMult: 0.92,
    scoreMult: 1.25,
  },
  difficile: {
    id: 'difficile',
    label: 'Difficile',
    description: 'Presque rien en poche, des événements durs, des concurrents agressifs. Pour les experts.',
    startingCapital: 600_000, // 6 000 €
    eventFrequency: 1.35,
    eventSeverity: 1.35,
    competitorAggression: 1.35,
    competitorCount: [3, 4],
    taxRigor: 1.5,
    passiveTarget: 350_000, // 3 500 €/mois
    graceDays: 30,
    marketMult: 0.85,
    scoreMult: 1.5,
  },
};

export const DIFFICULTY_ORDER = ['facile', 'normal', 'realiste', 'difficile'];
