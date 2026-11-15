// KUNANG — Night of the Firefly
// audio.js — every sound in the game is synthesised here with WebAudio.
// No audio files are loaded; nothing is fetched. The context is created lazily
// on the first player gesture (browsers block audio before that) and the whole
// sound set can be muted with M.

let ctx = null;
let muted = false;

// Call from any user gesture (click / key) so the browser allows sound.
export function unlockAudio() {
  if (!ctx) {
    try {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (AC) ctx = new AC();
    } catch (e) {
      ctx = null; // no audio on this browser; the game still plays silently
    }
  }
  if (ctx && ctx.state === 'suspended') ctx.resume();
}

export function isMuted() {
  return muted;
}

export function toggleMute() {
  muted = !muted;
  return muted;
}

function tone(freq, dur, type, vol, slideTo) {
  if (!ctx || muted) return;
  const now = ctx.currentTime;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, now);
  if (slideTo) osc.frequency.exponentialRampToValueAtTime(Math.max(30, slideTo), now + dur);
  gain.gain.setValueAtTime(vol, now);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + dur);
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.start(now);
  osc.stop(now + dur + 0.02);
}

// A dew drop is caught. The pluck climbs with the combo, so a streak sounds
// like a little melody rising.
export function sfxCollect(combo) {
  const base = 520 * (1 + 0.09 * Math.min(combo, 8));
  tone(base, 0.14, 'sine', 0.22);
  tone(base * 1.5, 0.1, 'sine', 0.1);
}

// A bat hits you: a low thud.
export function sfxHit() {
  tone(130, 0.25, 'square', 0.2, 55);
  tone(70, 0.3, 'sawtooth', 0.14, 40);
}

// Flash burst: a quick rising whoosh.
export function sfxFlash() {
  tone(240, 0.28, 'triangle', 0.2, 980);
}

// A web brushes you: a soft sticky buzz.
export function sfxWeb() {
  tone(180, 0.16, 'sawtooth', 0.08, 120);
}

// Dawn breaks: a small rising arpeggio.
export function sfxWin() {
  const notes = [523.25, 659.25, 783.99, 1046.5];
  notes.forEach((f, i) => {
    setTimeout(() => tone(f, 0.35, 'sine', 0.2), i * 110);
  });
}

// The night ends: two falling notes.
export function sfxLose() {
  tone(392, 0.3, 'sine', 0.18, 330);
  setTimeout(() => tone(311, 0.45, 'sine', 0.18, 220), 160);
}

// Buttons and menu clicks: a tiny blip.
export function sfxClick() {
  tone(840, 0.06, 'sine', 0.12);
}
