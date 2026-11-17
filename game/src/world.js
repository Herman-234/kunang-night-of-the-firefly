// KUNANG — Night of the Firefly
// world.js — the garden and everything in it: the firefly, the dew, the bats,
// the webs, the particles, and the rules that move them. This file knows
// nothing about drawing or sound; it only changes numbers, and it calls the
// small sound hooks the caller passes in so a hit or a catch can be heard.

import {
  CANVAS_W, CANVAS_H, NIGHT_SECONDS, START_LIVES, LIGHT_MAX,
  LIGHT_DRAIN_PER_SEC, LIGHT_PER_DEW, LIGHT_PER_BAT_HIT, LIGHT_PER_WEB,
  DARK_LIGHT, DEW_COLORS, DEW_BASE_POINTS, DEW_MAX_COMBO, DEW_SPAWN_EVERY_SEC,
  DEW_FALL_MIN, DEW_FALL_MAX, DEW_RADIUS, GOLDEN_DEW_POINTS, GOLDEN_DEW_LIGHT,
  GOLDEN_DEW_RADIUS, GOLDEN_DEW_EVERY_SEC, GOLDEN_DEW_CHANCE, BAT_SPAWN_EVERY_SEC, BAT_SPAWN_MIN_SEC,
  BAT_SPEED_MIN, BAT_SPEED_MAX, BAT_RADIUS, BAT_DARK_SPEED_MULT, WEB_COUNT,
  WEB_RADIUS, WEB_SLOW_SECONDS, FLASH_MAX_CHARGES, FLASH_RECHARGE_SEC,
  FLASH_RADIUS, FLASH_STUN_SEC, WAVE_SECONDS, WAVE_BONUS, MAX_WAVE,
  PLAYER_RADIUS, PLAYER_KEY_SPEED, PLAYER_MOUSE_EASE, PLAYER_HIT_GRACE_SEC,
  DAWN_PER_LIFE, DAWN_PER_LIGHT, AMBIENT_FIREFLIES, POLLEN_COUNT,
} from './config.js';

function rand(min, max) {
  return min + Math.random() * (max - min);
}

function pick(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function dist2(ax, ay, bx, by) {
  const dx = ax - bx;
  const dy = ay - by;
  return dx * dx + dy * dy;
}

export function loadBest() {
  try {
    return Number(window.localStorage.getItem('kunang-best') || 0) || 0;
  } catch (e) {
    return 0;
  }
}

export function saveBest(score) {
  try {
    window.localStorage.setItem('kunang-best', String(score));
  } catch (e) {
    // Private mode or blocked storage: the best score just lives for this visit.
  }
}

// A fresh garden. The title screen flies over this same world, idle.
export function createWorld() {
  const world = {
    state: 'title', // title | play | pause | over | win
    score: 0,
    best: loadBest(),
    combo: 0,
    comboColor: null,
    lives: START_LIVES,
    light: LIGHT_MAX,
    flashCharges: FLASH_MAX_CHARGES,
    flashRecharge: 0,
    elapsed: 0,
    wave: 1,
    shake: 0,
    flashRing: null, // {x, y, r, life} — the visible ring of a flash burst
    player: { x: CANVAS_W / 2, y: CANVAS_H / 2, vx: 0, vy: 0, grace: 0, slowUntil: 0, wing: 0 },
    dew: [],
    bats: [],
    webs: [],
    particles: [],
    texts: [],
    ambient: [],
    pollen: [],
    dewTimer: 0,
    goldenTimer: GOLDEN_DEW_EVERY_SEC,
    batTimer: 1.2,
    newBest: false,
  };
  for (let i = 0; i < AMBIENT_FIREFLIES; i++) {
    world.ambient.push({
      x: rand(40, CANVAS_W - 40), y: rand(60, CANVAS_H - 120),
      vx: rand(-14, 14), vy: rand(-10, 10), phase: rand(0, Math.PI * 2),
    });
  }
  for (let i = 0; i < POLLEN_COUNT; i++) {
    world.pollen.push({
      x: rand(0, CANVAS_W), y: rand(0, CANVAS_H),
      vy: rand(4, 12), sway: rand(0, Math.PI * 2), size: rand(1, 2.4),
    });
  }
  resetWebs(world);
  return world;
}

function resetWebs(world) {
  world.webs = [];
  const slots = [170, 480, 790];
  for (let i = 0; i < WEB_COUNT; i++) {
    world.webs.push({
      x: slots[i] + rand(-30, 30),
      y: rand(96, 190),
      r: WEB_RADIUS,
      cool: 0,
      sway: rand(0, Math.PI * 2),
    });
  }
}

// Start a fresh night: everything resets, the firefly returns to the centre.
export function resetWorld(world) {
  world.score = 0;
  world.combo = 0;
  world.comboColor = null;
  world.lives = START_LIVES;
  world.light = LIGHT_MAX;
  world.flashCharges = FLASH_MAX_CHARGES;
  world.flashRecharge = 0;
  world.elapsed = 0;
  world.wave = 1;
  world.shake = 0;
  world.flashRing = null;
  world.player.x = CANVAS_W / 2;
  world.player.y = CANVAS_H / 2;
  world.player.vx = 0;
  world.player.vy = 0;
  world.player.grace = 0;
  world.player.slowUntil = 0;
  world.dew = [];
  world.bats = [];
  world.particles = [];
  world.texts = [];
  world.dewTimer = 0;
  world.goldenTimer = GOLDEN_DEW_EVERY_SEC;
  world.batTimer = 1.4;
  world.newBest = false;
  resetWebs(world);
}

function addText(world, x, y, text, color, size) {
  world.texts.push({ x, y, text, color, size: size || 16, life: 1.1 });
}

function burst(world, x, y, color, n) {
  for (let i = 0; i < n; i++) {
    const a = rand(0, Math.PI * 2);
    const sp = rand(30, 130);
    world.particles.push({
      x, y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp,
      life: rand(0.35, 0.7), maxLife: 0.7, color, size: rand(1.5, 3.5),
    });
  }
}

function spawnDew(world) {
  // Every so often the night offers a golden drop: bigger, brighter, worth
  // chasing. It falls slower so the player can actually reach it.
  world.goldenTimer -= DEW_SPAWN_EVERY_SEC;
  if (world.goldenTimer <= 0 && Math.random() < GOLDEN_DEW_CHANCE + 0.5) {
    world.goldenTimer = GOLDEN_DEW_EVERY_SEC * (0.8 + Math.random() * 0.5);
    world.dew.push({
      x: rand(60, CANVAS_W - 60),
      y: -20,
      vy: rand(DEW_FALL_MIN, DEW_FALL_MAX) * 0.7,
      sway: rand(0, Math.PI * 2),
      swaySpeed: rand(1.2, 2.4),
      color: DEW_COLORS[1], // gold
      r: GOLDEN_DEW_RADIUS,
      phase: rand(0, Math.PI * 2),
      golden: true,
    });
    return;
  }
  const color = pick(DEW_COLORS);
  world.dew.push({
    x: rand(30, CANVAS_W - 30),
    y: -16,
    vy: rand(DEW_FALL_MIN, DEW_FALL_MAX) * (1 + 0.08 * (world.wave - 1)),
    sway: rand(0, Math.PI * 2),
    swaySpeed: rand(1.2, 2.4),
    color,
    r: DEW_RADIUS,
    phase: rand(0, Math.PI * 2),
  });
}

function spawnBat(world) {
  const fromLeft = Math.random() < 0.5;
  const speed = rand(BAT_SPEED_MIN, BAT_SPEED_MAX) * (1 + 0.12 * (world.wave - 1));
  world.bats.push({
    x: fromLeft ? -30 : CANVAS_W + 30,
    y: rand(70, CANVAS_H - 190),
    vx: fromLeft ? speed : -speed,
    baseY: 0,
    amp: rand(18, 55),
    freq: rand(1.4, 2.6),
    phase: rand(0, Math.PI * 2),
    flap: rand(0, Math.PI * 2),
    stun: 0,
  });
  const bat = world.bats[world.bats.length - 1];
  bat.baseY = bat.y;
}

// The flash burst: bats inside the ring are stunned and shoved away.
function flashBurst(world, sfx) {
  if (world.flashCharges <= 0) return;
  world.flashCharges -= 1;
  const p = world.player;
  world.flashRing = { x: p.x, y: p.y, r: 10, life: 0.45 };
  sfx.flash();
  for (const bat of world.bats) {
    const d = Math.sqrt(dist2(bat.x, bat.y, p.x, p.y));
    if (d < FLASH_RADIUS + BAT_RADIUS) {
      bat.stun = FLASH_STUN_SEC;
      const push = bat.x < p.x ? -160 : 160;
      bat.vx = push;
    }
  }
}

function collectDew(world, drop, sfx) {
  if (drop.golden) {
    world.score += GOLDEN_DEW_POINTS;
    world.light = Math.min(LIGHT_MAX, world.light + GOLDEN_DEW_LIGHT);
    burst(world, drop.x, drop.y, '#ffe27a', 18);
    burst(world, drop.x, drop.y, '#fff7c0', 8);
    addText(world, drop.x, drop.y - 14, `GOLDEN +${GOLDEN_DEW_POINTS}`, '#ffe27a', 20);
    sfx.collect(3);
    return;
  }
  const same = world.comboColor === drop.color.name;
  world.combo = same ? Math.min(world.combo + 1, DEW_MAX_COMBO) : 1;
  world.comboColor = drop.color.name;
  const mult = world.combo;
  const gained = DEW_BASE_POINTS * mult;
  world.score += gained;
  world.light = Math.min(LIGHT_MAX, world.light + LIGHT_PER_DEW);
  burst(world, drop.x, drop.y, drop.color.fill, 9);
  addText(world, drop.x, drop.y - 14, `+${gained}`, drop.color.fill, mult >= 3 ? 19 : 15);
  if (mult >= 3) addText(world, drop.x, drop.y - 36, `COMBO x${mult}`, '#fff7c0', 13);
  sfx.collect(mult);
}

function hitByBat(world, sfx) {
  const p = world.player;
  world.lives -= 1;
  world.light = Math.max(0, world.light - LIGHT_PER_BAT_HIT);
  world.combo = 0;
  world.comboColor = null;
  p.grace = PLAYER_HIT_GRACE_SEC;
  world.shake = 0.35;
  burst(world, p.x, p.y, '#ff5d5d', 14);
  sfx.hit();
  if (world.lives <= 0) {
    endNight(world, false, sfx);
  }
}

function endNight(world, won, sfx) {
  if (won) {
    const bonus = world.lives * DAWN_PER_LIFE + Math.round(world.light) * DAWN_PER_LIGHT;
    world.score += bonus;
    world.dawnBonus = bonus;
    world.state = 'win';
    sfx.win();
  } else {
    world.state = 'over';
    sfx.lose();
  }
  if (world.score > world.best) {
    world.best = world.score;
    world.newBest = true;
    saveBest(world.best);
  }
}

// One tick of the garden. dt is seconds since the last frame (clamped by caller).
// sfx is the sound hooks object from audio.js; input is from input.js.
export function updateWorld(world, input, dt, sfx) {
  // The ambient garden never sleeps: pollen drifts and background fireflies
  // wander on every screen, title included.
  for (const f of world.ambient) {
    f.x += f.vx * dt;
    f.y += f.vy * dt;
    f.phase += dt * 2;
    if (f.x < 20 || f.x > CANVAS_W - 20) f.vx *= -1;
    if (f.y < 50 || f.y > CANVAS_H - 90) f.vy *= -1;
  }
  for (const pol of world.pollen) {
    pol.y += pol.vy * dt;
    pol.sway += dt;
    if (pol.y > CANVAS_H + 4) {
      pol.y = -4;
      pol.x = rand(0, CANVAS_W);
    }
  }
  for (const t of world.texts) {
    t.y -= 26 * dt;
    t.life -= dt;
  }
  world.texts = world.texts.filter((t) => t.life > 0);
  for (const pt of world.particles) {
    pt.x += pt.vx * dt;
    pt.y += pt.vy * dt;
    pt.vy += 60 * dt;
    pt.life -= dt;
  }
  world.particles = world.particles.filter((pt) => pt.life > 0);
  if (world.shake > 0) world.shake = Math.max(0, world.shake - dt);
  if (world.flashRing) {
    world.flashRing.r += 520 * dt;
    world.flashRing.life -= dt;
    if (world.flashRing.life <= 0) world.flashRing = null;
  }
  for (const web of world.webs) {
    web.sway += dt * 0.8;
    if (web.cool > 0) web.cool -= dt;
  }

  if (world.state !== 'play') return;

  const p = world.player;
  const dark = world.light < DARK_LIGHT;

  // --- clock: the night runs out and dawn breaks ---
  world.elapsed += dt;
  const wave = Math.min(MAX_WAVE, Math.floor(world.elapsed / WAVE_SECONDS) + 1);
  if (wave > world.wave) {
    world.wave = wave;
    world.score += WAVE_BONUS;
    addText(world, CANVAS_W / 2, 120, `Wave ${wave} — +${WAVE_BONUS}`, '#fff7c0', 20);
  }
  if (world.elapsed >= NIGHT_SECONDS) {
    endNight(world, true, sfx);
    return;
  }

  // --- light drains; dew is the only way to feed it ---
  world.light = Math.max(0, world.light - LIGHT_DRAIN_PER_SEC * dt);

  // --- flash charges recharge, one at a time ---
  if (world.flashCharges < FLASH_MAX_CHARGES) {
    world.flashRecharge += dt;
    if (world.flashRecharge >= FLASH_RECHARGE_SEC) {
      world.flashCharges += 1;
      world.flashRecharge = 0;
    }
  }

  // --- the firefly moves: mouse steers, keys push ---
  const mv = input.moveVector();
  const slowed = world.elapsed < p.slowUntil;
  const speed = PLAYER_KEY_SPEED * (slowed ? 0.5 : 1);
  if (mv.x !== 0 || mv.y !== 0) {
    p.vx = mv.x * speed;
    p.vy = mv.y * speed;
    p.x += p.vx * dt;
    p.y += p.vy * dt;
  } else {
    p.x += (input.mouseX - p.x) * PLAYER_MOUSE_EASE;
    p.y += (input.mouseY - p.y) * PLAYER_MOUSE_EASE;
  }
  p.x = Math.max(24, Math.min(CANVAS_W - 24, p.x));
  p.y = Math.max(56, Math.min(CANVAS_H - 64, p.y));
  p.wing += dt * 22;
  if (p.grace > 0) p.grace -= dt;

  // --- flash on Space or click ---
  if (input.mouseDown || input.wasPressed('Space')) {
    flashBurst(world, sfx);
  }

  // --- dew falls; catch it ---
  world.dewTimer -= dt;
  if (world.dewTimer <= 0) {
    spawnDew(world);
    world.dewTimer = DEW_SPAWN_EVERY_SEC * rand(0.75, 1.25);
  }
  for (let i = world.dew.length - 1; i >= 0; i--) {
    const d = world.dew[i];
    d.y += d.vy * dt;
    d.sway += d.swaySpeed * dt;
    d.phase += dt * 3;
    if (d.y > CANVAS_H + 20) {
      world.dew.splice(i, 1);
      continue;
    }
    const dx = d.x + Math.sin(d.sway) * 14;
    if (dist2(dx, d.y, p.x, p.y) < (d.r + PLAYER_RADIUS) * (d.r + PLAYER_RADIUS)) {
      collectDew(world, d, sfx);
      world.dew.splice(i, 1);
    }
  }

  // --- bats cross; dodge them ---
  const spawnEvery = Math.max(BAT_SPAWN_MIN_SEC, BAT_SPAWN_EVERY_SEC - 0.22 * (world.wave - 1));
  world.batTimer -= dt;
  if (world.batTimer <= 0) {
    spawnBat(world);
    world.batTimer = spawnEvery * rand(0.8, 1.3);
  }
  for (let i = world.bats.length - 1; i >= 0; i--) {
    const b = world.bats[i];
    b.flap += dt * 14;
    if (b.stun > 0) {
      b.stun -= dt;
      b.x += b.vx * dt * 0.4;
      b.y += 26 * dt; // a stunned bat sinks
    } else {
      b.x += b.vx * dt * (dark ? BAT_DARK_SPEED_MULT : 1);
      b.y = b.baseY + Math.sin(b.phase + world.elapsed * b.freq) * b.amp;
    }
    if (b.x < -60 || b.x > CANVAS_W + 60 || b.y > CANVAS_H + 40) {
      world.bats.splice(i, 1);
      continue;
    }
    if (p.grace <= 0 && dist2(b.x, b.y, p.x, p.y) < (BAT_RADIUS + PLAYER_RADIUS - 4) ** 2) {
      hitByBat(world, sfx);
      world.bats.splice(i, 1);
      if (world.state !== 'play') return;
    }
  }

  // --- webs hang; brushing one slows you and dims your light ---
  for (const web of world.webs) {
    if (web.cool > 0) continue;
    if (dist2(web.x, web.y, p.x, p.y) < (web.r + PLAYER_RADIUS - 6) ** 2) {
      web.cool = 1.5;
      p.slowUntil = world.elapsed + WEB_SLOW_SECONDS;
      world.light = Math.max(0, world.light - LIGHT_PER_WEB);
      sfx.web();
      addText(world, p.x, p.y - 22, 'Tangled!', '#d8e6ff', 14);
    }
  }
}
