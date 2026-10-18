// Conseils pédagogiques du post-mortem, par cause de faillite.

export const ADVICE = {
  tva: {
    title: 'La TVA du trimestre',
    advice:
      'La TVA que tu factures n’est pas à toi : tu la collectes pour l’État et tu la reverses chaque trimestre. Mets-la de côté dès l’encaissement (un compte séparé est idéal). Regarde « TVA à reverser » dans l’onglet Finances.',
  },
  impot: {
    title: 'L’impôt annuel',
    advice:
      'L’impôt sur le bénéfice arrive des mois après la fin de l’année. Une année rentable crée une grosse facture l’année suivante. Provisionne environ 30 à 40 % du bénéfice (l’estimation est affichée dans Finances).',
  },
  cotisations: {
    title: 'Les cotisations sociales',
    advice:
      'Les cotisations provisoires d’un starter sont basses, puis régularisées sur ton revenu réel : le rattrapage peut être violent. Augmente tes provisionnelles quand ton bénéfice grimpe.',
  },
  rentabilite: {
    title: 'Une activité pas rentable',
    advice:
      'Tes charges dépassaient tes recettes. Vérifie ta marge : prix trop bas, coûts fixes trop élevés ou capacité inutilisée. Le panneau « Pourquoi ? » montre ce qui freine la demande.',
  },
  salaires: {
    title: 'Une masse salariale trop lourde',
    advice:
      'Un salarié coûte environ 1,35 fois son brut. Recrute quand la demande dépasse durablement ta capacité, pas avant, et vérifie que chaque poste rapporte plus qu’il ne coûte.',
  },
  dette: {
    title: 'Le poids de la dette',
    advice:
      'Les mensualités d’un prêt tombent même quand les ventes baissent. Emprunte pour un investissement qui rapporte, avec une mensualité couverte au moins 1,5 fois par ton bénéfice.',
  },
  stock: {
    title: 'Trop d’argent dans le stock',
    advice:
      'Le stock, c’est du cash immobilisé. Commande au rythme des ventes et surveille les ruptures ET les invendus.',
  },
  investissement: {
    title: 'Des investissements trop rapides',
    advice:
      'Une amélioration se rentabilise sur des mois. Garde une réserve de trésorerie (2-3 mois de charges) avant d’investir.',
  },
  imprevus: {
    title: 'Des imprévus non couverts',
    advice:
      'Amendes, pannes et litiges arrivent toujours. Une réserve de sécurité et des process solides (comptable, hygiène, contrats) limitent la casse.',
  },
  prelevements: {
    title: 'Des prélèvements trop élevés',
    advice:
      'Tu t’es payé plus que ce que l’entreprise gagnait. Ajuste ta rémunération au bénéfice réel, surtout les premières années.',
  },
  impayes: {
    title: 'Des clients qui ne paient pas',
    advice:
      'Un chiffre d’affaires non encaissé ne paie pas les factures. Demande un acompte, relance vite et évite de dépendre d’un seul gros client.',
  },
  demande: {
    title: 'Une demande en chute',
    advice:
      'Ton chiffre d’affaires a fortement baissé. Surveille la concurrence (onglet Marché), ta réputation et la saisonnalité, et réduis tes charges dès les premiers signes.',
  },
};
