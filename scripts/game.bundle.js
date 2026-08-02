(function () {
  'use strict';

  var WORLD = { width: 1600, height: 1000 };
  var WALLS = [
    { x: 0, y: 0, w: 1600, h: 28 }, { x: 0, y: 972, w: 1600, h: 28 },
    { x: 0, y: 0, w: 28, h: 1000 }, { x: 1572, y: 0, w: 28, h: 1000 },
    { x: 410, y: 410, w: 36, h: 420 }, { x: 970, y: 250, w: 36, h: 360 },
    { x: 1210, y: 590, w: 280, h: 34 }
  ];
  var FURNITURE = [
    { type: 'sofa', label: 'Family Couch', x: 90, y: 690, w: 230, h: 105 },
    { type: 'desk', label: 'Study Desk', x: 120, y: 310, w: 170, h: 85 },
    { type: 'tv', label: 'TV', x: 310, y: 140, w: 70, h: 150 },
    { type: 'studio', label: 'Bedroom Studio', x: 535, y: 640, w: 260, h: 120 },
    { type: 'counter', label: 'Corner Store', x: 1065, y: 150, w: 330, h: 110 },
    { type: 'bench', label: 'Courtyard Bench', x: 1090, y: 700, w: 210, h: 72 },
    { type: 'hoop', label: 'The Court', x: 1390, y: 350, w: 70, h: 140 }
  ];
  var CREW = [
    { id: 'nova', name: 'Nova', role: 'Producer', look: 'violet', x: 520, y: 560, line: 'The beat is ready, but talent means nothing if you never show up.' },
    { id: 'rex', name: 'Rex', role: 'Strategist', look: 'gold', x: 760, y: 455, line: 'You can chase quick respect, or build something nobody can take from you.' },
    { id: 'mina', name: 'Mina', role: 'Artist', look: 'rose', x: 865, y: 730, line: 'I made the cover feel like our block—rough edges, bright future.' },
    { id: 'kai', name: 'Kai', role: 'Connector', look: 'cyan', x: 1125, y: 520, line: 'People remember who helped before they remember who talked the loudest.' },
    { id: 'jett', name: 'Jett', role: 'Tech', look: 'green', x: 1350, y: 700, line: 'Your phone is the real command center. Check it before the next move.' }
  ];

  function $(selector) { return document.querySelector(selector); }
  function $all(selector) { return Array.prototype.slice.call(document.querySelectorAll(selector)); }
  function makeEntity(className, x, y, size) {
    var node = document.createElement('div');
    node.className = 'pixel ' + className;
    node.style.width = (size || 32) + 'px';
    node.style.height = (size || 32) + 'px';
    setPos(node, x, y);
    return node;
  }
  function setPos(node, x, y) { node.style.left = x + 'px'; node.style.top = y + 'px'; }
  function overlap(a, b) { return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y; }
  function loadRep() { try { return parseInt(localStorage.getItem('fastln_rep') || '0', 10) || 0; } catch (_) { return 0; } }
  function saveRep(value) { try { localStorage.setItem('fastln_rep', String(value)); } catch (_) {} }

  function boot() {
    var el = {
      world: $('#world'), camera: $('#camera'), mission: $('#missionText'), progress: $('#objectiveProgress'),
      rep: $('#repValue'), money: $('#moneyValue'), energy: $('#energyValue'), knowledge: $('#knowledgeValue'),
      relationships: $('#relationshipValue'), legacy: $('#legacyValue'), dialogue: $('#dialogue'), speaker: $('#speaker'),
      dialogueText: $('#dialogueText'), portrait: $('#portrait'), missionFx: $('#missionFx'), start: $('#startScreen'),
      tutorial: $('#tutorialOverlay'), pause: $('#pauseOverlay'), startInfo: $('#startInfo'), touchInteract: $('#touchInteract'),
      touchPause: $('#touchPause'), phoneBtn: $('#phoneBtn'), phone: $('#phoneOverlay'), phoneClose: $('#phoneClose'),
      phoneContent: $('#phoneContent')
    };

    if (!el.world || !el.camera || !el.start) {
      document.body.innerHTML = '<div style="padding:24px;color:white;background:#090a0f;font-family:system-ui"><h2>FAST LN could not load.</h2><p>Please refresh this page once.</p></div>';
      return;
    }

    var state = {
      player: { x: 120, y: 820, w: 38, h: 52, speed: 3.2 }, cam: { x: 0, y: 0 },
      keys: { w: false, a: false, s: false, d: false }, talked: {}, missionDone: false,
      reputation: loadRep(), running: false, paused: false,
      stats: { money: 20, energy: 85, knowledge: 10, relationships: 5, legacy: 0 }
    };

    el.world.style.width = WORLD.width + 'px';
    el.world.style.height = WORLD.height + 'px';

    var player = makeEntity('player', state.player.x, state.player.y, 38);
    player.setAttribute('aria-label', 'Star');
    el.world.appendChild(player);

    WALLS.forEach(function (wall) {
      var node = makeEntity('wall', wall.x, wall.y, 10);
      node.style.width = wall.w + 'px'; node.style.height = wall.h + 'px'; el.world.appendChild(node);
    });
    FURNITURE.forEach(function (item) {
      var node = makeEntity('furniture ' + item.type, item.x, item.y, 10);
      node.style.width = item.w + 'px'; node.style.height = item.h + 'px';
      node.textContent = item.type === 'hoop' ? '' : item.label; el.world.appendChild(node);
    });
    CREW.forEach(function (crew) {
      var node = makeEntity('crew', crew.x, crew.y, 38);
      node.setAttribute('data-look', crew.look);
      var label = document.createElement('span'); label.className = 'crew-label'; label.textContent = crew.name + ' • ' + crew.role;
      node.appendChild(label); el.world.appendChild(node); crew.node = node;
    });

    function show(node) { if (!node) return; node.classList.remove('hidden'); node.classList.add('visible'); }
    function hide(node) { if (!node) return; node.classList.add('hidden'); node.classList.remove('visible'); }
    function talkedCount() { return Object.keys(state.talked).length; }
    function render() {
      el.rep.textContent = state.reputation; el.money.textContent = state.stats.money; el.energy.textContent = state.stats.energy;
      el.knowledge.textContent = state.stats.knowledge; el.relationships.textContent = state.stats.relationships;
      el.legacy.textContent = state.stats.legacy; el.progress.textContent = talkedCount() + ' / ' + CREW.length + ' connections made';
    }
    function say(crew, line) {
      el.dialogue.classList.remove('hidden');
      el.speaker.textContent = typeof crew === 'string' ? crew : crew.name + ' • ' + crew.role;
      el.dialogueText.textContent = line;
      if (typeof crew !== 'string') el.portrait.style.background = 'linear-gradient(145deg,var(--' + crew.look + '),#2b1e30)';
    }
    function collides(nx, ny) {
      var rect = { x: nx, y: ny, w: state.player.w, h: state.player.h };
      return WALLS.concat(FURNITURE).some(function (item) { return overlap(rect, item); });
    }
    function applyMove(dx, dy) {
      var nx = state.player.x + dx, ny = state.player.y + dy;
      if (!collides(nx, state.player.y)) state.player.x = Math.max(0, Math.min(WORLD.width - state.player.w, nx));
      if (!collides(state.player.x, ny)) state.player.y = Math.max(0, Math.min(WORLD.height - state.player.h, ny));
      setPos(player, state.player.x, state.player.y);
    }
    function updateCamera(immediate) {
      var tx = state.player.x - el.camera.clientWidth / 2 + 19;
      var ty = state.player.y - el.camera.clientHeight / 2 + 26;
      state.cam.x = immediate ? tx : state.cam.x + (tx - state.cam.x) * 0.08;
      state.cam.y = immediate ? ty : state.cam.y + (ty - state.cam.y) * 0.08;
      state.cam.x = Math.max(0, Math.min(Math.max(0, WORLD.width - el.camera.clientWidth), state.cam.x));
      state.cam.y = Math.max(0, Math.min(Math.max(0, WORLD.height - el.camera.clientHeight), state.cam.y));
      el.world.style.transform = 'translate(' + (-state.cam.x) + 'px,' + (-state.cam.y) + 'px)';
    }
    function moveFrame() {
      var dx = 0, dy = 0;
      if (state.keys.w) dy -= state.player.speed; if (state.keys.s) dy += state.player.speed;
      if (state.keys.a) dx -= state.player.speed; if (state.keys.d) dx += state.player.speed;
      if (dx || dy) applyMove(dx, dy);
    }
    function nudge(key) {
      var d = 10;
      if (key === 'w') applyMove(0, -d); if (key === 's') applyMove(0, d);
      if (key === 'a') applyMove(-d, 0); if (key === 'd') applyMove(d, 0); updateCamera(true);
    }
    function clearMovement() {
      state.keys.w = state.keys.a = state.keys.s = state.keys.d = false;
      $all('[data-key]').forEach(function (button) { button.classList.remove('pressed'); });
    }
    function completeMission() {
      state.missionDone = true; state.reputation += 25; state.stats.legacy += 1; state.stats.knowledge += 5;
      saveRep(state.reputation); el.mission.textContent = 'Day One complete: your circle is forming.';
      el.missionFx.classList.remove('hidden'); setTimeout(function () { el.missionFx.classList.add('hidden'); }, 1800);
      say('SYSTEM', 'You finished the night with stronger relationships, sharper vision, and your first mark on the legacy board.'); render();
    }
    function interact() {
      if (!state.running || state.paused) return;
      for (var i = 0; i < CREW.length; i += 1) {
        var crew = CREW[i];
        if (Math.abs(state.player.x - crew.x) < 62 && Math.abs(state.player.y - crew.y) < 70) {
          if (!state.talked[crew.id]) { state.talked[crew.id] = true; state.reputation += 5; state.stats.relationships += 3; state.stats.energy = Math.max(0, state.stats.energy - 2); saveRep(state.reputation); }
          say(crew, crew.line); render(); if (!state.missionDone && talkedCount() === CREW.length) completeMission(); return;
        }
      }
      say('SYSTEM', 'Nobody is close enough. Move toward a named character and press TALK.');
    }
    function resetGame() {
      state.player.x = 120; state.player.y = 820; state.talked = {}; state.missionDone = false;
      state.stats = { money: 20, energy: 85, knowledge: 10, relationships: 5, legacy: 0 };
      setPos(player, state.player.x, state.player.y); el.mission.textContent = 'Meet the crew before the day gets away.'; render(); updateCamera(true);
    }
    function setPaused(value) { state.paused = value; clearMovement(); value ? show(el.pause) : hide(el.pause); }
    function openPhone(app) {
      state.paused = true; clearMovement(); app = app || 'messages';
      var content = {
        messages: ['Messages', '<p><b>Nova:</b> Everybody is waiting downstairs. Don’t waste the night.</p><p><b>Home:</b> Handle what matters before chasing what shines.</p>'],
        missions: ['Missions', '<p><b>First Move</b><br>' + talkedCount() + '/' + CREW.length + ' crew connections made.</p><p>Reward: +25 REP, +1 Legacy, +5 Knowledge</p>'],
        jobs: ['Jobs', '<p><b>Corner Store:</b> Stock shelves after school.<br>Pay: $35 • Cost: 20 Energy</p>'],
        school: ['School', '<p>Knowledge: <b>' + state.stats.knowledge + '</b></p><p>Assignment due tomorrow: Personal Vision Statement.</p>'],
        bank: ['Bank', '<p>Available balance</p><h2>$' + state.stats.money + '.00</h2>'],
        calendar: ['Calendar', '<p><b>Today:</b> Meet crew</p><p><b>Tomorrow:</b> School • Shift • Family dinner</p>']
      };
      var chosen = content[app] || content.messages; el.phoneContent.innerHTML = '<h3>' + chosen[0] + '</h3>' + chosen[1]; show(el.phone);
    }

    $('#newGameBtn').addEventListener('click', function () { resetGame(); hide(el.start); show(el.tutorial); });
    $('#continueBtn').addEventListener('click', function () { hide(el.start); state.running = true; updateCamera(true); });
    $('#creditsBtn').addEventListener('click', function () { el.startInfo.textContent = 'Created by Tremell Horn • Built for legacy.'; });
    $('#startRunBtn').addEventListener('click', function () { hide(el.tutorial); state.running = true; updateCamera(true); });
    $('#resumeBtn').addEventListener('click', function () { setPaused(false); });
    $('#pauseCreditsBtn').addEventListener('click', function () { say('CREDITS', 'FAST LN is a living world about pressure, purpose, family, and the choices that outlive you.'); });
    el.phoneBtn.addEventListener('click', function () { openPhone('messages'); });
    el.phoneClose.addEventListener('click', function () { hide(el.phone); state.paused = false; });
    $all('[data-app]').forEach(function (button) { button.addEventListener('click', function () { openPhone(button.getAttribute('data-app')); }); });
    el.touchInteract.addEventListener('click', interact);
    el.touchPause.addEventListener('click', function () { if (state.running) setPaused(!state.paused); });

    $all('[data-key]').forEach(function (button) {
      var key = button.getAttribute('data-key');
      function begin(event) { event.preventDefault(); if (!state.running || state.paused) return; state.keys[key] = true; button.classList.add('pressed'); nudge(key); }
      function end(event) { if (event) event.preventDefault(); state.keys[key] = false; button.classList.remove('pressed'); }
      button.addEventListener('touchstart', begin, { passive: false }); button.addEventListener('touchend', end, { passive: false });
      button.addEventListener('touchcancel', end, { passive: false }); button.addEventListener('mousedown', begin);
      button.addEventListener('mouseup', end); button.addEventListener('mouseleave', end);
    });

    window.addEventListener('keydown', function (event) {
      var key = event.key.toLowerCase(); if (key === 'escape' && state.running) { setPaused(!state.paused); return; }
      if (!state.running || state.paused) return;
      if (state.keys.hasOwnProperty(key)) { event.preventDefault(); state.keys[key] = true; }
      if (key === 'e') interact(); if (key === 'p') openPhone('messages');
    });
    window.addEventListener('keyup', function (event) { var key = event.key.toLowerCase(); if (state.keys.hasOwnProperty(key)) state.keys[key] = false; });
    window.addEventListener('blur', clearMovement);

    function tick() { if (state.running && !state.paused) { moveFrame(); updateCamera(false); } requestAnimationFrame(tick); }
    render(); show(el.start); requestAnimationFrame(tick);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
}());
