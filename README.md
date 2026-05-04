# FAST LN Origins
Retro 8-bit urban RPG project.

FAST LN Origins is a **static HTML/CSS/JavaScript** browser game prototype (no frameworks or build tools).
Open `index.html` directly in a browser to play.

## How to Play

### Controls
- `WASD` = move
- `E` = talk
- `M` = music toggle
- `Esc` = pause menu

### Game Flow
1. Open `index.html` in your browser.
2. On the title screen, choose:
   - **New Game** to start fresh (shows tutorial overlay),
   - **Continue** to jump directly into the current session,
   - **Credits** to view credits text.
3. Complete the mission **“Drop Episode 1”** by talking to all crew members.
4. Mission completion awards reputation and saves it in local storage.

## GitHub Pages Setup

Use this repository as a static site from the **main** branch:

1. Push your latest commits to `main`.
2. In GitHub, open **Settings → Pages**.
3. Under **Build and deployment**, set:
   - **Source**: `Deploy from a branch`
   - **Branch**: `main`
   - **Folder**: `/ (root)`
4. Save settings and wait for deployment.
5. Open the generated Pages URL (typically `https://<username>.github.io/<repo>/`).

Because the project is plain static files (`index.html`, `styles/`, `scripts/`), no build step is needed.

## QA Notes

Run these manual checks in a browser:

1. **New Game**
   - Title screen appears.
   - Clicking **New Game** opens tutorial overlay.
   - Clicking **Start Run** begins gameplay.

2. **Continue**
   - From title screen, click **Continue**.
   - Gameplay starts without tutorial.

3. **Credits**
   - On title screen, click **Credits**.
   - Credits text updates as expected.

4. **Dialogue / Interaction**
   - Move near crew with `WASD`.
   - Press `E` and confirm dialogue box updates.

5. **Mission Completion**
   - Talk to all crew members.
   - Verify mission completion message and completion animation appear.

6. **Reputation Saving**
   - Complete mission and note new reputation value.
   - Refresh/reopen page and verify reputation persists.

7. **Music Toggle**
   - Press `M` to toggle music on/off.
   - Click the music button to toggle on/off as well.

## Project Structure

- `index.html` — app shell, HUD, overlays
- `styles/main.css` — CRT/VHS + pixel UI styling
- `scripts/main.js` — game loop, input, mission flow, overlays
- `scripts/data/world.js` — world, walls, furniture, crew data
- `scripts/systems/entities.js` — entity and collision helpers
- `scripts/core/audio.js` — music + retro blip SFX
- `scripts/core/storage.js` — reputation persistence
