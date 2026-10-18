// =============================================================================
//  Événements aléatoires (82). Effets DÉCLARATIFS interprétés par
//  src/engine/events.js. Montants en centimes ; un montant peut être relatif :
//  { of: 'revenue'|'cash'|'payroll', f: facteur, min, max }.
//
//  Champs : id, title, text, kind ('good'|'bad'|'neutral'), weight, cooldown
//  (jours), sectors, legal, minDay, once, when(state), target ('employee',
//  'keyEmployee', 'competitor'), choices [{label, effects}] OU effects,
//  botChoice (choix « raisonnable » utilisé par les bots), chainOnly.
//
//  Types d'effets : cash, personal, rep, sat, mod {key, mult, days}, motivation,
//  loseEmployee, employeeSkill, employeeRaise, employeeAbsent, salaryIndex,
//  candidate, fixedCost, chain {id, days}, flag, flagUntil, economyTrend,
//  baseRate, competitorPromo, competitorBankrupt, newCompetitor, investorOffer,
//  founderEnergy, stat, sector {op…}, chance {p, success, fail}, log.
// =============================================================================

export const EVENT_PARAMS = {
  dailyChance: 0.05, // probabilité quotidienne de base (× fréquence de la difficulté)
  minGapDays: 7, // délai minimal entre deux événements aléatoires
  firstEventDay: 25, // pas d'événement aléatoire le premier mois
  defaultCooldown: 360,
};

const REV = (f, min, max) => ({ of: 'revenue', f, min, max });
const cash = (amount, cat) => ({ t: 'cash', amount, cat });
const rep = (v) => ({ t: 'rep', v });
const mod = (key, mult, days, label) => ({ t: 'mod', key, mult, days, label });
const chance = (p, success, fail, successText, failText) => ({ t: 'chance', p, success, fail, successText, failText });

const hasEmployees = (s) => s.staff.employees.length > 0;

export const EVENTS = [
  // ===========================================================================
  //  COMMUNS
  // ===========================================================================
  {
    id: 'bouche_a_oreille', kind: 'good', weight: 3, cooldown: 120,
    title: 'Bon bouche-à-oreille',
    text: 'Des clients satisfaits parlent de toi autour d’eux. Les demandes affluent.',
    when: (s) => s.company.satisfaction > 62,
    effects: [rep(3), mod('demand', 1.15, 30, 'Bouche-à-oreille')],
  },
  {
    id: 'avis_negatif', kind: 'bad', weight: 2, cooldown: 200,
    title: 'Avis négatif viral',
    text: 'Un client mécontent publie un avis cinglant qui fait le tour des réseaux sociaux locaux.',
    botChoice: 1,
    choices: [
      { label: 'Ignorer, ça passera', effects: [rep(-6), mod('demand', 0.85, 30, 'Avis viral')] },
      { label: 'Répondre publiquement et offrir un geste commercial', effects: [cash(-25_000, 'evenements'), rep(-2), mod('demand', 0.95, 15, 'Avis viral')] },
      { label: 'Menacer de porter plainte', effects: [chance(0.3, [rep(1)], [rep(-10), mod('demand', 0.8, 45, 'Effet Streisand')], 'L’auteur retire son avis.', 'Effet Streisand : l’affaire prend de l’ampleur !')] },
    ],
  },
  {
    id: 'panne_informatique', kind: 'bad', weight: 2, cooldown: 240,
    title: 'Panne informatique',
    text: 'Ton ordinateur principal rend l’âme en plein rush.',
    botChoice: 0,
    choices: [
      { label: 'Racheter tout de suite du matériel (1 200 €)', effects: [cash(-120_000, 'materiel'), mod('productivity', 0.95, 3, 'Panne informatique')] },
      { label: 'Bricoler avec un vieux PC', effects: [mod('productivity', 0.75, 20, 'Vieux PC')] },
    ],
  },
  {
    id: 'hausse_energie', kind: 'bad', weight: 1.5, cooldown: 360,
    title: 'Flambée des prix de l’énergie',
    text: 'Les prix du gaz et de l’électricité s’envolent sur les marchés européens.',
    effects: [mod('energy', 1.6, 120, 'Prix de l’énergie')],
  },
  {
    id: 'greve_nationale', kind: 'bad', weight: 1.5, cooldown: 180,
    title: 'Grève nationale',
    text: 'Les syndicats bloquent le pays une journée : transports à l’arrêt, clients absents.',
    effects: [mod('demand', 0.6, 2, 'Grève nationale'), mod('productivity', 0.7, 2, 'Grève nationale')],
  },
  {
    id: 'controle_fiscal', kind: 'bad', weight: 1, cooldown: 720, minDay: 400,
    title: 'Contrôle fiscal',
    text: 'Le SPF Finances t’annonce un contrôle de tes comptes des deux dernières années.',
    botChoice: 1,
    choices: [
      {
        label: 'Coopérer avec ton comptable habituel',
        effects: [chance(0.6, [{ t: 'stat', key: 'taxAuditsSurvived' }], [cash(REV(0.25, 80_000, 2_500_000), 'amendes'), rep(-2)], 'Contrôle sans redressement : tes comptes sont propres.', 'Redressement fiscal : quelques dépenses rejetées et une amende.')],
      },
      {
        label: 'Engager un fiscaliste spécialisé (1 800 €)',
        effects: [cash(-180_000, 'comptable'), chance(0.88, [{ t: 'stat', key: 'taxAuditsSurvived' }], [cash(REV(0.12, 50_000, 1_200_000), 'amendes')], 'Ton fiscaliste défend parfaitement le dossier.', 'Malgré le fiscaliste, un petit redressement.')],
      },
    ],
  },
  {
    id: 'inspection_sociale', kind: 'bad', weight: 1, cooldown: 720, minDay: 200,
    title: 'Inspection sociale (ONSS)',
    text: 'Les inspecteurs sociaux vérifient tes contrats, horaires et déclarations Dimona.',
    when: hasEmployees,
    effects: [chance(0.7, [{ t: 'stat', key: 'socialAuditsSurvived' }], [cash({ of: 'payroll', f: 0.4, min: 60_000, max: 1_500_000 }, 'amendes')], 'Inspection sociale : tout est en ordre.', 'Inspection sociale : irrégularités dans les horaires, amende administrative.')],
  },
  {
    id: 'subvention_regionale', kind: 'good', weight: 1.2, cooldown: 540, minDay: 120,
    title: 'Aide régionale à l’investissement',
    text: 'La Région propose une prime aux PME qui investissent. Le dossier est long à monter.',
    botChoice: 0,
    choices: [
      { label: 'Monter le dossier (10 jours de ton temps)', effects: [{ t: 'founderEnergy', v: -10 }, mod('productivity', 0.9, 10, 'Dossier de subvention'), { t: 'chain', id: 'subvention_versee', days: 75, hint: 'Réponse dans ≈ 2,5 mois (75 % de chances).' }] },
      { label: 'Laisser tomber', effects: [] },
    ],
  },
  {
    id: 'subvention_versee', kind: 'good', chainOnly: true,
    title: 'Réponse de la Région',
    text: 'L’administration régionale a examiné ton dossier.',
    effects: [chance(0.75, [cash({ of: 'revenue', f: 0.5, min: 200_000, max: 1_500_000 }, 'subvention')], [], 'Prime accordée et versée sur ton compte !', 'Dossier refusé : critères non remplis.')],
  },
  {
    id: 'crise_economique', kind: 'bad', weight: 0.6, cooldown: 1800, minDay: 360,
    title: 'Crise économique',
    text: 'Récession en Europe : les ménages et les entreprises serrent la ceinture.',
    effects: [{ t: 'economyTrend', v: -0.004 }, mod('demand', 0.85, 240, 'Récession'), { t: 'flag', key: 'crisis' }, { t: 'chain', id: 'reprise_economique', days: 300 }],
  },
  {
    id: 'reprise_economique', kind: 'good', weight: 0.5, cooldown: 900,
    title: 'Reprise économique',
    text: 'La confiance revient, les carnets de commandes se remplissent.',
    when: (s) => s.world.economy < 1.02,
    effects: [{ t: 'economyTrend', v: 0.003 }, mod('demand', 1.08, 120, 'Reprise'), { t: 'stat', key: 'crisesSurvived' }],
  },
  {
    id: 'canicule', kind: 'neutral', weight: 1.2, cooldown: 300,
    title: 'Canicule',
    text: 'Plus de 35 °C pendant une semaine. Tout le monde tourne au ralenti.',
    when: (s) => [5, 6, 7].includes(Math.floor((s.time.day % 360) / 30)),
    effects: [mod('productivity', 0.85, 7, 'Canicule'), { t: 'sector', op: 'heatwave' }],
  },
  {
    id: 'vague_froid', kind: 'neutral', weight: 1.2, cooldown: 300,
    title: 'Vague de froid',
    text: 'Gel intense et neige : les routes sont glissantes, les chaudières lâchent.',
    when: (s) => [0, 1, 11].includes(Math.floor((s.time.day % 360) / 30)),
    effects: [mod('energy', 1.3, 20, 'Grand froid'), { t: 'sector', op: 'coldwave' }],
  },
  {
    id: 'inondation', kind: 'bad', weight: 0.5, cooldown: 1080,
    title: 'Inondation',
    text: 'Des pluies diluviennes inondent ton rez-de-chaussée.',
    botChoice: 0,
    choices: [
      { label: 'Faire appel à l’assurance (franchise 600 €)', effects: [cash(-60_000, 'evenements'), mod('capacity', 0.6, 10, 'Inondation'), mod('demand', 0.8, 10, 'Inondation')] },
      { label: 'Tout nettoyer toi-même', effects: [{ t: 'founderEnergy', v: -20 }, mod('capacity', 0.5, 20, 'Inondation'), cash(-20_000, 'evenements')] },
    ],
  },
  {
    id: 'cambriolage', kind: 'bad', weight: 0.8, cooldown: 720,
    title: 'Cambriolage',
    text: 'Des voleurs sont passés cette nuit : matériel et caisse envolés.',
    botChoice: 0,
    choices: [
      { label: 'Déclarer à l’assurance (franchise 400 €)', effects: [cash(-40_000, 'evenements'), mod('productivity', 0.9, 5, 'Cambriolage')] },
      { label: 'Installer en plus une alarme (1 500 €)', effects: [cash(-190_000, 'materiel'), { t: 'flag', key: 'alarm' }] },
    ],
  },
  {
    id: 'litige_client', kind: 'bad', weight: 1.2, cooldown: 300, minDay: 90,
    title: 'Litige avec un client',
    text: 'Un client conteste ta facture et menace d’aller au tribunal de l’entreprise.',
    botChoice: 0,
    choices: [
      { label: 'Négocier un rabais de 50 %', effects: [cash(REV(-0.08, -400_000, -20_000), 'evenements')] },
      { label: 'Aller au tribunal (avocat 1 500 €)', effects: [cash(-150_000, 'evenements'), chance(0.55, [cash(REV(0.15, 50_000, 800_000), 'autres_revenus')], [cash(REV(-0.1, -600_000, -30_000), 'amendes'), rep(-2)], 'Le tribunal te donne raison !', 'Tu perds le procès et paies les frais.')] },
    ],
  },
  {
    id: 'demission_cle', kind: 'bad', weight: 1.5, cooldown: 240, target: 'keyEmployee',
    title: '{employee} veut partir',
    text: '{employee}, ton élément le plus compétent, a reçu une offre d’un concurrent.',
    when: (s) => s.staff.employees.length >= 2,
    botChoice: 0,
    choices: [
      { label: 'Contre-offre : +15 % de salaire', effects: [{ t: 'employeeRaise', pct: 0.15 }] },
      { label: 'Le/la laisser partir', effects: [{ t: 'loseEmployee' }, { t: 'motivation', v: -4 }] },
    ],
  },
  {
    id: 'maladie_longue', kind: 'bad', weight: 1, cooldown: 300, target: 'employee',
    title: 'Maladie de longue durée',
    text: '{employee} est en incapacité de travail pour plusieurs semaines. Tu paies le salaire garanti du premier mois.',
    when: hasEmployees,
    effects: [{ t: 'employeeAbsent', days: 45 }],
  },
  {
    id: 'conflit_equipe', kind: 'bad', weight: 1.2, cooldown: 240,
    title: 'Conflit dans l’équipe',
    text: 'Deux collègues ne se parlent plus et l’ambiance se dégrade.',
    when: (s) => s.staff.employees.length >= 3,
    botChoice: 0,
    choices: [
      { label: 'Payer une médiation (900 €)', effects: [cash(-90_000, 'formation'), { t: 'motivation', v: 5 }] },
      { label: 'Laisser faire', effects: [{ t: 'motivation', v: -12 }, mod('productivity', 0.92, 30, 'Mauvaise ambiance')] },
    ],
  },
  {
    id: 'team_building', kind: 'good', weight: 1, cooldown: 300,
    title: 'Idée de team building',
    text: 'L’équipe propose une journée kayak sur la Lesse.',
    when: (s) => s.staff.employees.length >= 2,
    botChoice: 0,
    choices: [
      { label: 'Offrir la journée (100 € par personne)', effects: [cash({ of: 'payroll', f: -0.03, max: -20_000 }, 'formation'), { t: 'motivation', v: 12 }] },
      { label: 'Pas cette année', effects: [{ t: 'motivation', v: -3 }] },
    ],
  },
  {
    id: 'business_angel', kind: 'good', weight: 0.8, cooldown: 540, legal: 'srl', minDay: 360,
    title: 'Un investisseur s’intéresse à toi',
    text: 'Un business angel a repéré ta société et souhaite discuter d’une entrée au capital.',
    when: (s) => s.company.reputation > 45 && !s.offers.investor,
    effects: [{ t: 'investorOffer' }],
  },
  {
    id: 'credit_promo', kind: 'good', weight: 0.8, cooldown: 540,
    title: 'Offre de crédit avantageuse',
    text: 'Ta banque lance une campagne de crédits aux PME à taux réduit pendant un mois.',
    effects: [{ t: 'flagUntil', key: 'loanPromo', days: 30 }, { t: 'log', text: 'Taux de crédit −1 point pendant 30 jours (onglet Finances).' }],
  },
  {
    id: 'hausse_taux', kind: 'bad', weight: 0.8, cooldown: 360,
    title: 'La BCE relève ses taux',
    text: 'La Banque centrale européenne relève ses taux directeurs pour combattre l’inflation.',
    when: (s) => s.world.baseRate < 0.05,
    effects: [{ t: 'baseRate', v: 0.005 }],
  },
  {
    id: 'baisse_taux', kind: 'good', weight: 0.8, cooldown: 360,
    title: 'La BCE baisse ses taux',
    text: 'Pour relancer l’économie, la BCE abaisse ses taux directeurs.',
    when: (s) => s.world.baseRate > 0.01,
    effects: [{ t: 'baseRate', v: -0.005 }],
  },
  {
    id: 'saut_index', kind: 'good', weight: 0.5, cooldown: 1800, minDay: 300,
    title: 'Saut d’index',
    text: 'Le gouvernement décide un « saut d’index » : cette année, les salaires ne seront pas indexés (comme en 2015). Bon pour tes marges, moins pour le moral.',
    when: hasEmployees,
    effects: [{ t: 'flagYear', key: 'skipIndexYear' }, { t: 'motivation', v: -5 }],
  },
  {
    id: 'nouvelle_norme', kind: 'bad', weight: 1, cooldown: 540,
    title: 'Nouvelle réglementation',
    text: 'Une nouvelle norme européenne t’oblige à adapter tes process.',
    botChoice: 0,
    choices: [
      { label: 'Se mettre en conformité tout de suite (800 €)', effects: [cash(-80_000, 'autres')] },
      { label: 'Attendre et espérer ne pas être contrôlé', effects: [chance(0.6, [], [cash(-300_000, 'amendes')], 'Personne n’a rien vérifié.', 'Contrôle : amende pour non-conformité.')] },
    ],
  },
  {
    id: 'article_presse', kind: 'good', weight: 1.2, cooldown: 300,
    title: 'Article dans la presse locale',
    text: 'Un journaliste de la presse régionale consacre un portrait à ton entreprise.',
    when: (s) => s.company.reputation > 35,
    effects: [rep(5), mod('demand', 1.12, 45, 'Article de presse')],
  },
  {
    id: 'salon_pro', kind: 'neutral', weight: 1, cooldown: 360,
    title: 'Salon professionnel',
    text: 'On te propose un stand au salon des entrepreneurs à Brussels Expo.',
    botChoice: 0,
    choices: [
      { label: 'Prendre un stand (2 000 €)', effects: [cash(-200_000, 'marketing'), chance(0.65, [mod('demand', 1.25, 60, 'Contacts du salon'), rep(2)], [rep(1)], 'Le salon est un succès : beaucoup de contacts !', 'Salon décevant : peu de visiteurs.')] },
      { label: 'Juste visiter (gratuit)', effects: [mod('demand', 1.03, 30, 'Réseautage')] },
    ],
  },
  {
    id: 'stagiaire', kind: 'good', weight: 1, cooldown: 300,
    title: 'Demande de stage',
    text: 'Un étudiant de haute école cherche un stage non rémunéré de quelques mois.',
    effects: [{ t: 'candidate', skill: 30, salaryMult: 0, trait: 'ambitieux' }, { t: 'log', text: 'Un stagiaire est disponible dans l’onglet Équipe (coût : charges uniquement).' }],
  },
  {
    id: 'fournisseur_faillite', kind: 'bad', weight: 1, cooldown: 540,
    title: 'Faillite d’un fournisseur',
    text: 'Ton fournisseur principal ferme : il faut en trouver un autre, plus cher.',
    effects: [mod('unitCost', 1.15, 90, 'Nouveau fournisseur'), mod('materialCost', 1.15, 90, 'Nouveau fournisseur')],
  },
  {
    id: 'erreur_comptable', kind: 'bad', weight: 0.8, cooldown: 720,
    title: 'Erreur de ton comptable',
    text: 'Ton comptable a oublié une déclaration : amende administrative.',
    botChoice: 0,
    choices: [
      { label: 'Payer et changer de comptable (plus cher, plus rigoureux)', effects: [cash(-50_000, 'amendes'), { t: 'flag', key: 'comptaRigueur' }, { t: 'fixedCost', amount: 3_000 }] },
      { label: 'Payer et lui laisser une chance', effects: [cash(-50_000, 'amendes')] },
    ],
  },
  {
    id: 'remboursement_impot', kind: 'good', weight: 0.6, cooldown: 720,
    title: 'Bonne nouvelle du fisc',
    text: 'Une erreur en ta faveur est corrigée : le SPF Finances te rembourse un trop-perçu.',
    effects: [{ t: 'personal', amount: 60_000 }],
  },
  {
    id: 'retard_paiement', kind: 'bad', weight: 1.2, cooldown: 200, minDay: 90,
    title: 'Gros client en retard de paiement',
    text: 'Ton plus gros client repousse son paiement de deux mois.',
    effects: [{ t: 'sector', op: 'delayReceivables', days: 60, hint: 'Factures en attente retardées de 60 jours' }],
  },
  {
    id: 'mauvais_payeur', kind: 'bad', weight: 1, cooldown: 300, minDay: 120,
    title: 'Client mauvais payeur',
    text: 'Une facture importante reste impayée malgré trois rappels.',
    botChoice: 0,
    choices: [
      { label: 'Confier à un huissier (250 €)', effects: [cash(-25_000, 'evenements'), { t: 'chain', id: 'recouvrement', days: 45, hint: 'Résultat dans 45 jours.' }] },
      { label: 'Abandonner la créance', effects: [cash(REV(-0.15, -800_000, -30_000), 'creances')] },
    ],
  },
  {
    id: 'recouvrement', kind: 'neutral', chainOnly: true,
    title: 'Recouvrement par huissier',
    text: 'L’huissier revient vers toi.',
    effects: [chance(0.65, [], [cash(REV(-0.15, -800_000, -30_000), 'creances')], 'L’huissier a récupéré la somme !', 'Le client est insolvable : créance perdue.')],
  },
  {
    id: 'cyberattaque', kind: 'bad', weight: 0.8, cooldown: 720, minDay: 180,
    title: 'Cyberattaque',
    text: 'Un rançongiciel chiffre tous tes fichiers et réclame 3 000 € en bitcoins.',
    botChoice: 1,
    choices: [
      { label: 'Payer la rançon', effects: [cash(-300_000, 'evenements'), chance(0.6, [], [mod('productivity', 0.6, 10, 'Données perdues')], 'Les fichiers sont déchiffrés.', 'Les pirates ne rendent pas tout…')] },
      { label: 'Restaurer les sauvegardes (prestataire 1 200 €)', effects: [cash(-120_000, 'evenements'), mod('productivity', 0.7, 7, 'Restauration')] },
    ],
  },
  {
    id: 'concurrent_promo', kind: 'bad', weight: 1.5, cooldown: 120, target: 'competitor',
    title: '{competitor} casse ses prix',
    text: '{competitor} lance une campagne de promotions massive pour te prendre des clients.',
    effects: [{ t: 'competitorPromo', days: 30 }],
  },
  {
    id: 'nouveau_concurrent', kind: 'bad', weight: 0.8, cooldown: 540, minDay: 300,
    title: 'Un nouveau concurrent arrive',
    text: 'Une enseigne bien financée ouvre près de chez toi.',
    when: (s) => s.competitors.filter((c) => c.alive).length < 5,
    effects: [{ t: 'newCompetitor' }],
  },
  {
    id: 'concurrent_rachat', kind: 'good', weight: 0.6, cooldown: 720, target: 'competitor', minDay: 360,
    title: '{competitor} jette l’éponge',
    text: 'Le patron de {competitor} part à la retraite et propose de te céder sa clientèle.',
    botChoice: 0,
    choices: [
      { label: 'Racheter la clientèle', effects: [cash(REV(-1.2, -6_000_000, -300_000), 'investissement'), { t: 'competitorBankrupt' }, rep(3), mod('demand', 1.2, 90, 'Clientèle rachetée')] },
      { label: 'Laisser ses clients se disperser', effects: [{ t: 'competitorBankrupt' }] },
    ],
  },
  {
    id: 'epuisement', kind: 'bad', weight: 1, cooldown: 360,
    title: 'Tu frôles le burn-out',
    text: 'Des semaines à 60 heures… ton corps dit stop.',
    when: (s) => s.staff.founder.active && (s.staff.lastWorkload > 1.1 || s.staff.founder.energy < 50),
    botChoice: 0,
    choices: [
      { label: 'Prendre deux semaines de vacances', effects: [mod('productivity', 0.7, 14, 'Vacances du patron'), { t: 'founderEnergy', v: 40 }] },
      { label: 'Serrer les dents', effects: [chance(0.5, [{ t: 'founderEnergy', v: -10 }], [{ t: 'founderEnergy', v: -40 }, mod('productivity', 0.5, 30, 'Burn-out')], 'Tu tiens le coup… pour l’instant.', 'Burn-out : arrêt forcé d’un mois.')] },
    ],
  },
  {
    id: 'prix_jeune_entreprise', kind: 'good', weight: 0.7, once: true, minDay: 360,
    title: 'Prix « Jeune entreprise de l’année »',
    text: 'Ta croissance attire l’attention : tu remportes un prix régional !',
    when: (s) => s.company.reputation > 55,
    effects: [rep(8), mod('demand', 1.15, 90, 'Prix régional'), cash(250_000, 'subvention'), { t: 'stat', key: 'awards' }],
  },
  {
    id: 'influenceur', kind: 'neutral', weight: 1, cooldown: 300,
    title: 'Proposition d’un influenceur',
    text: 'Un influenceur belge (120 000 abonnés) propose de parler de toi contre rémunération.',
    botChoice: 1,
    choices: [
      { label: 'Accepter (1 500 €)', effects: [cash(-150_000, 'marketing'), chance(0.55, [mod('demand', 1.4, 30, 'Buzz influenceur'), rep(3)], [rep(-2)], 'Le post cartonne !', 'Flop : son audience n’est pas ta cible, et certains crient au placement de produit.')] },
      { label: 'Refuser poliment', effects: [] },
    ],
  },
  {
    id: 'travaux_voirie', kind: 'bad', weight: 1, cooldown: 720,
    title: 'Travaux de voirie',
    text: 'La commune éventre la rue devant chez toi pour trois mois.',
    sectors: ['restaurant', 'soutien'],
    botChoice: 0,
    choices: [
      { label: 'Demander l’indemnité communale (dossier)', effects: [mod('demand', 0.7, 90, 'Rue en travaux'), { t: 'chain', id: 'indemnite_travaux', days: 60, hint: 'Indemnité possible dans 2 mois.' }] },
      { label: 'Faire de la pub « on reste ouverts » (600 €)', effects: [cash(-60_000, 'marketing'), mod('demand', 0.82, 90, 'Rue en travaux')] },
    ],
  },
  {
    id: 'indemnite_travaux', kind: 'good', chainOnly: true,
    title: 'Indemnité pour travaux',
    text: 'La commune répond à ta demande d’indemnisation.',
    effects: [chance(0.6, [cash(200_000, 'subvention')], [], 'Indemnité accordée.', 'Demande refusée.')],
  },
  {
    id: 'assurance_hausse', kind: 'bad', weight: 1, cooldown: 540,
    title: 'Hausse des primes d’assurance',
    text: 'Ton assureur augmente ses tarifs après une année de sinistres records.',
    effects: [{ t: 'fixedCost', amount: 3_500 }],
  },
  {
    id: 'loyer_indexation', kind: 'bad', weight: 1, cooldown: 360, minDay: 360,
    title: 'Indexation du loyer',
    text: 'Ton propriétaire applique l’indexation annuelle du bail commercial.',
    when: (s) => s.upgrades.owned.length > 0,
    effects: [{ t: 'fixedCost', amount: 4_000 }],
  },
  {
    id: 'grippe', kind: 'bad', weight: 1.2, cooldown: 300,
    title: 'Épidémie de grippe',
    text: 'La grippe saisonnière décime ton équipe.',
    when: (s) => [0, 1, 10, 11].includes(Math.floor((s.time.day % 360) / 30)),
    effects: [mod('productivity', 0.75, 12, 'Grippe')],
  },
  {
    id: 'penurie_main_oeuvre', kind: 'bad', weight: 0.8, cooldown: 540,
    title: 'Pénurie de main-d’œuvre',
    text: 'Ton métier est en pénurie : les candidats se font rares et exigeants.',
    effects: [{ t: 'motivation', v: -4 }, { t: 'sector', op: 'clearCandidates', hint: 'Vivier de candidats vidé' }],
  },
  {
    id: 'coupure_courant', kind: 'bad', weight: 1, cooldown: 300,
    title: 'Coupure de courant',
    text: 'Une panne du réseau électrique paralyse ton quartier toute une journée.',
    effects: [mod('capacity', 0.3, 1, 'Coupure de courant'), mod('productivity', 0.3, 1, 'Coupure de courant')],
  },
  {
    id: 'mentor', kind: 'good', weight: 0.8, cooldown: 720,
    title: 'Un mentor te prend sous son aile',
    text: 'Une cheffe d’entreprise expérimentée te propose des conseils gratuits.',
    effects: [rep(2), { t: 'founderEnergy', v: 10 }, mod('productivity', 1.05, 90, 'Conseils du mentor')],
  },
  {
    id: 'sponsoring_club', kind: 'neutral', weight: 1, cooldown: 360,
    title: 'Le club de foot local cherche un sponsor',
    text: 'Le RFC du quartier te propose ton logo sur les maillots des jeunes.',
    botChoice: 1,
    choices: [
      { label: 'Sponsoriser (800 €)', effects: [cash(-80_000, 'marketing'), rep(3), mod('demand', 1.05, 120, 'Sponsoring local')] },
      { label: 'Décliner', effects: [] },
    ],
  },
  {
    id: 'reviseur', kind: 'neutral', weight: 0.6, cooldown: 720, legal: 'srl',
    title: 'Dépôt des comptes annuels',
    text: 'Rappel : les comptes de ta SRL doivent être déposés à la Banque nationale.',
    botChoice: 0,
    choices: [
      { label: 'Laisser le comptable s’en charger (300 €)', effects: [cash(-30_000, 'comptable')] },
      { label: 'Reporter à plus tard', effects: [chance(0.5, [], [cash(-120_000, 'amendes'), rep(-1)], 'Déposé de justesse dans les délais.', 'Dépôt tardif : amende de la BNB.')] },
    ],
  },
  {
    id: 'caution_personnelle', kind: 'neutral', weight: 0.6, cooldown: 900, legal: 'srl', minDay: 200,
    title: 'La banque exige une caution personnelle',
    text: 'Pour maintenir ta ligne de crédit, la banque veut que tu te portes caution personnellement.',
    when: (s) => s.loans.length > 0,
    botChoice: 1,
    choices: [
      { label: 'Signer la caution', effects: [{ t: 'log', text: 'Tu t’es porté caution : ta responsabilité limitée ne protège plus ce crédit.' }, { t: 'flag', key: 'personalGuarantee' }] },
      { label: 'Refuser : la banque réduit ton découvert', effects: [{ t: 'flagUntil', key: 'overdraftCut', days: 180 }] },
    ],
  },
  {
    id: 'lettre_caisse', kind: 'neutral', weight: 0.8, cooldown: 720, legal: 'independant', minDay: 300,
    title: 'Lettre de ta caisse d’assurances sociales',
    text: 'Ta caisse t’avertit : tes revenus réels semblent bien supérieurs à la base de tes cotisations provisoires.',
    when: (s) => s.tax.results.length > 0 && (s.tax.results[s.tax.results.length - 1].operating || 0) > 3_000_000,
    botChoice: 0,
    choices: [
      { label: 'Augmenter mes provisionnelles', effects: [{ t: 'sector', op: 'raiseSocialBase', hint: 'Base des provisionnelles = ton dernier bénéfice' }] },
      { label: 'Garder le minimum (et la régularisation plus tard)', effects: [] },
    ],
  },
  {
    id: 'plci', kind: 'neutral', weight: 0.6, cooldown: 1080, legal: 'independant', minDay: 360,
    title: 'Pension libre complémentaire (PLCI)',
    text: 'Ton assureur te propose une PLCI : versements déductibles fiscalement pour ta pension.',
    botChoice: 1,
    choices: [
      { label: 'Souscrire (1 500 €, déductible)', effects: [cash(-150_000, 'assurances'), { t: 'stat', key: 'pension', v: 150_000 }, { t: 'founderEnergy', v: 5 }] },
      { label: 'Plus tard', effects: [] },
    ],
  },
  {
    id: 'heritage', kind: 'good', weight: 0.25, once: true, minDay: 720,
    title: 'Petit héritage',
    text: 'Une grand-tante d’Ostende te lègue une somme (après droits de succession).',
    effects: [{ t: 'personal', amount: 1_200_000 }],
  },
  {
    id: 'panne_banque', kind: 'bad', weight: 0.7, cooldown: 540,
    title: 'Panne du terminal de paiement',
    text: 'Le réseau de paiement par carte est en panne pendant tout un week-end.',
    sectors: ['restaurant', 'ecommerce'],
    effects: [mod('demand', 0.75, 3, 'Paiements en panne')],
  },
  {
    id: 'opportunite_locaux', kind: 'good', weight: 0.6, cooldown: 900, minDay: 200,
    title: 'Bonne affaire immobilière',
    text: 'Un local voisin se libère : le propriétaire propose 3 mois de loyer offerts si tu t’agrandis.',
    effects: [{ t: 'sector', op: 'upgradeDiscount', pct: 0.25, days: 45, hint: '−25 % sur la prochaine amélioration de locaux (45 j)' }],
  },
  {
    id: 'don_asbl', kind: 'neutral', weight: 0.8, cooldown: 540,
    title: 'Appel aux dons',
    text: 'Une ASBL du quartier organise une collecte pour les familles en difficulté.',
    botChoice: 0,
    choices: [
      { label: 'Donner 300 €', effects: [cash(-30_000, 'autres'), rep(2), { t: 'motivation', v: 3 }] },
      { label: 'Ne rien donner', effects: [] },
    ],
  },
  {
    id: 'erreur_tarif', kind: 'bad', weight: 0.8, cooldown: 540,
    title: 'Erreur de facturation',
    text: 'Tu découvres que tu as sous-facturé plusieurs clients ces dernières semaines.',
    effects: [cash(REV(-0.05, -300_000, -10_000), 'evenements')],
  },

  // ===========================================================================
  //  AGENCE WEB
  // ===========================================================================
  {
    id: 'web_appel_offres', kind: 'good', weight: 1.2, cooldown: 240, sectors: ['agence'], minDay: 120,
    title: 'Appel d’offres d’une commune',
    text: 'La commune de Namur lance un marché public pour refaire son site et ses e-services.',
    botChoice: 0,
    choices: [
      { label: 'Répondre (dossier : 2 000 €, 40 % de chances)', effects: [cash(-200_000, 'marketing'), chance(0.4, [{ t: 'sector', op: 'bigProject', hours: 350, rateMult: 1.05 }, rep(4)], [], 'Marché remporté : 350 h de travail !', 'Marché attribué à un concurrent.')] },
      { label: 'Passer ton tour', effects: [] },
    ],
  },
  {
    id: 'web_scope_creep', kind: 'bad', weight: 1.5, cooldown: 120, sectors: ['agence'],
    title: 'Le client change tout',
    text: 'En plein projet, un client veut « juste quelques modifications »… qui doublent le travail.',
    when: (s) => s.sector.projects.some((p) => !p.internal),
    botChoice: 0,
    choices: [
      { label: 'Facturer un avenant', effects: [chance(0.6, [{ t: 'sector', op: 'scopeCreep', pct: 0.3, paid: true }], [{ t: 'sector', op: 'scopeCreep', pct: 0.1, paid: false }, rep(-2)], 'Le client accepte l’avenant.', 'Le client refuse et te fait une mauvaise pub.')] },
      { label: 'Absorber le travail en plus', effects: [{ t: 'sector', op: 'scopeCreep', pct: 0.3, paid: false }, rep(2)] },
    ],
  },
  {
    id: 'web_faille', kind: 'bad', weight: 1, cooldown: 360, sectors: ['agence'], minDay: 200,
    title: 'Faille de sécurité',
    text: 'Un site que tu as livré a été piraté. Le client est furieux.',
    botChoice: 0,
    choices: [
      { label: 'Corriger gratuitement en urgence', effects: [mod('productivity', 0.8, 7, 'Correctif en urgence'), rep(-1)] },
      { label: 'Facturer l’intervention', effects: [cash(80_000, 'projets'), rep(-6)] },
    ],
  },
  {
    id: 'web_ia', kind: 'neutral', weight: 0.7, once: true, sectors: ['agence'], minDay: 500,
    title: 'L’IA bouscule le marché',
    text: 'Les générateurs de sites par IA font baisser les prix du marché. Mais ils rendent aussi les développeurs plus rapides.',
    effects: [mod('refPrice', 0.92, 3600, 'Pression de l’IA'), mod('productivity', 1.06, 3600, 'Outils IA')],
  },
  {
    id: 'web_product_hunt', kind: 'good', weight: 1, cooldown: 360, sectors: ['agence'],
    title: 'Ton SaaS sur Product Hunt',
    text: 'Ton logiciel atteint le top du jour sur Product Hunt !',
    when: (s) => s.sector.saas && s.sector.saas.status === 'live',
    effects: [{ t: 'sector', op: 'saasBoost', n: 60, hint: '+60 abonnés' }, rep(3)],
  },
  {
    id: 'web_hebergeur', kind: 'bad', weight: 1, cooldown: 360, sectors: ['agence'],
    title: 'Panne de l’hébergeur',
    text: 'Ton hébergeur subit une panne de 36 heures : tous tes sites clients sont hors ligne.',
    when: (s) => s.sector.maint.contracts.length > 0 || s.sector.saas.status === 'live',
    effects: [rep(-3), mod('maintChurn', 3, 30, 'Clients échaudés'), mod('saasChurn', 2, 30, 'Clients échaudés')],
  },

  // ===========================================================================
  //  RESTAURANT / FRITERIE
  // ===========================================================================
  {
    id: 'resto_afsca', kind: 'bad', weight: 1.3, cooldown: 300, sectors: ['restaurant'], minDay: 60,
    title: 'Contrôle de l’AFSCA',
    text: 'Deux inspecteurs de l’AFSCA se présentent sans prévenir.',
    effects: [{ t: 'sector', op: 'afsca' }],
  },
  {
    id: 'resto_frigo', kind: 'bad', weight: 1.2, cooldown: 300, sectors: ['restaurant'],
    title: 'Panne du frigo',
    text: 'La chambre froide a lâché pendant la nuit.',
    botChoice: 0,
    choices: [
      { label: 'Tout jeter et réparer (900 €)', effects: [{ t: 'sector', op: 'stockLoss', pct: 1, hint: 'Tout le stock est perdu' }, cash(-90_000, 'materiel')] },
      { label: 'Garder ce qui « a l’air bon »', effects: [{ t: 'sector', op: 'stockLoss', pct: 0.4, hint: '40 % du stock perdu' }, chance(0.7, [], [{ t: 'chain', id: 'resto_intoxication', days: 3 }], 'Personne n’a été malade. Ouf.', 'Des clients se plaignent de maux de ventre…')] },
    ],
  },
  {
    id: 'resto_critique', kind: 'neutral', weight: 1, cooldown: 360, sectors: ['restaurant'], minDay: 120,
    title: 'Passage d’un critique',
    text: 'Un critique culinaire connu a mangé chez toi incognito.',
    effects: [
      {
        ...chance(0.5, [rep(8), mod('demand', 1.25, 60, 'Bonne critique')], [rep(-6), mod('demand', 0.88, 45, 'Mauvaise critique')], 'Critique élogieuse : « les meilleures frites de la région ».', 'Critique assassine dans la presse.'),
        pFn: (s) => Math.min(0.92, Math.max(0.1, (s.company.quality - 0.6) * 1.1)), // dépend de la qualité
      },
    ],
  },
  {
    id: 'resto_patates', kind: 'bad', weight: 1, cooldown: 540, sectors: ['restaurant'],
    title: 'Mauvaise récolte de pommes de terre',
    text: 'La sécheresse a ravagé les récoltes de Bintje : le prix des patates explose.',
    effects: [mod('unitCost', 1.3, 90, 'Prix des pommes de terre')],
  },
  {
    id: 'resto_diables', kind: 'good', weight: 1.2, cooldown: 180, sectors: ['restaurant'],
    title: 'Match des Diables Rouges',
    text: 'La Belgique joue ce soir : écran géant sur la place, foule affamée garantie !',
    effects: [mod('demand', 1.9, 2, 'Match des Diables Rouges'), { t: 'log', text: 'Astuce : vérifie ton stock, la demande va exploser.' }],
  },
  {
    id: 'resto_intoxication', kind: 'bad', weight: 0.6, cooldown: 720, sectors: ['restaurant'],
    title: 'Suspicion d’intoxication alimentaire',
    text: 'Plusieurs clients disent avoir été malades après un repas chez toi.',
    when: (s) => s.sector && s.sector.hygiene < 55,
    botChoice: 0,
    choices: [
      { label: 'Fermer 3 jours pour désinfecter (1 000 €)', effects: [cash(-100_000, 'materiel'), { t: 'sector', op: 'close', days: 3 }, { t: 'sector', op: 'hygiene', v: 30, hint: 'Hygiène +30' }, rep(-4)] },
      { label: 'Nier en bloc', effects: [chance(0.4, [rep(-2)], [rep(-15), cash(-400_000, 'amendes'), { t: 'sector', op: 'close', days: 7 }], 'L’affaire se tasse.', 'L’AFSCA confirme : amende et fermeture d’une semaine.')] },
    ],
  },
  {
    id: 'resto_livraison', kind: 'neutral', weight: 1, once: true, sectors: ['restaurant'], minDay: 90,
    title: 'Plateforme de livraison',
    text: 'Une plateforme de livraison te propose de rejoindre son appli (commission de 30 % sur ces commandes).',
    botChoice: 0,
    choices: [
      { label: 'Rejoindre la plateforme', effects: [{ t: 'flag', key: 'delivery' }, { t: 'log', text: 'Livraison activée : +demande, mais 30 % de commission sur ces ventes.' }] },
      { label: 'Rester indépendant', effects: [] },
    ],
  },

  // ===========================================================================
  //  E-COMMERCE
  // ===========================================================================
  {
    id: 'ecom_black_friday', kind: 'neutral', weight: 3, cooldown: 300, sectors: ['ecommerce'],
    title: 'Préparer le Black Friday',
    text: 'Le Black Friday approche. Tu fais quoi ?',
    when: (s) => Math.floor((s.time.day % 360) / 30) === 10 && (s.time.day % 30) < 15,
    botChoice: 0,
    choices: [
      { label: 'Grosse promo (−20 %) et budget pub doublé', effects: [mod('demand', 1.5, 10, 'Promo Black Friday'), mod('priceCut', 0.8, 10, 'Prix Black Friday'), cash(REV(-0.05, -500_000, -50_000), 'marketing')] },
      { label: 'Pas de promo, on garde nos marges', effects: [mod('demand', 0.9, 10, 'Clients partis chez les promos')] },
    ],
  },
  {
    id: 'ecom_greve_transport', kind: 'bad', weight: 1, cooldown: 300, sectors: ['ecommerce'],
    title: 'Grève des transporteurs',
    text: 'Les livreurs sont en grève : les colis s’entassent au dépôt.',
    effects: [mod('returns', 1.6, 20, 'Livraisons en retard'), rep(-3), mod('demand', 0.85, 20, 'Délais de livraison')],
  },
  {
    id: 'ecom_conteneur', kind: 'bad', weight: 1, cooldown: 360, sectors: ['ecommerce'],
    title: 'Conteneur bloqué',
    text: 'Ton conteneur est bloqué au port d’Anvers par un contrôle douanier.',
    effects: [{ t: 'sector', op: 'delayOrders', days: 20, hint: 'Commandes fournisseurs retardées de 20 jours' }],
  },
  {
    id: 'ecom_avis', kind: 'good', weight: 1.2, cooldown: 240, sectors: ['ecommerce'],
    title: 'Vague d’avis 5 étoiles',
    text: 'Tes clients laissent des avis élogieux sur Trustpilot.',
    when: (s) => s.company.satisfaction > 60,
    effects: [rep(4), mod('demand', 1.12, 45, 'Avis clients')],
  },
  {
    id: 'ecom_cpc', kind: 'bad', weight: 1, cooldown: 360, sectors: ['ecommerce'],
    title: 'Hausse des coûts publicitaires',
    text: 'Les enchères publicitaires flambent : chaque clic coûte plus cher.',
    effects: [mod('cpc', 1.35, 60, 'Enchères pub')],
  },
  {
    id: 'ecom_contrefacon', kind: 'bad', weight: 0.8, cooldown: 540, sectors: ['ecommerce'], minDay: 200,
    title: 'Contrefaçon sur une marketplace',
    text: 'Ton best-seller est copié et vendu moitié prix sur une grande marketplace.',
    botChoice: 0,
    choices: [
      { label: 'Mise en demeure par avocat (1 200 €)', effects: [cash(-120_000, 'evenements'), chance(0.6, [], [mod('demand', 0.85, 90, 'Contrefaçon')], 'La copie est retirée.', 'La copie reste en ligne.')] },
      { label: 'Ignorer', effects: [mod('demand', 0.8, 120, 'Contrefaçon')] },
    ],
  },
  {
    id: 'ecom_tiktok', kind: 'good', weight: 1, cooldown: 360, sectors: ['ecommerce'],
    title: 'Produit viral sur TikTok',
    text: 'Une vidéo montrant un de tes produits explose sur TikTok !',
    effects: [mod('demand', 1.8, 14, 'Viral sur TikTok'), rep(2), { t: 'log', text: 'Vérifie ton stock : la demande va exploser !' }],
  },

  // ===========================================================================
  //  ARTISANAT
  // ===========================================================================
  {
    id: 'art_camionnette', kind: 'bad', weight: 1.2, cooldown: 300, sectors: ['artisan'],
    title: 'Panne de la camionnette',
    text: 'Ta camionnette refuse de démarrer : boîte de vitesses HS.',
    botChoice: 0,
    choices: [
      { label: 'Réparer au garage (1 800 €)', effects: [cash(-180_000, 'materiel'), mod('capacity', 0.85, 4, 'Camionnette au garage')] },
      { label: 'Louer une camionnette en attendant (600 €)', effects: [cash(-60_000, 'deplacements'), mod('capacity', 0.7, 14, 'Camionnette de location')] },
    ],
  },
  {
    id: 'art_accident', kind: 'bad', weight: 0.7, cooldown: 540, sectors: ['artisan'], target: 'employee',
    title: 'Accident de chantier',
    text: '{employee} est tombé d’une échelle sur un chantier.',
    when: hasEmployees,
    effects: [{ t: 'employeeAbsent', days: 30 }, { t: 'motivation', v: -5 }, cash(-50_000, 'assurances')],
  },
  {
    id: 'art_primes', kind: 'good', weight: 1, cooldown: 540, sectors: ['artisan'],
    title: 'Primes régionales à la rénovation',
    text: 'La Région augmente ses primes à la rénovation énergétique : les particuliers se lancent.',
    effects: [mod('demand', 1.3, 120, 'Primes rénovation')],
  },
  {
    id: 'art_penurie', kind: 'bad', weight: 1, cooldown: 360, sectors: ['artisan'],
    title: 'Pénurie de matériaux',
    text: 'Le cuivre et les composants électroniques manquent : les prix grimpent.',
    effects: [mod('materialCost', 1.25, 90, 'Pénurie de matériaux')],
  },
  {
    id: 'art_promoteur', kind: 'good', weight: 1, cooldown: 300, sectors: ['artisan'], minDay: 150,
    title: 'Un promoteur te propose un gros chantier',
    text: 'Un promoteur immobilier cherche un sous-traitant pour 12 appartements neufs. Payeur réputé lent.',
    botChoice: 0,
    choices: [
      { label: 'Accepter le chantier', effects: [{ t: 'sector', op: 'bigJob', days: 40, valueMult: 1, payDelay: 75, hint: 'Gros chantier de 40 jours-homme, payé à 75 jours' }] },
      { label: 'Refuser (risque de dépendance)', effects: [] },
    ],
  },
  {
    id: 'art_malfacon', kind: 'bad', weight: 1, cooldown: 300, sectors: ['artisan'], minDay: 120,
    title: 'Réclamation pour malfaçon',
    text: 'Un client signale une fuite après ton intervention.',
    botChoice: 0,
    choices: [
      { label: 'Repasser gratuitement', effects: [mod('capacity', 0.92, 5, 'Retour sur chantier'), rep(1)] },
      { label: 'Contester', effects: [chance(0.4, [], [rep(-8), cash(-150_000, 'evenements')], 'Le client reconnaît une mauvaise utilisation.', 'L’expertise te donne tort : tu paies les dégâts.')] },
    ],
  },

  // ===========================================================================
  //  SOUTIEN SCOLAIRE
  // ===========================================================================
  {
    id: 'sco_record', kind: 'good', weight: 1, cooldown: 300, sectors: ['soutien'],
    title: 'Résultats record',
    text: 'Tes élèves cartonnent aux examens : les parents en parlent partout.',
    when: (s) => s.sector && s.sector.lastSuccess > 0.85,
    effects: [rep(6), mod('enrollment', 1.3, 60, 'Résultats record')],
  },
  {
    id: 'sco_reforme', kind: 'neutral', weight: 0.6, once: true, sectors: ['soutien'],
    title: 'Réforme du calendrier scolaire',
    text: 'La Fédération Wallonie-Bruxelles confirme son calendrier : rentrée fin août, deux semaines de congé à la Toussaint et au carnaval.',
    effects: [mod('enrollment', 1.1, 60, 'Stages de congés plus demandés')],
  },
  {
    id: 'sco_prof_star', kind: 'good', weight: 1, cooldown: 360, sectors: ['soutien'],
    title: 'Un prof star veut te rejoindre',
    text: 'Une professeure de maths réputée cherche un nouveau centre.',
    effects: [{ t: 'candidate', role: 'enseignant', skill: 92, salaryMult: 1.2, trait: 'perfectionniste' }, { t: 'log', text: 'Une candidate exceptionnelle t’attend dans l’onglet Équipe (20 jours).' }],
  },
  {
    id: 'sco_ecole', kind: 'good', weight: 1, cooldown: 540, sectors: ['soutien'], minDay: 150,
    title: 'Partenariat avec une école',
    text: 'Une école secondaire propose de t’envoyer ses élèves en difficulté, avec un tarif négocié.',
    botChoice: 0,
    choices: [
      { label: 'Accepter (+élèves, prix −15 %)', effects: [{ t: 'sector', op: 'addStudents', n: 15, priceMult: 0.85, hint: '+15 élèves à −15 %' }] },
      { label: 'Refuser', effects: [] },
    ],
  },
  {
    id: 'sco_plainte', kind: 'bad', weight: 1, cooldown: 300, sectors: ['soutien'],
    title: 'Plainte d’un parent',
    text: 'Un parent furieux accuse ton centre d’avoir mal préparé son enfant.',
    botChoice: 0,
    choices: [
      { label: 'Rembourser le trimestre', effects: [cash(-48_000, 'evenements'), rep(-1)] },
      { label: 'Défendre ton équipe', effects: [rep(-4), { t: 'motivation', v: 4 }] },
    ],
  },
  {
    id: 'sco_en_ligne', kind: 'bad', weight: 0.8, cooldown: 720, sectors: ['soutien'], minDay: 300,
    title: 'Cours en ligne gratuits',
    text: 'Une plateforme gratuite de cours en vidéo séduit beaucoup d’élèves.',
    effects: [mod('enrollment', 0.85, 180, 'Concurrence en ligne')],
  },
];
