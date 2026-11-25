// state.js — the whole game state in one plain object, and the helpers that
// build and reset it. No rendering or input here: this file only knows facts.

import {
  BOARDS, CHEF_START, FRYER_SLOTS, GRILL_SLOTS, MAX_ORDERS, PHASES,
  PLATE_COUNT, PLATE_SPOTS, SHIFT_SECONDS,
} from './config.js';

let nextOrderId = 1;

export function createState() {
  return {
    screen: 'title', // title | playing | paused | end
    timeLeft: SHIFT_SECONDS,
    phase: 0,
    phaseBanner: 0, // seconds left to show the phase banner
    coins: 0,
    served: 0,
    expired: 0,
    combo: 0,
    bestCombo: 0,
    vexHype: 0,
    orders: [],
    spawnTimer: 2.5,
    chef: {
      x: CHEF_START.x,
      y: CHEF_START.y,
      tx: CHEF_START.x,
      ty: CHEF_START.y,
      moving: false,
      walking: false,
      walkPhase: 0,
      dir: 1, // 1 faces right, -1 faces left
      carrying: null, // { kind: 'item', itemId } | { kind: 'plate', plate }
      pendingStation: null, // station id to use on arrival
    },
    plates: PLATE_SPOTS.slice(0, PLATE_COUNT).map((spot, i) => ({
      id: spot.id,
      spotIndex: i,
      items: [],
      carried: false,
    })),
    boards: BOARDS.map((b) => ({ id: b.id, item: null })), // item: { itemId, progress, done }
    grill: GRILL_SLOTS.map((g) => ({ id: g.id, item: null })), // item: { itemId, progress, state }
    fryer: FRYER_SLOTS.map((f) => ({ id: f.id, item: null })),
    particles: [],
    floats: [],
    shake: 0,
    flash: null, // { color, t } full-screen flash, 0..1
    lastTickSecond: -1,
    stats: { chopped: 0, cooked: 0, trashed: 0, earned: 0 },
    muted: false,
    shot: null,
  };
}

export function resetState(state) {
  const fresh = createState();
  fresh.muted = state.muted;
  fresh.shot = state.shot;
  Object.keys(fresh).forEach((k) => { state[k] = fresh[k]; });
}

export function phaseFor(timeLeft) {
  if (timeLeft > 120) return 0;
  if (timeLeft > 60) return 1;
  return 2;
}

export function phaseConfig(state) {
  return PHASES[state.phase];
}

export function makeOrder(recipeId, patience) {
  return { id: nextOrderId++, recipeId, patience, maxPatience: patience };
}

export function ordersFull(state) {
  return state.orders.length >= MAX_ORDERS;
}

// The plate the chef is carrying, or null.
export function carriedPlate(state) {
  const c = state.chef.carrying;
  return c && c.kind === 'plate' ? c.plate : null;
}

// A plate on the counter at a spot, or null when its plate is carried away.
export function plateAtSpot(state, spotIndex) {
  return state.plates.find((p) => p.spotIndex === spotIndex && !p.carried) ?? null;
}

// Does a plate's contents match a recipe exactly, in any order?
export function plateMatchesRecipe(items, recipe) {
  if (items.length !== recipe.needs.length) return false;
  const have = [...items].sort().join('|');
  const want = [...recipe.needs].sort().join('|');
  return have === want;
}

// Stars earned from the coins total at the end of the shift.
export function starsFor(coins, thresholds) {
  let stars = 0;
  thresholds.forEach((t) => { if (coins >= t) stars += 1; });
  return stars;
}
