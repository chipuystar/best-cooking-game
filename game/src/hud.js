// hud.js — the DOM around the canvas: the top bar (timer, coins, combo),
// the order board rail (ticket cards with patience bars), the Chef Vex
// rivalry meter, phase banners and the title / end / pause screens.

import { INGREDIENTS, MAX_VEX_HYPE, PHASES, RECIPES, STAR_THRESHOLDS } from './config.js';
import { renderDishIcon } from './food.js';
import { starsFor } from './state.js';

const $ = (id) => document.getElementById(id);

let ticketEls = new Map();
let lastTicketSig = '';

function fmtTime(seconds) {
  const s = Math.max(0, Math.ceil(seconds));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
}

function ticketSignature(orders) {
  return orders.map((o) => `${o.id}:${o.recipeId}`).join(',');
}

function buildTicket(order) {
  const recipe = RECIPES[order.recipeId];
  const el = document.createElement('div');
  el.className = 'ticket';
  el.style.setProperty('--ticket-color', recipe.color);
  const needs = recipe.needs.map((id) => INGREDIENTS[id].short).join(' · ');
  el.innerHTML = `
    <img class="ticket-dish" src="${renderDishIcon(order.recipeId)}" alt="${recipe.name}">
    <div class="ticket-body">
      <div class="ticket-name">${recipe.name}</div>
      <div class="ticket-needs">${needs}</div>
      <div class="ticket-bar"><div class="ticket-fill"></div></div>
    </div>
    <div class="ticket-price">$${recipe.price}</div>`;
  return el;
}

function syncTickets(state) {
  const sig = ticketSignature(state.orders);
  if (sig === lastTicketSig) return;
  lastTicketSig = sig;
  const box = $('tickets');
  box.innerHTML = '';
  ticketEls = new Map();
  if (state.orders.length === 0) {
    const empty = document.createElement('div');
    empty.className = 'tickets-empty';
    empty.textContent = 'No orders yet — the night is young.';
    box.appendChild(empty);
    return;
  }
  for (const order of state.orders) {
    const el = buildTicket(order);
    box.appendChild(el);
    ticketEls.set(order.id, {
      el,
      fill: el.querySelector('.ticket-fill'),
    });
  }
}

function updateTicketBars(state) {
  for (const order of state.orders) {
    const t = ticketEls.get(order.id);
    if (!t) continue;
    const share = Math.max(0, order.patience / order.maxPatience);
    t.fill.style.width = `${share * 100}%`;
    t.fill.classList.toggle('low', share < 0.3);
    t.fill.classList.toggle('mid', share >= 0.3 && share < 0.6);
    t.el.classList.toggle('urgent', share < 0.25);
  }
}

function updateVex(state) {
  const meter = $('vex-meter');
  if (!meter) return;
  const segs = meter.querySelectorAll('.vex-seg');
  segs.forEach((seg, i) => seg.classList.toggle('lit', i < state.vexHype));
  const label = $('vex-label');
  if (label) {
    label.textContent = state.vexHype === 0
      ? 'VEX IS QUIET'
      : state.vexHype >= MAX_VEX_HYPE
        ? 'VEX OWNS THE STREET'
        : `VEX HYPE ${state.vexHype}/${MAX_VEX_HYPE}`;
  }
}

export function updateHUD(state) {
  const timer = $('timer');
  if (timer) {
    timer.textContent = fmtTime(state.timeLeft);
    timer.classList.toggle('urgent', state.timeLeft <= 10 && state.screen === 'playing');
  }
  const phase = $('phase-badge');
  if (phase) {
    phase.textContent = PHASES[state.phase].name;
    phase.style.setProperty('--phase-color', PHASES[state.phase].tint);
  }
  const coins = $('coins');
  if (coins) coins.textContent = `$${state.coins}`;
  const combo = $('combo-badge');
  if (combo) {
    combo.classList.toggle('show', state.combo >= 2);
    combo.textContent = `COMBO x${state.combo}`;
  }
  const served = $('served-count');
  if (served) served.textContent = `${state.served} SERVED`;
  const best = $('best-combo');
  if (best) best.textContent = `BEST x${state.bestCombo}`;
  syncTickets(state);
  updateTicketBars(state);
  updateVex(state);
}

let bannerTimer = null;

export function showBanner(title, sub, color) {
  const banner = $('banner');
  if (!banner) return;
  banner.querySelector('.banner-title').textContent = title;
  banner.querySelector('.banner-sub').textContent = sub;
  banner.style.setProperty('--banner-color', color);
  banner.classList.add('show');
  if (bannerTimer) clearTimeout(bannerTimer);
  bannerTimer = setTimeout(() => banner.classList.remove('show'), 2400);
}

export function showScreen(name) {
  for (const id of ['title-screen', 'pause-screen', 'end-screen']) {
    const el = $(id);
    if (el) el.classList.toggle('show', id === `${name}-screen`);
  }
}

export function fillEndScreen(state) {
  const stars = starsFor(state.coins, STAR_THRESHOLDS);
  const starRow = $('end-stars');
  if (starRow) {
    starRow.innerHTML = '';
    for (let i = 0; i < 3; i++) {
      const s = document.createElement('span');
      s.className = `end-star${i < stars ? ' lit' : ''}`;
      s.textContent = '★';
      starRow.appendChild(s);
    }
  }
  const set = (id, text) => { const el = $(id); if (el) el.textContent = text; };
  set('end-coins', `$${state.coins}`);
  set('end-served', `${state.served}`);
  set('end-expired', `${state.expired}`);
  set('end-combo', `x${state.bestCombo}`);
  set('end-chopped', `${state.stats.chopped}`);
  set('end-cooked', `${state.stats.cooked}`);
  set('end-trashed', `${state.stats.trashed}`);
  const title = $('end-title');
  if (title) {
    title.textContent = stars === 3
      ? 'A LEGENDARY NIGHT'
      : stars === 2
        ? 'THE CROWD LOVED IT'
        : stars === 1
          ? 'A SOLID SHIFT'
          : 'THE NIGHT GOT AWAY';
  }
  const vex = $('end-vex');
  if (vex) {
    vex.textContent = state.vexHype >= MAX_VEX_HYPE
      ? 'Chef Vex stole the street tonight — expired orders fed his hype. Serve faster next shift.'
      : state.served > state.vexHype * 2
        ? 'You out-cooked Chef Vex and owned the night. The street is yours.'
        : 'Chef Vex is still across the street, watching. Keep the tickets moving.';
  }
}
