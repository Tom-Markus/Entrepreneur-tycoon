// Succès (achievements). check(state) est évalué chaque fin de mois et après
// certaines actions. Les fonctions ne lisent que l'état (aucun effet de bord).

const revenue = (s) => s.finance.totals.revenue;
const profitMonths = (s, min) => s.finance.history.filter((h) => h.profit >= min).length;
const employees = (s) => s.staff.employees.length;
const inv = (s) => s.investments;
const portfolio = (s) => inv(s).etf.value + inv(s).stocks.value + inv(s).savings;
const years = (s) => s.time.day / 360;
const alive = (s) => s.status !== 'bankrupt';

export const ACHIEVEMENTS = [
  { id: 'premiere_vente', icon: '🪙', label: 'Premier client', desc: 'Encaisser ta première vente.', check: (s) => revenue(s) > 0 },
  { id: 'ca_10k', icon: '💶', label: '10 000 € de chiffre d’affaires', desc: 'Atteindre 10 000 € de CA cumulé.', check: (s) => revenue(s) >= 1_000_000 },
  { id: 'ca_100k', icon: '💰', label: '100 000 € de chiffre d’affaires', desc: 'Atteindre 100 000 € de CA cumulé.', check: (s) => revenue(s) >= 10_000_000 },
  { id: 'ca_1m', icon: '🏆', label: 'Le million', desc: 'Atteindre 1 000 000 € de CA cumulé.', check: (s) => revenue(s) >= 100_000_000 },
  { id: 'premier_employe', icon: '🤝', label: 'Premier engagement', desc: 'Recruter ton premier salarié.', check: (s) => (s.stats.hires || 0) >= 1 },
  { id: 'equipe_5', icon: '👥', label: 'Une vraie équipe', desc: 'Avoir 5 employés en même temps.', check: (s) => (s.stats.maxEmployees || 0) >= 5 },
  { id: 'equipe_10', icon: '🏢', label: 'PME', desc: 'Avoir 10 employés en même temps.', check: (s) => (s.stats.maxEmployees || 0) >= 10 },
  { id: 'formation', icon: '🎓', label: 'Investir dans les gens', desc: 'Former 5 fois un employé.', check: (s) => (s.stats.trainings || 0) >= 5 },
  { id: 'controle_fiscal', icon: '🧾', label: 'Comptes impeccables', desc: 'Sortir indemne d’un contrôle fiscal.', check: (s) => (s.stats.taxAuditsSurvived || 0) >= 1 },
  { id: 'inspection', icon: '🔍', label: 'Tout est en règle', desc: 'Réussir une inspection sociale.', check: (s) => (s.stats.socialAuditsSurvived || 0) >= 1 },
  { id: 'tva_payee', icon: '📅', label: 'Premier trimestre', desc: 'Payer ta première déclaration de TVA.', check: (s) => (s.stats.vatPaid || 0) >= 1 },
  { id: 'annee_1', icon: '🎂', label: 'Un an déjà', desc: 'Survivre à ta première année.', check: (s) => years(s) >= 1 && alive(s) },
  { id: 'annee_5', icon: '🗓', label: 'Cap des 5 ans', desc: 'Toujours là après 5 ans (la moitié des entreprises n’y arrivent pas).', check: (s) => years(s) >= 5 && alive(s) },
  { id: 'mois_5k', icon: '📈', label: 'Rentable', desc: 'Un mois avec 5 000 € de bénéfice.', check: (s) => profitMonths(s, 500_000) >= 1 },
  { id: 'mois_20k', icon: '🚀', label: 'Machine à cash', desc: 'Un mois avec 20 000 € de bénéfice.', check: (s) => profitMonths(s, 2_000_000) >= 1 },
  { id: 'remontada', icon: '🧗', label: 'Remontada', desc: 'Sortir d’une trésorerie négative.', check: (s) => (s.endgame?.recoveredFromNegative || 0) >= 1 },
  { id: 'pret_rembourse', icon: '🏦', label: 'Dette remboursée', desc: 'Rembourser entièrement un prêt bancaire.', check: (s) => (s.stats.loansRepaid || 0) >= 1 },
  { id: 'zero_dette', icon: '🕊', label: 'Libre de dettes', desc: 'Plus aucun prêt après en avoir eu.', check: (s) => (s.stats.loansTaken || 0) >= 1 && s.loans.length === 0 },
  { id: 'levee_fonds', icon: '🦄', label: 'Levée de fonds', desc: 'Faire entrer un investisseur au capital.', check: (s) => (s.stats.fundraises || 0) >= 1 },
  { id: 'dividende', icon: '🍾', label: 'Premier dividende', desc: 'Te verser un dividende (SRL).', check: (s) => (s.stats.dividendsTotal || 0) > 0 },
  { id: 'premier_placement', icon: '🌱', label: 'Premier placement', desc: 'Acheter ton premier ETF ou tes premières actions.', check: (s) => (s.stats.invested || 0) > 0 },
  { id: 'portefeuille_100k', icon: '📊', label: 'Portefeuille à 100 000 €', desc: 'Épargne + bourse ≥ 100 000 €.', check: (s) => portfolio(s) >= 10_000_000 },
  { id: 'immo_1', icon: '🏠', label: 'Propriétaire bailleur', desc: 'Acheter ton premier bien locatif.', check: (s) => (s.stats.propertiesBought || 0) >= 1 },
  { id: 'immo_3', icon: '🏘', label: 'Petit empire immobilier', desc: 'Posséder 3 biens en même temps.', check: (s) => inv(s).realEstate.length >= 3 },
  { id: 'passif_1000', icon: '🌤', label: '1 000 € de revenu passif', desc: 'Revenu passif mensuel ≥ 1 000 €.', check: (s) => (s.passive?.total || 0) >= 100_000 },
  { id: 'liberte', icon: '🏝', label: 'Liberté financière', desc: 'Atteindre ton objectif de revenu passif.', check: (s) => s.endgame?.wonDay != null },
  { id: 'sans_credit', icon: '💪', label: 'Sans l’aide des banques', desc: 'Atteindre la liberté financière sans jamais emprunter.', check: (s) => s.endgame?.wonDay != null && !(s.stats.loansTaken > 0) },
  { id: 'millionnaire', icon: '💎', label: 'Millionnaire', desc: 'Patrimoine net ≥ 1 000 000 €.', check: (s) => s.finance.history.some((h) => (h.netWorth || 0) >= 100_000_000) },
  { id: 'reputation_80', icon: '⭐', label: 'Réputation en or', desc: 'Réputation ≥ 80.', check: (s) => s.company.reputation >= 80 },
  { id: 'leader', icon: '👑', label: 'Leader du marché', desc: 'Part de marché ≥ 40 %.', check: (s) => s.company.share >= 0.4 },
  { id: 'concurrent_ko', icon: '🥊', label: 'Survivant', desc: 'Voir un concurrent faire faillite.', check: (s) => (s.stats.competitorsBankrupt || 0) >= 1 },
  { id: 'ameliorations_10', icon: '🔧', label: 'Toujours mieux', desc: 'Acheter 10 améliorations.', check: (s) => (s.stats.upgradesBought || 0) >= 10 },
  { id: 'retraite', icon: '🧘', label: 'Délégation réussie', desc: 'Te retirer de l’opérationnel au profit d’un gérant.', check: (s) => s.stats.retiredDay != null },
  { id: 'crise', icon: '🌪', label: 'Tempête traversée', desc: 'Survivre à une crise économique.', check: (s) => (s.stats.crisesSurvived || 0) >= 1 && alive(s) },
  { id: 'krach', icon: '📉', label: 'Mains de diamant', desc: 'Garder ses placements pendant un krach boursier.', check: (s) => (s.stats.crashes || 0) >= 1 && inv(s).etf.value + inv(s).stocks.value > 0 },
  { id: 'fidele', icon: '❤️', label: 'Fidélité', desc: 'Un employé avec 3 ans d’ancienneté.', check: (s) => s.staff.employees.some((e) => s.time.day - e.hiredDay >= 1080) },
  // Un par secteur
  { id: 'saas', icon: '☁️', label: 'Éditeur de logiciel', desc: 'Agence : mettre ton SaaS en ligne.', sector: 'agence', check: (s) => s.flags.saasLive === true },
  { id: 'friterie_300', icon: '🍟', label: 'Rush du samedi', desc: 'Friterie : servir 300 clients en une journée.', sector: 'restaurant', check: (s) => (s.sector.stats?.bestDay || 0) >= 300 },
  { id: 'afsca', icon: '😊', label: 'Smiley AFSCA', desc: 'Friterie : réussir 3 contrôles AFSCA.', sector: 'restaurant', check: (s) => (s.stats.afscaOk || 0) >= 3 },
  { id: 'ecom_100', icon: '📦', label: 'Cent colis', desc: 'E-commerce : 100 commandes en une journée.', sector: 'ecommerce', check: (s) => (s.sector.stats?.bestDay || 0) >= 100 },
  { id: 'artisan_50', icon: '🛠', label: 'Artisan reconnu', desc: 'Artisan : terminer 50 chantiers.', sector: 'artisan', check: (s) => (s.sector.stats?.jobsDone || 0) >= 50 },
  { id: 'soutien_90', icon: '🎯', label: 'Taux de réussite record', desc: 'Soutien scolaire : 90 % de réussite à une session.', sector: 'soutien', check: (s) => (s.sector.stats?.bestSuccess || 0) >= 0.9 },
];
