# FAST LN Origins

A lightweight, static HTML/CSS/JavaScript urban life-and-legacy RPG. No runtime dependencies, account, or build step. Open `index.html`, or serve this directory with `python -m http.server 8000`.

## Play

1. Begin Day One, meet five crew members, and make their branching decisions.
2. Return to the Family Couch area and choose how to finish the night.
3. Close the dialogue, open the phone, and select **Calendar → Begin Day 2**.
4. Spend three time blocks per day across Jobs, School, and Calendar. Each activity can be completed once a day. Walking and reading never spend time.
5. Review the day and sleep in Calendar. Unspent blocks expire; sleep restores 35 energy, capped at 100.

| Activity | Cost | Reward |
| --- | --- | --- |
| Corner store shift | 1 block, 20 energy | $35; $50 at 25 knowledge |
| Personal vision workshop | 1 block, 15 energy | 6 knowledge |
| Family time | 1 block, 10 energy | 5 relationships |
| Independent studio session | 1 block, 25 energy, $10; requires 20 knowledge | 12 reputation, 1 legacy |
| Take a breather | 1 block | 25 energy, capped at 100 |

Complete work, study, and family time on the same day for **1 extra legacy when you sleep**. Choosing to clear Nova's sample adds 1 legacy per studio session. Kai's promoter connection adds $20 per session. These bonuses and activity costs are shown before acting. Rest or sleep provides a recovery route if energy is too low.

## Controls

- WASD / touch D-pad / controller left stick: move in eight directions.
- E / A touch button / controller Cross: interact or confirm a story choice.
- Q / Esc / B touch button / controller Circle: close dialogue, cancel choices, or pause.
- P / phone icon: open the phone when no dialogue is active.
- Tap/click phone apps and activity buttons; keyboard Tab and Enter also work. Controller navigation within the phone is not implemented.

## Saves

Story choices, crew progress, stats, day, completed activities, and recap persist locally as `fastln_save_v3`. Existing `fastln_save_v2` stats and decisions migrate on the next save; story progress is reconstructed from valid choices. Continue returns Star to the home starting position while preserving progress. A cancelled finale can be retried. Starting over asks before replacing an existing save. The HUD reports unavailable local storage instead of silently claiming a successful save.

Saves are browser/device-specific. Clearing site data removes them. This slice does not add cloud saves or a new story episode; it makes the existing world replayable through a daily simulation.

## Source of truth

- `index.html`: loads `scripts/systems/life.js`, then `scripts/game.bundle.js` as classic scripts, including when opened directly from disk.
- `scripts/game.bundle.js`: **active, hand-maintained game runtime**, branching story, world, input, phone, persistence.
- `scripts/systems/life.js`: pure daily-loop rules and save validation; no browser dependencies.
- `styles/main.css`, `styles/mobile-fix.css`: responsive presentation.
- `scripts/main.js`, `scripts/data/world.js`, and older core modules: legacy scaffold, **not loaded by the current page**. Do not edit those expecting to change the shipped game.

## Validation

Run the dependency-free rules suite:

```sh
node --test tests/life.test.cjs
node --check scripts/game.bundle.js
```

Optional browser regression suite (development tools only):

```sh
npm install --no-save playwright
npx playwright install chromium
python -m http.server 8000
# In another terminal:
node tests/browser.cjs
```

The browser suite checks new-game movement, locked activities, v2 migration, finale cancellation/retry, daily rewards, reload persistence, sleep confirmation, viewport overflow, and pause behavior. It saves a mobile screenshot in the system temp directory. `CHROMIUM_PATH` can select an existing Chromium executable.

Manually verify touch D-pad holds, portrait/landscape phone scrolling, and controller behavior on target hardware before release. The existing GitHub Pages workflow deploys the static files from main; a feature branch/PR does not replace the live game.
