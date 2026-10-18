// Noms, caractères et rôles communs des employés.

export const FIRST_NAMES = [
  'Lucas', 'Emma', 'Noah', 'Louise', 'Arthur', 'Olivia', 'Jules', 'Mila', 'Adam', 'Alice',
  'Liam', 'Léa', 'Victor', 'Lina', 'Nathan', 'Juliette', 'Mohamed', 'Inès', 'Thomas', 'Sarah',
  'Wout', 'Lotte', 'Sem', 'Fien', 'Yasmine', 'Elif', 'Mehdi', 'Kevin', 'Laura', 'Julie',
  'Maxime', 'Manon', 'Robin', 'Chloé', 'Hugo', 'Zoé', 'Bram', 'Nina', 'Amir', 'Camille',
  'Sacha', 'Margaux', 'Ibrahim', 'Charlotte', 'Tom', 'Elena', 'Simon', 'Aya', 'Jasper', 'Nour',
];

export const LAST_NAMES = [
  'Peeters', 'Janssens', 'Maes', 'Jacobs', 'Dubois', 'Lambert', 'Dupont', 'Martin', 'Claes', 'Goossens',
  'Wouters', 'De Smet', 'Mertens', 'Willems', 'Leclercq', 'Renard', 'Simon', 'Laurent', 'Lejeune', 'Hermans',
  'El Amrani', 'Benali', 'Yilmaz', 'Nowak', 'Dumont', 'Michel', 'François', 'Lemaire', 'Van Damme', 'Declercq',
  'Wauters', 'Pirlot', 'Delvaux', 'Collignon', 'Fontaine', 'Gilson', 'Mahieu', 'Bastin', 'Diallo', 'Rossi',
];

/**
 * Caractères. Multiplicateurs : prod (productivité), quality (qualité),
 * resign (risque de démission), motivation (bonus de motivation cible),
 * learn (gain de formation).
 */
export const TRAITS = {
  fiable: { label: 'Fiable', desc: 'Régulier, rarement absent.', prod: 1.03, quality: 1.02, resign: 0.7, motivation: 4, learn: 1 },
  rapide: { label: 'Rapide', desc: 'Abat beaucoup de travail, parfois au détriment de la finition.', prod: 1.15, quality: 0.94, resign: 1, motivation: 0, learn: 1 },
  perfectionniste: { label: 'Perfectionniste', desc: 'Travail impeccable mais plus lent.', prod: 0.9, quality: 1.12, resign: 1, motivation: 0, learn: 1 },
  raleur: { label: 'Râleur', desc: 'Compétent mais plombe l’ambiance.', prod: 1, quality: 1, resign: 1.3, motivation: -8, learn: 1, teamMorale: -3 },
  ambitieux: { label: 'Ambitieux', desc: 'Progresse vite, part si on ne l’augmente pas.', prod: 1.05, quality: 1, resign: 1.6, motivation: -2, learn: 1.6 },
  loyal: { label: 'Loyal', desc: 'Reste dans les moments difficiles.', prod: 1, quality: 1, resign: 0.35, motivation: 6, learn: 0.9 },
  creatif: { label: 'Créatif', desc: 'Idées originales, qualité en hausse.', prod: 0.97, quality: 1.08, resign: 1.1, motivation: 2, learn: 1.1 },
  distrait: { label: 'Distrait', desc: 'Sympathique mais fait des erreurs.', prod: 0.9, quality: 0.93, resign: 0.9, motivation: 3, learn: 0.9 },
};

/** Rôle commun à tous les secteurs. */
export const COMMON_ROLES = {
  gerant: {
    id: 'gerant',
    label: 'Gérant·e',
    baseSalary: 450_000,
    skillRange: [45, 90],
    max: 1,
    desc: 'Dirige l’opérationnel. Indispensable pour te retirer et transformer l’entreprise en revenu passif. +5 % de productivité d’équipe.',
  },
};

export const COMPETITOR_NAMES = {
  agence: ['PixelForge', 'WebWallonie', 'Studio Atomium', 'CodeBrabant', 'Digitaal & Co', 'Agence Meuse', 'ByteBrussels', 'Nébuleuse Web'],
  restaurant: ['Fritkot Manneken', 'Chez Raymond', 'La Baraque à Frites', 'Snack Atomium', 'Friterie de la Gare', 'Burger Bruxellois', 'Le Cornet d’Or', 'Frituur Sint-Jan'],
  ecommerce: ['BelgaShop', 'Boutik.be', 'Colis & Cie', 'Webwinkel Plus', 'MegaDeal BE', 'Panier Futé', 'ShopLiège', 'Clic & Gaufre'],
  artisan: ['Plomberie Dumont', 'Élec Services', 'Renov’Pro', 'Techni-Habitat', 'Dépann’Express', 'Installateurs Réunis', 'Maes & Fils', 'Chauffage Lemaire'],
  soutien: ['Cap Réussite', 'Blocus Academy', 'Les Profs du Quartier', 'Studia Plus', 'Remédiation & Co', 'Bulle d’Étude', 'Skolar', 'Objectif CEB'],
};
