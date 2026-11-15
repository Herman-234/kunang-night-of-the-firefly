// KUNANG — Night of the Firefly
// input.js — keyboard and mouse state, in one small place.
// The firefly steers with the mouse (it chases the cursor) and with
// WASD / arrow keys. Space or a mouse click fires a flash burst.
// Enter starts, R restarts, P pauses, M mutes. This module only records
// what the player did; world.js and main.js decide what it means.

export function createInput(canvas) {
  const input = {
    mouseX: 480, // centre of the garden; the firefly starts here
    mouseY: 300,
    mouseDown: false, // true on the frame a click begins
    keys: new Set(),
    // Edge-triggered presses, consumed once per frame by the game loop.
    pressedKeys: new Set(),
  };

  canvas.addEventListener('mousemove', (e) => {
    const r = canvas.getBoundingClientRect();
    input.mouseX = ((e.clientX - r.left) / r.width) * canvas.width;
    input.mouseY = ((e.clientY - r.top) / r.height) * canvas.height;
  });

  canvas.addEventListener('mousedown', (e) => {
    e.preventDefault();
    input.mouseDown = true;
    const r = canvas.getBoundingClientRect();
    input.mouseX = ((e.clientX - r.left) / r.width) * canvas.width;
    input.mouseY = ((e.clientY - r.top) / r.height) * canvas.height;
  });

  window.addEventListener('keydown', (e) => {
    // Space and arrows would scroll the page; the game owns them.
    if (['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.code)) {
      e.preventDefault();
    }
    if (!e.repeat) input.pressedKeys.add(e.code);
    input.keys.add(e.code);
  });

  window.addEventListener('keyup', (e) => {
    input.keys.delete(e.code);
  });

  // The game loop calls this at the end of every frame so a press is seen once.
  input.endFrame = () => {
    input.mouseDown = false;
    input.pressedKeys.clear();
  };

  input.isDown = (code) => input.keys.has(code);

  input.wasPressed = (code) => input.pressedKeys.has(code);

  // Any of the four movement directions, as a -1..1 pair.
  input.moveVector = () => {
    let x = 0;
    let y = 0;
    if (input.keys.has('KeyA') || input.keys.has('ArrowLeft')) x -= 1;
    if (input.keys.has('KeyD') || input.keys.has('ArrowRight')) x += 1;
    if (input.keys.has('KeyW') || input.keys.has('ArrowUp')) y -= 1;
    if (input.keys.has('KeyS') || input.keys.has('ArrowDown')) y += 1;
    if (x !== 0 && y !== 0) {
      x *= Math.SQRT1_2;
      y *= Math.SQRT1_2;
    }
    return { x, y };
  };

  return input;
}
