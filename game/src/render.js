// render.js — everything the canvas shows: the dark neon kitchen, every
// station with its food and progress, the chef, and the juice on top. The
// DOM owns the HUD and the order board; this file owns the kitchen itself.

import {
  BIN, BOARDS, CANVAS_H, CANVAS_W, COLORS, CRATES, FLOOR, FRYER_SLOTS,
  GRILL_SLOTS, INGREDIENTS, PHASES, PLATE_SPOTS, RECIPES, SERVE_WINDOW,
} from './config.js';
import { drawIngredient, drawPlate } from './food.js';
import { drawParticles } from './particles.js';
import { nearestStation } from './kitchen.js';
import { carriedPlate, plateAtSpot, plateMatchesRecipe } from './state.js';

function rr(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, r);
}

function panel(ctx, x, y, w, h, glow, glowAlpha = 0.5) {
  ctx.save();
  if (glow) {
    ctx.shadowColor = glow;
    ctx.shadowBlur = 16;
  }
  rr(ctx, x, y, w, h, 12);
  ctx.fillStyle = COLORS.counter;
  ctx.fill();
  ctx.restore();
  rr(ctx, x, y, w, h, 12);
  ctx.strokeStyle = glow ?? COLORS.counterEdge;
  ctx.globalAlpha = glow ? 0.9 : 1;
  ctx.lineWidth = glow ? 2 : 1.5;
  ctx.stroke();
  ctx.globalAlpha = 1;
}

function label(ctx, text, x, y, size = 11, color = COLORS.muted, font = '600') {
  ctx.font = `${font} ${size}px "Chakra Petch", sans-serif`;
  ctx.textAlign = 'center';
  ctx.fillStyle = color;
  ctx.fillText(text, x, y);
}

function progressRing(ctx, x, y, r, progress, color) {
  ctx.save();
  ctx.lineWidth = 5;
  ctx.strokeStyle = 'rgba(255,255,255,0.14)';
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.stroke();
  ctx.strokeStyle = color;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.arc(x, y, r, -Math.PI / 2, -Math.PI / 2 + progress * Math.PI * 2);
  ctx.stroke();
  ctx.restore();
}

function drawFloor(ctx, state) {
  ctx.fillStyle = COLORS.wall;
  ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);
  const tile = 32;
  for (let y = FLOOR.y; y < FLOOR.y + FLOOR.h; y += tile) {
    for (let x = FLOOR.x; x < FLOOR.x + FLOOR.w; x += tile) {
      const even = ((x - FLOOR.x) / tile + (y - FLOOR.y) / tile) % 2 === 0;
      const accent = (((x - FLOOR.x) / tile + (y - FLOOR.y) / tile) % 7 === 0);
      ctx.fillStyle = accent ? '#1b2136' : (even ? COLORS.floorA : COLORS.floorB);
      ctx.fillRect(x, y, tile, tile);
    }
  }
  // Soft warm glow in the middle of the room, and the house skillet etched
  // into the floor — the middle of the kitchen is the stage, not a void.
  const glow = ctx.createRadialGradient(460, 330, 40, 460, 330, 260);
  glow.addColorStop(0, 'rgba(244,114,182,0.07)');
  glow.addColorStop(0.6, 'rgba(34,211,238,0.04)');
  glow.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = glow;
  ctx.fillRect(FLOOR.x, FLOOR.y, FLOOR.w, FLOOR.h);
  ctx.save();
  ctx.globalAlpha = 0.09;
  ctx.strokeStyle = '#f4f6fb';
  ctx.lineWidth = 6;
  ctx.beginPath();
  ctx.arc(460, 330, 110, 0, Math.PI * 2);
  ctx.stroke();
  ctx.lineWidth = 10;
  ctx.beginPath();
  ctx.moveTo(560, 290);
  ctx.lineTo(640, 260);
  ctx.stroke();
  ctx.globalAlpha = 0.06;
  ctx.fillStyle = '#f4f6fb';
  ctx.font = '700 26px "Chakra Petch", sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('NEON SKILLET', 460, 336);
  ctx.restore();
  // Neon strip along the top of the floor, tinted by the rush phase.
  const tint = PHASES[state.phase].tint;
  ctx.save();
  ctx.shadowColor = tint;
  ctx.shadowBlur = 14;
  ctx.fillStyle = tint;
  ctx.globalAlpha = 0.75;
  ctx.fillRect(FLOOR.x, FLOOR.y - 4, FLOOR.w, 3);
  ctx.restore();
  // Vignette.
  const g = ctx.createRadialGradient(
    CANVAS_W / 2, CANVAS_H / 2, CANVAS_H * 0.35,
    CANVAS_W / 2, CANVAS_H / 2, CANVAS_H * 0.85,
  );
  g.addColorStop(0, 'rgba(0,0,0,0)');
  g.addColorStop(1, 'rgba(2,4,10,0.55)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);
}

function drawCrates(ctx, state, near) {
  CRATES.forEach((c) => {
    const ing = INGREDIENTS[c.itemId];
    const isNear = near && near.id === c.id;
    panel(ctx, c.x, c.y, c.w, c.h, isNear ? COLORS.cyan : null);
    // Crate lip.
    rr(ctx, c.x + 6, c.y + 6, c.w - 12, 10, 5);
    ctx.fillStyle = '#2a3148';
    ctx.fill();
    drawIngredient(ctx, c.itemId, c.x + c.w / 2, c.y + 38, 44);
    label(ctx, ing.name, c.x + c.w / 2, c.y + c.h - 8, 11, isNear ? COLORS.text : COLORS.muted, '700');
  });
}

function drawBoards(ctx, state, near) {
  BOARDS.forEach((b, i) => {
    const slot = state.boards[i];
    const isNear = near && near.id === b.id;
    panel(ctx, b.x, b.y, b.w, b.h, isNear ? COLORS.green : null);
    // Wooden board.
    rr(ctx, b.x + 10, b.y + 10, b.w - 20, b.h - 30, 8);
    ctx.fillStyle = '#7c5a36';
    ctx.fill();
    rr(ctx, b.x + 10, b.y + 10, b.w - 20, b.h - 30, 8);
    ctx.strokeStyle = '#5d4226';
    ctx.lineWidth = 2;
    ctx.stroke();
    const cx = b.x + b.w / 2;
    const cy = b.y + (b.h - 20) / 2 + 4;
    if (slot.item && !slot.item.done) {
      drawIngredient(ctx, slot.item.itemId, cx, cy, 40);
      progressRing(ctx, cx, cy, 26, slot.item.progress, COLORS.green);
    } else if (slot.item && slot.item.done) {
      ctx.save();
      ctx.shadowColor = COLORS.green;
      ctx.shadowBlur = 14;
      drawIngredient(ctx, slot.item.itemId, cx, cy, 44);
      ctx.restore();
    } else {
      // Knife, waiting.
      ctx.save();
      ctx.translate(cx + 6, cy - 2);
      ctx.rotate(-0.6);
      rr(ctx, -18, -3, 26, 6, 3);
      ctx.fillStyle = '#cbd5e1';
      ctx.fill();
      rr(ctx, 8, -3, 14, 6, 3);
      ctx.fillStyle = '#334155';
      ctx.fill();
      ctx.restore();
    }
    label(ctx, 'CHOP', cx, b.y + b.h - 8, 11, isNear ? COLORS.text : COLORS.muted, '700');
  });
}

function drawCooker(ctx, state, defs, slots, kind, near, accent) {
  defs.forEach((d, i) => {
    const slot = slots[i];
    const isNear = near && near.id === d.id;
    panel(ctx, d.x, d.y, d.w, d.h, isNear ? accent : null);
    const cx = d.x + d.w / 2;
    const cy = d.y + (d.h - 20) / 2 + 4;
    if (kind === 'grill') {
      // Grate.
      rr(ctx, d.x + 10, d.y + 10, d.w - 20, d.h - 30, 8);
      ctx.fillStyle = '#171c2b';
      ctx.fill();
      ctx.strokeStyle = '#39415c';
      ctx.lineWidth = 3;
      for (let gx = d.x + 18; gx < d.x + d.w - 14; gx += 10) {
        ctx.beginPath();
        ctx.moveTo(gx, d.y + 14);
        ctx.lineTo(gx, d.y + d.h - 24);
        ctx.stroke();
      }
      if (slot.item && slot.item.state === 'cooking') {
        ctx.save();
        ctx.globalAlpha = 0.55 + Math.sin(performance.now() / 140) * 0.2;
        ctx.fillStyle = '#fb923c';
        ctx.beginPath();
        ctx.ellipse(cx, d.y + d.h - 26, 26, 6, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }
    } else {
      // Fryer oil.
      rr(ctx, d.x + 10, d.y + 10, d.w - 20, d.h - 30, 8);
      ctx.fillStyle = '#3a2a10';
      ctx.fill();
      rr(ctx, d.x + 14, d.y + 14, d.w - 28, d.h - 38, 6);
      ctx.fillStyle = '#b45309';
      ctx.fill();
      // Oil sheen so the idle fryer reads as liquid, not a flat box.
      ctx.fillStyle = 'rgba(251,191,36,0.35)';
      ctx.beginPath();
      ctx.ellipse(cx, d.y + 24, 26, 7, 0, 0, Math.PI * 2);
      ctx.fill();
      if (slot.item && slot.item.state === 'cooking') {
        ctx.fillStyle = 'rgba(251,191,36,0.7)';
        for (let b = 0; b < 4; b++) {
          const bx = d.x + 22 + ((b * 19 + Math.floor(performance.now() / 300)) % 56);
          const by = d.y + 20 + ((b * 13) % 26);
          ctx.beginPath();
          ctx.arc(bx, by, 2.4, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    }
    const it = slot.item;
    if (it && it.state === 'burnt') {
      ctx.fillStyle = '#1c1917';
      ctx.beginPath();
      ctx.arc(cx, cy, 15, 0, Math.PI * 2);
      ctx.fill();
      label(ctx, 'BURNT', cx, cy + 30, 10, COLORS.red, '700');
    } else if (it) {
      drawIngredient(ctx, it.itemId, cx, cy, 42);
      if (it.state === 'cooking') {
        progressRing(ctx, cx, cy, 26, it.progress, accent);
      } else {
        ctx.save();
        ctx.shadowColor = COLORS.green;
        ctx.shadowBlur = 12;
        ctx.strokeStyle = COLORS.green;
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(cx, cy, 26, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();
      }
    }
    label(ctx, kind === 'grill' ? 'GRILL' : 'FRYER', cx, d.y + d.h - 8, 11, isNear ? COLORS.text : COLORS.muted, '700');
  });
}

function drawPlates(ctx, state, near) {
  // Plating counter slab.
  const x0 = PLATE_SPOTS[0].x - 14;
  const x1 = PLATE_SPOTS[2].x + PLATE_SPOTS[2].w + 14;
  panel(ctx, x0, PLATE_SPOTS[0].y - 10, x1 - x0, PLATE_SPOTS[0].h + 20, null);
  label(ctx, 'PLATING', (x0 + x1) / 2, PLATE_SPOTS[0].y - 16, 11, COLORS.muted, '700');
  PLATE_SPOTS.forEach((p, i) => {
    const plate = plateAtSpot(state, i);
    const cx = p.x + p.w / 2;
    const cy = p.y + p.h / 2;
    const isNear = near && near.id === p.id;
    if (isNear) {
      ctx.save();
      ctx.strokeStyle = COLORS.cyan;
      ctx.lineWidth = 2;
      ctx.shadowColor = COLORS.cyan;
      ctx.shadowBlur = 10;
      ctx.beginPath();
      ctx.arc(cx, cy, 36, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    }
    if (plate) {
      const complete = plate.items.length > 0
        && state.orders.some((o) => plateMatchesRecipe(plate.items, RECIPES[o.recipeId]));
      if (complete) {
        ctx.save();
        ctx.strokeStyle = COLORS.green;
        ctx.lineWidth = 3;
        ctx.shadowColor = COLORS.green;
        ctx.shadowBlur = 16;
        ctx.beginPath();
        ctx.arc(cx, cy, 34, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();
      }
      drawPlate(ctx, cx, cy, 30, plate.items);
    } else {
      // Empty spot: faint plate outline where the carried plate belongs.
      ctx.save();
      ctx.globalAlpha = 0.35;
      ctx.strokeStyle = COLORS.muted;
      ctx.lineWidth = 2;
      ctx.setLineDash([5, 5]);
      ctx.beginPath();
      ctx.arc(cx, cy, 30, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    }
  });
}

function drawServe(ctx, state, near) {
  const w = SERVE_WINDOW;
  const held = carriedPlate(state);
  const heldComplete = held && held.items.length > 0
    && state.orders.some((o) => plateMatchesRecipe(held.items, RECIPES[o.recipeId]));
  const glow = heldComplete ? COLORS.green : (near && near.id === w.id ? COLORS.gold : null);
  panel(ctx, w.x, w.y, w.w, w.h, glow);
  // Window opening.
  rr(ctx, w.x + 10, w.y + 10, w.w - 20, w.h - 34, 8);
  ctx.fillStyle = heldComplete ? '#123524' : '#141a2c';
  ctx.fill();
  // Bell.
  const bx = w.x + 34;
  const by = w.y + 34;
  ctx.fillStyle = COLORS.gold;
  ctx.beginPath();
  ctx.arc(bx, by, 12, Math.PI, 0);
  ctx.fill();
  ctx.fillRect(bx - 12, by, 24, 4);
  circle(ctx, bx, by + 7, 3, COLORS.gold);
  ctx.font = '700 22px Bungee, sans-serif';
  ctx.textAlign = 'left';
  ctx.fillStyle = heldComplete ? COLORS.green : COLORS.gold;
  ctx.fillText('SERVE', w.x + 58, w.y + 42);
  ctx.font = '600 11px "Chakra Petch", sans-serif';
  ctx.fillStyle = COLORS.muted;
  ctx.fillText(heldComplete ? 'READY — CLICK TO SERVE' : 'FINISHED PLATES HERE', w.x + 58, w.y + 60);
  if (heldComplete) {
    // Pulsing arrow pointing at the window.
    const pulse = 0.6 + Math.sin(performance.now() / 180) * 0.4;
    ctx.save();
    ctx.globalAlpha = pulse;
    ctx.fillStyle = COLORS.green;
    ctx.font = '22px Bungee, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('▼', w.x + w.w / 2, w.y - 8);
    ctx.restore();
  }
}

function drawBin(ctx, state, near) {
  const b = BIN;
  const isNear = near && near.id === b.id;
  panel(ctx, b.x, b.y, b.w, b.h, isNear ? COLORS.red : null);
  const cx = b.x + b.w / 2;
  const cy = b.y + (b.h - 20) / 2 + 2;
  // Bin body.
  rr(ctx, cx - 18, cy - 14, 36, 32, 6);
  ctx.fillStyle = '#334155';
  ctx.fill();
  rr(ctx, cx - 21, cy - 20, 42, 8, 4);
  ctx.fillStyle = '#475569';
  ctx.fill();
  ctx.strokeStyle = '#64748b';
  ctx.lineWidth = 2;
  [-8, 0, 8].forEach((dx) => {
    ctx.beginPath();
    ctx.moveTo(cx + dx, cy - 8);
    ctx.lineTo(cx + dx, cy + 12);
    ctx.stroke();
  });
  label(ctx, 'BIN', cx, b.y + b.h - 8, 11, isNear ? COLORS.text : COLORS.muted, '700');
}

function circle(ctx, x, y, r, color) {
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fill();
}

function drawChef(ctx, state) {
  const chef = state.chef;
  const bob = chef.walking
    ? Math.abs(Math.sin(chef.walkPhase)) * 3
    : Math.sin(performance.now() / 500) * 1.2;
  const x = chef.x;
  const y = chef.y - bob;
  // Shadow.
  ctx.fillStyle = 'rgba(0,0,0,0.4)';
  ctx.beginPath();
  ctx.ellipse(x, chef.y + 20, 18, 6, 0, 0, Math.PI * 2);
  ctx.fill();
  // The chef draws 1.25x so the character reads at screenshot size.
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(1.25, 1.25);
  ctx.translate(-x, -y);
  // Feet.
  const step = Math.sin(chef.walkPhase) * 5;
  circle(ctx, x - 7 + step * 0.4, chef.y + 17, 5, '#0f172a');
  circle(ctx, x + 7 - step * 0.4, chef.y + 17, 5, '#0f172a');
  // Body (white uniform).
  rr(ctx, x - 13, y - 2, 26, 22, 9);
  ctx.fillStyle = '#f1f5f9';
  ctx.fill();
  rr(ctx, x - 13, y - 2, 26, 22, 9);
  ctx.strokeStyle = '#cbd5e1';
  ctx.lineWidth = 1.5;
  ctx.stroke();
  // Apron stripe.
  ctx.fillStyle = '#f472b6';
  ctx.fillRect(x - 13, y + 8, 26, 3);
  // Head.
  circle(ctx, x, y - 12, 11, '#f2c79b');
  // Eyes look in the facing direction.
  const ex = chef.dir * 3;
  circle(ctx, x - 4 + ex, y - 13, 1.7, '#0f172a');
  circle(ctx, x + 4 + ex, y - 13, 1.7, '#0f172a');
  // Chef hat.
  circle(ctx, x - 7, y - 22, 6.5, '#ffffff');
  circle(ctx, x, y - 26, 7.5, '#ffffff');
  circle(ctx, x + 7, y - 22, 6.5, '#ffffff');
  rr(ctx, x - 11, y - 24, 22, 6, 3);
  ctx.fillStyle = '#ffffff';
  ctx.fill();
  // Carried item or plate above the head.
  const c = chef.carrying;
  if (c) {
    const iy = y - 40;
    ctx.save();
    ctx.shadowColor = 'rgba(251,191,36,0.8)';
    ctx.shadowBlur = 10;
    if (c.kind === 'item') {
      circle(ctx, x, iy, 17, 'rgba(10,14,24,0.85)');
      ctx.shadowBlur = 0;
      drawIngredient(ctx, c.itemId, x, iy, 30);
    } else {
      drawPlate(ctx, x, iy, 17, c.plate.items);
    }
    ctx.restore();
  }
  ctx.restore();
}

function drawInteractHint(ctx, state, near) {
  if (!near || state.screen !== 'playing') return;
  const cx = near.x + near.w / 2;
  const top = near.y - 14;
  ctx.save();
  ctx.font = '700 13px "Chakra Petch", sans-serif';
  ctx.textAlign = 'center';
  const text = 'E';
  const w = 22;
  rr(ctx, cx - w / 2, top - 18, w, 20, 6);
  ctx.fillStyle = 'rgba(10,14,24,0.9)';
  ctx.fill();
  ctx.strokeStyle = COLORS.cyan;
  ctx.lineWidth = 1.5;
  ctx.stroke();
  ctx.fillStyle = COLORS.cyan;
  ctx.fillText(text, cx, top - 4);
  ctx.restore();
}

export function render(ctx, state) {
  ctx.save();
  if (state.shake > 0.2) {
    ctx.translate((Math.random() - 0.5) * state.shake, (Math.random() - 0.5) * state.shake);
  }
  const near = state.screen === 'playing' ? nearestStation(state) : null;
  drawFloor(ctx, state);
  drawCrates(ctx, state, near);
  drawBoards(ctx, state, near);
  drawCooker(ctx, state, GRILL_SLOTS, state.grill, 'grill', near, COLORS.orange);
  drawCooker(ctx, state, FRYER_SLOTS, state.fryer, 'fryer', near, COLORS.gold);
  drawPlates(ctx, state, near);
  drawServe(ctx, state, near);
  drawBin(ctx, state, near);
  drawChef(ctx, state);
  drawParticles(ctx, state);
  drawInteractHint(ctx, state, near);
  ctx.restore();
  // Full-screen flash (expire = red wash).
  if (state.flash) {
    ctx.save();
    ctx.globalAlpha = Math.max(0, state.flash.t);
    ctx.fillStyle = state.flash.color;
    ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);
    ctx.restore();
  }
  // Midnight rush: a slow orange pulse at the edges.
  if (state.phase === 2 && state.screen === 'playing') {
    const pulse = 0.1 + Math.sin(performance.now() / 420) * 0.06;
    ctx.save();
    ctx.globalAlpha = pulse;
    ctx.strokeStyle = COLORS.orange;
    ctx.lineWidth = 10;
    ctx.shadowColor = COLORS.orange;
    ctx.shadowBlur = 24;
    ctx.strokeRect(5, 5, CANVAS_W - 10, CANVAS_H - 10);
    ctx.restore();
  }
}
