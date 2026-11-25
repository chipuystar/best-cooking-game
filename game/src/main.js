// main.js — boot and the game loop. Wires every module together: input,
// kitchen, orders, rendering and the DOM HUD, and runs the shift from the
// title screen through the three rush phases to the end screen.

import { CANVAS_H, CANVAS_W, PHASES } from './config.js';
import { createState, phaseFor, resetState } from './state.js';
import { bindInput, createInput, updateChef } from './input.js';
import { updateKitchen } from './kitchen.js';
import { spawnOrder, updateOrders } from './orders.js';
import { render } from './render.js';
import { fillEndScreen, showBanner, showScreen, updateHUD } from './hud.js';
import { updateParticles } from './particles.js';
import { ensureAudio, isMuted, setMuted, sfx } from './audio.js';
import { applyShot } from './shots.js';

const PHASE_SUBS = [
  '',
  'Orders come faster — tips pay +25%',
  'Full speed. Tips pay +50%. Don\'t blink.',
];

const canvas = document.getElementById('game-canvas');
const ctx = canvas.getContext('2d');
canvas.width = CANVAS_W;
canvas.height = CANVAS_H;

const state = createState();
const input = createInput();

// Debug handle for automated play-tests: the test drives and asserts
// through this object. The game never reads it back.
window.__skillet = { state, input, startShift };

function startShift() {
  ensureAudio();
  resetState(state);
  state.screen = 'playing';
  spawnOrder(state, 'fries');
  spawnOrder(state, 'salad');
  state.spawnTimer = 6;
  showScreen(null);
  showBanner('DINNER RUSH', 'The night begins. First tickets are in.', PHASES[0].tint);
  sfx.phase();
}

function endShift() {
  state.screen = 'end';
  state.timeLeft = 0;
  fillEndScreen(state);
  showScreen('end');
  sfx.star();
}

function togglePause() {
  if (state.screen === 'playing') {
    state.screen = 'paused';
    showScreen('pause');
  } else if (state.screen === 'paused') {
    state.screen = 'playing';
    showScreen(null);
  }
}

function toggleMute() {
  setMuted(!isMuted());
  state.muted = isMuted();
  const btn = document.getElementById('mute-btn');
  if (btn) btn.textContent = isMuted() ? 'SOUND OFF' : 'SOUND ON';
}

input.onPause = togglePause;
input.onMute = toggleMute;
input.onAnyKey = (key) => {
  if (state.screen === 'title' && key === 'Enter') startShift();
  if (state.screen === 'end' && key === 'Enter') startShift();
};

bindInput(input, canvas, state);

document.getElementById('start-btn')?.addEventListener('click', startShift);
document.getElementById('again-btn')?.addEventListener('click', startShift);
document.getElementById('resume-btn')?.addEventListener('click', togglePause);
document.getElementById('restart-btn')?.addEventListener('click', startShift);
document.getElementById('mute-btn')?.addEventListener('click', toggleMute);
document.getElementById('pause-btn')?.addEventListener('click', togglePause);

// Screenshot staging: ?shot=cover|rush|serve|end drops the game into a
// reachable moment of play. No gesture, so no audio.
const shot = new URLSearchParams(window.location.search).get('shot');
if (shot) {
  state.shot = shot;
  applyShot(state, shot);
  if (shot === 'end') {
    fillEndScreen(state);
    showScreen('end');
  } else {
    showScreen(null);
  }
} else {
  showScreen('title');
}

let last = performance.now();

function loop(now) {
  const dt = Math.min(0.1, (now - last) / 1000);
  last = now;

  if (state.screen === 'playing') {
    updateChef(state, input, dt);
    updateKitchen(state, dt);
    updateOrders(state, dt);
    updateParticles(state, dt);

    state.timeLeft -= dt;
    const phase = phaseFor(state.timeLeft);
    if (phase !== state.phase) {
      state.phase = phase;
      showBanner(PHASES[phase].name, PHASE_SUBS[phase], PHASES[phase].tint);
      sfx.phase();
    }
    if (state.timeLeft <= 10 && state.timeLeft > 0) {
      const sec = Math.ceil(state.timeLeft);
      if (sec !== state.lastTickSecond) {
        state.lastTickSecond = sec;
        sfx.tick();
      }
    }
    if (state.timeLeft <= 0) endShift();
  } else {
    updateParticles(state, dt);
  }

  render(ctx, state);
  updateHUD(state);
  requestAnimationFrame(loop);
}

requestAnimationFrame(loop);
