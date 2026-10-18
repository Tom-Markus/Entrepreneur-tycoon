// Formatage à la belge : 12 345,67 €

const nf2 = new Intl.NumberFormat('fr-BE', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const nf0 = new Intl.NumberFormat('fr-BE', { maximumFractionDigits: 0 });
const nf1 = new Intl.NumberFormat('fr-BE', { minimumFractionDigits: 1, maximumFractionDigits: 1 });

// Intl utilise une espace fine insécable comme séparateur de milliers ; on la
// remplace par une espace insécable classique, mieux supportée par les polices.
function clean(s) {
  return s.replace(/ /g, ' ');
}

/** Centimes → « 12 345,67 € ». opts.decimals = false pour arrondir à l'euro. */
export function eur(cents, { decimals = true, sign = false } = {}) {
  if (!Number.isFinite(cents)) return '—';
  const v = cents / 100;
  const s = clean(decimals ? nf2.format(v) : nf0.format(Math.round(v)));
  return `${sign && cents > 0 ? '+' : ''}${s} €`;
}

/** Version courte pour la barre du haut : 12,3 k€ / 1,25 M€. */
export function eurShort(cents) {
  if (!Number.isFinite(cents)) return '—';
  const v = cents / 100;
  const a = Math.abs(v);
  if (a >= 1e6) return `${clean(nf1.format(v / 1e6))} M€`;
  if (a >= 1e4) return `${clean(nf1.format(v / 1e3))} k€`;
  return `${clean(nf0.format(Math.round(v)))} €`;
}

export function num(x, digits = 0) {
  if (!Number.isFinite(x)) return '—';
  return clean(digits === 1 ? nf1.format(x) : digits === 2 ? nf2.format(x) : nf0.format(x));
}

export function pct(x, digits = 0) {
  if (!Number.isFinite(x)) return '—';
  return `${num(x * 100, digits)} %`;
}

/** Multiplicateur lisible : 1,15 → « +15 % », 0,8 → « −20 % ». */
export function factor(x) {
  if (!Number.isFinite(x)) return '—';
  const d = Math.round((x - 1) * 100);
  if (d === 0) return '±0 %';
  return `${d > 0 ? '+' : '−'}${Math.abs(d)} %`;
}

/** Formatage générique selon un code (utilisé par les KPI des secteurs). */
export function byFmt(value, fmt, suffix = '') {
  switch (fmt) {
    case 'eur':
      return eur(value, { decimals: false }) + suffix;
    case 'eur2':
      return eur(value) + suffix;
    case 'pct':
      return pct(value) + suffix;
    case 'num1':
      return num(value, 1) + suffix;
    case 'int':
    case 'num0':
    default:
      return num(Math.round(value)) + suffix;
  }
}
