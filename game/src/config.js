// KUNANG — Night of the Firefly
// config.js — every tuning number for the game lives here, in one place.
// Nothing in this file touches the DOM, the canvas, or the network.

export const CANVAS_W = 960;
export const CANVAS_H = 600;

// The night lasts this long. Survive it and dawn breaks: you win.
export const NIGHT_SECONDS = 90;

// Lives. A bat hit costs one life; at zero lives the night ends.
export const START_LIVES = 3;

// Light. Your glow drains over time; dew feeds it. At zero light the garden
// goes dark and the bats grow bolder (faster).
export const LIGHT_MAX = 100;
export const LIGHT_DRAIN_PER_SEC = 1.0;
export const LIGHT_PER_DEW = 14;
export const LIGHT_PER_BAT_HIT = 15;
export const LIGHT_PER_WEB = 8;
export const DARK_LIGHT = 30; // below this, the garden is dark and bats speed up

// Dew drops: the points. Same colour in a row builds the combo multiplier.
export const DEW_COLORS = [
  { name: 'cyan', fill: '#6ff2ff', glow: '#2fb9d6' },
  { name: 'gold', fill: '#ffd76a', glow: '#d99a1f' },
  { name: 'pink', fill: '#ff8fb3', glow: '#d64f83' },
];
export const DEW_BASE_POINTS = 10;
export const DEW_MAX_COMBO = 5;
export const DEW_SPAWN_EVERY_SEC = 0.55;
export const DEW_FALL_MIN = 42;
export const DEW_FALL_MAX = 92;
export const DEW_RADIUS = 11;

// Bats: the danger. They cross the garden in a sine wave.
export const BAT_SPAWN_EVERY_SEC = 2.2; // wave 1; shrinks as waves rise
export const BAT_SPAWN_MIN_SEC = 1.05;
export const BAT_SPEED_MIN = 120;
export const BAT_SPEED_MAX = 220;
export const BAT_RADIUS = 20;
export const BAT_DARK_SPEED_MULT = 1.35; // bats are faster when your light is low

// Spider webs: hanging hazards. Touching one slows you and dims your light.
// They never cost a life — they are a tax on careless flying, not a death.
export const WEB_COUNT = 3;
export const WEB_RADIUS = 46;
export const WEB_SLOW_SECONDS = 2.0;

// Flash burst: your one defence. Repels and stuns bats inside its radius.
export const FLASH_MAX_CHARGES = 3;
export const FLASH_RECHARGE_SEC = 12;
export const FLASH_RADIUS = 150;
export const FLASH_STUN_SEC = 1.6;

// Waves: every 20 seconds the night deepens — more bats, faster dew.
export const WAVE_SECONDS = 20;
export const WAVE_BONUS = 50;
export const MAX_WAVE = 5;

// The firefly itself.
export const PLAYER_RADIUS = 14;
export const PLAYER_KEY_SPEED = 330; // px per second on WASD / arrows
export const PLAYER_MOUSE_EASE = 0.16; // how fast the firefly chases the cursor
export const PLAYER_HIT_GRACE_SEC = 1.4; // invulnerable just after a bat hit

// Dawn bonus on winning: each life left and each point of light left pays out.
export const DAWN_PER_LIFE = 100;
export const DAWN_PER_LIGHT = 2;

// Ambient dressing: background fireflies and drifting pollen.
export const AMBIENT_FIREFLIES = 6;
export const POLLEN_COUNT = 26;
