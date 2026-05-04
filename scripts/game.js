const state = {
  player: { x: 140, y: 310, rep: 1, inventory: ["Notebook", "Phone", "Demo Beat Tape"] },
  mission: {
    title: "Drop Episode 1",
    complete: false,
    tasks: [
      "Talk to all 5 crew members",
      "Collect 2 lyric pages",
      "Record a rough demo",
    ],
  },
  crew: [
    { name: "Nova", activity: "Mixing beats", x: 300, y: 245, line: "Need cleaner drums. Let's push the low-end." },
    { name: "Rex", activity: "Writing bars", x: 520, y: 300, line: "I got a hook, but we need your verse." },
    { name: "Mina", activity: "Designing cover art", x: 620, y: 200, line: "Green/purple palette is perfect branding." },
    { name: "Kai", activity: "Posting clips", x: 430, y: 145, line: "Short clips are pulling views tonight." },
    { name: "Jett", activity: "Fixing old CRT", x: 220, y: 170, line: "VHS fuzz gives the room soul." },
  ],
  talked: new Set(),
};

const scene = document.querySelector("#scene");
const dialogue = document.querySelector("#dialogueText");
const missionList = document.querySelector("#missionList");
const repBar = document.querySelector("#repBar");
const menuItems = document.querySelector("#menuItems");
const menuTitle = document.querySelector("#menuTitle");
const tabs = document.querySelectorAll(".tab");

const playerEl = document.createElement("div");
playerEl.className = "character player";
scene.appendChild(playerEl);

state.crew.forEach((npc, i) => {
  const el = document.createElement("div");
  el.className = "character crew";
  el.style.left = `${npc.x}px`;
  el.style.top = `${npc.y}px`;
  el.dataset.index = i;
  el.title = `${npc.name}: ${npc.activity}`;
  scene.appendChild(el);
});

function drawPlayer() {
  playerEl.style.left = `${state.player.x}px`;
  playerEl.style.top = `${state.player.y}px`;
}

function renderMission() {
  missionList.innerHTML = state.mission.tasks
    .map(task => `<li>${state.talked.size >= 5 && task.includes("Talk") ? "✅" : "•"} ${task}</li>`)
    .join("");
}

function renderRep() {
  const repPct = Math.min(100, state.player.rep * 12);
  repBar.style.setProperty("--rep", `${repPct}%`);
}

function openMenu(name) {
  const menuMap = {
    inventory: state.player.inventory,
    missions: state.mission.tasks,
    crew: state.crew.map(c => `${c.name} — ${c.activity}`),
    audio: ["SFX: Retro Blip", "Track: FAST LN Freestyle (Demo)", "Output: Tape Deck"],
  };
  menuTitle.textContent = name[0].toUpperCase() + name.slice(1);
  menuItems.innerHTML = menuMap[name].map(item => `<li>${item}</li>`).join("");
}

function interact() {
  for (const npc of state.crew) {
    const dx = Math.abs(npc.x - state.player.x);
    const dy = Math.abs(npc.y - state.player.y);
    if (dx < 35 && dy < 35) {
      dialogue.textContent = `${npc.name}: ${npc.line}`;
      if (!state.talked.has(npc.name)) {
        state.talked.add(npc.name);
        state.player.rep += 1;
        renderMission();
        renderRep();
        if (state.talked.size === 5) {
          dialogue.textContent = "Crew synced. Objective updated: Drop Episode 1 is ready to record!";
        }
      }
      return;
    }
  }
  dialogue.textContent = "No one close enough. Move with arrow keys / WASD and press E.";
}

window.addEventListener("keydown", e => {
  const step = 10;
  if (["ArrowUp", "w", "W"].includes(e.key)) state.player.y -= step;
  if (["ArrowDown", "s", "S"].includes(e.key)) state.player.y += step;
  if (["ArrowLeft", "a", "A"].includes(e.key)) state.player.x -= step;
  if (["ArrowRight", "d", "D"].includes(e.key)) state.player.x += step;
  if (["e", "E"].includes(e.key)) interact();

  state.player.x = Math.max(0, Math.min(scene.clientWidth - 28, state.player.x));
  state.player.y = Math.max(0, Math.min(scene.clientHeight - 28, state.player.y));
  drawPlayer();
});

tabs.forEach(tab => {
  tab.addEventListener("click", () => {
    tabs.forEach(t => t.classList.remove("active"));
    tab.classList.add("active");
    openMenu(tab.dataset.menu);
  });
});

drawPlayer();
renderMission();
renderRep();
openMenu("inventory");
