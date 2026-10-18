// Contrôles de la friterie (onglet Entreprise).

import { eurInput, selectInput, rangeInput, bar, help } from '../dom.js';
import { eur, num } from '../format.js';
import { RESTAURANT as D } from '../../data/sectors/restaurant.js';
import { capacities, stockQty, unitCost, blendedVat, refPrice } from '../../engine/sectors/restaurant.js';
import { formatDate } from '../../engine/calendar.js';

export function renderSector(state) {
  const s = state.sector;
  const caps = capacities(state);
  const t = s.today;
  return `
  <section class="card-block">
    <h3>Ta carte</h3>
    <div class="form-row">
      ${eurInput('price', s.price, { type: 'sector', name: 'setPrice' }, { min: D.minPrice / 100, max: D.maxPrice / 100, step: 0.1, label: `Ticket moyen TTC (marché ≈ ${eur(refPrice(state))})` })}
      ${selectInput('ingredient', String(s.ingredient), D.ingredients.map((i) => ({ value: String(i.level), label: `${i.label} — ${eur(i.cost)}/portion` })), { type: 'sector', name: 'setIngredient' }, { label: 'Qualité des ingrédients' })}
    </div>
    <p class="small muted">TVA moyenne du ticket : ${num(blendedVat() * 100, 1)} % (repas 12 %, boissons 21 %) ${help('TVA')} · coût matière actuel ${eur(unitCost(state))}/portion (${num((unitCost(state) / (s.price / (1 + blendedVat()))) * 100)} % du prix HT).</p>
  </section>
  <section class="card-block">
    <h3>Stock périssable</h3>
    ${rangeInput('stockdays', s.stockDays * 100, { type: 'sector', name: 'setStockDays' }, { min: 50, max: 400, step: 10, scale: 1, label: 'Commande quotidienne : jours de ventes à couvrir', display: `${num(s.stockDays, 1)} j`, fmt: 'days100' })}
    <p class="small">En stock : <strong>${stockQty(state)}</strong> portions (périment après ${D.shelfLife} jours) · gaspillées au total : ${s.stats.wasted} · ventes perdues (rupture ou file) : ${s.stats.lost}</p>
    <p class="small muted">Trop bas = ruptures et clients perdus ; trop haut = gaspillage. Le lundi est jour de fermeture.</p>
  </section>
  <section class="card-block">
    <h3>Service d'hier ${s.closedUntil > state.time.day ? `<span class="tag warn">Fermé jusqu’au ${formatDate(s.closedUntil)}</span>` : ''}</h3>
    <p>${t.served} clients servis sur ${t.demand} venus · ${t.lostQueue} partis à cause de la file · ${t.lostStock} faute de stock.</p>
    <p class="small">Capacité : personnel ${num(caps.staff)} · équipement ${num(caps.equipment)} clients/jour → <strong>${num(caps.total)}</strong>.</p>
  </section>
  <section class="card-block">
    <h3>Hygiène ${help('AFSCA')}</h3>
    <p>${bar(s.hygiene, 100, s.hygiene < 55 ? 'bad' : '')} <strong>${num(s.hygiene)}/100</strong> ${s.hygiene < 55 ? '<span class="bad">— risque de sanction AFSCA !</span>' : ''}</p>
    ${eurInput('cleaning', s.cleaning, { type: 'sector', name: 'setCleaning' }, { min: 0, max: 5000, step: 10, label: 'Budget nettoyage mensuel HT' })}
  </section>`;
}
