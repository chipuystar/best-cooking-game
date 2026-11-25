// config.js — every tunable number, colour, recipe and station of Neon Skillet.
// One file holds the whole design so balancing never means hunting through code.

export const CANVAS_W = 920;
export const CANVAS_H = 640;

export const SHIFT_SECONDS = 180;
export const MAX_ORDERS = 4;
export const PLATE_COUNT = 3;
export const COMBO_BONUS_EVERY = 3;
export const COMBO_BONUS_COINS = 5;
export const EXPIRE_PENALTY = 5;
export const MAX_VEX_HYPE = 5;

// Star thresholds on coins earned by the end of the shift.
export const STAR_THRESHOLDS = [60, 120, 180];

// The three rush phases of one shift. timeLeftAbove selects the phase:
// above 120s is phase 0, above 60s phase 1, else phase 2.
export const PHASES = [
  { name: 'DINNER RUSH', spawnEvery: 11, patience: 55, tipRate: 1.0, tint: '#22d3ee' },
  { name: 'NEON RUSH', spawnEvery: 8.5, patience: 48, tipRate: 1.25, tint: '#f472b6' },
  { name: 'MIDNIGHT RUSH', spawnEvery: 6.5, patience: 42, tipRate: 1.5, tint: '#fb923c' },
];

export const CHOP_SECONDS = 1.4;
export const COOK_SECONDS = 4.0;
export const BURN_AFTER_SECONDS = 3.5;
export const CHEF_SPEED = 270;
export const CHEF_RADIUS = 17;
export const INTERACT_RANGE = 78;

// Palette: a dark kitchen lit by neon. One dominant dark, warm gold for
// money, cyan and pink for neon, orange for heat.
export const COLORS = {
  floorA: '#171d2d',
  floorB: '#121724',
  wall: '#0b0e16',
  counter: '#1e2436',
  counterEdge: '#2c3550',
  steel: '#232a3d',
  text: '#f4f6fb',
  muted: '#93a0b8',
  gold: '#fbbf24',
  pink: '#f472b6',
  cyan: '#22d3ee',
  green: '#34d399',
  orange: '#fb923c',
  red: '#f87171',
  plate: '#eef2ff',
};

// Ingredients. kind: raw (from a crate), chopped, grilled, fried.
// process says what a raw ingredient becomes and where.
export const INGREDIENTS = {
  potato: { name: 'POTATO', short: 'POT', color: '#d9a05b', process: { station: 'fryer', result: 'potato-fried' } },
  tomato: { name: 'TOMATO', short: 'TOM', color: '#f87171', process: { station: 'board', result: 'tomato-chopped' } },
  lettuce: { name: 'LETTUCE', short: 'LET', color: '#4ade80', process: { station: 'board', result: 'lettuce-chopped' } },
  bun: { name: 'BUN', short: 'BUN', color: '#f0c27a', process: null },
  patty: { name: 'PATTY', short: 'PAT', color: '#c2707e', process: { station: 'grill', result: 'patty-grilled' } },
  cheese: { name: 'CHEESE', short: 'CHS', color: '#fbbf24', process: null },
  steak: { name: 'STEAK', short: 'STK', color: '#b45309', process: { station: 'grill', result: 'steak-grilled' } },
  chicken: { name: 'CHICKEN', short: 'CHK', color: '#fda4af', process: { station: 'fryer', result: 'chicken-fried' } },
  'tomato-chopped': { name: 'TOMATO', short: 'TOM', color: '#f87171', chopped: true, process: null },
  'lettuce-chopped': { name: 'LETTUCE', short: 'LET', color: '#4ade80', chopped: true, process: null },
  'patty-grilled': { name: 'PATTY', short: 'PAT', color: '#8a4b3a', grilled: true, process: null },
  'steak-grilled': { name: 'STEAK', short: 'STK', color: '#7c2d12', grilled: true, process: null },
  'potato-fried': { name: 'FRIES', short: 'FRI', color: '#fbbf24', fried: true, process: null },
  'chicken-fried': { name: 'CRISPY CHICKEN', short: 'CRI', color: '#f59e0b', fried: true, process: null },
};

export const CRATE_ORDER = ['potato', 'tomato', 'lettuce', 'bun', 'patty', 'cheese', 'steak', 'chicken'];

// Recipes: the dish, its ingredients (processed ids), its price and the
// colour of its ticket. Every dish needs a different route through the
// kitchen: fry-only, chop-only, grill-plus-chop, and the four-part burger.
export const RECIPES = {
  fries: {
    name: 'GOLDEN FRIES', price: 8, color: '#fbbf24',
    needs: ['potato-fried'],
    blurb: 'One potato, straight to the fryer. Fast money.',
  },
  salad: {
    name: 'SUNSET SALAD', price: 10, color: '#4ade80',
    needs: ['tomato-chopped', 'lettuce-chopped'],
    blurb: 'Chop tomato, chop lettuce, plate it bright.',
  },
  crispy: {
    name: 'CRISPY BIRD', price: 13, color: '#fb923c',
    needs: ['chicken-fried', 'lettuce-chopped'],
    blurb: 'Fried chicken over chopped lettuce.',
  },
  burger: {
    name: 'NEON BURGER', price: 14, color: '#f472b6',
    needs: ['bun', 'patty-grilled', 'cheese', 'lettuce-chopped'],
    blurb: 'The house signature. Four parts, one glow.',
  },
  steak: {
    name: 'EMBER STEAK', price: 16, color: '#f87171',
    needs: ['steak-grilled', 'tomato-chopped'],
    blurb: 'Grilled steak, chopped tomato, top price.',
  },
};

export const RECIPE_IDS = ['fries', 'salad', 'crispy', 'burger', 'steak'];

// Station layout in canvas pixels. front is where the chef stands to use it.
export const CRATES = CRATE_ORDER.map((itemId, i) => ({
  id: `crate-${itemId}`,
  kind: 'crate',
  itemId,
  x: 16 + i * 111,
  y: 14,
  w: 103,
  h: 82,
  front: { x: 16 + i * 111 + 51, y: 128 },
}));

export const BOARDS = [0, 1].map((i) => ({
  id: `board-${i}`,
  kind: 'board',
  x: 16,
  y: 168 + i * 124,
  w: 104,
  h: 96,
  front: { x: 150, y: 168 + i * 124 + 48 },
}));

export const GRILL_SLOTS = [0, 1].map((i) => ({
  id: `grill-${i}`,
  kind: 'grill',
  x: 800,
  y: 168 + i * 124,
  w: 104,
  h: 96,
  front: { x: 770, y: 168 + i * 124 + 48 },
}));

export const FRYER_SLOTS = [0, 1].map((i) => ({
  id: `fryer-${i}`,
  kind: 'fryer',
  x: 800,
  y: 416 + i * 96,
  w: 104,
  h: 84,
  front: { x: 770, y: 416 + i * 96 + 42 },
}));

export const PLATE_SPOTS = [0, 1, 2].map((i) => ({
  id: `plate-${i}`,
  kind: 'plate',
  x: 322 + i * 108,
  y: 552,
  w: 92,
  h: 72,
  front: { x: 322 + i * 108 + 46, y: 528 },
}));

export const SERVE_WINDOW = {
  id: 'serve',
  kind: 'serve',
  x: 668,
  y: 540,
  w: 236,
  h: 84,
  front: { x: 740, y: 520 },
};

export const BIN = {
  id: 'bin',
  kind: 'bin',
  x: 16,
  y: 440,
  w: 104,
  h: 96,
  front: { x: 150, y: 488 },
};

// Walkable floor: the open middle of the kitchen, clear of every counter.
// The tile area spans the full width under the crates; the side counters
// draw over it. The chef's movement clamp in input.js is region-aware and
// must stay in sync with this rect.
export const FLOOR = { x: 16, y: 112, w: 888, h: 428 };
export const CHEF_START = { x: 460, y: 330 };
