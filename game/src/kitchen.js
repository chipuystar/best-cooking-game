// kitchen.js — the kitchen's stations and what happens when the chef uses
// one: grabbing ingredients, chopping, grilling, frying, plating, serving
// and binning. Also advances every chopping and cooking timer.

import {
  BIN, BOARDS, BURN_AFTER_SECONDS, CHOP_SECONDS, COOK_SECONDS, CRATES,
  FRYER_SLOTS, GRILL_SLOTS, INGREDIENTS, INTERACT_RANGE, PLATE_SPOTS,
  SERVE_WINDOW,
} from './config.js';
import { carriedPlate, plateAtSpot, plateMatchesRecipe } from './state.js';
import { RECIPES } from './config.js';
import { sfx } from './audio.js';
import { addFloat, addShake, spawnBurst, spawnChopBits, spawnSteam } from './particles.js';
import { servePlate } from './orders.js';

// Every clickable station, in hit-test order (plates and serve last so the
// counter row wins over nothing else — the rects do not overlap anyway).
export function allStations() {
  return [
    ...CRATES.map((c, i) => ({ ...c, index: i })),
    ...BOARDS.map((b, i) => ({ ...b, index: i })),
    ...GRILL_SLOTS.map((g, i) => ({ ...g, index: i })),
    ...FRYER_SLOTS.map((f, i) => ({ ...f, index: i })),
    ...PLATE_SPOTS.map((p, i) => ({ ...p, index: i })),
    { ...SERVE_WINDOW, index: 0 },
    { ...BIN, index: 0 },
  ];
}

export function stationAtPoint(x, y) {
  return allStations().find((s) => x >= s.x && x <= s.x + s.w && y >= s.y && y <= s.y + s.h) ?? null;
}

function stationById(id) {
  return allStations().find((s) => s.id === id) ?? null;
}

export function nearestStation(state) {
  const { x, y } = state.chef;
  let best = null;
  let bestD = INTERACT_RANGE;
  for (const s of allStations()) {
    const cx = s.x + s.w / 2;
    const cy = s.y + s.h / 2;
    const d = Math.hypot(cx - x, cy - y);
    if (d < bestD) { best = s; bestD = d; }
  }
  return best;
}

function deny(state, x, y, text) {
  addFloat(state, x, y - 10, text, '#f87171', 15);
  sfx.error();
}

function cookableAt(kind, itemId) {
  const ing = INGREDIENTS[itemId];
  return ing && ing.process && ing.process.station === kind;
}

function useBoard(state, station) {
  const slot = state.boards[station.index];
  const chef = state.chef;
  const cx = station.x + station.w / 2;
  const cy = station.y + station.h / 2;
  if (slot.item && slot.item.done) {
    if (chef.carrying) { deny(state, cx, cy, 'HANDS FULL'); return; }
    chef.carrying = { kind: 'item', itemId: slot.item.itemId };
    slot.item = null;
    sfx.pickup();
    return;
  }
  if (slot.item) return; // still chopping
  if (!chef.carrying || chef.carrying.kind !== 'item') { deny(state, cx, cy, 'NEEDS VEG TO CHOP'); return; }
  const itemId = chef.carrying.itemId;
  if (!cookableAt('board', itemId)) { deny(state, cx, cy, 'CAN\'T CHOP THAT'); return; }
  slot.item = { itemId: INGREDIENTS[itemId].process.result, progress: 0, done: false, chopMark: 0 };
  chef.carrying = null;
  sfx.place();
  sfx.chop();
  spawnChopBits(state, cx, cy, INGREDIENTS[itemId].color);
}

function useCooker(state, station) {
  const slots = station.kind === 'grill' ? state.grill : state.fryer;
  const slot = slots[station.index];
  const chef = state.chef;
  const cx = station.x + station.w / 2;
  const cy = station.y + station.h / 2;
  if (slot.item && slot.item.state === 'burnt') {
    slot.item = null;
    state.stats.trashed += 1;
    addFloat(state, cx, cy - 16, 'BURNT — BINNED', '#f87171', 15);
    spawnBurst(state, cx, cy, ['#44403c', '#78716c'], 8, 60);
    sfx.burnt();
    return;
  }
  if (slot.item && slot.item.state === 'done') {
    if (chef.carrying) { deny(state, cx, cy, 'HANDS FULL'); return; }
    chef.carrying = { kind: 'item', itemId: slot.item.itemId };
    slot.item = null;
    sfx.pickup();
    return;
  }
  if (slot.item) return; // still cooking
  if (!chef.carrying || chef.carrying.kind !== 'item') {
    deny(state, cx, cy, station.kind === 'grill' ? 'NEEDS PATTY OR STEAK' : 'NEEDS POTATO OR CHICKEN');
    return;
  }
  const itemId = chef.carrying.itemId;
  if (!cookableAt(station.kind, itemId)) {
    deny(state, cx, cy, station.kind === 'grill' ? 'GRILL: PATTY OR STEAK' : 'FRYER: POTATO OR CHICKEN');
    return;
  }
  slot.item = {
    itemId: INGREDIENTS[itemId].process.result,
    progress: 0,
    state: 'cooking',
    burnTimer: 0,
  };
  chef.carrying = null;
  sfx.place();
  sfx.sizzle();
  spawnSteam(state, cx, cy, 3);
}

function usePlateSpot(state, station) {
  const chef = state.chef;
  const cx = station.x + station.w / 2;
  const cy = station.y + station.h / 2;
  const plate = plateAtSpot(state, station.index);
  if (!plate) {
    // Spot is empty because its plate is carried: put a carried plate down.
    const held = carriedPlate(state);
    if (held) {
      held.carried = false;
      held.spotIndex = station.index;
      chef.carrying = null;
      sfx.place();
    }
    return;
  }
  if (chef.carrying && chef.carrying.kind === 'plate') {
    deny(state, cx, cy, 'HANDS FULL');
    return;
  }
  if (chef.carrying && chef.carrying.kind === 'item') {
    const itemId = chef.carrying.itemId;
    if (plate.items.includes(itemId)) { deny(state, cx, cy, 'ALREADY ON PLATE'); return; }
    plate.items.push(itemId);
    chef.carrying = null;
    sfx.place();
    spawnBurst(state, cx, cy, ['#fbbf24', '#f472b6', '#22d3ee'], 6, 70);
    // A completed plate glows: tell the player the moment it matches an order.
    const done = state.orders.some((o) => plateMatchesRecipe(plate.items, RECIPES[o.recipeId]));
    if (done) {
      addFloat(state, cx, cy - 24, 'READY TO SERVE!', '#34d399', 16);
      sfx.cooked();
      spawnBurst(state, cx, cy, ['#34d399', '#fbbf24'], 12, 110);
    }
    return;
  }
  // Empty hands: pick the plate up.
  plate.carried = true;
  chef.carrying = { kind: 'plate', plate };
  sfx.pickup();
}

function useServe(state, station) {
  const chef = state.chef;
  const cx = station.x + station.w / 2;
  const cy = station.y + station.h / 2;
  const plate = carriedPlate(state);
  if (!plate) {
    sfx.tick();
    addFloat(state, cx, cy - 10, 'BRING A FINISHED PLATE', '#93a0b8', 14);
    return;
  }
  const served = servePlate(state, plate);
  if (!served) {
    addFloat(state, cx, cy - 10, 'NO MATCHING ORDER', '#f87171', 15);
    addShake(state, 4);
    sfx.error();
  }
}

function useBin(state, station) {
  const chef = state.chef;
  const cx = station.x + station.w / 2;
  const cy = station.y + station.h / 2;
  if (!chef.carrying) return;
  if (chef.carrying.kind === 'plate') {
    const plate = chef.carrying.plate;
    plate.items = [];
    plate.carried = false;
    chef.carrying = null;
    state.stats.trashed += 1;
    addFloat(state, cx, cy - 10, 'PLATE CLEARED', '#93a0b8', 14);
  } else {
    chef.carrying = null;
    state.stats.trashed += 1;
    addFloat(state, cx, cy - 10, 'BINNED', '#93a0b8', 14);
  }
  sfx.place();
  spawnBurst(state, cx, cy, ['#64748b', '#475569'], 6, 60);
}

function useCrate(state, station) {
  const chef = state.chef;
  const cx = station.x + station.w / 2;
  const cy = station.y + station.h / 2;
  if (chef.carrying) { deny(state, cx, cy, 'HANDS FULL'); return; }
  chef.carrying = { kind: 'item', itemId: station.itemId };
  sfx.pickup();
  spawnBurst(state, cx, cy + 10, [INGREDIENTS[station.itemId].color], 5, 60);
}

// The chef uses a station by id. Called on arrival (click-to-walk) or
// directly (E key when already in range).
export function interact(state, stationId) {
  const station = stationById(stationId);
  if (!station) return;
  if (station.kind === 'crate') useCrate(state, station);
  else if (station.kind === 'board') useBoard(state, station);
  else if (station.kind === 'grill' || station.kind === 'fryer') useCooker(state, station);
  else if (station.kind === 'plate') usePlateSpot(state, station);
  else if (station.kind === 'serve') useServe(state, station);
  else if (station.kind === 'bin') useBin(state, station);
}

// Advance chopping and cooking. Boards chop on their own once loaded; grill
// and fryer slots cook, then burn if nobody picks the food up in time.
export function updateKitchen(state, dt) {
  for (const slot of state.boards) {
    const it = slot.item;
    if (!it || it.done) continue;
    it.progress += dt / CHOP_SECONDS;
    const mark = Math.floor(it.progress * 3);
    if (mark > it.chopMark) {
      it.chopMark = mark;
      const b = BOARDS[state.boards.indexOf(slot)];
      sfx.chop();
      spawnChopBits(state, b.x + b.w / 2, b.y + b.h / 2, '#4ade80');
    }
    if (it.progress >= 1) {
      it.progress = 1;
      it.done = true;
      state.stats.chopped += 1;
      sfx.chopDone();
    }
  }
  const cookers = [
    ...state.grill.map((slot, i) => ({ slot, def: GRILL_SLOTS[i] })),
    ...state.fryer.map((slot, i) => ({ slot, def: FRYER_SLOTS[i] })),
  ];
  for (const { slot, def } of cookers) {
    const it = slot.item;
    if (!it) continue;
    const cx = def.x + def.w / 2;
    const cy = def.y + def.h / 2;
    if (it.state === 'cooking') {
      it.progress += dt / COOK_SECONDS;
      if (Math.random() < dt * 1.6) spawnSteam(state, cx, cy, 1);
      if (it.progress >= 1) {
        it.progress = 1;
        it.state = 'done';
        it.burnTimer = 0;
        state.stats.cooked += 1;
        sfx.cooked();
        spawnSteam(state, cx, cy, 4);
      }
    } else if (it.state === 'done') {
      it.burnTimer += dt;
      if (Math.random() < dt * 2.2) spawnSteam(state, cx, cy, 1);
      if (it.burnTimer >= BURN_AFTER_SECONDS) {
        it.state = 'burnt';
        sfx.burnt();
        addFloat(state, cx, cy - 16, 'BURNT!', '#f87171', 16);
        spawnBurst(state, cx, cy, ['#44403c', '#78716c'], 10, 80);
      }
    }
  }
}
