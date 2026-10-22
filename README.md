# FAST LN: STREET KINGS 🥊

A fast, playable, **mobile-first 2D arcade fighting game** set in FAST LN's original South Cove universe. Rebuilt from the first FAST LN Origins prototype to put round-based combat first. No account, payment, build step, framework, or install required.

## Play

Open **index.html** in a modern browser, or serve the directory locally with:

```sh
python -m http.server 8000
```

Select an unlocked rival on the fight card and choose **ENTER THE RING**. Defeat your opponent in **two rounds** to win the match. Each round is 50 seconds. A knockout or higher remaining health when time runs out wins the round; ties replay the round.

Win fights to unlock three progressively harder rivals: **Rook → Vex → Crown**. Wins award in-game cash (not real money), and the fight card shows your career record. Losses are recorded only when a match is completed.

### Fight controls

| Move | Keyboard | Touch screen |
| --- | --- | --- |
| Move | A / D or ← / → | Left / right buttons, hold |
| Jab | J | JAB |
| Hook | K | HOOK |
| Kick | L | KICK |
| Guard | Space, hold | GUARD, hold |
| Dodge | Shift | DODGE |
| Finisher | U when power ≥65 | FINISHER when enabled |
| Pause | Escape | Ⅱ |

A jab is quick and inexpensive. Hooks and kicks have longer recovery; kicks have more reach. Guarding reduces incoming damage but drains stamina. Dodging spends stamina and grants a brief evasive window. Clean hits build power toward a heavy finisher. Fighters recover stamina between actions.

### Career and saves

Career data is stored locally in `fastln_street_kings_v1`: completed match wins/losses, cash won and unlocked rivals. A page refresh does **not** preserve a match currently underway. Local storage may be disabled by the browser, in which case fighting still works but progress may not persist. No accounts or cloud saves.

The older RPG's `fastln_save_v2` / `fastln_save_v3` records are **left intact**. The old walking/dialogue RPG implementation remains in the repository as inactive source files, not loaded by `index.html`.

## Architecture

- `index.html`: shipped fight UI, interactive buttons, scoreboard and accessible overlays.
- `styles/fight.css`: responsive neon fight-card and touch control system.
- `scripts/fight-core.js`: standalone combat mechanics, timing, round logic and opponent decision-making. Compatible with Node tests.
- `scripts/fighters.js`: canvas-based procedural fighters, arena rendering, input, synthesized audio, overlays, career storage and animations.
- `tests/fight.test.cjs`: combat regression checks.

No sprite downloads, sound files or network services are required for gameplay. Google Fonts are an optional visual enhancement; local fallback fonts are provided.

## Checks

```sh
node --check scripts/fight-core.js
node --check scripts/fighters.js
node --test tests/fight.test.cjs
```

The rules suite covers initialization, move range, blocking, stamina, finishers, dodges, draws, round victories and timer decisions. Manual browser checks on actual iOS/Android devices are still recommended for long multitouch holds, background/resume, sound, orientation and performance.

## Project direction

This release is **the playable first combat slice**, not a claim of a finished commercial-quality fighting game. The next improvements should be hand-crafted character art/sprite sheets, a true combo/counter system, more animation frames, deeper opponent patterns, between-fight upgrades, and broader device testing. Multiplayer is **not** part of this release.

## Deployment

GitHub Pages deploys the **main** branch with `.github/workflows/static.yml`. Merging a feature pull request into main is required before the public Pages site updates. Older unreferenced game assets are retained deliberately until the fighting rebuild is approved.
