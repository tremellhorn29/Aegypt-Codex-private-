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

const movementKeys = ["w", "a", "s", "d"];
const state = {
  player: { x: 120, y: 700, w: 32, h: 32, speed: 3.2 },
  cam: { x: 0, y: 0 },
  keys: { w: false, a: false, s: false, d: false },
  talked: new Set(), missionDone: false, reputation: loadReputation(), running: false, paused: false
};

const audio = createMusicController(el.musicBtn);
el.world.style.width = `${WORLD.width}px`;
el.world.style.height = `${WORLD.height}px`;
const playerEl = makePixelEntity("player", state.player.x, state.player.y);
el.world.appendChild(playerEl);

for (const wall of WALLS) {
  const w = makePixelEntity("wall", wall.x, wall.y, 10);
  w.style.width = `${wall.w}px`;
  w.style.height = `${wall.h}px`;
  el.world.appendChild(w);
}

for (const item of FURNITURE) {
  const f = makePixelEntity("furniture", item.x, item.y, 10);
  f.style.width = `${item.w}px`;
  f.style.height = `${item.h}px`;
  el.world.appendChild(f);
}

const crewMap = new Map();
for (const crew of CREW) {
  const c = makePixelEntity("crew", crew.x, crew.y);
  c.title = crew.name;
  el.world.appendChild(c);
  crewMap.set(crew.id, { ...crew, el: c });
}

function showOverlay(node) {
  node.classList.remove("hidden");
  node.classList.add("visible");
}

function hideOverlay(node) {
  node.classList.add("hidden");
  node.classList.remove("visible");
}

function showDialogue(name, line) {
  el.dialogue.classList.remove("hidden");
  el.speaker.textContent = name;
  el.dialogueText.textContent = line;
  audio.blip();
}

function collides(nx, ny) {
  const r = { x: nx, y: ny, w: state.player.w, h: state.player.h };
  return [...WALLS, ...FURNITURE].some(ob => rectsOverlap(r, { x: ob.x, y: ob.y, w: ob.w, h: ob.h }));
}

function applyMovement(dx, dy) {
  const nx = state.player.x + dx;
  const ny = state.player.y + dy;

  if (!collides(nx, state.player.y)) {
    state.player.x = Math.max(0, Math.min(WORLD.width - state.player.w, nx));
  }

  if (!collides(state.player.x, ny)) {
    state.player.y = Math.max(0, Math.min(WORLD.height - state.player.h, ny));
  }

  setEntityPos(playerEl, state.player.x, state.player.y);
}

function movePlayer() {
  let dx = 0;
  let dy = 0;

  if (state.keys.w) dy -= state.player.speed;
  if (state.keys.s) dy += state.player.speed;
  if (state.keys.a) dx -= state.player.speed;
  if (state.keys.d) dx += state.player.speed;

  if (dx !== 0 || dy !== 0) applyMovement(dx, dy);
}

function nudgePlayer(key) {
  const distance = 8;
  if (key === "w") applyMovement(0, -distance);
  if (key === "s") applyMovement(0, distance);
  if (key === "a") applyMovement(-distance, 0);
  if (key === "d") applyMovement(distance, 0);
  updateCamera(true);
}

function updateCamera(immediate = false) {
  const tx = state.player.x - (el.camera.clientWidth / 2) + 16;
  const ty = state.player.y - (el.camera.clientHeight / 2) + 16;

  if (immediate) {
    state.cam.x = tx;
    state.cam.y = ty;
  } else {
    state.cam.x += (tx - state.cam.x) * 0.08;
    state.cam.y += (ty - state.cam.y) * 0.08;
  }

  state.cam.x = Math.max(0, Math.min(Math.max(0, WORLD.width - el.camera.clientWidth), state.cam.x));
  state.cam.y = Math.max(0, Math.min(Math.max(0, WORLD.height - el.camera.clientHeight), state.cam.y));
  el.world.style.transform = `translate(${-state.cam.x}px, ${-state.cam.y}px)`;
}

function completeMission() {
  state.missionDone = true;
  state.reputation += 10;
  saveReputation(state.reputation);
  el.rep.textContent = String(state.reputation);
  el.mission.textContent = "Drop Episode 1 complete! Reputation +10";
  el.missionFx.classList.remove("hidden");
  setTimeout(() => el.missionFx.classList.add("hidden"), 1500);
  showDialogue("Mission", "Drop Episode 1 complete. The crew is locked in.");
}

function interact() {
  if (!state.running || state.paused) return;

  for (const crew of crewMap.values()) {
    const near = Math.abs(state.player.x - crew.x) < 50 && Math.abs(state.player.y - crew.y) < 50;
    if (!near) continue;

    state.talked.add(crew.id);
    showDialogue(crew.name, crew.line);
    if (!state.missionDone && state.talked.size === CREW.length) completeMission();
    return;
  }

  showDialogue("System", "No crew nearby. Move closer and press E.");
}

function setDirection(key, active, button = null) {
  if (!movementKeys.includes(key)) return;
  state.keys[key] = active;

  if (button) {
    button.classList.toggle("pressed", active);
    button.setAttribute("aria-pressed", String(active));
  }
}

function clearMovement() {
  for (const key of movementKeys) state.keys[key] = false;
  document.querySelectorAll("[data-key]").forEach(button => {
    button.classList.remove("pressed");
    button.setAttribute("aria-pressed", "false");
  });
}

function setPaused(next) {
  state.paused = next;
  clearMovement();
  if (next) showOverlay(el.pause);
  else hideOverlay(el.pause);
}

function startNewGame() {
  state.player.x = 120;
  state.player.y = 700;
  state.talked = new Set();
  state.missionDone = false;
  setEntityPos(playerEl, state.player.x, state.player.y);
  updateCamera(true);
  el.mission.textContent = "Drop Episode 1: Talk to all crew members.";
  hideOverlay(el.start);
  showOverlay(el.tutorial);
}

function continueGame() {
  hideOverlay(el.start);
  state.running = true;
  updateCamera(true);
}

window.addEventListener("keydown", event => {
  const key = event.key.toLowerCase();

  if (key === "escape" && state.running) {
    setPaused(!state.paused);
    return;
  }

  if (!state.running || state.paused) return;

  if (movementKeys.includes(key)) {
    event.preventDefault();
    state.keys[key] = true;
  }
  if (key === "e") interact();
  if (key === "m") audio.toggle();
});

window.addEventListener("keyup", event => {
  const key = event.key.toLowerCase();
  if (movementKeys.includes(key)) state.keys[key] = false;
});

window.addEventListener("blur", clearMovement);
document.addEventListener("visibilitychange", () => {
  if (document.hidden) clearMovement();
});

function bindDirectionButton(button) {
  const key = button.dataset.key;
  let activeTouchId = null;
  let suppressMouseUntil = 0;

  button.setAttribute("aria-pressed", "false");

  const begin = event => {
    event.preventDefault();
    event.stopPropagation();
    if (!state.running || state.paused) return;

    setDirection(key, true, button);
    nudgePlayer(key);
  };

  const end = event => {
    event?.preventDefault?.();
    event?.stopPropagation?.();
    setDirection(key, false, button);
  };

  button.addEventListener("touchstart", event => {
    suppressMouseUntil = Date.now() + 800;
    activeTouchId = event.changedTouches[0]?.identifier ?? null;
    begin(event);
  }, { passive: false });

  button.addEventListener("touchend", event => {
    const ended = [...event.changedTouches].some(touch => touch.identifier === activeTouchId);
    if (ended || activeTouchId === null) {
      activeTouchId = null;
      end(event);
    }
  }, { passive: false });

  button.addEventListener("touchcancel", event => {
    activeTouchId = null;
    end(event);
  }, { passive: false });

  button.addEventListener("mousedown", event => {
    if (Date.now() < suppressMouseUntil) return;
    begin(event);
  });

  button.addEventListener("mouseup", event => {
    if (Date.now() < suppressMouseUntil) return;
    end(event);
  });

  button.addEventListener("mouseleave", event => {
    if (Date.now() < suppressMouseUntil) return;
    if (event.buttons === 0) end(event);
  });

  button.addEventListener("contextmenu", event => event.preventDefault());
}

document.querySelectorAll("[data-key]").forEach(bindDirectionButton);

// Safety release only. These handlers do not interfere with an active finger press.
window.addEventListener("mouseup", clearMovement);
window.addEventListener("touchcancel", clearMovement, { passive: true });

el.touchInteract?.addEventListener("touchstart", event => {
  event.preventDefault();
  el.touchInteract.classList.add("pressed");
  interact();
}, { passive: false });

el.touchInteract?.addEventListener("touchend", event => {
  event.preventDefault();
  el.touchInteract.classList.remove("pressed");
}, { passive: false });

el.touchInteract?.addEventListener("click", event => {
  if (event.detail === 0) interact();
});

el.touchPause?.addEventListener("click", () => {
  if (state.running) setPaused(!state.paused);
});

el.musicBtn.addEventListener("click", () => audio.toggle());
buttons.newGame.addEventListener("click", startNewGame);
buttons.cont.addEventListener("click", continueGame);
buttons.credits.addEventListener("click", () => {
  el.startInfo.textContent = "Credits: FAST LN dev crew • retro web slice";
  audio.blip();
});
buttons.startRun.addEventListener("click", () => {
  hideOverlay(el.tutorial);
  state.running = true;
  updateCamera(true);
});
buttons.resume.addEventListener("click", () => setPaused(false));
buttons.pauseCredits.addEventListener("click", () => showDialogue("Credits", "FAST LN dev crew • Keep building."));

function tick() {
  if (state.running && !state.paused) {
    movePlayer();
    updateCamera();
  }
  requestAnimationFrame(tick);
}

el.rep.textContent = String(state.reputation);
showOverlay(el.start);
requestAnimationFrame(tick);
