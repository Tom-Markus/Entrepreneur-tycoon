// Météo belge simplifiée : probabilités par mois (janvier → décembre).

const WINTER = { pluie: 0.42, nuageux: 0.3, froid: 0.22, soleil: 0.06 };
const SPRING = { soleil: 0.3, nuageux: 0.35, pluie: 0.35 };
const SUMMER = { soleil: 0.45, nuageux: 0.25, pluie: 0.22, canicule: 0.08 };
const AUTUMN = { pluie: 0.5, nuageux: 0.35, soleil: 0.12, froid: 0.03 };

export const WEATHER = {
  byMonth: [WINTER, WINTER, SPRING, SPRING, SPRING, SUMMER, SUMMER, SUMMER, AUTUMN, AUTUMN, AUTUMN, WINTER],
  labels: { soleil: 'Soleil', nuageux: 'Nuageux', pluie: 'Pluie', froid: 'Froid', canicule: 'Canicule' },
};
