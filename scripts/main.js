import { WORLD, WALLS, FURNITURE, CREW } from "./data/world.js";
import { loadReputation, saveReputation } from "./core/storage.js";
import { createMusicController } from "./core/audio.js";
import { makePixelEntity, setEntityPos, rectsOverlap } from "./systems/entities.js";

const worldEl = document.querySelector("#world");
const cameraEl = document.querySelector("#camera");
const missionText = document.querySelector("#missionText");
const repValue = document.querySelector("#repValue");
const dialogueEl = document.querySelector("#dialogue");
const speakerEl = document.querySelector("#speaker");
const dialogueTextEl = document.querySelector("#dialogueText");
const musicBtn = document.querySelector("#musicToggle");

const state = {
  player: { x: 120, y: 700, w: 32, h: 32, speed: 3.2 },
  cam: { x: 0, y: 0 },
  keys: {},
  talked: new Set(),
  missionDone: false,
  reputation: loadReputation(),
};

const audio = createMusicController(musicBtn);
worldEl.style.width = `${WORLD.width}px`;
worldEl.style.height = `${WORLD.height}px`;

const playerEl = makePixelEntity("player", state.player.x, state.player.y);
worldEl.appendChild(playerEl);

for (const wall of WALLS) {
  const wallEl = makePixelEntity("wall", wall.x, wall.y, 10);
  wallEl.style.width = `${wall.w}px`;
  wallEl.style.height = `${wall.h}px`;
  worldEl.appendChild(wallEl);
}
for (const item of FURNITURE) {
  const furnEl = makePixelEntity("furniture", item.x, item.y, 10);
  furnEl.style.width = `${item.w}px`;
  furnEl.style.height = `${item.h}px`;
  worldEl.appendChild(furnEl);
}

const crewMap = new Map();
for (const crew of CREW) {
  const el = makePixelEntity("crew", crew.x, crew.y);
  el.title = `${crew.name}`;
  worldEl.appendChild(el);
  crewMap.set(crew.id, { ...crew, w: 32, h: 32, el });
}

function collides(nx, ny) {
  const rect = { x: nx, y: ny, w: state.player.w, h: state.player.h };
  return [...WALLS, ...FURNITURE].some(ob => rectsOverlap(rect, { x: ob.x, y: ob.y, w: ob.w, h: ob.h }));
}

function movePlayer() {
  let dx = 0;
  let dy = 0;
  if (state.keys.w) dy -= state.player.speed;
  if (state.keys.s) dy += state.player.speed;
  if (state.keys.a) dx -= state.player.speed;
  if (state.keys.d) dx += state.player.speed;
  const nx = state.player.x + dx;
  const ny = state.player.y + dy;

  if (!collides(nx, state.player.y)) state.player.x = Math.max(0, Math.min(WORLD.width - state.player.w, nx));
  if (!collides(state.player.x, ny)) state.player.y = Math.max(0, Math.min(WORLD.height - state.player.h, ny));
  setEntityPos(playerEl, state.player.x, state.player.y);
}

function updateCamera() {
  const targetX = state.player.x - (cameraEl.clientWidth / 2) + 16;
  const targetY = state.player.y - (cameraEl.clientHeight / 2) + 16;
  state.cam.x += (targetX - state.cam.x) * 0.08;
  state.cam.y += (targetY - state.cam.y) * 0.08;

  const maxX = WORLD.width - cameraEl.clientWidth;
  const maxY = WORLD.height - cameraEl.clientHeight;
  state.cam.x = Math.max(0, Math.min(maxX, state.cam.x));
  state.cam.y = Math.max(0, Math.min(maxY, state.cam.y));
  worldEl.style.transform = `translate(${-state.cam.x}px, ${-state.cam.y}px)`;
}

function showDialogue(name, line) {
  dialogueEl.classList.remove("hidden");
  speakerEl.textContent = name;
  dialogueTextEl.textContent = line;
  audio.blip();
}

function interact() {
  for (const crew of crewMap.values()) {
    const near = Math.abs(state.player.x - crew.x) < 50 && Math.abs(state.player.y - crew.y) < 50;
    if (near) {
      state.talked.add(crew.id);
      showDialogue(crew.name, crew.line);
      if (!state.missionDone && state.talked.size === CREW.length) {
        state.missionDone = true;
        state.reputation += 10;
        saveReputation(state.reputation);
        repValue.textContent = String(state.reputation);
        missionText.textContent = "Drop Episode 1 complete! Reputation +10";
        showDialogue("Mission", "Drop Episode 1 complete. The crew is locked in.");
      }
      return;
    }
  }
  showDialogue("System", "No crew nearby. Move closer and press E.");
}

window.addEventListener("keydown", (e) => {
  const key = e.key.toLowerCase();
  if (["w", "a", "s", "d"].includes(key)) state.keys[key] = true;
  if (key === "e") interact();
  if (key === "m") audio.toggle();
});
window.addEventListener("keyup", (e) => {
  const key = e.key.toLowerCase();
  if (["w", "a", "s", "d"].includes(key)) state.keys[key] = false;
});
musicBtn.addEventListener("click", () => audio.toggle());

function tick() {
  movePlayer();
  updateCamera();
  requestAnimationFrame(tick);
}

repValue.textContent = String(state.reputation);
requestAnimationFrame(tick);
