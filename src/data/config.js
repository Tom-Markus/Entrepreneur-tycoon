// Paramètres généraux du jeu (temps, sauvegarde, interface).
// Les paramètres économiques sont dans les autres fichiers de src/data/.

export const CONFIG = {
  /** Version du format de sauvegarde. Incrémenter + ajouter une migration. */
  saveVersion: 1,
  startYear: 2026,
  /** Jour de la semaine du jour 0 (0 = lundi). Le 1/1/2026 est un jeudi. */
  startWeekday: 3,
  /** Durée d'un mois de jeu en secondes réelles à la vitesse ×1. */
  secondsPerMonth: 60,
  /** Vitesses disponibles (multiplicateurs). */
  speeds: [0, 1, 2, 4],
  /** Plafond de jours simulés par image (évite les sauts après un onglet en arrière-plan). */
  maxDaysPerFrame: 2,
  /** Autosauvegarde toutes les N secondes réelles de jeu actif. */
  autosaveSeconds: 30,
  /** Nombre d'emplacements de sauvegarde manuelle. */
  saveSlots: 3,
  /** Taille max du journal d'événements conservé dans l'état. */
  logSize: 150,
  /** Nombre de jours de trésorerie quotidienne conservés (graphique). */
  dailyHistoryDays: 180,
  /** Taille max du journal d'actions (rejeu V2). */
  actionLogMax: 20000,
};
