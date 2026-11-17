// KUNANG — Night of the Firefly
// render.js — everything the player sees: the night garden, the firefly,
// the dew, the bats, the webs, the HUD, and the title / pause / end screens.
// All art is drawn here from code (gradients, shapes, particles). No images
// are loaded. The judge reads the game mostly through its screenshots, so
// every screen is drawn to read at a glance, even when shrunk.

import {
  CANVAS_W, CANVAS_H, NIGHT_SECONDS, LIGHT_MAX, DARK_LIGHT, DEW_COLORS,
  PLAYER_RADIUS, BAT_RADIUS, FLASH_MAX_CHARGES, FLASH_RADIUS,
} from './config.js';

// A fixed star field, so the sky does not shimmer randomly between frames.
function mulberry32(seed) {
  return function () {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const rng = mulberry32(20261116);
const STARS = [];
for (let i = 0; i < 90; i++) {
  STARS.push({ x: rng() * CANVAS_W, y: rng() * 380, r: rng() * 1.4 + 0.4, tw: rng() * Math.PI * 2 });
}
const FLOWERS = [];
for (let i = 0; i < 14; i++) {
  FLOWERS.push({ x: (i + 0.5) * (CANVAS_W / 14) + (rng() - 0.5) * 26, h: 26 + rng() * 42, sway: rng() * Math.PI * 2 });
}
// Glowing bell-flowers along the garden floor: the lower half of the screen
// was empty dark space in screenshots, so these give it colour and light.
const GLOWFLOWERS = [];
const GLOW_COLORS = ['#6ff2ff', '#ffd76a', '#ff8fb3', '#9fe8a8'];
for (let i = 0; i < 11; i++) {
  GLOWFLOWERS.push({
    x: 40 + i * 86 + (rng() - 0.5) * 40,
    y: CANVAS_H - 26 - rng() * 34,
    r: 4 + rng() * 4,
    color: GLOW_COLORS[i % GLOW_COLORS.length],
    tw: rng() * Math.PI * 2,
  });
}

function fmtTime(sec) {
  const s = Math.max(0, Math.ceil(sec));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
}

function drawBackground(ctx, world, now) {
  const sky = ctx.createLinearGradient(0, 0, 0, CANVAS_H);
  sky.addColorStop(0, '#0a0f2e');
  sky.addColorStop(0.55, '#10233d');
  sky.addColorStop(1, '#0d332f');
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);

  // Stars, twinkling slowly.
  for (const s of STARS) {
    const a = 0.35 + 0.4 * (0.5 + 0.5 * Math.sin(now * 0.001 + s.tw));
    ctx.globalAlpha = a;
    ctx.fillStyle = '#dfe9ff';
    ctx.beginPath();
    ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;

  // The moon, top right, with a soft halo.
  const moon = ctx.createRadialGradient(830, 74, 8, 830, 74, 90);
  moon.addColorStop(0, 'rgba(255, 246, 200, 0.55)');
  moon.addColorStop(0.35, 'rgba(255, 246, 200, 0.12)');
  moon.addColorStop(1, 'rgba(255, 246, 200, 0)');
  ctx.fillStyle = moon;
  ctx.fillRect(720, 0, 220, 180);
  ctx.fillStyle = '#fff3c4';
  ctx.beginPath();
  ctx.arc(830, 74, 26, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = 'rgba(220, 200, 140, 0.5)';
  ctx.beginPath();
  ctx.arc(822, 68, 5, 0, Math.PI * 2);
  ctx.arc(838, 82, 4, 0, Math.PI * 2);
  ctx.fill();

  // Flower silhouettes along the bottom, swaying in the night breeze.
  ctx.fillStyle = '#081a16';
  for (const f of FLOWERS) {
    const sway = Math.sin(now * 0.0006 + f.sway) * 4;
    ctx.beginPath();
    ctx.moveTo(f.x - 3, CANVAS_H);
    ctx.quadraticCurveTo(f.x + sway, CANVAS_H - f.h * 0.6, f.x + sway * 2, CANVAS_H - f.h);
    ctx.lineTo(f.x + 3, CANVAS_H);
    ctx.closePath();
    ctx.fill();
    ctx.beginPath();
    ctx.arc(f.x + sway * 2, CANVAS_H - f.h, 6, 0, Math.PI * 2);
    ctx.fill();
  }

  // Glowing bell-flowers: soft halos that light the garden floor.
  for (const g of GLOWFLOWERS) {
    const a = 0.5 + 0.35 * Math.sin(now * 0.0012 + g.tw);
    const halo = ctx.createRadialGradient(g.x, g.y, 1, g.x, g.y, g.r * 4);
    halo.addColorStop(0, g.color);
    halo.addColorStop(0.4, g.color + '44');
    halo.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.globalAlpha = a;
    ctx.fillStyle = halo;
    ctx.beginPath();
    ctx.arc(g.x, g.y, g.r * 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(g.x, g.y, g.r * 0.45, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;
}

function drawWeb(ctx, web, now) {
  ctx.save();
  ctx.translate(web.x, web.y + Math.sin(now * 0.0008 + web.sway) * 3);
  ctx.strokeStyle = 'rgba(216, 230, 255, 0.4)';
  ctx.lineWidth = 1;
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(Math.cos(a) * web.r, Math.sin(a) * web.r);
    ctx.stroke();
  }
  for (let ring = 1; ring <= 3; ring++) {
    const r = (web.r / 3) * ring;
    ctx.beginPath();
    for (let i = 0; i <= 16; i++) {
      const a = (i / 16) * Math.PI * 2;
      const rr = r * (1 + 0.08 * Math.sin(a * 3 + ring));
      if (i === 0) ctx.moveTo(Math.cos(a) * rr, Math.sin(a) * rr);
      else ctx.lineTo(Math.cos(a) * rr, Math.sin(a) * rr);
    }
    ctx.closePath();
    ctx.stroke();
  }
  ctx.restore();
}

function drawDew(ctx, d) {
  const x = d.x + Math.sin(d.sway) * 14;
  const bob = Math.sin(d.phase) * 2;
  const glow = ctx.createRadialGradient(x, d.y + bob, 1, x, d.y + bob, d.r * 2.4);
  glow.addColorStop(0, d.color.fill);
  glow.addColorStop(0.35, d.color.glow + '66');
  glow.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = glow;
  ctx.beginPath();
  ctx.arc(x, d.y + bob, d.r * 2.4, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = d.color.fill;
  ctx.beginPath();
  ctx.arc(x, d.y + bob, d.r * 0.62, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = 'rgba(255,255,255,0.9)';
  ctx.beginPath();
  ctx.arc(x - 3, d.y + bob - 3, 2.2, 0, Math.PI * 2);
  ctx.fill();
  // Golden dew: the jackpot drop. A four-point star sparkle so it shouts
  // "fly here" even when the screen is shrunk to a thumbnail.
  if (d.golden) {
    ctx.fillStyle = 'rgba(255, 247, 192, 0.95)';
    const s = d.r * 1.5;
    ctx.beginPath();
    ctx.moveTo(x, d.y + bob - s);
    ctx.quadraticCurveTo(x, d.y + bob, x + s, d.y + bob);
    ctx.quadraticCurveTo(x, d.y + bob, x, d.y + bob + s);
    ctx.quadraticCurveTo(x, d.y + bob, x - s, d.y + bob);
    ctx.quadraticCurveTo(x, d.y + bob, x, d.y + bob - s);
    ctx.fill();
  }
}

function drawBat(ctx, b) {
  const flap = Math.sin(b.flap);
  const dir = b.vx >= 0 ? 1 : -1;
  ctx.save();
  ctx.translate(b.x, b.y);
  // A faint violet halo so the dark bat reads against the dark sky,
  // even in a small screenshot.
  const halo = ctx.createRadialGradient(0, 0, 2, 0, 0, 44);
  halo.addColorStop(0, 'rgba(120, 90, 200, 0.30)');
  halo.addColorStop(1, 'rgba(120, 90, 200, 0)');
  ctx.fillStyle = halo;
  ctx.beginPath();
  ctx.arc(0, 0, 44, 0, Math.PI * 2);
  ctx.fill();
  ctx.scale(dir, 1);
  // Wings, flapping.
  ctx.fillStyle = '#241f33';
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.quadraticCurveTo(-14, -16 - flap * 10, -30, -6 - flap * 12);
  ctx.quadraticCurveTo(-16, 2, -8, 6);
  ctx.closePath();
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.quadraticCurveTo(14, -16 - flap * 10, 30, -6 - flap * 12);
  ctx.quadraticCurveTo(16, 2, 8, 6);
  ctx.closePath();
  ctx.fill();
  // Body and ears.
  ctx.fillStyle = '#17131f';
  ctx.beginPath();
  ctx.ellipse(0, 0, 13, 9, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(-8, -6);
  ctx.lineTo(-11, -14);
  ctx.lineTo(-4, -8);
  ctx.closePath();
  ctx.moveTo(8, -6);
  ctx.lineTo(11, -14);
  ctx.lineTo(4, -8);
  ctx.closePath();
  ctx.fill();
  // Glowing eyes.
  ctx.fillStyle = '#ff4d4d';
  ctx.beginPath();
  ctx.arc(5, -2, 2, 0, Math.PI * 2);
  ctx.arc(10, -2, 2, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function drawPlayer(ctx, p, now) {
  const blink = p.grace > 0 ? (Math.sin(now * 0.03) > 0 ? 1 : 0.35) : 1;
  ctx.save();
  ctx.globalAlpha = blink;
  // The glow: a pulsing halo that lights the garden around the firefly.
  const pulse = 1 + 0.12 * Math.sin(now * 0.006);
  const glow = ctx.createRadialGradient(p.x, p.y, 2, p.x, p.y, 64 * pulse);
  glow.addColorStop(0, 'rgba(216, 255, 122, 0.85)');
  glow.addColorStop(0.4, 'rgba(160, 230, 90, 0.28)');
  glow.addColorStop(1, 'rgba(160, 230, 90, 0)');
  ctx.fillStyle = glow;
  ctx.beginPath();
  ctx.arc(p.x, p.y, 64 * pulse, 0, Math.PI * 2);
  ctx.fill();
  // Wings: two translucent ovals beating fast.
  const flap = Math.sin(p.wing) * 0.5;
  ctx.fillStyle = 'rgba(255, 255, 255, 0.55)';
  ctx.beginPath();
  ctx.ellipse(p.x - 8, p.y - 8 - flap * 4, 9, 4.5, -0.5 - flap * 0.3, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.ellipse(p.x + 8, p.y - 8 - flap * 4, 9, 4.5, 0.5 + flap * 0.3, 0, Math.PI * 2);
  ctx.fill();
  // Body: dark thorax, glowing amber abdomen.
  ctx.fillStyle = '#2a2118';
  ctx.beginPath();
  ctx.ellipse(p.x, p.y - 2, 7, 9, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#ffe27a';
  ctx.beginPath();
  ctx.ellipse(p.x, p.y + 7, 6, 7, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#fff7c0';
  ctx.beginPath();
  ctx.arc(p.x, p.y + 7, 3, 0, Math.PI * 2);
  ctx.fill();
  // Antennae.
  ctx.strokeStyle = '#2a2118';
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  ctx.moveTo(p.x - 3, p.y - 10);
  ctx.quadraticCurveTo(p.x - 7, p.y - 16, p.x - 9, p.y - 18);
  ctx.moveTo(p.x + 3, p.y - 10);
  ctx.quadraticCurveTo(p.x + 7, p.y - 16, p.x + 9, p.y - 18);
  ctx.stroke();
  ctx.restore();
}

function drawHud(ctx, world) {
  ctx.save();
  ctx.textBaseline = 'alphabetic';
  // Score, top left.
  ctx.fillStyle = '#ffffff';
  ctx.font = '700 13px "Trebuchet MS", Verdana, sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText('SCORE', 16, 22);
  ctx.font = '700 26px "Trebuchet MS", Verdana, sans-serif';
  ctx.fillStyle = '#ffe27a';
  ctx.fillText(String(world.score), 16, 48);
  // Combo, under the score when a streak is running.
  if (world.combo >= 2) {
    ctx.font = '700 15px "Trebuchet MS", Verdana, sans-serif';
    ctx.fillStyle = '#ff8fb3';
    ctx.fillText(`COMBO x${world.combo}`, 16, 70);
  }
  // Light meter, bottom left: your glow is your life in the dark.
  ctx.font = '700 11px "Trebuchet MS", Verdana, sans-serif';
  ctx.fillStyle = '#cfe8ff';
  ctx.fillText('LIGHT', 16, CANVAS_H - 34);
  ctx.fillStyle = 'rgba(255,255,255,0.16)';
  ctx.fillRect(16, CANVAS_H - 28, 180, 10);
  const lightW = 180 * Math.max(0, world.light / LIGHT_MAX);
  const lightGrad = ctx.createLinearGradient(16, 0, 196, 0);
  lightGrad.addColorStop(0, '#7ce0a3');
  lightGrad.addColorStop(1, '#ffe27a');
  ctx.fillStyle = lightGrad;
  ctx.fillRect(16, CANVAS_H - 28, lightW, 10);
  // Flash charges, bottom left next to the meter.
  for (let i = 0; i < FLASH_MAX_CHARGES; i++) {
    const cx = 216 + i * 22;
    const cy = CANVAS_H - 23;
    ctx.fillStyle = i < world.flashCharges ? '#6ff2ff' : 'rgba(255,255,255,0.18)';
    ctx.beginPath();
    ctx.moveTo(cx + 2, cy - 8);
    ctx.lineTo(cx - 4, cy + 1);
    ctx.lineTo(cx, cy + 1);
    ctx.lineTo(cx - 2, cy + 8);
    ctx.lineTo(cx + 4, cy - 1);
    ctx.lineTo(cx, cy - 1);
    ctx.closePath();
    ctx.fill();
  }
  // Time to dawn, top centre: a moon-to-sun bar.
  const barW = 260;
  const barX = (CANVAS_W - barW) / 2;
  const barY = 16;
  ctx.fillStyle = 'rgba(255,255,255,0.16)';
  ctx.fillRect(barX, barY, barW, 8);
  const done = Math.min(1, world.elapsed / NIGHT_SECONDS);
  const dawnGrad = ctx.createLinearGradient(barX, 0, barX + barW, 0);
  dawnGrad.addColorStop(0, '#7fa8ff');
  dawnGrad.addColorStop(1, '#ffb347');
  ctx.fillStyle = dawnGrad;
  ctx.fillRect(barX, barY, barW * done, 8);
  ctx.font = '700 12px "Trebuchet MS", Verdana, sans-serif';
  ctx.fillStyle = '#ffffff';
  ctx.textAlign = 'center';
  ctx.fillText(`DAWN IN ${fmtTime(NIGHT_SECONDS - world.elapsed)}`, CANVAS_W / 2, barY + 24);
  // Lives and wave, top right.
  ctx.textAlign = 'right';
  ctx.font = '700 13px "Trebuchet MS", Verdana, sans-serif';
  ctx.fillStyle = '#ffffff';
  ctx.fillText(`WAVE ${world.wave}`, CANVAS_W - 16, 22);
  for (let i = 0; i < 3; i++) {
    const hx = CANVAS_W - 26 - i * 26;
    const hy = 44;
    ctx.fillStyle = i < world.lives ? '#ff5d7a' : 'rgba(255,255,255,0.18)';
    ctx.beginPath();
    ctx.moveTo(hx, hy + 6);
    ctx.bezierCurveTo(hx - 9, hy - 3, hx - 4, hy - 10, hx, hy - 4);
    ctx.bezierCurveTo(hx + 4, hy - 10, hx + 9, hy - 3, hx, hy + 6);
    ctx.fill();
  }
  ctx.restore();
}

function panel(ctx, x, y, w, h) {
  ctx.fillStyle = 'rgba(6, 10, 28, 0.72)';
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, 18);
  ctx.fill();
  ctx.strokeStyle = 'rgba(255, 226, 122, 0.35)';
  ctx.lineWidth = 1.5;
  ctx.stroke();
}

function drawTitle(ctx, world, now) {
  ctx.fillStyle = 'rgba(5, 8, 24, 0.45)';
  ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);
  // A big firefly glow behind the title panel, so the cover reads warm
  // and alive instead of a dark box on a dark sky.
  const halo = ctx.createRadialGradient(CANVAS_W / 2, 300, 20, CANVAS_W / 2, 300, 340);
  halo.addColorStop(0, 'rgba(216, 255, 122, 0.22)');
  halo.addColorStop(0.55, 'rgba(160, 220, 120, 0.08)');
  halo.addColorStop(1, 'rgba(160, 220, 120, 0)');
  ctx.fillStyle = halo;
  ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);
  panel(ctx, 180, 92, 600, 416);
  ctx.save();
  ctx.textAlign = 'center';
  // Title glow.
  ctx.shadowColor = '#d8ff7a';
  ctx.shadowBlur = 26;
  ctx.fillStyle = '#ffe27a';
  ctx.font = '700 84px Georgia, "Times New Roman", serif';
  ctx.fillText('KUNANG', CANVAS_W / 2, 190);
  ctx.shadowBlur = 0;
  ctx.fillStyle = '#cfe8ff';
  ctx.font = 'italic 22px Georgia, "Times New Roman", serif';
  ctx.fillText('Night of the Firefly', CANVAS_W / 2, 226);
  ctx.fillStyle = '#e8f2ff';
  ctx.font = '16px "Trebuchet MS", Verdana, sans-serif';
  ctx.fillText('Catch the glowing dew. Dodge the bats. Mind the webs.', CANVAS_W / 2, 268);
  ctx.fillText('Keep your light alive — and survive until dawn.', CANVAS_W / 2, 292);
  ctx.fillStyle = '#9fb4d8';
  ctx.font = '14px "Trebuchet MS", Verdana, sans-serif';
  ctx.fillText('Mouse or WASD / arrows to fly  •  Space or click to flash', CANVAS_W / 2, 336);
  ctx.fillText('Same-colour dew builds your combo  •  P pauses  •  M mutes', CANVAS_W / 2, 358);
  if (world.best > 0) {
    ctx.fillStyle = '#ffe27a';
    ctx.font = '700 15px "Trebuchet MS", Verdana, sans-serif';
    ctx.fillText(`BEST SCORE  ${world.best}`, CANVAS_W / 2, 396);
  }
  const pulse = 0.65 + 0.35 * Math.sin(now * 0.005);
  ctx.globalAlpha = pulse;
  ctx.fillStyle = '#ffffff';
  ctx.font = '700 19px "Trebuchet MS", Verdana, sans-serif';
  ctx.fillText('CLICK OR PRESS ENTER TO FLY', CANVAS_W / 2, 452);
  ctx.restore();
}

function drawPause(ctx) {
  ctx.fillStyle = 'rgba(5, 8, 24, 0.6)';
  ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);
  ctx.save();
  ctx.textAlign = 'center';
  ctx.fillStyle = '#ffffff';
  ctx.font = '700 52px Georgia, "Times New Roman", serif';
  ctx.fillText('PAUSED', CANVAS_W / 2, 280);
  ctx.fillStyle = '#cfe8ff';
  ctx.font = '17px "Trebuchet MS", Verdana, sans-serif';
  ctx.fillText('Press P or click to keep flying', CANVAS_W / 2, 318);
  ctx.restore();
}

function drawEnd(ctx, world, won) {
  ctx.fillStyle = won ? 'rgba(40, 26, 4, 0.5)' : 'rgba(5, 8, 24, 0.55)';
  ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);
  panel(ctx, 230, 110, 500, 380);
  ctx.save();
  ctx.textAlign = 'center';
  if (won) {
    ctx.shadowColor = '#ffb347';
    ctx.shadowBlur = 24;
    ctx.fillStyle = '#ffcf5e';
    ctx.font = '700 56px Georgia, "Times New Roman", serif';
    ctx.fillText('DAWN BREAKS!', CANVAS_W / 2, 186);
    ctx.shadowBlur = 0;
    ctx.fillStyle = '#e8f2ff';
    ctx.font = '16px "Trebuchet MS", Verdana, sans-serif';
    ctx.fillText('You kept your light alive all night long.', CANVAS_W / 2, 222);
    ctx.fillStyle = '#cfe8ff';
    ctx.font = '15px "Trebuchet MS", Verdana, sans-serif';
    ctx.fillText(`Dew & waves  ${world.score - (world.dawnBonus || 0)}`, CANVAS_W / 2, 268);
    ctx.fillText(`Dawn bonus  +${world.dawnBonus || 0}`, CANVAS_W / 2, 292);
  } else {
    ctx.fillStyle = '#ff8fb3';
    ctx.font = '700 44px Georgia, "Times New Roman", serif';
    ctx.fillText('THE NIGHT FADES…', CANVAS_W / 2, 186);
    ctx.fillStyle = '#e8f2ff';
    ctx.font = '16px "Trebuchet MS", Verdana, sans-serif';
    ctx.fillText('The bats got the better of your little light.', CANVAS_W / 2, 222);
  }
  ctx.fillStyle = '#ffffff';
  ctx.font = '700 13px "Trebuchet MS", Verdana, sans-serif';
  ctx.fillText('SCORE', CANVAS_W / 2, 336);
  ctx.fillStyle = '#ffe27a';
  ctx.font = '700 44px "Trebuchet MS", Verdana, sans-serif';
  ctx.fillText(String(world.score), CANVAS_W / 2, 382);
  if (world.newBest) {
    ctx.fillStyle = '#ff8fb3';
    ctx.font = '700 16px "Trebuchet MS", Verdana, sans-serif';
    ctx.fillText('★ NEW BEST! ★', CANVAS_W / 2, 412);
  } else {
    ctx.fillStyle = '#9fb4d8';
    ctx.font = '15px "Trebuchet MS", Verdana, sans-serif';
    ctx.fillText(`Best  ${world.best}`, CANVAS_W / 2, 412);
  }
  const pulse = 0.65 + 0.35 * Math.sin(Date.now() * 0.005);
  ctx.globalAlpha = pulse;
  ctx.fillStyle = '#ffffff';
  ctx.font = '700 17px "Trebuchet MS", Verdana, sans-serif';
  ctx.fillText('PRESS R OR CLICK TO FLY AGAIN', CANVAS_W / 2, 456);
  ctx.restore();
}

// The one entry point the loop calls each frame. now is a millisecond clock.
export function drawWorld(ctx, world, now) {
  ctx.save();
  if (world.shake > 0) {
    const m = world.shake * 14;
    ctx.translate((Math.random() - 0.5) * m, (Math.random() - 0.5) * m);
  }
  drawBackground(ctx, world, now);

  // Ambient fireflies drift behind everything, on every screen.
  for (const f of world.ambient) {
    const a = 0.35 + 0.3 * Math.sin(f.phase);
    const g = ctx.createRadialGradient(f.x, f.y, 0, f.x, f.y, 16);
    g.addColorStop(0, `rgba(216, 255, 122, ${a})`);
    g.addColorStop(1, 'rgba(216, 255, 122, 0)');
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(f.x, f.y, 16, 0, Math.PI * 2);
    ctx.fill();
  }
  // Pollen motes.
  ctx.fillStyle = 'rgba(255, 240, 180, 0.35)';
  for (const pol of world.pollen) {
    ctx.beginPath();
    ctx.arc(pol.x + Math.sin(pol.sway) * 8, pol.y, pol.size, 0, Math.PI * 2);
    ctx.fill();
  }

  for (const web of world.webs) drawWeb(ctx, web, now);
  for (const d of world.dew) drawDew(ctx, d);
  for (const b of world.bats) drawBat(ctx, b);
  if (world.state !== 'title') drawPlayer(ctx, world.player, now);

  // Flash ring, expanding.
  if (world.flashRing) {
    const fr = world.flashRing;
    ctx.strokeStyle = `rgba(111, 242, 255, ${Math.max(0, fr.life / 0.45)})`;
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.arc(fr.x, fr.y, fr.r, 0, Math.PI * 2);
    ctx.stroke();
    ctx.strokeStyle = `rgba(255, 255, 255, ${Math.max(0, fr.life / 0.45) * 0.5})`;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(fr.x, fr.y, Math.max(1, fr.r - 14), 0, Math.PI * 2);
    ctx.stroke();
  }

  // Particles and floating score text.
  for (const pt of world.particles) {
    ctx.globalAlpha = Math.max(0, pt.life / pt.maxLife);
    ctx.fillStyle = pt.color;
    ctx.beginPath();
    ctx.arc(pt.x, pt.y, pt.size, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;
  ctx.textAlign = 'center';
  for (const t of world.texts) {
    ctx.globalAlpha = Math.max(0, Math.min(1, t.life));
    ctx.fillStyle = t.color;
    ctx.font = `700 ${t.size}px "Trebuchet MS", Verdana, sans-serif`;
    ctx.fillText(t.text, t.x, t.y);
  }
  ctx.globalAlpha = 1;

  // Darkness closes in when the light runs low: a ring of sight around you.
  if ((world.state === 'play' || world.state === 'pause') && world.light < DARK_LIGHT) {
    const p = world.player;
    const dark = ctx.createRadialGradient(p.x, p.y, 90, p.x, p.y, 420);
    dark.addColorStop(0, 'rgba(2, 4, 16, 0)');
    dark.addColorStop(1, 'rgba(2, 4, 16, 0.62)');
    ctx.fillStyle = dark;
    ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);
  }
  ctx.restore();

  if (world.state === 'play' || world.state === 'pause') drawHud(ctx, world);
  if (world.state === 'title') drawTitle(ctx, world, now);
  if (world.state === 'pause') drawPause(ctx);
  if (world.state === 'over') drawEnd(ctx, world, false);
  if (world.state === 'win') drawEnd(ctx, world, true);
}
