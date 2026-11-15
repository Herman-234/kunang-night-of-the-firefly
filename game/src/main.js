// KUNANG — Night of the Firefly
// main.js — the front door. It wires the canvas, the input, the world and the
// renderer together, runs the frame loop, and owns the state machine:
// title -> play -> pause -> play, and play -> over | win -> play.
// The game is also playable from a ?shot= URL for screenshots (see shots.js).

import { CANVAS_W, CANVAS_H } from './config.js';
import * as audio from './audio.js';
import { createInput } from './input.js';
import { createWorld, resetWorld, updateWorld } from './world.js';
import { drawWorld } from './render.js';
import { setupShot } from './shots.js';

const canvas = document.getElementById('game');
canvas.width = CANVAS_W;
canvas.height = CANVAS_H;
const ctx = canvas.getContext('2d');

const world = createWorld();
const input = createInput(canvas);

// world.js talks about sounds by their short names; audio.js exports the
// synthesisers. This adapter is the one place the two vocabularies meet,
// so a renamed sound can never freeze the game loop again.
const sfx = {
  collect: audio.sfxCollect,
  flash: audio.sfxFlash,
  hit: audio.sfxHit,
  web: audio.sfxWeb,
  win: audio.sfxWin,
  lose: audio.sfxLose,
};

// A ?shot=title|play|win|over URL jumps straight to that screen, rendered by
// the real game, for screenshots. Normal play never uses it.
const params = new URLSearchParams(window.location.search);
const shot = params.get('shot');
if (shot) setupShot(world, shot);

// A tiny handle for play-testing: the page's own state, readable from the
// console or an automation script. It changes nothing about the game.
window.__kunang = { world, input };

function startNight() {
  audio.unlockAudio();
  audio.sfxClick();
  resetWorld(world);
  world.state = 'play';
}

// One frame's worth of menu keys. Returns true when a state change happened.
function handleMenuKeys() {
  if (input.wasPressed('KeyM')) {
    audio.toggleMute();
    return false;
  }
  if (world.state === 'title') {
    if (input.mouseDown || input.wasPressed('Enter') || input.wasPressed('Space')) {
      startNight();
      return true;
    }
  } else if (world.state === 'pause') {
    if (input.wasPressed('KeyP') || input.wasPressed('Escape') || input.mouseDown) {
      audio.unlockAudio();
      world.state = 'play';
      return true;
    }
  } else if (world.state === 'over' || world.state === 'win') {
    if (input.mouseDown || input.wasPressed('KeyR') || input.wasPressed('Enter')) {
      startNight();
      return true;
    }
  }
  return false;
}

let last = performance.now();

function frame(now) {
  const dt = Math.min(0.05, Math.max(0, (now - last) / 1000));
  last = now;

  // A single bad frame must never freeze the night: log it and keep flying.
  try {
    tick(dt, now);
  } catch (err) {
    console.error('KUNANG frame error:', err);
  }
  input.endFrame();
  requestAnimationFrame(frame);
}

function tick(dt, now) {
  if (world.state === 'play') {
    if (input.wasPressed('KeyP') || input.wasPressed('Escape')) {
      world.state = 'pause';
    } else if (input.wasPressed('KeyM')) {
      audio.toggleMute();
    } else {
      updateWorld(world, input, dt, sfx);
    }
  } else {
    handleMenuKeys();
    // The garden idles behind the menus: pollen drifts, fireflies wander.
    if (world.state === 'title') updateWorld(world, input, dt, sfx);
  }

  drawWorld(ctx, world, now);
}

// If the player tabs away mid-night, the night waits for them.
document.addEventListener('visibilitychange', () => {
  if (document.hidden && world.state === 'play') world.state = 'pause';
});

requestAnimationFrame(frame);
