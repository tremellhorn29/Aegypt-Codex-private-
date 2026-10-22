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

| Move | Keyboard | Touch screen | DUALSHOCK 4 (standard layout) |
| --- | --- | --- | --- |
| Move | A / D or ← / → | Left / right buttons, hold | Left stick or D-pad left/right |
| Jab | J | JAB | ✕ (Cross) |
| Hook | K | HOOK | □ (Square) |
| Kick | L | KICK | △ (Triangle) |
| Guard | Space, hold | GUARD, hold | L1 or L2, hold |
| Dodge | Shift | DODGE | ◯ (Circle) |
| Finisher | U when power ≥65 | FINISHER when enabled | R1 or R2 (65+ power) |
| Pause | Escape | Ⅱ | OPTIONS |

### DUALSHOCK 4 on iPhone / iPad

1. Pair the **DUALSHOCK 4 Wireless Controller** in iPhone **Settings → Bluetooth** (the connected device is shown in the user's screenshot).
2. Open the deployed game directly in **Safari**, keep the page visible, and press **✕** or move the left stick. iOS Safari can withhold Gamepad API access until controller input is detected. Look for the green **🎮 DS4 / PAD CONNECTED** status.
3. In the fight-card menu use the **D-pad or left stick vertically** to choose unlocked rivals, **✕** to start. In results use **✕** to continue or **◯** to return. In pause use **✕** to resume, **◯** to quit.
4. Left stick is analog with a 20% dead zone. D-pad left/right also moves the fighter. Controller, touch and keyboard can be used without changing settings. If the controller disconnects mid-fight, gameplay pauses so a reconnect won't cost the round.

Browser support depends on the browser/iOS version and Gamepad API permissions. The **PS button** and some operating-system shortcuts may be reserved by iOS. If the controller is paired but the status does not change, interact with a controller button while Safari is active. Touch controls remain available. Hardware behavior still needs physical iPhone/DUALSHOCK 4 verification.

A jab is quick and inexpensive. Hooks and kicks have longer recovery; kicks have more reach. Guarding reduces incoming damage but drains stamina. Dodging spends stamina and grants a brief evasive window. Clean hits build power toward a heavy finisher. Fighters recover stamina between actions.

### Combat 2.0: hit confirmation and three-hit chains

Landing another **clean hit within 1.15 seconds** continues a combo, up to three hits. The second and third hits deal 2 and 4 additional damage and award slightly more special meter. Blocks, missed attacks, getting hit, and running out of combo time reset the chain. A missed attack also creates a slightly longer recovery period, rewarding patient counterattacks. Impact frames briefly pause the action and a combo callout confirms successful chains. This changes neither the DUALSHOCK 4 mappings nor existing career saves.

### Career and saves

Career data is stored locally in `fastln_street_kings_v1`: completed match wins/losses, cash won and unlocked rivals. A page refresh does **not** preserve a match currently underway. Local storage may be disabled by the browser, in which case fighting still works but progress may not persist. No accounts or cloud saves.

The older RPG's `fastln_save_v2` / `fastln_save_v3` records are **left intact**. The old walking/dialogue RPG implementation remains in the repository as inactive source files, not loaded by `index.html`.

## Architecture

- `index.html`: shipped fight UI, interactive buttons, scoreboard and accessible overlays.
- `styles/fight.css`: responsive neon fight-card and touch control system.
- `scripts/fight-core.js`: standalone combat mechanics, timing, round logic and opponent decision-making. Compatible with Node tests.
- `scripts/gamepad.js`: standard Gamepad reader, button edge detection, controller reconnect and dead-zone support.
- `scripts/fighters.js`: canvas-based procedural fighters, arena rendering, input, synthesized audio, overlays, career storage and animations.
- `tests/fight.test.cjs`: combat regression checks.

No sprite downloads, sound files or network services are required for gameplay. Google Fonts are an optional visual enhancement; local fallback fonts are provided.

## Checks

```sh
node --check scripts/fight-core.js
node --check scripts/fighters.js
node --check scripts/gamepad.js
node --test tests/fight.test.cjs tests/gamepad.test.cjs
```

The rules suite covers initialization, move range, blocking, stamina, finishers, dodges, draws, round victories, combo damage, whiff recovery and timer decisions. Manual browser checks on actual iOS/Android devices are still recommended for long multitouch holds, background/resume, sound, orientation and performance.

## Project direction

This release is **the playable first combat slice**, not a claim of a finished commercial-quality fighting game. The next improvements should be hand-crafted character art/sprite sheets, a true combo/counter system, more animation frames, deeper opponent patterns, between-fight upgrades, and broader device testing. Multiplayer is **not** part of this release.

## Deployment

GitHub Pages deploys the **main** branch with `.github/workflows/static.yml`. Merging a feature pull request into main is required before the public Pages site updates. Older unreferenced game assets are retained deliberately until the fighting rebuild is approved.

## FAST LN studio review and shipping gates

The shared [FAST LN Studio Playbook](STUDIO_PLAYBOOK.md) describes gameplay, frontend, UX, architecture, security and QA roles; mobile/controller test matrices; save compatibility; and the release checklist.

The **Street Kings combat checks** GitHub Actions workflow now runs both Node combat/gamepad regression tests and the existing Playwright mobile browser smoke on pull requests. That browser smoke exercises opponent selection, round timer, pause, simulated standard-gamepad actions, disconnect behavior, touch interaction and screen widths. It does not prove physical DUALSHOCK 4 compatibility. Complete an actual iPhone/Safari playtest before calling a gamepad release fully verified.

Run the browser check locally with Playwright installed and `python3 -m http.server 8000` running from the repository root. Use `node tests/browser.cjs` in a second terminal.
