// particles.js — juice: sparks, steam, chop bits and floating score text.
// Everything here is cosmetic; the game logic never reads it.

export function spawnBurst(state, x, y, colors, count = 10, speed = 120) {
  for (let i = 0; i < count; i++) {
    const a = Math.random() * Math.PI * 2;
    const v = speed * (0.4 + Math.random() * 0.8);
    state.particles.push({
      kind: 'spark',
      x, y,
      vx: Math.cos(a) * v,
      vy: Math.sin(a) * v - 40,
      life: 0.5 + Math.random() * 0.4,
      t: 0,
      size: 2 + Math.random() * 3.5,
      color: colors[i % colors.length],
    });
  }
}

export function spawnSteam(state, x, y, count = 1) {
  for (let i = 0; i < count; i++) {
    state.particles.push({
      kind: 'steam',
      x: x + (Math.random() - 0.5) * 18,
      y: y - 4,
      vx: (Math.random() - 0.5) * 12,
      vy: -28 - Math.random() * 22,
      life: 0.9 + Math.random() * 0.5,
      t: 0,
      size: 5 + Math.random() * 6,
      color: 'rgba(226,232,240,0.5)',
    });
  }
}

export function spawnChopBits(state, x, y, color) {
  for (let i = 0; i < 8; i++) {
    const a = Math.random() * Math.PI * 2;
    const v = 60 + Math.random() * 90;
    state.particles.push({
      kind: 'bit',
      x, y,
      vx: Math.cos(a) * v,
      vy: Math.sin(a) * v - 70,
      life: 0.45 + Math.random() * 0.25,
      t: 0,
      size: 3 + Math.random() * 3,
      color,
      rot: Math.random() * Math.PI,
      vr: (Math.random() - 0.5) * 12,
    });
  }
}

export function addFloat(state, x, y, text, color = '#fbbf24', size = 22, life = 1.15) {
  state.floats.push({ x, y, text, color, size, t: 0, life });
}

export function addShake(state, amount) {
  state.shake = Math.min(10, state.shake + amount);
}

export function updateParticles(state, dt) {
  for (const p of state.particles) {
    p.t += dt;
    p.x += p.vx * dt;
    p.y += p.vy * dt;
    if (p.kind === 'spark' || p.kind === 'bit') p.vy += 320 * dt;
    if (p.kind === 'steam') p.size += 9 * dt;
    if (p.vr) p.rot += p.vr * dt;
  }
  state.particles = state.particles.filter((p) => p.t < p.life);
  for (const f of state.floats) {
    f.t += dt;
    f.y -= 34 * dt;
  }
  state.floats = state.floats.filter((f) => f.t < f.life);
  state.shake = Math.max(0, state.shake - dt * 26);
  if (state.flash) {
    state.flash.t -= dt * 2.2;
    if (state.flash.t <= 0) state.flash = null;
  }
}

export function drawParticles(ctx, state) {
  for (const p of state.particles) {
    const k = 1 - p.t / p.life;
    ctx.globalAlpha = Math.max(0, k);
    if (p.kind === 'bit') {
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rot);
      ctx.fillStyle = p.color;
      ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size);
      ctx.restore();
    } else {
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size * (p.kind === 'steam' ? k * 0.6 + 0.4 : 1), 0, Math.PI * 2);
      ctx.fill();
    }
  }
  ctx.globalAlpha = 1;
  for (const f of state.floats) {
    const k = 1 - f.t / f.life;
    ctx.globalAlpha = Math.min(1, k * 2);
    ctx.font = `${f.size}px Bungee, sans-serif`;
    ctx.textAlign = 'center';
    ctx.lineWidth = 4;
    ctx.strokeStyle = 'rgba(5,8,16,0.9)';
    ctx.strokeText(f.text, f.x, f.y);
    ctx.fillStyle = f.color;
    ctx.fillText(f.text, f.x, f.y);
  }
  ctx.globalAlpha = 1;
}
