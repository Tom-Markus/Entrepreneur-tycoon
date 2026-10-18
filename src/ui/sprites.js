// Sprites pixel art décrits en chaînes de caractères + palette.
// Chaque caractère = une couleur de la palette ; '.' = transparent.
// Les lettres x (haut), y (bas), z (cheveux), q (peau) sont recolorées à la
// volée pour varier les personnages.

export const PALETTE = {
  k: '#1a1c2c', // noir bleuté
  p: '#5d275d', // prune
  r: '#b13e53', // rouge
  R: '#e43b44', // rouge vif
  o: '#ef7d57', // orange
  y: '#ffcd75', // jaune
  F: '#ffe8a0', // frite
  g: '#a7f070', // vert clair
  G: '#38b764', // vert
  T: '#257179', // sarcelle
  n: '#29366f', // marine
  b: '#3b5dc9', // bleu
  c: '#41a6f6', // bleu clair
  C: '#73eff7', // cyan
  w: '#f4f4f4', // blanc
  l: '#94b0c2', // gris clair
  m: '#566c86', // gris
  d: '#333c57', // gris foncé
  s: '#f2c9a0', // peau claire
  S: '#c68863', // peau médium
  D: '#8d5524', // peau foncée
  h: '#4a2c1a', // brun foncé
  B: '#8f563b', // bois
  W: '#c28569', // bois clair
  a: '#e8c170', // blond
};

export const SKINS = ['s', 'S', 'D', 's', 'S'];
export const HAIRS = ['h', 'k', 'a', 'o', 'h', 'd'];
export const SHIRTS = ['b', 'R', 'G', 'o', 'p', 'c', 'T', 'y', 'w'];
export const PANTS = ['n', 'd', 'k', 'm', 'B'];

export const SPRITES = {
  person0: [
    '..zzz..',
    '.zzzzz.',
    '.zqqqz.',
    '..qqq..',
    '.xxxxx.',
    'x.xxx.x',
    'q.xxx.q',
    '..yyy..',
    '..y.y..',
    '..y.y..',
    '..k.k..',
  ],
  person1: [
    '..zzz..',
    '.zzzzz.',
    '.zqqqz.',
    '..qqq..',
    '.xxxxx.',
    'x.xxx.x',
    'q.xxx.q',
    '..yyy..',
    '.y...y.',
    '.y...y.',
    '.k...k.',
  ],
  // Personnage assis (vu de dos/côté) derrière un bureau
  sitting: ['..zzz..', '.zzzzz.', '.zqqqz.', '..qqq..', '.xxxxx.', 'xxxxxxx', 'q.xxx.q'],
  desk: [
    '....dddddd....',
    '....dCCCCd....',
    '....dCCCCd....',
    '....dddddd....',
    '......dd......',
    'WWWWWWWWWWWWWW',
    'BBBBBBBBBBBBBB',
    '.B..........B.',
    '.B..........B.',
    '.B..........B.',
  ],
  plant: ['..G.G..', '.GgGgG.', 'GgGgGgG', '.GgGgG.', '..GgG..', '..BBB..', '..WWW..', '..BBB..'],
  coin: ['.yyy.', 'yyFyy', 'yFyyy', 'yyyyy', '.yyy.'],
  door: [
    'dddddddd',
    'dBBBBBBd',
    'dBWWWWBd',
    'dBWccWBd',
    'dBWccWBd',
    'dBWWWWBd',
    'dBBBBBBd',
    'dBBBByBd',
    'dBBBBBBd',
    'dBBBBBBd',
    'dBBBBBBd',
    'dBBBBBBd',
    'dBBBBBBd',
    'dBBBBBBd',
    'dBBBBBBd',
    'dBBBBBBd',
  ],
  table: ['WWWWWWWWWWWWWWWWWW', 'BBBBBBBBBBBBBBBBBB', '.B..............B.', '.B..............B.', '.B..............B.'],
  poster: ['llllllllll', 'lyyyyyyyyl', 'lyRRyyGGyl', 'lyRRyyGGyl', 'lyyyyyyyyl', 'lyccccccyl', 'llllllllll'],
  coffee: ['.dddd.', '.dlld.', '.dRRd.', '.dddd.', 'mmmmmm', 'mllllm', 'mllllm', 'mmmmmm'],
  server: ['dddddd', 'dGkkkd', 'dddddd', 'dGkkkd', 'dddddd', 'dRkkkd', 'dddddd', 'dddddd'],
  // Friterie
  fryer: ['llllllllll', 'lkFFkkFFkl', 'lkFkFFkFkl', 'llllllllll', 'lmmmmmmmml', 'lmRmmmmGml', 'lmmmmmmmml', 'lmmmmmmmml'],
  counter: ['wwwwwwwwwwwwwwwwwwwwwwwwwwww', 'RRRRRRRRRRRRRRRRRRRRRRRRRRRR', 'rwwrrwwrrwwrrwwrrwwrrwwrrwwr', 'rwwrrwwrrwwrrwwrrwwrrwwrrwwr', 'RRRRRRRRRRRRRRRRRRRRRRRRRRRR', 'rrrrrrrrrrrrrrrrrrrrrrrrrrrr', 'rrrrrrrrrrrrrrrrrrrrrrrrrrrr', 'rrrrrrrrrrrrrrrrrrrrrrrrrrrr'],
  cone: ['.y.y.', 'FyFyF', 'yFyFy', '.www.', '.wRw.', '..w..'],
  menu: ['kkkkkkkkkkkk', 'kwwwwwwwwwwk', 'kwRRwwyyywwk', 'kwwwwwwwwwwk', 'kwyyywwRRwwk', 'kwwwwwwwwwwk', 'kkkkkkkkkkkk'],
  parasol: ['....RRRRRR....', '..RRwwRRwwRR..', '.RwwRRwwRRwwR.', '......dd......', '......dd......', '......dd......', '......dd......', '......dd......', '....dddddd....'],
  table2: ['WWWWWWWW', 'BBBBBBBB', '.B....B.', '.B....B.'],
  // E-commerce
  shelf: ['BBBBBBBBBBBBBB', 'B.ooo..ccc...B', 'BBBBBBBBBBBBBB', 'B..yyy.RR.ggGB', 'BBBBBBBBBBBBBB', 'B.WWW..WWW...B', 'BBBBBBBBBBBBBB', 'B............B', 'B............B'],
  box: ['WWWWWW', 'WBBBBW', 'WWyyWW', 'WWWWWW', 'WWWWWW'],
  laptop: ['.dddddd.', '.dCCCCd.', '.dCCCCd.', 'llllllll'],
  // Artisan
  van: [
    '....wwwwwwwwwwwwwwwwww....',
    '...wwwwwwwwwwwwwwwwwwww...',
    '..wwccccwwwwwwwwwwwwwwww..',
    '.wwwccccwwwwwwwwwwwwwwwww.',
    'wwwwwwwwwwbbbbbbbbbbbwwwww',
    'wwwwwwwwwwbbbbbbbbbbbwwwww',
    'wwwwwwwwwwwwwwwwwwwwwwwwww',
    'mmmmmmmmmmmmmmmmmmmmmmmmmm',
    '..kkkk............kkkk....',
    '..kllk............kllk....',
  ],
  toolbox: ['..dddd..', '.d....d.', 'RRRRRRRR', 'RyRRRRyR', 'RRRRRRRR', 'rrrrrrrr'],
  pipe: ['llllllllllll', 'mmmmmmmmmmmm', '..........ll', '..........mm', '..........ll', '..........mm'],
  // Soutien scolaire
  board: [
    'BBBBBBBBBBBBBBBBBBBBBBBB',
    'BTTTTTTTTTTTTTTTTTTTTTTB',
    'BTwwTTwTwTTTwwwTTTTTTTTB',
    'BTTTTTTTTTTTTTTTTTTTTTTB',
    'BTwTwwTTwwwwTTwTTTwwTTTB',
    'BTTTTTTTTTTTTTTTTTTTTTTB',
    'BTTwwwTT=TTwwTTTTTTTTTTB',
    'BTTTTTTTTTTTTTTTTTTTTTTB',
    'BBBBBBBBBBBBBBBBBBBBBBBB',
  ],
  schoolDesk: ['WWWWWWWWWW', 'BBBBBBBBBB', '.B......B.', '.B......B.', '.B......B.'],
  books: ['RbGyo', 'RbGyo', 'RbGyo', 'BBBBB'],
};

/** Dessine un sprite. map = remplacements de lettres (ex. { x: 'R' }). */
export function drawSprite(ctx, name, x, y, map = null, flip = false) {
  const rows = SPRITES[name];
  if (!rows) return;
  const w = rows[0].length;
  for (let r = 0; r < rows.length; r++) {
    const row = rows[r];
    for (let c = 0; c < w; c++) {
      let ch = row[flip ? w - 1 - c : c];
      if (ch === '.') continue;
      if (map && map[ch]) ch = map[ch];
      const col = PALETTE[ch];
      if (!col) continue;
      ctx.fillStyle = col;
      ctx.fillRect(x + c, y + r, 1, 1);
    }
  }
}

export function spriteSize(name) {
  const rows = SPRITES[name];
  return rows ? { w: rows[0].length, h: rows.length } : { w: 0, h: 0 };
}

/** Rectangle plein en couleur de palette. */
export function rect(ctx, x, y, w, h, col) {
  ctx.fillStyle = PALETTE[col] || col;
  ctx.fillRect(x, y, w, h);
}

function hashStr(s) {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return Math.abs(h);
}

/** Apparence stable d'une personne à partir d'un identifiant. */
export function look(id) {
  const h = hashStr(String(id));
  return { q: SKINS[h % SKINS.length], z: HAIRS[(h >> 3) % HAIRS.length], x: SHIRTS[(h >> 6) % SHIRTS.length], y: PANTS[(h >> 9) % PANTS.length] };
}
