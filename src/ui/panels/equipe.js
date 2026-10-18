// Onglet Équipe : employés, candidats, gérant.

import { esc, actBtn, help } from '../dom.js';
import { eur, num } from '../format.js';
import { TRAITS } from '../../data/people.js';
import {
  roles, employerCost, dismissalCost, noticeWeeksOf, seatsAvailable, hasManager, TRAINING_COST, JOB_AD_COST, monthlyPayroll, marketSalary,
} from '../../engine/systems/staff.js';
import { DAYS_PER_MONTH } from '../../engine/calendar.js';

function motivationLabel(m) {
  if (m >= 75) return '<span class="good">😀 motivé·e</span>';
  if (m >= 50) return '<span>🙂 correct</span>';
  if (m >= 25) return '<span class="warn">😐 démotivé·e</span>';
  return '<span class="bad">😠 au bord du départ</span>';
}

export const panel = {
  id: 'equipe',
  label: 'Équipe',
  icon: '👥',
  render(state) {
    const R = roles(state);
    const st = state.staff;
    const emps = st.employees
      .map((e) => {
        const r = R[e.role];
        const months = Math.floor((state.time.day - e.hiredDay) / DAYS_PER_MONTH);
        const absent = state.time.day < e.absentUntil;
        const ratio = e.salary / marketSalary(state, e.role, e.skill);
        return `<li class="row">
          <div class="grow"><strong>${esc(e.name)}</strong> — ${esc(r ? r.label : e.role)} <span class="tag">${esc(TRAITS[e.trait]?.label || e.trait)}</span>${absent ? ' <span class="tag warn">absent·e</span>' : ''}<br>
          <span class="small">Compétence ${e.skill}/100 · ${motivationLabel(e.motivation)} (${num(e.motivation)}) · brut ${eur(e.salary, { decimals: false })} (${ratio >= 1 ? 'au-dessus' : 'en dessous'} du marché) · coût ${eur(employerCost(e), { decimals: false })}/mois · ${months} mois d'ancienneté</span></div>
          <div class="btns">
          ${actBtn('Former', { type: 'train', id: e.id }, { cls: 'btn-small', title: `${eur(TRAINING_COST, { decimals: false })} HT, 5 jours d'absence, +8 compétence` })}
          ${actBtn('Augmenter 5 %', { type: 'raise', id: e.id }, { cls: 'btn-small' })}
          <button type="button" class="btn btn-small btn-danger" data-act='${esc(JSON.stringify({ type: 'fire', id: e.id }))}' data-confirm="${esc(`Licencier ${e.name} ? Préavis de ${noticeWeeksOf(state, e)} semaine(s) payé en indemnité : ${eur(dismissalCost(state, e), { decimals: false })}.`)}">Licencier</button>
          </div></li>`;
      })
      .join('');
    const cands = st.candidates
      .map((c) => {
        const r = R[c.role];
        const t = TRAITS[c.trait];
        return `<li class="row">
          <div class="grow"><strong>${esc(c.name)}</strong> — ${esc(r ? r.label : c.role)} <span class="tag" title="${esc(t?.desc || '')}">${esc(t?.label || c.trait)}</span><br>
          <span class="small">Compétence ${c.skill}/100 · demande ${eur(c.salary, { decimals: false })} brut/mois → coût employeur ≈ ${eur(employerCost(c), { decimals: false })}/mois</span><br>
          <span class="small muted">${esc(r?.desc || '')}</span></div>
          ${actBtn('Embaucher', { type: 'hire', id: c.id }, { cls: 'btn-small btn-primary' })}
        </li>`;
      })
      .join('');
    const roleOpts = Object.values(R)
      .map((r) => actBtn(`Annonce : ${esc(r.label)}`, { type: 'postJobAd', role: r.id }, { cls: 'btn-small', title: `${eur(JOB_AD_COST, { decimals: false })} HT : 3 nouveaux candidats` }))
      .join(' ');
    const f = st.founder;
    return `
    <section class="card-block">
      <h3>Toi, ${esc(state.meta.founderName)}</h3>
      <p>${f.active ? 'Tu travailles dans l’entreprise (ta capacité de travail compte).' : 'Tu t’es retiré·e de l’opérationnel : ton gérant dirige, le bénéfice compte comme revenu passif.'}</p>
      ${f.active
        ? actBtn('Me retirer de l’opérationnel', { type: 'retire' }, { disabled: !hasManager(state), title: hasManager(state) ? '' : 'Recrute d’abord un·e gérant·e (compétence ≥ 40).' })
        : actBtn('Reprendre du service', { type: 'unretire' })}
      <p class="muted small">Places de travail libres : ${Math.max(0, seatsAvailable(state))}. Masse salariale : ${eur(monthlyPayroll(state), { decimals: false })}/mois ${help('Coût employeur')}</p>
    </section>
    <section class="card-block">
      <h3>Employés (${st.employees.length})</h3>
      ${emps ? `<ul class="list">${emps}</ul>` : '<p class="muted">Personne pour l’instant. Recrute quand ta capacité est saturée.</p>'}
    </section>
    <section class="card-block">
      <h3>Candidats ${help('Préavis')}</h3>
      ${cands ? `<ul class="list">${cands}</ul>` : '<p class="muted">Aucun candidat. Publie une annonce ou attends le mois prochain.</p>'}
      <div class="btns wrap">${roleOpts}</div>
    </section>`;
  },
};
