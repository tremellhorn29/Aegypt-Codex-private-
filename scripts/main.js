import { WORLD, WALLS, FURNITURE, CREW } from "./data/world.js";
import { loadReputation, saveReputation } from "./core/storage.js";
import { createMusicController } from "./core/audio.js";
import { makePixelEntity, setEntityPos, rectsOverlap } from "./systems/entities.js";

const $ = selector => document.querySelector(selector);
const el = {
  world: $("#world"), camera: $("#camera"), mission: $("#missionText"), objectiveProgress: $("#objectiveProgress"),
  rep: $("#repValue"), money: $("#moneyValue"), energy: $("#energyValue"), knowledge: $("#knowledgeValue"),
  relationships: $("#relationshipValue"), legacy: $("#legacyValue"), dialogue: $("#dialogue"), speaker: $("#speaker"),
  dialogueText: $("#dialogueText"), portrait: $("#portrait"), musicBtn: $("#musicToggle"), missionFx: $("#missionFx"),
  start: $("#startScreen"), tutorial: $("#tutorialOverlay"), pause: $("#pauseOverlay"), startInfo: $("#startInfo"),
  touchInteract: $("#touchInteract"), touchPause: $("#touchPause"), phoneBtn: $("#phoneBtn"), phone: $("#phoneOverlay"),
  phoneClose: $("#phoneClose"), phoneContent: $("#phoneContent")
};

const buttons = {
  newGame: $("#newGameBtn"), cont: $("#continueBtn"), credits: $("#creditsBtn"),
  startRun: $("#startRunBtn"), resume: $("#resumeBtn"), pauseCredits: $("#pauseCreditsBtn")
};

const movementKeys = ["w", "a", "s", "d"];
const state = {
  player: { x: 120, y: 820, w: 38, h: 52, speed: 3.2 },
  cam: { x: 0, y: 0 }, keys: { w: false, a: false, s: false, d: false },
  talked: new Set(), missionDone: false, reputation: loadReputation(), running: false, paused: false,
  stats: { money: 20, energy: 85, knowledge: 10, relationships: 5, legacy: 0 }
};

const audio = createMusicController(el.musicBtn);
el.world.style.width = `${WORLD.width}px`;
el.world.style.height = `${WORLD.height}px`;

const playerEl = makePixelEntity("player", state.player.x, state.player.y);
playerEl.setAttribute("aria-label", "Star");
el.world.appendChild(playerEl);

for (const wall of WALLS) {
  const node = makePixelEntity("wall", wall.x, wall.y, 10);
  node.style.width = `${wall.w}px`; node.style.height = `${wall.h}px`;
  el.world.appendChild(node);
}

for (const item of FURNITURE) {
  const node = makePixelEntity(`furniture ${item.type}`, item.x, item.y, 10);
  node.style.width = `${item.w}px`; node.style.height = `${item.h}px`;
  node.textContent = item.type === "hoop" ? "" : item.label;
  el.world.appendChild(node);
}

const crewMap = new Map();
for (const crew of CREW) {
  const node = makePixelEntity("crew", crew.x, crew.y);
  node.dataset.look = crew.look;
  const label = document.createElement("span");
  label.className = "crew-label";
  label.textContent = `${crew.name} • ${crew.role}`;
  node.appendChild(label);
  el.world.appendChild(node);
  crewMap.set(crew.id, { ...crew, el: node });
}

function showOverlay(node) { node.classList.remove("hidden"); node.classList.add("visible"); }
function hideOverlay(node) { node.classList.add("hidden"); node.classList.remove("visible"); }

function renderStats() {
  el.rep.textContent = state.reputation;
  el.money.textContent = state.stats.money;
  el.energy.textContent = state.stats.energy;
  el.knowledge.textContent = state.stats.knowledge;
  el.relationships.textContent = state.stats.relationships;
  el.legacy.textContent = state.stats.legacy;
  el.objectiveProgress.textContent = `${state.talked.size} / ${CREW.length} connections made`;
}

function showDialogue(crew, line) {
  el.dialogue.classList.remove("hidden");
  el.speaker.textContent = typeof crew === "string" ? crew : `${crew.name} • ${crew.role}`;
  el.dialogueText.textContent = line;
  el.portrait.style.background = typeof crew === "string" ? "" : `linear-gradient(145deg,var(--${crew.look}),#2b1e30)`;
  audio.blip();
}

function collides(nx, ny) {
  const r = { x: nx, y: ny, w: state.player.w, h: state.player.h };
  return [...WALLS, ...FURNITURE].some(ob => rectsOverlap(r, ob));
}

function applyMovement(dx, dy) {
  const nx = state.player.x + dx, ny = state.player.y + dy;
  if (!collides(nx, state.player.y)) state.player.x = Math.max(0, Math.min(WORLD.width - state.player.w, nx));
  if (!collides(state.player.x, ny)) state.player.y = Math.max(0, Math.min(WORLD.height - state.player.h, ny));
  setEntityPos(playerEl, state.player.x, state.player.y);
}

function movePlayer() {
  let dx = 0, dy = 0;
  if (state.keys.w) dy -= state.player.speed;
  if (state.keys.s) dy += state.player.speed;
  if (state.keys.a) dx -= state.player.speed;
  if (state.keys.d) dx += state.player.speed;
  if (dx || dy) applyMovement(dx, dy);
}

function nudgePlayer(key) {
  const d = 8;
  if (key === "w") applyMovement(0, -d);
  if (key === "s") applyMovement(0, d);
  if (key === "a") applyMovement(-d, 0);
  if (key === "d") applyMovement(d, 0);
  updateCamera(true);
}

function updateCamera(immediate = false) {
  const tx = state.player.x - el.camera.clientWidth / 2 + 19;
  const ty = state.player.y - el.camera.clientHeight / 2 + 26;
  state.cam.x = immediate ? tx : state.cam.x + (tx - state.cam.x) * .08;
  state.cam.y = immediate ? ty : state.cam.y + (ty - state.cam.y) * .08;
  state.cam.x = Math.max(0, Math.min(Math.max(0, WORLD.width - el.camera.clientWidth), state.cam.x));
  state.cam.y = Math.max(0, Math.min(Math.max(0, WORLD.height - el.camera.clientHeight), state.cam.y));
  el.world.style.transform = `translate(${-state.cam.x}px,${-state.cam.y}px)`;
}

function completeMission() {
  state.missionDone = true;
  state.reputation += 25;
  state.stats.legacy += 1;
  state.stats.knowledge += 5;
  saveReputation(state.reputation);
  el.mission.textContent = "Day One complete: your circle is forming.";
  el.missionFx.classList.remove("hidden");
  setTimeout(() => el.missionFx.classList.add("hidden"), 1800);
  showDialogue("SYSTEM", "You finished the night with stronger relationships, sharper vision, and your first mark on the legacy board.");
  renderStats();
}

function interact() {
  if (!state.running || state.paused) return;
  for (const crew of crewMap.values()) {
    const near = Math.abs(state.player.x - crew.x) < 62 && Math.abs(state.player.y - crew.y) < 70;
    if (!near) continue;
    const firstTalk = !state.talked.has(crew.id);
    state.talked.add(crew.id);
    if (firstTalk) {
      state.reputation += 5;
      state.stats.relationships += 3;
      state.stats.energy = Math.max(0, state.stats.energy - 2);
      saveReputation(state.reputation);
    }
    showDialogue(crew, crew.line);
    renderStats();
    if (!state.missionDone && state.talked.size === CREW.length) completeMission();
    return;
  }
  showDialogue("SYSTEM", "Nobody is close enough. Move toward a named character and press TALK.");
}

function clearMovement() {
  movementKeys.forEach(k => state.keys[k] = false);
  document.querySelectorAll("[data-key]").forEach(b => b.classList.remove("pressed"));
}

function setPaused(next) {
  state.paused = next; clearMovement();
  next ? showOverlay(el.pause) : hideOverlay(el.pause);
}

function resetGame() {
  state.player.x = 120; state.player.y = 820; state.talked.clear(); state.missionDone = false;
  state.stats = { money: 20, energy: 85, knowledge: 10, relationships: 5, legacy: 0 };
  setEntityPos(playerEl, state.player.x, state.player.y);
  el.mission.textContent = "Meet the crew before the day gets away.";
  renderStats(); updateCamera(true);
}

function openPhone(app = "messages") {
  state.paused = true; clearMovement();
  const content = {
    messages: ["Messages", "<p><b>Nova:</b> Everybody is waiting downstairs. Don’t waste the night.</p><p><b>Home:</b> Handle what matters before chasing what shines.</p>"],
    missions: ["Missions", `<p><b>First Move</b><br>${state.talked.size}/${CREW.length} crew connections made.</p><p>Reward: +25 REP, +1 Legacy, +5 Knowledge</p>`],
    jobs: ["Jobs", "<p><b>Corner Store:</b> Stock shelves after school.<br>Pay: $35 • Cost: 20 Energy</p><p><b>Studio Help:</b> Carry equipment.<br>Pay: $20 • Reward: +5 REP</p>"],
    school: ["School", `<p>Knowledge: <b>${state.stats.knowledge}</b></p><p>Assignment due tomorrow: Personal Vision Statement.</p>`],
    bank: ["Bank", `<p>Available balance</p><h2>$${state.stats.money}.00</h2><p>No shortcuts. Every dollar needs a purpose.</p>`],
    calendar: ["Calendar", "<p><b>Today:</b> Meet crew</p><p><b>Tomorrow:</b> School • Shift • Family dinner</p>"]
  };
  const [title, body] = content[app] || content.messages;
  el.phoneContent.innerHTML = `<h3>${title}</h3>${body}`;
  showOverlay(el.phone);
}

function closePhone() { hideOverlay(el.phone); state.paused = false; }

window.addEventListener("keydown", event => {
  const key = event.key.toLowerCase();
  if (key === "escape" && state.running) return setPaused(!state.paused);
  if (!state.running || state.paused) return;
  if (movementKeys.includes(key)) { event.preventDefault(); state.keys[key] = true; }
  if (key === "e") interact();
  if (key === "m") audio.toggle();
  if (key === "p") openPhone();
});
window.addEventListener("keyup", event => { if (movementKeys.includes(event.key.toLowerCase())) state.keys[event.key.toLowerCase()] = false; });
window.addEventListener("blur", clearMovement);
document.addEventListener("visibilitychange", () => document.hidden && clearMovement());

function bindDirectionButton(button) {
  const key = button.dataset.key;
  const begin = event => { event.preventDefault(); if (!state.running || state.paused) return; state.keys[key] = true; button.classList.add("pressed"); nudgePlayer(key); };
  const end = event => { event?.preventDefault?.(); state.keys[key] = false; button.classList.remove("pressed"); };
  button.addEventListener("touchstart", begin, { passive:false });
  button.addEventListener("touchend", end, { passive:false });
  button.addEventListener("touchcancel", end, { passive:false });
  button.addEventListener("mousedown", begin);
  button.addEventListener("mouseup", end);
  button.addEventListener("mouseleave", end);
  button.addEventListener("contextmenu", e => e.preventDefault());
}
document.querySelectorAll("[data-key]").forEach(bindDirectionButton);

el.touchInteract?.addEventListener("touchstart", e => { e.preventDefault(); interact(); }, { passive:false });
el.touchInteract?.addEventListener("click", interact);
el.touchPause?.addEventListener("click", () => state.running && setPaused(!state.paused));
el.phoneBtn.addEventListener("click", () => openPhone());
el.phoneClose.addEventListener("click", closePhone);
document.querySelectorAll("[data-app]").forEach(btn => btn.addEventListener("click", () => openPhone(btn.dataset.app)));

buttons.newGame.addEventListener("click", () => { resetGame(); hideOverlay(el.start); showOverlay(el.tutorial); });
buttons.cont.addEventListener("click", () => { hideOverlay(el.start); state.running = true; updateCamera(true); });
buttons.credits.addEventListener("click", () => { el.startInfo.textContent = "Created by Tremell Horn • Built for legacy."; audio.blip(); });
buttons.startRun.addEventListener("click", () => { hideOverlay(el.tutorial); state.running = true; updateCamera(true); });
buttons.resume.addEventListener("click", () => setPaused(false));
buttons.pauseCredits.addEventListener("click", () => showDialogue("CREDITS", "FAST LN is a living world about pressure, purpose, family, and the choices that outlive you."));

function tick() {
  if (state.running && !state.paused) { movePlayer(); updateCamera(); }
  requestAnimationFrame(tick);
}

renderStats(); showOverlay(el.start); requestAnimationFrame(tick);
