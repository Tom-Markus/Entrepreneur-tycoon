// Étapes du tutoriel de premier lancement. `tab` = onglet à ouvrir, `target` = sélecteur CSS à mettre en évidence.

export const TUTORIAL = [
  { title: 'Bienvenue, entrepreneur !', text: 'Ton objectif : faire grandir ton entreprise, survivre au fisc, puis construire des revenus passifs jusqu’à la liberté financière. Le jeu est en pause : prends ton temps.', target: null },
  { title: 'La barre du haut', text: 'Ta trésorerie (compte pro), ton compte perso, ta réputation et ton revenu passif face à l’objectif. Si la trésorerie passe sous le découvert autorisé, un compte à rebours de faillite démarre.', target: '.topbar' },
  { title: 'Le temps', text: 'Pause, ×1, ×2, ×4. Un mois dure une minute à ×1. Raccourcis : Espace = pause, 1/2/3 = vitesses.', target: '.tb-speed' },
  { title: 'Ton entreprise', text: 'Ici tu fixes tes prix, ton marketing et tu achètes des améliorations. Chaque secteur a ses propres leviers.', target: '#panel', tab: 'entreprise' },
  { title: 'Pourquoi mes ventes ?', text: 'Ce panneau montre chaque facteur qui pousse ta demande vers le haut ou vers le bas, et le goulet d’étranglement actuel.', target: '.why' },
  { title: 'Les finances', text: 'Attention à la TVA du trimestre et aux impôts : ils arrivent après l’encaissement. Les « ? » ouvrent le glossaire.', target: '#panel', tab: 'finances' },
  { title: 'C’est parti !', text: 'Commence petit, surveille ta trésorerie, recrute quand tu es saturé. Bonne chance ! Tu peux revoir ce tutoriel dans le menu ☰.', target: null, tab: 'entreprise' },
];
