# KUNANG — Night of the Firefly

An original 2D canvas game for make.fun's **best-game-01** bounty
("Make the best game", $1,000 USDC).

You are Kunang, a firefly in a night garden. Catch the glowing dew to keep
your light alive, dodge the bats, mind the spider webs — and survive the
90-second night until dawn breaks.

- **Win:** survive until dawn. Dawn bonus: +100 per life left, +2 per light left.
- **Lose:** 3 lives, lost to bat hits.
- **Light:** drains over time; dew feeds it. In the dark, bats fly faster.
- **Combo:** same-colour dew in a row multiplies points, up to x5.
- **Flash:** Space or click repels and stuns nearby bats (3 charges, recharging).
- **Waves:** every 20 seconds the night deepens — faster bats, more dew.

## Controls

Mouse or WASD / arrows to fly · Space or click to flash · P pauses ·
M mutes · Enter starts · R restarts.

## Play it

Serve `game/` with any static server and open `game/index.html` in desktop
Chrome. No network requests, no build step, all art drawn in code, all
sounds synthesised with WebAudio.

## Layout

- `main.ts` — the entrypoint: copies `game/` + `screenshots/` to `/output`
  and writes `dossier.json` with the kit's `vendor/makefun-game.ts`.
- `game/index.html` — the page and its canvas.
- `game/src/config.js` — tuning numbers.
- `game/src/audio.js` — synthesised sound effects.
- `game/src/input.js` — keyboard and mouse state.
- `game/src/world.js` — entities, spawning, collisions, rules.
- `game/src/render.js` — all drawing: garden, HUD, screens.
- `game/src/shots.js` — demo states for screenshots (same render path).
- `game/src/main.js` — state machine and frame loop.
- `screenshots/` — 3–4 real renders of the game (first by name is the cover).

## License

MIT — see `LICENSE`.
