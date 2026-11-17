// KUNANG — Night of the Firefly
// shots.js — demo states for the screenshots. A screenshot of a game must show
// the real game: its title screen, play in progress with the HUD, and a win or
// loss screen. These setups build those moments out of the game's own entities
// (real dew, real bats, a real score) and hand them to the same render path
// the player sees. Nothing here is a mock-up, a composite, or borrowed art.
// Use: open game/index.html?shot=title | play | win | over

import { CANVAS_W, CANVAS_H } from './config.js';
import { resetWorld } from './world.js';

function placeDew(world, x, y, colorName, phase, golden) {
  const colors = { cyan: { name: 'cyan', fill: '#6ff2ff', glow: '#2fb9d6' }, gold: { name: 'gold', fill: '#ffd76a', glow: '#d99a1f' }, pink: { name: 'pink', fill: '#ff8fb3', glow: '#d64f83' } };
  world.dew.push({
    x, y, vy: 60, sway: 0, swaySpeed: 1.6, color: colors[colorName],
    r: golden ? 16 : 11, phase: phase || 0, golden: !!golden,
  });
}

function placeBat(world, x, y, vx) {
  world.bats.push({
    x, y, vx, baseY: y, amp: 30, freq: 2, phase: 0.5, flap: 1.2, stun: 0,
  });
}

export function setupShot(world, name) {
  resetWorld(world);
  if (name === 'title') {
    world.state = 'title';
    // Dew drifts behind the title panel, so the cover feels alive.
    placeDew(world, 110, 420, 'gold', 0.4);
    placeDew(world, 850, 380, 'cyan', 1.8);
    placeDew(world, 760, 500, 'pink', 2.6);
    placeDew(world, 220, 140, 'cyan', 0.9);
    placeDew(world, 700, 120, 'gold', 2.2, true);
    return true;
  }
  if (name === 'play') {
    world.state = 'play';
    world.score = 342;
    world.combo = 4;
    world.comboColor = 'gold';
    world.lives = 3;
    world.light = 78;
    world.flashCharges = 2;
    world.elapsed = 41;
    world.wave = 3;
    world.player.x = 470;
    world.player.y = 290;
    // A busy mid-night moment: a golden drop to chase, a dew arc, bats
    // closing in, and a flash going off — everything a real game shows.
    placeDew(world, 620, 150, 'gold', 0.3, true);
    placeDew(world, 330, 180, 'gold', 0.3);
    placeDew(world, 390, 120, 'gold', 1.1);
    placeDew(world, 520, 210, 'cyan', 2.0);
    placeDew(world, 610, 300, 'pink', 0.8);
    placeDew(world, 250, 300, 'cyan', 1.5);
    placeDew(world, 720, 420, 'gold', 1.9);
    placeDew(world, 180, 460, 'pink', 0.6);
    placeDew(world, 560, 90, 'cyan', 2.4);
    placeBat(world, 180, 150, 150);
    placeBat(world, 780, 430, -170);
    placeBat(world, 700, 190, -140);
    placeBat(world, 240, 420, 160);
    world.flashRing = { x: 470, y: 290, r: 95, life: 0.3 };
    world.texts.push({ x: 380, y: 250, text: '+30', color: '#ffd76a', size: 19, life: 1 });
    world.texts.push({ x: 380, y: 228, text: 'COMBO x4', color: '#fff7c0', size: 13, life: 1 });
    return true;
  }
  if (name === 'win') {
    world.state = 'win';
    world.score = 864;
    world.dawnBonus = 232;
    world.best = 864;
    world.newBest = true;
    world.lives = 2;
    world.light = 64;
    world.player.x = CANVAS_W / 2;
    world.player.y = 300;
    return true;
  }
  if (name === 'over') {
    world.state = 'over';
    world.score = 342;
    world.best = 864;
    world.newBest = false;
    world.lives = 0;
    world.light = 18;
    world.player.x = CANVAS_W / 2;
    world.player.y = 300;
    return true;
  }
  return false;
}
