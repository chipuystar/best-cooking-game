// Neon Skillet — make.fun "Make the best cooking game" entry hand-in.
//
// This program (Node 22, standard library only) is the entrypoint the grader
// runs. It assembles /output from this repository: the playable game under
// game/, the screenshots under screenshots/, and dossier.json — the summary
// the AI judge reads — built with make.fun's own vendored library so the
// gate can reproduce it byte for byte.
//
// Determinism is the whole point of this file: the grader runs it twice and
// both runs must write identical bytes, so there is no randomness, no clock
// and no network anywhere in here — plain deterministic copies, and the
// dossier library hashes the same inputs into the same output every time.
//
// Local check:
//   mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts

import { cpSync, existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-game.ts';

const repoRoot = fileURLToPath(new URL('.', import.meta.url));
const outDir = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

mkdirSync(outDir, { recursive: true });

// The game itself: static files only, served from game/ at a static
// server's root. Copied whole, exactly as committed.
cpSync(join(repoRoot, 'game'), join(outDir, 'game'), { recursive: true });

// The screenshots: 3 or 4 real renders of the game's own code. The first
// by name is the cover the judge sees largest.
mkdirSync(join(outDir, 'screenshots'), { recursive: true });
if (existsSync(join(repoRoot, 'screenshots'))) {
  cpSync(join(repoRoot, 'screenshots'), join(outDir, 'screenshots'), { recursive: true });
}

// The dossier, built by the kit's library with the gate's own caps: at most
// 160 KiB of source text, at most 4 screenshots of 256 KiB each, game/
// within 993 files and 48 MiB, every game path within 1,000 bytes.
writeFileSync(
  join(outDir, 'dossier.json'),
  buildDossier(outDir, {
    text_max_bytes: 163840,
    screenshots: { max: 4, max_bytes: 262144 },
    game_max_files: 993,
    game_max_bytes: 50331648,
    game_path_max_bytes: 1000,
  }),
);
