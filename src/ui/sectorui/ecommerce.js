// Contrôles de l'e-commerce (onglet Entreprise).

import { esc, actBtn, eurInput, help } from '../dom.js';
import { eur, num, pct } from '../format.js';
import { ECOMMERCE as D } from '../../data/sectors/ecommerce.js';
import { slots, cpc, orderCapacity } from '../../engine/sectors/ecommerce.js';
import { formatDate } from '../../engine/calendar.js';

export function renderSector(state) {
  const s = state.sector;
  const t = s.today;
  const rows = D.products
    .map((p) => {
      const listed = s.listed.includes(p.id);
      const inbound = s.pos.filter((x) => x.id === p.id);
      const ht = s.prices[p.id] / (1 + p.vat);
      const margin = ht - p.cost - p.ship - D.packing;
      return `<li class="row ${listed ? '' : 'dim'}">
        <div class="grow"><strong>${esc(p.label)}</strong> ${listed ? '<span class="tag good">en ligne</span>' : ''}<br>
        <span class="small">Achat ${eur(p.cost)} HT · prix conseillé ${eur(p.ref)} TTC · TVA ${pct(p.vat)} · retours ≈ ${pct(p.returns)} · marge/commande ≈ <span class="${margin > 0 ? 'good' : 'bad'}">${eur(Math.round(margin))}</span> (hors pub)</span><br>
        <span class="small">Stock : <strong>${s.stock[p.id] || 0}</strong>${inbound.length ? ` · en route : ${inbound.map((x) => `${x.qty} (le ${formatDate(x.arrive)})`).join(', ')}` : ''}</span></div>
        ${listed ? eurInput(`price-${p.id}`, s.prices[p.id], { type: 'sector', name: 'setProductPrice', id: p.id }, { min: 1, max: 999, step: 0.1, label: 'Prix TTC' }) : ''}
        <div class="btns">
          ${listed ? actBtn('Retirer', { type: 'sector', name: 'unlistProduct', id: p.id }, { cls: 'btn-small' }) : actBtn('Mettre en ligne', { type: 'sector', name: 'listProduct', id: p.id }, { cls: 'btn-small', disabled: s.listed.length >= slots(state) })}
          ${actBtn('Commander 50', { type: 'sector', name: 'orderStock', id: p.id, qty: 50 }, { cls: 'btn-small', title: `≈ ${eur(Math.round(p.cost * 50 * (1 + p.vat)), { decimals: false })} TTC, livré en ${D.leadTime} jours` })}
        </div></li>`;
    })
    .join('');
  return `
  <section class="card-block">
    <h3>Entonnoir de vente ${help('Taux de conversion')}</h3>
    <p>${t.visitors} visiteurs hier (${t.organic} gratuits, ${t.paid} payés à ${eur(Math.round(cpc(state)))}/clic) → conversion ${pct(t.conversion, 1)} → <strong>${t.orders}</strong> commandes${t.lostStock ? `, <span class="bad">${t.lostStock} perdues (rupture)</span>` : ''}.</p>
    <p class="small muted">Le budget marketing (plus bas) = ta publicité en ligne. Coût d'acquisition et panier moyen : surveille-les ${help('Coût d’acquisition client')}.</p>
    <p class="small">Préparation : ${num(orderCapacity(state))} commandes/jour · à expédier : ${s.backlog}${s.backlog > orderCapacity(state) ? ' <span class="bad">(retards !)</span>' : ''}.</p>
  </section>
  <section class="card-block">
    <h3>Réapprovisionnement</h3>
    <label class="check"><input type="checkbox" ${s.reorder ? 'checked' : ''} data-input='${esc(JSON.stringify({ type: 'sector', name: 'setReorder' }))}' data-raw="1" data-checkbox="1"> Commandes fournisseur automatiques (point de commande)</label>
    <label class="field"><span>Jours de ventes commandés à chaque réassort : ${s.coverDays}</span><input type="number" min="7" max="90" value="${s.coverDays}" data-input='${esc(JSON.stringify({ type: 'sector', name: 'setCoverDays' }))}' data-scale="1"></label>
    <p class="small muted">Le stock est payé à la commande et arrive après ≈ ${D.leadTime} jours : c'est de la trésorerie immobilisée ${help('Besoin en fonds de roulement')}.</p>
  </section>
  <section class="card-block">
    <h3>Catalogue (${s.listed.length}/${slots(state)} produits en ligne)</h3>
    <ul class="list">${rows}</ul>
  </section>`;
}
