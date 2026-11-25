// food.js — every ingredient and dish is drawn as vector shapes on canvas.
// No image files: the art is code, so it stays sharp at any size and the
// game ships no assets at all. renderDishIcon paints a dish to an offscreen
// canvas and returns a data URL for the DOM order tickets.

function circle(ctx, x, y, r, color) {
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fill();
}

function ellipse(ctx, x, y, rx, ry, color) {
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2);
  ctx.fill();
}

function roundRect(ctx, x, y, w, h, r, color) {
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, r);
  ctx.fill();
}

// One ingredient, centred on (x, y), fitting in a box of size s.
export function drawIngredient(ctx, itemId, x, y, s) {
  const u = s / 48; // unit: drawings are authored in a 48px box
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(u, u);
  switch (itemId) {
    case 'potato': {
      ellipse(ctx, 0, 2, 17, 12, '#c68b4e');
      ellipse(ctx, -4, -1, 12, 8, '#d9a05b');
      circle(ctx, -6, 3, 1.6, '#8a5a2b');
      circle(ctx, 4, -3, 1.6, '#8a5a2b');
      circle(ctx, 7, 4, 1.4, '#8a5a2b');
      break;
    }
    case 'tomato': {
      circle(ctx, 0, 2, 15, '#e5484d');
      circle(ctx, -5, -3, 9, '#f87171');
      ellipse(ctx, 0, -12, 6, 3.4, '#4ade80');
      ctx.strokeStyle = '#22c55e';
      ctx.lineWidth = 2.4;
      ctx.beginPath();
      ctx.moveTo(0, -12);
      ctx.lineTo(3, -18);
      ctx.stroke();
      break;
    }
    case 'lettuce': {
      circle(ctx, -6, 2, 10, '#22c55e');
      circle(ctx, 6, 2, 10, '#4ade80');
      circle(ctx, 0, -5, 10, '#86efac');
      ctx.strokeStyle = '#16a34a';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(0, -12);
      ctx.lineTo(0, 10);
      ctx.stroke();
      break;
    }
    case 'bun': {
      roundRect(ctx, -16, 2, 32, 10, 4, '#e8b25e');
      ctx.fillStyle = '#f0c27a';
      ctx.beginPath();
      ctx.arc(0, 2, 16, Math.PI, 0);
      ctx.fill();
      circle(ctx, -7, -6, 1.5, '#fff7e0');
      circle(ctx, 2, -10, 1.5, '#fff7e0');
      circle(ctx, 8, -5, 1.5, '#fff7e0');
      break;
    }
    case 'patty': {
      ellipse(ctx, 0, 2, 17, 11, '#a85a4e');
      ellipse(ctx, -3, -1, 12, 7, '#c2707e');
      break;
    }
    case 'cheese': {
      ctx.fillStyle = '#fbbf24';
      ctx.beginPath();
      ctx.moveTo(-16, -10);
      ctx.lineTo(16, -10);
      ctx.lineTo(16, 8);
      ctx.lineTo(-16, 12);
      ctx.closePath();
      ctx.fill();
      // Drip at the bottom edge and holes so it reads as cheese, not a card.
      ctx.fillStyle = '#f59e0b';
      ctx.beginPath();
      ctx.moveTo(-8, 10);
      ctx.lineTo(-4, 10);
      ctx.lineTo(-6, 16);
      ctx.closePath();
      ctx.fill();
      circle(ctx, -6, -2, 2.2, '#f59e0b');
      circle(ctx, 6, 2, 2.2, '#f59e0b');
      circle(ctx, 8, -5, 1.6, '#fde68a');
      break;
    }
    case 'steak': {
      roundRect(ctx, -16, -10, 32, 20, 8, '#9a3412');
      roundRect(ctx, -12, -6, 24, 12, 6, '#b45309');
      ctx.strokeStyle = '#431407';
      ctx.lineWidth = 2.4;
      [-6, 0, 6].forEach((dx) => {
        ctx.beginPath();
        ctx.moveTo(dx - 3, -6);
        ctx.lineTo(dx + 3, 6);
        ctx.stroke();
      });
      break;
    }
    case 'chicken': {
      ellipse(ctx, -2, 0, 13, 11, '#fda4af');
      ellipse(ctx, 2, -2, 8, 7, '#fecdd3');
      ctx.strokeStyle = '#f8fafc';
      ctx.lineWidth = 3.4;
      ctx.beginPath();
      ctx.moveTo(10, 6);
      ctx.lineTo(17, 12);
      ctx.stroke();
      circle(ctx, 17, 13, 3, '#f8fafc');
      break;
    }
    case 'tomato-chopped': {
      [-9, 6].forEach((dx, i) => {
        ctx.fillStyle = '#e5484d';
        ctx.beginPath();
        ctx.arc(dx, i ? 5 : -3, 10, Math.PI, 0);
        ctx.fill();
        ctx.fillStyle = '#fca5a5';
        ctx.beginPath();
        ctx.arc(dx, i ? 5 : -3, 6, Math.PI, 0);
        ctx.fill();
      });
      break;
    }
    case 'lettuce-chopped': {
      ctx.strokeStyle = '#4ade80';
      ctx.lineWidth = 5;
      ctx.lineCap = 'round';
      [[-12, -6, 2, -10], [-4, 2, 12, -2], [-10, 8, 4, 10], [2, -12, 14, -8]].forEach(([x1, y1, x2, y2]) => {
        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.stroke();
      });
      break;
    }
    case 'patty-grilled': {
      ellipse(ctx, 0, 2, 17, 11, '#6b3226');
      ellipse(ctx, -3, -1, 12, 7, '#8a4b3a');
      ctx.strokeStyle = '#3f1d15';
      ctx.lineWidth = 2.4;
      [-7, 0, 7].forEach((dx) => {
        ctx.beginPath();
        ctx.moveTo(dx, -8);
        ctx.lineTo(dx, 9);
        ctx.stroke();
      });
      break;
    }
    case 'steak-grilled': {
      roundRect(ctx, -16, -10, 32, 20, 8, '#5b2113');
      roundRect(ctx, -12, -6, 24, 12, 6, '#9a3412');
      ellipse(ctx, -4, -2, 8, 4, 'rgba(251,146,60,0.5)');
      ctx.strokeStyle = '#2d0f06';
      ctx.lineWidth = 2.6;
      [-6, 0, 6].forEach((dx) => {
        ctx.beginPath();
        ctx.moveTo(dx - 3, -6);
        ctx.lineTo(dx + 3, 6);
        ctx.stroke();
      });
      break;
    }
    case 'potato-fried': {
      ctx.strokeStyle = '#f59e0b';
      ctx.lineWidth = 6;
      ctx.lineCap = 'round';
      [[-10, -10, -4, 8], [-2, -12, 2, 8], [6, -10, 10, 6], [-12, 2, -6, 12], [8, -2, 14, 10]].forEach(([x1, y1, x2, y2]) => {
        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.stroke();
      });
      ctx.strokeStyle = '#fbbf24';
      ctx.lineWidth = 3;
      [[-9, -8, -5, 6], [-1, -10, 1, 6], [7, -8, 9, 5]].forEach(([x1, y1, x2, y2]) => {
        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.stroke();
      });
      break;
    }
    case 'chicken-fried': {
      ellipse(ctx, -7, 2, 11, 9, '#d97706');
      ellipse(ctx, 7, -2, 11, 9, '#f59e0b');
      ellipse(ctx, 0, 7, 10, 8, '#b45309');
      circle(ctx, -9, -1, 2, '#fbbf24');
      circle(ctx, 8, -5, 2, '#fbbf24');
      break;
    }
    default: {
      circle(ctx, 0, 0, 12, '#94a3b8');
    }
  }
  ctx.restore();
}

// A plate with the dish on it, centred on (x, y), plate radius r.
export function drawPlate(ctx, x, y, r, items) {
  ctx.save();
  ellipse(ctx, x, y + r * 0.18, r, r * 0.86, 'rgba(0,0,0,0.35)');
  circle(ctx, x, y, r, '#dbe2f0');
  circle(ctx, x, y, r * 0.82, '#eef2ff');
  circle(ctx, x, y, r * 0.62, '#f8fafc');
  if (items.length === 0) {
    ctx.restore();
    return;
  }
  // Stack the ingredients as a little pile in the middle of the plate.
  const s = r * 1.32;
  if (items.length === 1) {
    drawIngredient(ctx, items[0], x, y - r * 0.1, s);
  } else {
    items.forEach((itemId, i) => {
      const a = (i / items.length) * Math.PI * 2 - Math.PI / 2;
      const d = r * 0.34;
      drawIngredient(ctx, itemId, x + Math.cos(a) * d, y - r * 0.1 + Math.sin(a) * d * 0.7, s * 0.68);
    });
  }
  ctx.restore();
}

// A finished dish, drawn large for the ticket icon: plate + food, side view
// for the burger so its layers read.
export function drawDish(ctx, recipeId, x, y, s) {
  const u = s / 96;
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(u, u);
  ellipse(ctx, 0, 26, 40, 12, 'rgba(0,0,0,0.3)');
  circle(ctx, 0, 22, 38, '#dbe2f0');
  circle(ctx, 0, 22, 31, '#eef2ff');
  if (recipeId === 'burger') {
    roundRect(ctx, -26, 14, 52, 9, 4, '#e8b25e');
    ellipse(ctx, 0, 12, 28, 8, '#8a4b3a');
    roundRect(ctx, -28, 4, 56, 7, 3, '#fbbf24');
    ellipse(ctx, 0, 0, 27, 7, '#4ade80');
    ctx.fillStyle = '#f0c27a';
    ctx.beginPath();
    ctx.arc(0, 0, 27, Math.PI, 0);
    ctx.fill();
    circle(ctx, -10, -14, 2, '#fff7e0');
    circle(ctx, 4, -19, 2, '#fff7e0');
    circle(ctx, 12, -11, 2, '#fff7e0');
  } else if (recipeId === 'fries') {
    drawIngredient(ctx, 'potato-fried', 0, 4, 64);
  } else if (recipeId === 'salad') {
    drawIngredient(ctx, 'lettuce-chopped', -8, 4, 60);
    drawIngredient(ctx, 'tomato-chopped', 10, 8, 56);
  } else if (recipeId === 'crispy') {
    drawIngredient(ctx, 'chicken-fried', 0, 2, 62);
    drawIngredient(ctx, 'lettuce-chopped', 0, 14, 46);
  } else if (recipeId === 'steak') {
    drawIngredient(ctx, 'steak-grilled', -4, 4, 58);
    drawIngredient(ctx, 'tomato-chopped', 14, 12, 36);
  }
  ctx.restore();
}

const iconCache = new Map();

// Paint a dish to a 96x96 offscreen canvas and return its data URL, for the
// DOM order tickets. Cached per recipe.
export function renderDishIcon(recipeId) {
  if (iconCache.has(recipeId)) return iconCache.get(recipeId);
  const canvas = document.createElement('canvas');
  canvas.width = 96;
  canvas.height = 96;
  const ctx = canvas.getContext('2d');
  drawDish(ctx, recipeId, 48, 44, 96);
  const url = canvas.toDataURL('image/png');
  iconCache.set(recipeId, url);
  return url;
}
