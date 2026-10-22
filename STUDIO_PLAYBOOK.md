# FAST LN Studio: Engineering Playbook

This is the operating framework for shipping **FAST LN** browser games. It combines senior frontend development, gameplay engineering, UI/UX, QA, IT architecture, security, and technical writing into one reviewable workflow.

## Non-negotiables

1. **Gameplay before menus.** A release needs a playable 60-second loop, not just attractive screens.
2. **One-click access.** The game should open from a URL without an account; optional installability must not be a prerequisite.
3. **Phone-first, controller-friendly.** Test narrow iPhone portrait, landscape, desktop, keyboard, touch and DUALSHOCK 4/standard Gamepad where supported. Hover cannot be the sole means of revealing a control.
4. **Protect progress.** Preserve existing local-storage keys or version/migrate deliberately. Never erase another game's saves as a side effect.
5. **No silent failures.** If saving, sound, gamepads, or storage are unavailable, gameplay must degrade gracefully.
6. **Small PRs.** New features need acceptance criteria and regression coverage. Do not combine an engine rewrite with unreviewed gameplay balancing.
7. **Code belongs to a source of truth.** Don't patch legacy files not loaded by the game. Gradually replace chains of runtime function-wrappers with named modules and explicit interfaces.
8. **Keep dependencies proportional.** React, Ant Design, Redux, axios, Angular and Golang are options for *future account/admin/backend dashboards*, not default additions to lightweight Canvas gameplay.

## FAST LN virtual studio roles

| Role | Deliverable | Gate for approval |
| --- | --- | --- |
| Game Director / Product | One-sentence player fantasy, core loop and measurable release goal | A full playable match/run |
| Gameplay Engineer | Input, hit detection, opponents, state and rewards | Automated gameplay tests plus manual feel review |
| Senior Frontend / UI Engineer | Responsive layouts, accessibility, menus and overlays | Working tap + keyboard interactions, no horizontal overflow |
| UX & Controller Designer | Touch ergonomics, visible focus, button mapping, safe back/pause flows | Test on phone + supported controller; no hover-only actions |
| IT Architect | Source ownership, module boundaries, persistence/data flow, deployment plan | No hidden globals or incompatible migrations added |
| QA Tester | Reproduction steps, regression tests, evidence and device matrix | No open release-blocking bug; automated checks pass |
| Security & Privacy | User input, external assets, storage and dependency review | No secrets in client; no untrusted HTML; no undisclosed telemetry |
| Technical Writer | Changelog, control map, game rules, known limitations | README matches shipped behavior |

## Definition of done (a PR cannot be called shipped until checked)

- [ ] Purpose: state the player-facing improvement and what is outside scope.
- [ ] Acceptance: repeatable test steps for the feature and regression it might break.
- [ ] Device: desktop keyboard + mobile viewport; touch and controller checks if input changes.
- [ ] State: pause/back/visibility/disconnect, resume, fresh game, reload and existing save.
- [ ] Performance: record an actual slow-device play session; aim for smooth interaction, not claimed FPS without measurement.
- [ ] Accessibility: semantic buttons, clear labels, visible focus, readable contrast, no essential hover-only affordances.
- [ ] Security: safe handling of localStorage, player-facing strings and external sources; no secrets bundled.
- [ ] Reliability: JavaScript syntax checks, rules tests and browser smoke checks all green.
- [ ] Deployment: PR reviewed then merged; verify Pages published the merged SHA, then test the live URL on physical hardware.
- [ ] Release notes: record feature, verification evidence and known issues.

## QA matrix

| Situation | Expected behavior |
| --- | --- |
| First launch, fresh browser | Start from a visible playable menu |
| Touch controls on 390×844 iPhone-like viewport | Every required action works without hover |
| 844×390 landscape | Menus and controls are usable, no horizontal overflow |
| Desktop 1280×900 | Keyboard and mouse inputs work |
| Controller disconnected during play | Player is not trapped in a held input; game recovers |
| Tab hidden, browser interrupted | No accidental loss, unintended attacks, or runaway timers |
| Local storage denied/corrupt | Game can still launch; honest persistence fallback |
| Finish then reload | Only completed, intended progress persists; no double rewards |
| No audio permission | Muted gameplay still works |
| Replay after losing | State resets predictably |

## Change pipeline

**Issue / idea → scope → code → peer-style review → automatic tests → device playtest → merge → live smoke test → retrospective.**

Automated browser tests approximate devices; **only physical iPhone + DUALSHOCK 4 testing can confirm that exact controller pairing and tactile feel**. A green GitHub check means CI passed, not that the game is bug-free.

## Priorities

1. Make the existing movement and combat loops responsive and unambiguous.
2. Cover the most failure-prone save/progression and controls with regressions.
3. Replace prototype visuals with authored character animations and hit reactions.
4. Add distinctive enemy behavior and replayable content.
5. Build a cross-game FAST LN identity and opt-in analytics *only after gameplay holds up*.

## Working from ChatGPT

Ask for **"FAST LN studio review on [repository/feature]"** to receive a scope assessment, gameplay/UX architecture, implementation plan, test cases, QA risks, and a GitHub PR. Ask for **"FAST LN ship check"** to audit test evidence and device gaps. Do not assume merged means tested on your phone.

## Street Kings release-specific focus

**Active entry point:** `index.html` loads `scripts/fight-core.js`, `scripts/gamepad.js` and `scripts/fighters.js`. The previous RPG JavaScript is retained but inactive.

Current rules tests: `tests/fight.test.cjs`, `tests/gamepad.test.cjs`; existing browser smoke: `tests/browser.cjs`.

**Next game-quality slice:** hit confirmation + whiff recovery + distinct attack animations for Star and Rook. Preserve the iPhone DUALSHOCK 4 mappings. Test two-round KO, timeouts, pause/disconnect, and career persistence before adding more rivals.

**Architecture concern:** drawing, UI state, storage, audio, and controller dispatch currently share a large runtime file. Extract one concern at a time with tests and no gameplay change.
