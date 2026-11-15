// KUNANG — Night of the Firefly: the entrypoint for make.fun best-game-01.
// Node 22, standard library only. The grader runs this program twice in a
// fresh container with no network: it copies the game and its screenshots
// into /output and writes /output/dossier.json, the summary the judge reads,
// using the kit's vendored make.fun library. Both runs must write the same
// bytes, so this program does nothing time- or random-dependent: it copies
// files and lets the library summarise them.
//
// Outside the grader, MAKEFUN_OUTPUT_DIR stands in for /output:
//   mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts

import { cpSync, existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-game.ts';

// The repository root is the directory this file lives in.
const root = fileURLToPath(new URL('.', import.meta.url));
// The grader hands us /output; a local run takes MAKEFUN_OUTPUT_DIR instead.
const outDir = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

function handIn() {
  mkdirSync(outDir, { recursive: true });

  // The game itself: plain static files under game/, loaded offline.
  cpSync(join(root, 'game'), join(outDir, 'game'), { recursive: true });

  // The screenshots: 3 or 4 real renders of the game, first by name is cover.
  mkdirSync(join(outDir, 'screenshots'), { recursive: true });
  const shots = join(root, 'screenshots');
  if (existsSync(shots)) {
    cpSync(shots, join(outDir, 'screenshots'), { recursive: true });
  }

  // The dossier: the judge's view of the game, written by the kit's library
  // from exactly the files above. Caps mirror the scorer's own limits, so a
  // dossier this program writes is one the gate accepts.
  const dossier = buildDossier(outDir, {
    text_max_bytes: 163840,
    screenshots: { max: 4, max_bytes: 262144 },
    game_max_files: 993,
    game_max_bytes: 50331648,
    game_path_max_bytes: 1000,
  });
  writeFileSync(join(outDir, 'dossier.json'), dossier);
}

handIn();
