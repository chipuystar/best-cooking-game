// shots.js — scripted states for screenshots. ?shot=cover|rush|serve|end
// drops the game into a moment that real play reaches, so the screenshots
// the entry hands in are staged but honest: every pixel is the game's own
// code rendering a reachable state, never an edit or a composite.

import { makeOrder } from './state.js';
import { spawnBurst, spawnSteam, addFloat } from './particles.js';
import { showBanner } from './hud.js';

function setChef(state, x, y) {
  state.chef.x = x;
  state.chef.y = y;
  state.chef.tx = x;
  state.chef.ty = y;
  state.chef.moving = false;
  state.chef.walking = false;
}

function startPlaying(state, timeLeft) {
  state.screen = 'playing';
  state.timeLeft = timeLeft;
  state.phase = timeLeft > 120 ? 0 : timeLeft > 60 ? 1 : 2;
}

// The cover: mid-shift, three tickets up, a burger half-built on a plate,
// the grill and the board both busy, the chef carrying cheese to the plate.
function shotCover(state) {
  startPlaying(state, 95);
  state.coins = 46;
  state.combo = 2;
  state.bestCombo = 3;
  state.served = 4;
  state.orders = [
    { ...makeOrder('burger', 55), patience: 38 },
    { ...makeOrder('salad', 55), patience: 27 },
    { ...makeOrder('steak', 55), patience: 47 },
  ];
  state.plates[0].items = ['bun', 'patty-grilled'];
  state.grill[0].item = { itemId: 'patty-grilled', progress: 0.62, state: 'cooking', burnTimer: 0 };
  state.grill[1].item = { itemId: 'steak-grilled', progress: 0.3, state: 'cooking', burnTimer: 0 };
  state.boards[0].item = { itemId: 'tomato-chopped', progress: 0.55, done: false, chopMark: 1 };
  state.chef.carrying = { kind: 'item', itemId: 'cheese' };
  setChef(state, 520, 420);
  spawnSteam(state, 852, 216, 3);
  spawnSteam(state, 852, 340, 2);
  spawnBurst(state, 368, 588, ['#fbbf24', '#f472b6'], 8, 80);
  addFloat(state, 740, 500, '+$14', '#fbbf24', 24, 3.5);
}

// The midnight rush: four tickets, every cooker busy, a finished plate in
// hand, the orange pulse on. The most dramatic minute of the shift.
function shotRush(state) {
  startPlaying(state, 44);
  state.coins = 128;
  state.combo = 4;
  state.bestCombo = 5;
  state.served = 11;
  state.vexHype = 2;
  state.orders = [
    { ...makeOrder('burger', 42), patience: 30 },
    { ...makeOrder('fries', 42), patience: 18 },
    { ...makeOrder('crispy', 42), patience: 35 },
    { ...makeOrder('steak', 42), patience: 12 },
  ];
  state.grill[0].item = { itemId: 'patty-grilled', progress: 0.8, state: 'cooking', burnTimer: 0 };
  state.fryer[0].item = { itemId: 'potato-fried', progress: 1, state: 'done', burnTimer: 0.5 };
  state.fryer[1].item = { itemId: 'chicken-fried', progress: 0.45, state: 'cooking', burnTimer: 0 };
  state.boards[1].item = { itemId: 'lettuce-chopped', progress: 1, done: true, chopMark: 3 };
  state.plates[1].items = ['potato-fried'];
  state.plates[1].carried = true;
  state.chef.carrying = { kind: 'plate', plate: state.plates[1] };
  setChef(state, 640, 470);
  spawnSteam(state, 852, 216, 4);
  spawnSteam(state, 852, 458, 4);
  spawnBurst(state, 640, 420, ['#fb923c', '#fbbf24'], 10, 100);
  showBanner('MIDNIGHT RUSH', 'Full speed. Tips pay +50%. Don\'t blink.', '#fb923c');
}

// The serve: a finished Neon Burger on its plate, carried to the glowing
// window. The payoff moment, one click from +$18.
function shotServe(state) {
  startPlaying(state, 110);
  state.coins = 82;
  state.combo = 3;
  state.bestCombo = 4;
  state.served = 7;
  state.orders = [
    { ...makeOrder('burger', 48), patience: 40 },
    { ...makeOrder('salad', 48), patience: 22 },
  ];
  state.plates[0].items = ['bun', 'patty-grilled', 'cheese', 'lettuce-chopped'];
  state.plates[0].carried = true;
  state.chef.carrying = { kind: 'plate', plate: state.plates[0] };
  setChef(state, 700, 480);
  state.grill[0].item = { itemId: 'steak-grilled', progress: 0.5, state: 'cooking', burnTimer: 0 };
  spawnSteam(state, 852, 216, 2);
  addFloat(state, 700, 420, 'READY!', '#34d399', 20, 3.5);
}

// The end of a great shift: three stars, the stats, Vex beaten.
function shotEnd(state) {
  state.screen = 'end';
  state.timeLeft = 0;
  state.coins = 187;
  state.served = 14;
  state.expired = 2;
  state.combo = 0;
  state.bestCombo = 5;
  state.vexHype = 2;
  state.stats = { chopped: 12, cooked: 11, trashed: 1, earned: 187 };
  state.orders = [];
}

export function applyShot(state, name) {
  if (name === 'cover') shotCover(state);
  else if (name === 'rush') shotRush(state);
  else if (name === 'serve') shotServe(state);
  else if (name === 'end') shotEnd(state);
}
