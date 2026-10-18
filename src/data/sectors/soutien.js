// Secteur 5 — Centre de soutien scolaire. Montants en centimes.
//
// Mécanique : le RYTHME SCOLAIRE (Fédération Wallonie-Bruxelles). Les élèves
// s'inscrivent à la rentrée et avant les examens, partent en fin d'année ; la
// réputation dépend des RÉSULTATS aux sessions de janvier et de juin ; la
// taille des groupes arbitre entre capacité et réussite.

export const SOUTIEN = {
  id: 'soutien',
  label: 'Soutien scolaire',
  icon: 'book',
  tagline: 'Remédiation, blocus et stages pour élèves du secondaire.',
  description:
    'Les élèves paient un abonnement mensuel. Ils arrivent à la rentrée et avant les examens, et partent en été. Tes résultats aux sessions de janvier et juin font ta réputation : petits groupes et bons profs = réussite, mais coût élevé.',
  b2c: true,
  vatRate: 0.21, // voir fiscalite.js : exemption possible selon les cas, le jeu prend 21 %
  startCostExtra: 300_000, // tableaux, tables, manuels
  homeSeats: 4, // enseignants (temps partiel) dans le local de départ
  staffSeatKey: 'staffSeats',

  refPrice: 19_000, // abonnement mensuel de référence TTC : 190 € (≈ 12 h de cours en groupe)
  minPrice: 5_000,
  maxPrice: 50_000,
  elasticity: 1.5,
  marketingRef: 40_000,

  // Nouvelles familles qui cherchent un soutien, par mois, sur le marché local
  marketPool: 140,
  seasonality: [1.1, 0.8, 0.9, 1, 1.4, 1.1, 0.25, 0.7, 2.2, 1.2, 1.1, 1.3],
  churnMonthly: 0.045,
  yearEndChurn: 0.6, // départ massif fin juin
  examMonths: [0, 5], // sessions de fin janvier et fin juin
  groupSize: { min: 3, max: 12, default: 6 },
  slotsPerTeacher: 5, // groupes par enseignant (le nombre d'élèves = groupes × taille)
  founderSlots: 7, // le fondateur enseigne à temps plein
  baseSeats: 40, // places dans le local de départ
  materialPerStudent: 400, // fournitures/mois
  stage: { price: 18_000, month: [6, 7], pool: 70 }, // stages d'été (si amélioration)

  roles: {
    etudiant: { id: 'etudiant', label: 'Étudiant·e jobiste', baseSalary: 120_000, skillRange: [25, 65], slots: 3, teach: true, flex: true,
      desc: 'Contrat étudiant payé à l’heure : coûte selon le remplissage (3 groupes), résultats moyens.' },
    enseignant: { id: 'enseignant', label: 'Enseignant·e diplômé·e', baseSalary: 230_000, skillRange: [50, 90], slots: 6, teach: true, flex: true,
      desc: 'Payé à l’heure de cours donnée (coûte selon le remplissage), cher mais efficace (6 groupes).' },
    coordinateur: { id: 'coordinateur', label: 'Coordinateur·rice pédagogique', baseSalary: 320_000, skillRange: [45, 90], max: 1, success: 0.05,
      desc: 'Suivi des élèves et lien avec les parents : +5 points de réussite, moins de départs.' },
  },

  fixedCosts: [
    { id: 'loyer', label: 'Loyer (local de quartier)', amount: 85_000, vat: 0, cat: 'loyer' },
    { id: 'assurance', label: 'Assurance RC & accidents', amount: 5_500, vat: 0, cat: 'assurances' },
    { id: 'logiciel', label: 'Plateforme d’inscription & suivi', amount: 4_000, perHead: 800, vat: 0.21, cat: 'logiciels' },
  ],

  upgrades: [
    { id: 'salle2', cat: 'locaux', label: 'Deuxième salle de cours', cost: 400_000, rent: 45_000, effects: { seats: 25, staffSeats: 4 },
      desc: '+25 élèves possibles.' },
    { id: 'centre', cat: 'locaux', label: 'Centre en centre-ville', cost: 2_200_000, rent: 180_000, requires: ['salle2'], effects: { seats: 90, staffSeats: 12, attraction: 0.1 },
      desc: '+90 élèves, adresse prestigieuse.' },
    { id: 'antenne', cat: 'locaux', label: 'Antenne dans une 2e ville', cost: 3_500_000, rent: 150_000, requires: ['centre'], minRep: 60, effects: { seats: 80, staffSeats: 10, marketMult: 1.7 },
      desc: '+70 % de marché.' },
    { id: 'tableaux', cat: 'materiel', label: 'Tableaux interactifs', cost: 300_000, effects: { success: 0.03, attraction: 0.03 },
      desc: 'Cours plus vivants : +3 points de réussite.' },
    { id: 'tablettes', cat: 'materiel', label: 'Tablettes et exerciseurs', cost: 450_000, monthly: 3_000, effects: { success: 0.03 },
      desc: 'Entraînement personnalisé.' },
    { id: 'methode', cat: 'process', label: 'Méthode de remédiation éprouvée', cost: 250_000, effects: { success: 0.05 },
      desc: '+5 points de réussite aux examens.' },
    { id: 'suivi_parents', cat: 'process', label: 'Bulletin de suivi pour les parents', cost: 120_000, effects: { churnMult: 0.75, repTarget: 3 },
      desc: '−25 % de désinscriptions en cours d’année.' },
    { id: 'stages', cat: 'process', label: 'Stages de vacances', cost: 200_000, effects: { stages: 1 },
      desc: 'Remplis l’été avec des stages intensifs (juillet-août).' },
    { id: 'blocus', cat: 'process', label: 'Sessions « blocus » avant examens', cost: 150_000, effects: { examBoost: 0.4 },
      desc: '+40 % d’inscriptions en décembre et en mai.' },
    { id: 'flyers', cat: 'marque', label: 'Partenariat avec les associations de parents', cost: 100_000, effects: { attraction: 0.06 },
      desc: 'Bouche-à-oreille des parents : +6 % d’attractivité.' },
    { id: 'temoignages', cat: 'marque', label: 'Site avec témoignages et taux de réussite', cost: 220_000, effects: { attraction: 0.08, resultsVisible: 1 },
      desc: 'Tes bons résultats attirent encore plus d’élèves.' },
    { id: 'en_ligne', cat: 'automatisation', label: 'Cours en ligne hybrides', cost: 900_000, monthly: 8_000, effects: { seats: 40, marketMult: 1.25, slotsMult: 1.2 },
      desc: '+40 places virtuelles, +25 % de marché, profs plus efficaces.' },
  ],
};
