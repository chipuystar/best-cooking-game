// input.js — keyboard and mouse. WASD/arrows walk the chef, E or Space uses
// the nearest station, Q bins what the chef carries, M mutes, P pauses.
// Clicking a station walks the chef to it and uses it on arrival; clicking
// the floor just walks there.

import { CHEF_SPEED } from './config.js';
import { interact, nearestStation, stationAtPoint } from './kitchen.js';

export function createInput() {
  return {
    keys: new Set(),
    mouse: { x: 0, y: 0, down: false },
    onPause: null,
    onMute: null,
    onAnyKey: null,
  };
}

function toCanvas(canvas, clientX, clientY) {
  const rect = canvas.getBoundingClientRect();
  return {
    x: ((clientX - rect.left) / rect.width) * canvas.width,
    y: ((clientY - rect.top) / rect.height) * canvas.height,
  };
}

export function bindInput(input, canvas, state) {
  window.addEventListener('keydown', (e) => {
    if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' '].includes(e.key)) e.preventDefault();
    if (e.repeat) return;
    input.keys.add(e.key.toLowerCase());
    if (input.onAnyKey) input.onAnyKey(e.key);
    const k = e.key.toLowerCase();
    // Pause and mute work from any gameplay screen, including while paused.
    if (k === 'p' || k === 'escape') {
      if (input.onPause) input.onPause();
      return;
    }
    if (k === 'm') {
      if (input.onMute) input.onMute();
      return;
    }
    if (state.screen !== 'playing') return;
    if (k === 'e' || k === ' ') {
      const station = nearestStation(state);
      if (station) {
        state.chef.pendingStation = null;
        interact(state, station.id);
      }
    } else if (k === 'q') {
      if (state.chef.carrying) interact(state, 'bin');
    }
  });
  window.addEventListener('keyup', (e) => {
    input.keys.delete(e.key.toLowerCase());
  });
  canvas.addEventListener('pointerdown', (e) => {
    if (state.screen !== 'playing') return;
    const p = toCanvas(canvas, e.clientX, e.clientY);
    input.mouse.down = true;
    const station = stationAtPoint(p.x, p.y);
    if (station) {
      state.chef.tx = station.front.x;
      state.chef.ty = station.front.y;
      state.chef.moving = true;
      state.chef.pendingStation = station.id;
    } else {
      state.chef.tx = p.x;
      state.chef.ty = p.y;
      state.chef.moving = true;
      state.chef.pendingStation = null;
    }
  });
  canvas.addEventListener('pointermove', (e) => {
    const p = toCanvas(canvas, e.clientX, e.clientY);
    input.mouse.x = p.x;
    input.mouse.y = p.y;
  });
  window.addEventListener('pointerup', () => { input.mouse.down = false; });
}

// Move the chef: keyboard velocity wins over click-to-walk, and arriving at
// a clicked station uses it. The chef stays on the walkable floor.
export function updateChef(state, input, dt) {
  const chef = state.chef;
  const k = input.keys;
  let vx = 0;
  let vy = 0;
  if (k.has('w') || k.has('arrowup')) vy -= 1;
  if (k.has('s') || k.has('arrowdown')) vy += 1;
  if (k.has('a') || k.has('arrowleft')) vx -= 1;
  if (k.has('d') || k.has('arrowright')) vx += 1;
  if (vx !== 0 || vy !== 0) {
    chef.moving = false;
    chef.walking = true;
    chef.pendingStation = null;
    const len = Math.hypot(vx, vy);
    vx /= len;
    vy /= len;
    chef.x += vx * CHEF_SPEED * dt;
    chef.y += vy * CHEF_SPEED * dt;
    if (vx !== 0) chef.dir = vx > 0 ? 1 : -1;
    chef.walkPhase += dt * 11;
  } else if (chef.moving) {
    chef.walking = true;
    const dx = chef.tx - chef.x;
    const dy = chef.ty - chef.y;
    const d = Math.hypot(dx, dy);
    const step = CHEF_SPEED * dt;
    if (step >= d) {
      // Snap instead of stepping past the target: at a low frame rate one
      // step can overshoot, and the chef would orbit the point forever.
      chef.x = chef.tx;
      chef.y = chef.ty;
      chef.moving = false;
      chef.walking = false;
      if (chef.pendingStation) {
        const id = chef.pendingStation;
        chef.pendingStation = null;
        interact(state, id);
      }
    } else {
      chef.x += (dx / d) * step;
      chef.y += (dy / d) * step;
      if (dx !== 0) chef.dir = dx > 0 ? 1 : -1;
      chef.walkPhase += dt * 11;
    }
  } else {
    chef.walking = false;
  }
  // Walkable floor, region-aware: the strip under the crates is full width
  // (above the side counters), the middle is between the side counters, and
  // the strip in front of the plating counter and serve window reaches down
  // to y 535. Every station's front point must sit inside these bounds, or
  // the chef can never arrive and click-to-use silently fails.
  chef.y = Math.min(535, Math.max(122, chef.y));
  if (chef.y < 165) {
    chef.x = Math.min(894, Math.max(26, chef.x));
  } else {
    chef.x = Math.min(778, Math.max(142, chef.x));
  }
}
