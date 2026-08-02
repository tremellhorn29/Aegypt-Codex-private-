import { WORLD, WALLS, FURNITURE, CREW } from "./data/world.js";
import { loadReputation, saveReputation } from "./core/storage.js";
import { createMusicController } from "./core/audio.js";
import { makePixelEntity, setEntityPos, rectsOverlap } from "./systems/entities.js";

const el = {
  world: document.querySelector("#world"), camera: document.querySelector("#camera"), mission: document.querySelector("#missionText"),
  rep: document.querySelector("#repValue"), dialogue: document.querySelector("#dialogue"), speaker: document.querySelector("#speaker"),
  dialogueText: document.querySelector("#dialogueText"), musicBtn: document.querySelector("#musicToggle"), missionFx: document.querySelector("#missionFx"),
  start: document.querySelector("#startScreen"), tutorial: document.querySelector("#tutorialOverlay"), pause: document.querySelector("#pauseOverlay"), startInfo: document.querySelector("#startInfo"),
  touchControls: document.querySelector("#touchControls"), touchInteract: document.querySelector("#touchInteract"), touchPause: document.querySelector("#touchPause")
};

const buttons = {
  newGame: document.querySelector("#newGameBtn"), cont: document.querySelector("#continueBtn"), credits: document.querySelector("#creditsBtn"),
  startRun: document.querySelector("#startRunBtn"), resume: document.querySelector("#resumeBtn"), pauseCredits: document.querySelector("#pauseCreditsBtn")
};

const state = { player: { x: 120, y: 700, w: 32, h: 32, speed: 3.2 }, cam: { x: 0, y: 0 }, keys: {}, talked: new Set(), missionDone: false, reputation: loadReputation(), running: false, paused: false };
const audio = createMusicController(el.musicBtn);
el.world.style.width = `${WORLD.width}px`; el.world.style.height = `${WORLD.height}px`;
const playerEl = makePixelEntity("player", state.player.x, state.player.y); el.world.appendChild(playerEl);

for (const wall of WALLS) { const w = makePixelEntity("wall", wall.x, wall.y, 10); w.style.width = `${wall.w}px`; w.style.height = `${wall.h}px`; el.world.appendChild(w); }
for (const item of FURNITURE) { const f = makePixelEntity("furniture", item.x, item.y, 10); f.style.width = `${item.w}px`; f.style.height = `${item.h}px`; el.world.appendChild(f); }
const crewMap = new Map();
for (const crew of CREW) { const c = makePixelEntity("crew", crew.x, crew.y); c.title = crew.name; el.world.appendChild(c); crewMap.set(crew.id, { ...crew, el: c }); }

function showOverlay(node) { node.classList.remove("hidden"); node.classList.add("visible"); }
function hideOverlay(node) { node.classList.add("hidden"); node.classList.remove("visible"); }
function showDialogue(name, line) { el.dialogue.classList.remove("hidden"); el.speaker.textContent = name; el.dialogueText.textContent = line; audio.blip(); }

function collides(nx, ny) { const r = { x: nx, y: ny, w: state.player.w, h: state.player.h }; return [...WALLS, ...FURNITURE].some(ob => rectsOverlap(r, { x: ob.x, y: ob.y, w: ob.w, h: ob.h })); }
function movePlayer() {
  let dx = 0, dy = 0; if (state.keys.w) dy -= state.player.speed; if (state.keys.s) dy += state.player.speed; if (state.keys.a) dx -= state.player.speed; if (state.keys.d) dx += state.player.speed;
  const nx = state.player.x + dx, ny = state.player.y + dy;
  if (!collides(nx, state.player.y)) state.player.x = Math.max(0, Math.min(WORLD.width - state.player.w, nx));
  if (!collides(state.player.x, ny)) state.player.y = Math.max(0, Math.min(WORLD.height - state.player.h, ny));
  setEntityPos(playerEl, state.player.x, state.player.y);
}
function updateCamera() {
  const tx = state.player.x - (el.camera.clientWidth / 2) + 16; const ty = state.player.y - (el.camera.clientHeight / 2) + 16;
  state.cam.x += (tx - state.cam.x) * 0.08; state.cam.y += (ty - state.cam.y) * 0.08;
  state.cam.x = Math.max(0, Math.min(WORLD.width - el.camera.clientWidth, state.cam.x)); state.cam.y = Math.max(0, Math.min(WORLD.height - el.camera.clientHeight, state.cam.y));
  el.world.style.transform = `translate(${-state.cam.x}px, ${-state.cam.y}px)`;
}

function completeMission() {
  state.missionDone = true; state.reputation += 10; saveReputation(state.reputation); el.rep.textContent = String(state.reputation);
  el.mission.textContent = "Drop Episode 1 complete! Reputation +10";
  el.missionFx.classList.remove("hidden"); setTimeout(() => el.missionFx.classList.add("hidden"), 1500);
  showDialogue("Mission", "Drop Episode 1 complete. The crew is locked in.");
}

function interact() {
  if (!state.running || state.paused) return;
  for (const crew of crewMap.values()) {
    const near = Math.abs(state.player.x - crew.x) < 50 && Math.abs(state.player.y - crew.y) < 50;
    if (!near) continue;
    state.talked.add(crew.id); showDialogue(crew.name, crew.line);
    if (!state.missionDone && state.talked.size === CREW.length) completeMission();
    return;
  }
  showDialogue("System", "No crew nearby. Move closer and press E.");
}

function clearMovement() {
  for (const key of ["w", "a", "s", "d"]) state.keys[key] = false;
  document.querySelectorAll("[data-key].pressed").forEach(button => button.classList.remove("pressed"));
}

function setPaused(next) {
  state.paused = next;
  clearMovement();
  if (next) showOverlay(el.pause); else hideOverlay(el.pause);
}
function startNewGame() { state.player.x = 120; state.player.y = 700; state.talked = new Set(); state.missionDone = false; el.mission.textContent = "Drop Episode 1: Talk to all crew members."; hideOverlay(el.start); showOverlay(el.tutorial); }
function continueGame() { hideOverlay(el.start); state.running = true; }

window.addEventListener("keydown", (e) => {
  const key = e.key.toLowerCase();
  if (key === "escape" && state.running) { setPaused(!state.paused); return; }
  if (!state.running || state.paused) return;
  if (["w", "a", "s", "d"].includes(key)) state.keys[key] = true;
  if (key === "e") interact();
  if (key === "m") audio.toggle();
});
window.addEventListener("keyup", (e) => { const key = e.key.toLowerCase(); if (["w", "a", "s", "d"].includes(key)) state.keys[key] = false; });
window.addEventListener("blur", clearMovement);
document.addEventListener("visibilitychange", () => { if (document.hidden) clearMovement(); });

function bindHoldButton(button) {
  const key = button.dataset.key;

  const press = (event) => {
    event.preventDefault();
    event.stopPropagation();
    if (!state.running || state.paused) return;
    state.keys[key] = true;
    button.classList.add("pressed");
  };

  const release = (event) => {
    event?.preventDefault?.();
    event?.stopPropagation?.();
    state.keys[key] = false;
    button.classList.remove("pressed");
  };

  // iPhone/iPad Safari responds most reliably to native touch events.
  button.addEventListener("touchstart", press, { passive: false });
  button.addEventListener("touchend", release, { passive: false });
  button.addEventListener("touchcancel", release, { passive: false });

  // Pointer events preserve support for Android, stylus, mouse, and desktop testing.
  button.addEventListener("pointerdown", (event) => {
    if (event.pointerType === "touch") return;
    press(event);
  });
  button.addEventListener("pointerup", (event) => {
    if (event.pointerType === "touch") return;
    release(event);
  });
  button.addEventListener("pointercancel", release);
  button.addEventListener("contextmenu", event => event.preventDefault());
}

document.querySelectorAll("[data-key]").forEach(bindHoldButton);

// Release any held direction if the finger ends outside the original button.
document.addEventListener("touchend", clearMovement, { passive: true });
document.addEventListener("touchcancel", clearMovement, { passive: true });
window.addEventListener("pointerup", (event) => { if (event.pointerType !== "touch") clearMovement(); });

el.touchInteract?.addEventListener("pointerdown", (event) => { event.preventDefault(); el.touchInteract.classList.add("pressed"); interact(); });
el.touchInteract?.addEventListener("pointerup", () => el.touchInteract.classList.remove("pressed"));
el.touchInteract?.addEventListener("pointercancel", () => el.touchInteract.classList.remove("pressed"));
el.touchPause?.addEventListener("click", () => { if (state.running) setPaused(!state.paused); });

el.musicBtn.addEventListener("click", () => audio.toggle());
buttons.newGame.addEventListener("click", startNewGame);
buttons.cont.addEventListener("click", continueGame);
buttons.credits.addEventListener("click", () => { el.startInfo.textContent = "Credits: FAST LN dev crew • retro web slice"; audio.blip(); });
buttons.startRun.addEventListener("click", () => { hideOverlay(el.tutorial); state.running = true; });
buttons.resume.addEventListener("click", () => setPaused(false));
buttons.pauseCredits.addEventListener("click", () => showDialogue("Credits", "FAST LN dev crew • Keep building."));

function tick() { if (state.running && !state.paused) { movePlayer(); updateCamera(); } requestAnimationFrame(tick); }
el.rep.textContent = String(state.reputation); showOverlay(el.start); requestAnimationFrame(tick);
