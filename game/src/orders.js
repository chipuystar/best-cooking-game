// orders.js — the order board: spawning tickets, draining patience,
// serving a finished plate for coins, and the combo that rewards a hot
// streak. Expired orders feed Chef Vex, the rival across the street.

import {
  COMBO_BONUS_COINS, COMBO_BONUS_EVERY, EXPIRE_PENALTY, MAX_VEX_HYPE,
  PHASES, RECIPES, RECIPE_IDS, SERVE_WINDOW,
} from './config.js';
import { makeOrder, ordersFull, phaseConfig, plateMatchesRecipe } from './state.js';
import { sfx } from './audio.js';
import { addFloat, addShake, spawnBurst, spawnSteam } from './particles.js';

function randomRecipe() {
  return RECIPE_IDS[Math.floor(Math.random() * RECIPE_IDS.length)];
}

export function spawnOrder(state, recipeId = randomRecipe()) {
  if (ordersFull(state)) return null;
  const order = makeOrder(recipeId, phaseConfig(state).patience);
  state.orders.push(order);
  return order;
}

function expireOrder(state, order) {
  state.orders = state.orders.filter((o) => o.id !== order.id);
  state.expired += 1;
  state.combo = 0;
  state.vexHype = Math.min(MAX_VEX_HYPE, state.vexHype + 1);
  state.coins = Math.max(0, state.coins - EXPIRE_PENALTY);
  state.flash = { color: 'rgba(244,63,94,0.28)', t: 1 };
  addShake(state, 6);
  sfx.expire();
}

// Serve the plate the chef carries. Pays price + a patience tip, grows the
// combo, and clears the matching ticket. Returns true when served.
export function servePlate(state, plate) {
  const order = state.orders.find((o) => plateMatchesRecipe(plate.items, RECIPES[o.recipeId]));
  if (!order) return false;
  const recipe = RECIPES[order.recipeId];
  const patienceShare = order.patience / order.maxPatience;
  const tip = Math.round(recipe.price * 0.5 * patienceShare * phaseConfig(state).tipRate);
  let payout = recipe.price + tip;
  state.combo += 1;
  state.bestCombo = Math.max(state.bestCombo, state.combo);
  if (state.combo > 0 && state.combo % COMBO_BONUS_EVERY === 0) {
    payout += COMBO_BONUS_COINS;
  }
  state.coins += payout;
  state.stats.earned += payout;
  state.served += 1;
  state.orders = state.orders.filter((o) => o.id !== order.id);
  plate.items = [];
  plate.carried = false;
  state.chef.carrying = null;

  const cx = SERVE_WINDOW.x + SERVE_WINDOW.w / 2;
  const cy = SERVE_WINDOW.y + SERVE_WINDOW.h / 2;
  addFloat(state, cx, cy - 30, `+$${payout}`, '#fbbf24', 26);
  if (state.combo >= 2) {
    addFloat(state, cx, cy - 58, `COMBO x${state.combo}!`, '#f472b6', 20);
    sfx.combo();
  }
  spawnBurst(state, cx, cy, ['#fbbf24', '#34d399', '#f472b6'], 16, 150);
  spawnSteam(state, cx, cy, 3);
  sfx.serve();
  return true;
}

// Tick the order board: spawn on schedule, drain patience, expire the
// tickets that run out. Called every frame while playing.
export function updateOrders(state, dt) {
  state.spawnTimer -= dt;
  if (state.spawnTimer <= 0) {
    state.spawnTimer = phaseConfig(state).spawnEvery;
    spawnOrder(state);
  }
  const expired = [];
  for (const order of state.orders) {
    order.patience -= dt;
    if (order.patience <= 0) expired.push(order);
  }
  expired.forEach((o) => expireOrder(state, o));
}

// The phase banner text and colour for the current phase.
export function phaseBanner(state) {
  return PHASES[state.phase];
}
