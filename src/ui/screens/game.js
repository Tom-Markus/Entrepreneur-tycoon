// Écran de jeu : barre du haut, scène animée, indicateurs, onglets.

import { esc, $ } from '../dom.js';
import { eur, eurShort, num, byFmt } from '../format.js';
import { formatDate, dateOf, WEEKDAY_NAMES } from '../../engine/calendar.js';
import { WEATHER } from '../../data/world.js';
import { CONFIG } from '../../data/config.js';
import { kpis } from '../../engine/selectors.js';
import { Scene } from '../scene.js';
import { PANELS } from '../panels/index.js';
import { toast } from '../toast.js';
import { audio } from '../audio.js';
import { openLoadDialog } from './title.js';
import { openGlossary } from '../glossary.js';
import { startTutorial } from '../tutorial.js';
import { showDecisionModal } from '../decision.js';
import { passiveIncome } from '../../engine/selectors.js';
import { isModalOpen, closeModal } from '../modal.js';
import { DIFFICULTIES } from '../../data/difficulty.js';
import { mountPixelTitles } from '../pixelfont.js';

const SPEED_LABELS = ['⏸', '×1', '×2', '×4'];
const WEATHER_ICON = { soleil: '☀', nuageux: '☁', pluie: '🌧', froid: '❄', canicule: '🔥' };

export class GameScreen {
  constructor(app) {
    this.app = app;
    this.tab = 'entreprise';
    this.panelHtml = '';
    this.sideHtml = '';
    this.refreshAcc = 0;
    this.lastLogId = app.state.logSeq || 0;
    this.scene = null;
    this.decisionOpen = false;
  }

  get state() {
    return this.app.state;
  }

  mount() {
    const s = this.state;
    this.app.root.innerHTML = `
    <div class="game">
      <header class="topbar" aria-label="Indicateurs principaux">
        <div class="tb-company"><span class="tb-name">${esc(s.meta.companyName)}</span><span class="tb-sub muted" id="tb-sub"></span></div>
        <div class="tb-stat" title="Trésorerie du compte professionnel"><span class="tb-label">Trésorerie</span><span id="tb-cash" class="tb-value"></span></div>
        <div class="tb-stat" title="Ton compte personnel"><span class="tb-label">Perso</span><span id="tb-perso" class="tb-value"></span></div>
        <div class="tb-stat" title="Réputation (0-100)"><span class="tb-label">Réputation</span><span id="tb-rep" class="tb-value"></span></div>
        <div class="tb-stat" title="Revenu passif mensuel net / objectif"><span class="tb-label">Revenu passif</span><span id="tb-passive" class="tb-value"></span></div>
        <div class="tb-date"><span id="tb-date"></span><span id="tb-weather" class="muted"></span></div>
        <div class="tb-speed" role="group" aria-label="Vitesse du jeu">
          ${SPEED_LABELS.map((l, i) => `<button type="button" class="btn btn-speed" data-ui="speed" data-arg="${i}" aria-label="${i === 0 ? 'Pause' : `Vitesse ${l}`}">${l}</button>`).join('')}
        </div>
        <button type="button" class="btn btn-icon" data-ui="menu" aria-label="Menu">☰</button>
      </header>
      <div class="game-main">
        <section class="left" aria-label="Ton entreprise">
          <div class="scene-wrap"><canvas id="scene" class="scene" aria-label="Scène animée de ton entreprise"></canvas>
            <div id="alert" class="scene-alert" role="alert" hidden></div></div>
          <div id="side" class="side"></div>
        </section>
        <section class="right" aria-label="Gestion">
          <nav class="tabs" role="tablist">
            ${PANELS.map((p) => `<button type="button" role="tab" class="tab" id="tab-${p.id}" data-ui="tab" data-arg="${p.id}" aria-controls="panel">${p.icon} <span>${p.label}</span></button>`).join('')}
          </nav>
          <div id="panel" class="panel" role="tabpanel" tabindex="-1"></div>
        </section>
      </div>
    </div>`;
    this.scene = new Scene($('#scene'));
    this.root = this.app.root.querySelector('.game');
    this._onClick = (e) => this.onClick(e);
    this._onChange = (e) => this.onChange(e);
    this._onInput = (e) => this.onInput(e);
    this.root.addEventListener('click', this._onClick);
    this.root.addEventListener('change', this._onChange);
    this.root.addEventListener('input', this._onInput);
    this.root.querySelector('.tabs').addEventListener('keydown', (e) => {
      if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(e.key)) return;
      const i = PANELS.findIndex((p) => p.id === this.tab);
      const n = PANELS.length;
      const j = e.key === 'Home' ? 0 : e.key === 'End' ? n - 1 : (i + (e.key === 'ArrowRight' ? 1 : -1) + n) % n;
      this.selectTab(PANELS[j].id);
      $(`#tab-${PANELS[j].id}`).focus();
      e.preventDefault();
    });
    this.selectTab(this.tab);
    this.refresh(true);
  }

  unmount() {
    if (this.root) {
      this.root.removeEventListener('click', this._onClick);
      this.root.removeEventListener('change', this._onChange);
      this.root.removeEventListener('input', this._onInput);
    }
  }

  // --- Interactions ----------------------------------------------------------------

  onClick(e) {
    const t = e.target.closest('[data-act], [data-ui]');
    if (!t || t.disabled) return;
    if (t.dataset.act) {
      let action;
      try {
        action = JSON.parse(t.dataset.act);
      } catch {
        return;
      }
      if (t.dataset.confirm && !confirm(t.dataset.confirm)) return;
      const res = this.app.dispatch(action);
      if (res.ok && t.dataset.okmsg) toast(t.dataset.okmsg, 'good');
      return;
    }
    this.uiCommand(t.dataset.ui, t.dataset.arg, t);
  }

  onInput(e) {
    const el = e.target;
    if (el.type === 'range') {
      const out = el.closest('label')?.querySelector('output');
      const fmt = el.dataset.fmt;
      const v = Number(el.value);
      if (out) out.textContent = fmt === 'eur' ? eur(v * Number(el.dataset.scale || 1), { decimals: false }) : fmt === 'pct' ? `${v} %` : fmt === 'days100' ? `${(v / 100).toFixed(1).replace('.', ',')} j` : el.value;
    }
  }

  onChange(e) {
    const el = e.target;
    if (!el.dataset.input) return;
    let action;
    try {
      action = JSON.parse(el.dataset.input);
    } catch {
      return;
    }
    const value = el.dataset.checkbox ? el.checked : el.dataset.raw ? el.value : Math.round(Number(String(el.value).replace(',', '.')) * Number(el.dataset.scale || 1));
    if (!el.dataset.raw && !el.dataset.checkbox && !Number.isFinite(value)) {
      toast('Valeur invalide.', 'bad');
      return;
    }
    this.app.dispatch({ ...action, value });
  }

  uiCommand(cmd, arg) {
    switch (cmd) {
      case 'tab':
        this.selectTab(arg);
        break;
      case 'speed':
        this.app.setSpeed(Number(arg));
        break;
      case 'menu':
        this.openMenu();
        break;
      case 'glossary':
        openGlossary(this.app, arg);
        break;
      case 'saves':
        openLoadDialog(this.app, { inGame: true });
        break;
      default: {
        const panel = PANELS.find((p) => p.id === this.tab);
        if (panel && panel.ui) panel.ui(cmd, arg, this.app);
      }
    }
  }

  openMenu() {
    const m = this.app.openModal({
      title: 'Menu',
      html: `<div class="menu-list">
        <button class="btn" data-m="saves">💾 Sauvegardes (sauver, charger, exporter)</button>
        <button class="btn" data-m="export">⬇ Exporter la partie en fichier</button>
        <button class="btn" data-m="glossary">📖 Glossaire</button>
        <button class="btn" data-m="tutorial">🎓 Revoir le tutoriel</button>
        <button class="btn" data-m="sound">${this.app.settings.sound ? '🔊 Son : activé' : '🔇 Son : désactivé'}</button>
        <button class="btn" data-m="quit">⏏ Retour au menu principal</button>
      </div>
      <p class="muted small">Partie n° ${esc(this.state.meta.gameId.slice(0, 8))} · graine « ${esc(this.state.meta.seed.slice(0, 30))} » · autosauvegarde toutes les ${CONFIG.autosaveSeconds} s.</p>`,
    });
    m.addEventListener('click', (e) => {
      const b = e.target.closest('[data-m]');
      if (!b) return;
      const c = b.dataset.m;
      if (c === 'saves') openLoadDialog(this.app, { inGame: true });
      if (c === 'export') this.app.exportCurrent();
      if (c === 'glossary') openGlossary(this.app);
      if (c === 'tutorial') startTutorial(this.app, true);
      if (c === 'sound') {
        this.app.settings.sound = !this.app.settings.sound;
        audio.setEnabled(this.app.settings.sound);
        this.app.saveSettings();
        b.textContent = this.app.settings.sound ? '🔊 Son : activé' : '🔇 Son : désactivé';
        audio.play('good');
      }
      if (c === 'quit') {
        this.app.autosave().then(() => {
          closeModal(true);
          this.app.showTitle();
        });
      }
    });
  }

  selectTab(id) {
    if (!PANELS.find((p) => p.id === id)) id = PANELS[0].id;
    this.tab = id;
    for (const p of PANELS) {
      const b = $(`#tab-${p.id}`);
      if (b) {
        b.classList.toggle('active', p.id === id);
        b.setAttribute('aria-selected', p.id === id ? 'true' : 'false');
        b.tabIndex = p.id === id ? 0 : -1;
      }
    }
    this.panelHtml = '';
    this.refresh(true);
  }

  startTutorial() {
    startTutorial(this.app, false);
  }

  showDecision() {
    if (this.decisionOpen || isModalOpen()) return;
    this.decisionOpen = true;
    audio.play('event');
    showDecisionModal(this.app, () => {
      this.decisionOpen = false;
      this.refresh(true);
    });
  }

  // --- Rendu ---------------------------------------------------------------------

  frame(dt) {
    const s = this.state;
    const running = this.app.currentSpeed() > 0;
    this.scene.update(running ? dt * Math.max(1, this.app.currentSpeed() / 2) : 0, s);
    this.scene.draw(s);
    this.refreshAcc += dt;
    if (this.refreshAcc >= 0.25) {
      this.refreshAcc = 0;
      this.refresh(false);
    }
    if (s.events && s.events.pending.length && !this.decisionOpen && !isModalOpen()) this.showDecision();
  }

  updateHeader() {
    const s = this.state;
    const cashEl = $('#tb-cash');
    if (!cashEl) return;
    cashEl.textContent = eurShort(s.cash);
    cashEl.className = `tb-value ${s.cash < 0 ? 'bad' : ''}`;
    $('#tb-perso').textContent = eurShort(s.personal.cash);
    $('#tb-rep').textContent = `${num(s.company.reputation)}/100`;
    const p = passiveIncome(s);
    $('#tb-passive').textContent = `${eurShort(p.total)} / ${eurShort(p.target)}`;
    $('#tb-passive').className = `tb-value ${p.total >= p.target ? 'good' : ''}`;
    const d = dateOf(s.time.day);
    $('#tb-date').textContent = `${WEEKDAY_NAMES[d.weekday].slice(0, 3)}. ${formatDate(s.time.day)}`;
    $('#tb-weather').textContent = ` ${WEATHER_ICON[s.world.weather] || ''} ${WEATHER.labels[s.world.weather] || ''}`;
    $('#tb-sub').textContent = s.status === 'sandbox' ? 'Bac à sable' : s.staff.founder.active ? `Dirigé par ${s.meta.founderName}` : 'Géré par ton gérant';
    const idx = this.app.speedIdx;
    this.root.querySelectorAll('.btn-speed').forEach((b, i) => {
      b.classList.toggle('active', i === idx);
      b.setAttribute('aria-pressed', i === idx ? 'true' : 'false');
    });
    const alert = $('#alert');
    const eg = s.endgame;
    if (eg && eg.distressDays > 0) {
      alert.hidden = false;
      alert.textContent = `⚠ Défaut de paiement : faillite dans ${Math.max(0, DIFFICULTIES[s.meta.difficulty].graceDays - eg.distressDays)} jours si rien ne change`;
    } else if (s.events && s.events.pending.length) {
      alert.hidden = false;
      alert.textContent = '⏸ Décision en attente';
    } else alert.hidden = true;
  }

  refresh(force) {
    const s = this.state;
    if (!s || !this.root) return;
    this.updateHeader();
    // Notifications du journal
    for (const e of s.log) {
      if (e.id > this.lastLogId && e.toast) {
        toast(e.text, e.kind === 'good' ? 'good' : e.kind === 'bad' ? 'bad' : 'info');
        if (e.kind === 'good') audio.play('good');
        if (e.kind === 'bad') audio.play('bad');
      }
    }
    this.lastLogId = s.logSeq;
    // Colonne de gauche (indicateurs + pourquoi)
    const side = renderSide(s);
    if (force || side !== this.sideHtml) {
      this.sideHtml = side;
      $('#side').innerHTML = side;
    }
    // Panneau actif (ne pas écraser un champ en cours d'édition)
    const panelEl = $('#panel');
    const active = document.activeElement;
    const editing = active && panelEl.contains(active) && ['INPUT', 'SELECT', 'TEXTAREA'].includes(active.tagName);
    if (editing && !force) return;
    const panel = PANELS.find((p) => p.id === this.tab);
    const html = panel.render(s, this.app);
    if (force || html !== this.panelHtml) {
      const scroll = panelEl.scrollTop;
      const focusId = active && panelEl.contains(active) ? active.id : null;
      this.panelHtml = html;
      panelEl.innerHTML = html;
      mountPixelTitles(panelEl);
      if (panel.mount) panel.mount(panelEl, s, this.app);
      panelEl.scrollTop = scroll;
      if (focusId) {
        const f = document.getElementById(focusId);
        if (f) f.focus();
      }
    } else if (panel.mount && panel.live) panel.mount(panelEl, s, this.app);
  }
}

function renderSide(s) {
  const k = kpis(s);
  const why = (s.company.why || []).filter((w) => w.kind !== 'pct');
  const share = (s.company.why || []).find((w) => w.kind === 'pct');
  const bn = {
    capacite: 'Goulet : ta capacité est saturée — recrute ou augmente tes prix.',
    prix: 'Goulet : tes prix sont trop élevés pour les clients actuels.',
    demande: 'Goulet : pas assez de demande — marketing, réputation, saison.',
    stock: 'Goulet : ruptures de stock — commande plus.',
    personnel: 'Goulet : pas assez de personnel en service.',
    places: 'Goulet : plus de places disponibles dans tes locaux.',
    ferme: 'Établissement fermé (sanction ou incident).',
  }[s.company.bottleneck];
  return `
  <div class="kpis">${k.map((x) => `<div class="kpi"><span class="kpi-label">${esc(x.label)}</span><span class="kpi-value">${byFmt(x.value, x.fmt, x.suffix || '')}</span></div>`).join('')}</div>
  <details class="why" open>
    <summary>Pourquoi mes ventes ? <span class="muted">(part de marché ${share ? `${num(share.value * 100)} %` : '—'})</span></summary>
    ${bn ? `<p class="bottleneck">${esc(bn)}</p>` : ''}
    <ul class="why-list">${why
      .map((w) => {
        const d = Math.round((w.value - 1) * 100);
        const cls = d > 2 ? 'good' : d < -2 ? 'bad' : 'muted';
        return `<li title="${esc(w.hint || '')}"><span>${esc(w.label)}</span><span class="${cls}">${d === 0 ? '±0' : d > 0 ? `+${d}` : `−${-d}`} %</span></li>`;
      })
      .join('')}</ul>
    <p class="muted small">Chaque facteur multiplie la demande. Survole un facteur pour l'explication.</p>
  </details>`;
}
