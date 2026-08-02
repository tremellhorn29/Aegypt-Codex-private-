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
    {
      id: 'nova', name: 'Nova', role: 'Producer', look: 'violet', x: 520, y: 560,
      intro: 'The beat is ready. I can send it tonight, but the sample is risky. What kind of name are we building?',
      choices: [
        { text: 'Clear the sample first.', result: 'Nova nods. Slow money, clean foundation.', effects: { knowledge: 2, legacy: 1, energy: -2 }, flag: 'cleanRelease' },
        { text: 'Drop it now. Momentum matters.', result: 'Nova uploads the teaser. The block hears it immediately.', effects: { reputation: 6, relationships: 1, energy: -4 }, flag: 'fastRelease' }
      ]
    },
    {
      id: 'rex', name: 'Rex', role: 'Strategist', look: 'gold', x: 760, y: 455,
      intro: 'Kai says the older crew wants a cut for using the courtyard. We can pay, negotiate, or ignore them.',
      choices: [
        { text: 'Negotiate face to face.', result: 'Rex respects the move. Respect rises, but so does attention.', effects: { reputation: 3, relationships: 3, energy: -3 }, flag: 'negotiator' },
        { text: 'Keep the operation quiet.', result: 'You choose control over applause. Rex marks a safer route.', effects: { knowledge: 3, legacy: 1 }, flag: 'quietBuilder' }
      ]
    },
    {
      id: 'mina', name: 'Mina', role: 'Artist', look: 'rose', x: 865, y: 730,
      intro: 'The cover can show the real block, or make us look richer than we are. Which truth sells?',
      choices: [
        { text: 'Show the block honestly.', result: 'Mina keeps the cracks, porch lights, and family windows. It feels lived-in.', effects: { relationships: 4, legacy: 1 }, flag: 'authenticCover' },
        { text: 'Make the dream look expensive.', result: 'The cover shines. People start asking who funded the image.', effects: { reputation: 5, money: -5 }, flag: 'luxuryCover' }
      ]
    },
    {
      id: 'kai', name: 'Kai', role: 'Connector', look: 'cyan', x: 1125, y: 520,
      intro: 'A promoter wants us tonight, but your family expects you home. I can only hold one door open.',
      choices: [
        { text: 'Handle family first.', result: 'Kai loses the slot but remembers your priorities.', effects: { relationships: 5, legacy: 1, reputation: -2 }, flag: 'familyFirst' },
        { text: 'Take the promoter meeting.', result: 'The meeting creates heat and a possible paid opening.', effects: { reputation: 5, money: 10, energy: -6 }, flag: 'industryDoor' }
      ]
    },
    {
      id: 'jett', name: 'Jett', role: 'Tech', look: 'green', x: 1350, y: 700,
      intro: 'Your phone is the command center. I found a school portal alert and a job lead at the same time.',
      choices: [
        { text: 'Finish the school submission.', result: 'Jett helps upload the assignment before midnight.', effects: { knowledge: 6, energy: -4 }, flag: 'schoolHandled' },
        { text: 'Apply for the paid shift.', result: 'The application goes through. No promise, but your name is in the room.', effects: { money: 5, reputation: 2, energy: -3 }, flag: 'jobApplied' }
      ]
    }
  ];

  function $(selector) { return document.querySelector(selector); }
  function $all(selector) { return Array.prototype.slice.call(document.querySelectorAll(selector)); }
  function makeEntity(className, x, y, size) {
    var node = document.createElement('div');
    node.className = 'pixel ' + className;
    node.style.width = (size || 32) + 'px'; node.style.height = (size || 32) + 'px';
    setPos(node, x, y); return node;
  }
  function setPos(node, x, y) { node.style.left = x + 'px'; node.style.top = y + 'px'; }
  function overlap(a, b) { return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y; }
  function safeLoad() { try { return JSON.parse(localStorage.getItem('fastln_save_v2') || 'null'); } catch (_) { return null; } }
  function safeSave(data) { try { localStorage.setItem('fastln_save_v2', JSON.stringify(data)); } catch (_) {} }
  function clamp(value, min, max) { return Math.max(min, Math.min(max, value)); }

  function injectInterface() {
    var style = document.createElement('style');
    style.textContent = [
      '.choice-panel{position:absolute;left:4%;right:4%;bottom:150px;z-index:70;background:rgba(5,7,13,.97);border:3px solid #8d4cff;padding:14px;box-shadow:8px 8px 0 #000}',
      '.choice-panel.hidden{display:none!important}.choice-panel h3{margin:0 0 10px;color:#ffd166;font-size:1rem}.choice-list{display:grid;gap:9px}',
      '.choice-btn{background:#171b25;color:#fff;border:2px solid #596177;padding:12px;text-align:left;font:700 .92rem system-ui;min-height:48px}.choice-btn.selected,.choice-btn:focus{border-color:#4de28a;background:#10251b;outline:none}',
      '.consequence-toast{position:absolute;top:16px;left:50%;transform:translateX(-50%);z-index:90;width:min(92%,620px);background:#0a0c12;border:2px solid #ffd166;color:#fff;padding:12px 16px;text-align:center;font:700 .9rem system-ui;box-shadow:6px 6px 0 #000}.consequence-toast.hidden{display:none}',
      '.back-btn{border-color:#ff5f73!important;color:#ff8190!important}.controller-status{position:absolute;right:12px;top:12px;z-index:30;background:rgba(0,0,0,.75);color:#a9ffcc;padding:6px 9px;border:1px solid #4de28a;font:700 .65rem system-ui}',
      '@media(max-width:760px){.choice-panel{bottom:142px;padding:10px}.choice-btn{font-size:.82rem;padding:10px}.action-pad{display:grid!important;grid-template-columns:1fr 1fr;gap:8px}.action-pad .action-btn{min-width:0!important;width:100%!important}.controller-status{top:6px;right:6px}}'
    ].join('');
    document.head.appendChild(style);

    var actionPad = $('.action-pad');
    if (actionPad && !$('#touchBack')) {
      var back = document.createElement('button');
      back.id = 'touchBack'; back.type = 'button'; back.className = 'touch-btn action-btn back-btn';
      back.setAttribute('aria-label', 'Back or cancel'); back.textContent = 'B'; actionPad.appendChild(back);
      var a = $('#touchInteract'); if (a) a.textContent = 'A';
    }

    var wrap = $('.game-wrap');
    if (wrap && !$('#choicePanel')) {
      var panel = document.createElement('section');
      panel.id = 'choicePanel'; panel.className = 'choice-panel hidden';
      panel.innerHTML = '<h3 id="choicePrompt">CHOOSE YOUR MOVE</h3><div id="choiceList" class="choice-list"></div>';
      wrap.appendChild(panel);
      var toast = document.createElement('div'); toast.id = 'consequenceToast'; toast.className = 'consequence-toast hidden'; wrap.appendChild(toast);
      var status = document.createElement('div'); status.id = 'controllerStatus'; status.className = 'controller-status'; status.textContent = 'CONTROLLER: SEARCHING'; wrap.appendChild(status);
    }
  }

  function boot() {
    injectInterface();
    var el = {
      world: $('#world'), camera: $('#camera'), mission: $('#missionText'), progress: $('#objectiveProgress'),
      rep: $('#repValue'), money: $('#moneyValue'), energy: $('#energyValue'), knowledge: $('#knowledgeValue'),
      relationships: $('#relationshipValue'), legacy: $('#legacyValue'), dialogue: $('#dialogue'), speaker: $('#speaker'), dialogueText: $('#dialogueText'),
      portrait: $('#portrait'), missionFx: $('#missionFx'), start: $('#startScreen'), tutorial: $('#tutorialOverlay'), pause: $('#pauseOverlay'),
      startInfo: $('#startInfo'), touchInteract: $('#touchInteract'), touchBack: $('#touchBack'), touchPause: $('#touchPause'), phoneBtn: $('#phoneBtn'),
      phone: $('#phoneOverlay'), phoneClose: $('#phoneClose'), phoneContent: $('#phoneContent'), choicePanel: $('#choicePanel'), choiceList: $('#choiceList'),
      choicePrompt: $('#choicePrompt'), consequence: $('#consequenceToast'), controllerStatus: $('#controllerStatus')
    };
    if (!el.world || !el.camera || !el.start) return;

    var saved = safeLoad();
    var state = {
      player: { x: 120, y: 820, w: 38, h: 52, speed: 3.2 }, cam: { x: 0, y: 0 },
      keys: { w: false, a: false, s: false, d: false }, talked: {}, decisions: {}, missionStage: 0,
      running: false, paused: false, dialogueOpen: false, choiceOpen: false, activeCrew: null, selectedChoice: 0,
      reputation: saved && saved.reputation || 0,
      stats: saved && saved.stats || { money: 20, energy: 85, knowledge: 10, relationships: 5, legacy: 0 },
      gamepad: { index: null, prevButtons: {}, connected: false }
    };

    el.world.style.width = WORLD.width + 'px'; el.world.style.height = WORLD.height + 'px';
    var player = makeEntity('player', state.player.x, state.player.y, 38); player.setAttribute('aria-label', 'Star'); el.world.appendChild(player);
    WALLS.forEach(function (wall) { var n = makeEntity('wall', wall.x, wall.y, 10); n.style.width = wall.w + 'px'; n.style.height = wall.h + 'px'; el.world.appendChild(n); });
    FURNITURE.forEach(function (item) { var n = makeEntity('furniture ' + item.type, item.x, item.y, 10); n.style.width = item.w + 'px'; n.style.height = item.h + 'px'; n.textContent = item.type === 'hoop' ? '' : item.label; el.world.appendChild(n); });
    CREW.forEach(function (crew) { var n = makeEntity('crew', crew.x, crew.y, 38); n.setAttribute('data-look', crew.look); var label = document.createElement('span'); label.className = 'crew-label'; label.textContent = crew.name + ' • ' + crew.role; n.appendChild(label); el.world.appendChild(n); crew.node = n; });

    function show(node) { if (!node) return; node.classList.remove('hidden'); node.classList.add('visible'); }
    function hide(node) { if (!node) return; node.classList.add('hidden'); node.classList.remove('visible'); }
    function talkedCount() { return Object.keys(state.talked).length; }
    function persist() { safeSave({ reputation: state.reputation, stats: state.stats, decisions: state.decisions }); }
    function render() {
      el.rep.textContent = state.reputation; el.money.textContent = state.stats.money; el.energy.textContent = state.stats.energy;
      el.knowledge.textContent = state.stats.knowledge; el.relationships.textContent = state.stats.relationships; el.legacy.textContent = state.stats.legacy;
      if (state.missionStage === 0) el.progress.textContent = talkedCount() + ' / ' + CREW.length + ' connections made';
      else el.progress.textContent = Object.keys(state.decisions).length + ' choices now shaping your story';
    }
    function toast(text) { el.consequence.textContent = text; show(el.consequence); clearTimeout(toast.timer); toast.timer = setTimeout(function () { hide(el.consequence); }, 2600); }
    function say(crew, line) {
      state.dialogueOpen = true; el.dialogue.classList.remove('hidden');
      el.speaker.textContent = typeof crew === 'string' ? crew : crew.name + ' • ' + crew.role; el.dialogueText.textContent = line;
      if (typeof crew !== 'string') el.portrait.style.background = 'linear-gradient(145deg,var(--' + crew.look + '),#2b1e30)';
    }
    function closeDialogue() { state.dialogueOpen = false; state.activeCrew = null; el.dialogue.classList.add('hidden'); }
    function closeTopLayer() {
      if (!el.phone.classList.contains('hidden')) { hide(el.phone); state.paused = false; return true; }
      if (state.choiceOpen) { closeChoices(); return true; }
      if (state.dialogueOpen) { closeDialogue(); return true; }
      if (!el.pause.classList.contains('hidden')) { setPaused(false); return true; }
      return false;
    }
    function collides(nx, ny) { var r = { x: nx, y: ny, w: state.player.w, h: state.player.h }; return WALLS.concat(FURNITURE).some(function (o) { return overlap(r, o); }); }
    function applyMove(dx, dy) {
      var nx = state.player.x + dx, ny = state.player.y + dy;
      if (!collides(nx, state.player.y)) state.player.x = clamp(nx, 0, WORLD.width - state.player.w);
      if (!collides(state.player.x, ny)) state.player.y = clamp(ny, 0, WORLD.height - state.player.h);
      setPos(player, state.player.x, state.player.y);
    }
    function updateCamera(immediate) {
      var tx = state.player.x - el.camera.clientWidth / 2 + 19, ty = state.player.y - el.camera.clientHeight / 2 + 26;
      state.cam.x = immediate ? tx : state.cam.x + (tx - state.cam.x) * .08; state.cam.y = immediate ? ty : state.cam.y + (ty - state.cam.y) * .08;
      state.cam.x = clamp(state.cam.x, 0, Math.max(0, WORLD.width - el.camera.clientWidth)); state.cam.y = clamp(state.cam.y, 0, Math.max(0, WORLD.height - el.camera.clientHeight));
      el.world.style.transform = 'translate(' + (-state.cam.x) + 'px,' + (-state.cam.y) + 'px)';
    }
    function movementVector() {
      var dx = (state.keys.d ? 1 : 0) - (state.keys.a ? 1 : 0), dy = (state.keys.s ? 1 : 0) - (state.keys.w ? 1 : 0);
      if (dx && dy) { dx *= Math.SQRT1_2; dy *= Math.SQRT1_2; }
      return { x: dx * state.player.speed, y: dy * state.player.speed };
    }
    function clearMovement() { state.keys.w = state.keys.a = state.keys.s = state.keys.d = false; $all('[data-key]').forEach(function (b) { b.classList.remove('pressed'); }); }

    function applyEffects(effects) {
      Object.keys(effects || {}).forEach(function (key) {
        if (key === 'reputation') state.reputation = Math.max(0, state.reputation + effects[key]);
        else if (state.stats.hasOwnProperty(key)) state.stats[key] = Math.max(0, state.stats[key] + effects[key]);
      });
      persist(); render();
    }
    function openChoices(crew) {
      state.choiceOpen = true; state.activeCrew = crew; state.selectedChoice = 0; state.paused = true;
      el.choicePrompt.textContent = crew.name.toUpperCase() + ' — THIS CHOICE WILL BE REMEMBERED'; el.choiceList.innerHTML = '';
      crew.choices.forEach(function (choice, index) {
        var btn = document.createElement('button'); btn.type = 'button'; btn.className = 'choice-btn' + (index === 0 ? ' selected' : ''); btn.textContent = choice.text;
        btn.addEventListener('click', function () { choose(index); }); el.choiceList.appendChild(btn);
      });
      show(el.choicePanel);
    }
    function closeChoices() { state.choiceOpen = false; state.paused = false; hide(el.choicePanel); }
    function moveChoice(delta) {
      if (!state.choiceOpen) return; var buttons = $all('.choice-btn'); if (!buttons.length) return;
      state.selectedChoice = (state.selectedChoice + delta + buttons.length) % buttons.length;
      buttons.forEach(function (b, i) { b.classList.toggle('selected', i === state.selectedChoice); });
    }
    function choose(index) {
      if (!state.choiceOpen || !state.activeCrew) return;
      var crew = state.activeCrew, choice = crew.choices[index]; state.decisions[crew.id] = choice.flag; applyEffects(choice.effects);
      closeChoices(); say(crew, choice.result); toast('YOUR CHOICE: ' + choice.text + ' — THIS WILL BE REMEMBERED');
      if (!state.talked[crew.id]) { state.talked[crew.id] = true; state.reputation += 3; state.stats.relationships += 2; }
      render(); persist();
      if (talkedCount() === CREW.length && state.missionStage === 0) advanceStory();
    }
    function interact() {
      if (!state.running || state.paused) return;
      if (state.dialogueOpen) { closeDialogue(); return; }
      for (var i = 0; i < CREW.length; i += 1) {
        var crew = CREW[i];
        if (Math.abs(state.player.x - crew.x) < 72 && Math.abs(state.player.y - crew.y) < 82) {
          if (state.decisions[crew.id]) { say(crew, 'You already chose your lane with me. Now live with what that choice opens—and closes.'); return; }
          say(crew, crew.intro); setTimeout(function (c) { return function () { if (state.dialogueOpen) openChoices(c); }; }(crew), 500); return;
        }
      }
      say('SYSTEM', 'Nobody is close enough. Move toward a named character and press A.');
    }
    function advanceStory() {
      state.missionStage = 1; state.reputation += 15; state.stats.legacy += 1; state.stats.knowledge += 2;
      el.mission.textContent = 'The Night Splits: return to the Family Couch and decide what comes first.';
      toast('EPISODE CONTINUES — RETURN HOME'); persist(); render();
    }
    function checkStoryTrigger() {
      if (state.missionStage !== 1 || state.dialogueOpen || state.choiceOpen) return;
      if (state.player.x < 350 && state.player.y > 620) {
        state.missionStage = 2; state.paused = true;
        say('HOME', 'The crew is moving, but morning is coming. You can stay up building the release, or sleep and protect tomorrow.');
        state.activeCrew = {
          id: 'finale', name: 'Home', choices: [
            { text: 'Stay up and finish the release.', result: 'The song leaves the apartment before sunrise. Tomorrow will demand payment in energy.', effects: { reputation: 10, legacy: 1, energy: -18 }, flag: 'nightGrind' },
            { text: 'Sleep. Protect tomorrow.', result: 'You shut the laptop. Discipline becomes its own kind of ambition.', effects: { energy: 15, knowledge: 2, legacy: 2 }, flag: 'protectedTomorrow' }
          ]
        };
        setTimeout(function () { openChoices(state.activeCrew); }, 450);
      }
    }
    function finishFinaleIfNeeded() {
      if (state.missionStage === 2 && state.decisions.finale) {
        state.missionStage = 3; el.mission.textContent = 'Episode 1 complete: the first move became a direction.';
        el.progress.textContent = 'Your decisions are saved for the next episode';
        el.missionFx.textContent = 'EPISODE COMPLETE • CONSEQUENCES SAVED'; el.missionFx.classList.remove('hidden');
        setTimeout(function () { el.missionFx.classList.add('hidden'); }, 2200); persist();
      }
    }

    function setPaused(value) { state.paused = value; clearMovement(); value ? show(el.pause) : hide(el.pause); }
    function openPhone(app) {
      state.paused = true; clearMovement(); app = app || 'messages';
      var decisionList = Object.keys(state.decisions).map(function (k) { return '<p><b>' + k.toUpperCase() + ':</b> ' + state.decisions[k] + '</p>'; }).join('') || '<p>No major choices recorded yet.</p>';
      var content = {
        messages: ['Messages', '<p><b>Nova:</b> Everybody is waiting downstairs.</p><p><b>Home:</b> Handle what matters before chasing what shines.</p>'],
        missions: ['Missions', '<p><b>Current:</b> ' + el.mission.textContent + '</p><p><b>Consequences:</b></p>' + decisionList],
        jobs: ['Jobs', '<p><b>Corner Store:</b> Stock shelves after school.<br>Pay: $35 • Cost: 20 Energy</p><p><b>Promoter:</b> Possible opening—depends on earlier choices.</p>'],
        school: ['School', '<p>Knowledge: <b>' + state.stats.knowledge + '</b></p><p>Assignment: Personal Vision Statement.</p>'],
        bank: ['Bank', '<p>Available balance</p><h2>$' + state.stats.money + '.00</h2><p>No shortcuts. Every dollar needs a purpose.</p>'],
        calendar: ['Calendar', '<p><b>Tonight:</b> Crew decisions</p><p><b>Tomorrow:</b> School • Shift • Family</p>']
      };
      var chosen = content[app] || content.messages; el.phoneContent.innerHTML = '<h3>' + chosen[0] + '</h3>' + chosen[1]; show(el.phone);
    }
    function resetGame() {
      state.player.x = 120; state.player.y = 820; state.talked = {}; state.decisions = {}; state.missionStage = 0;
      state.reputation = 0; state.stats = { money: 20, energy: 85, knowledge: 10, relationships: 5, legacy: 0 };
      state.dialogueOpen = false; state.choiceOpen = false; closeDialogue(); hide(el.choicePanel); setPos(player, state.player.x, state.player.y);
      el.mission.textContent = 'Meet the crew before the day gets away.'; render(); updateCamera(true); persist();
    }

    function primaryAction() {
      if (state.choiceOpen) choose(state.selectedChoice);
      else if (!el.pause.classList.contains('hidden')) setPaused(false);
      else interact();
    }
    function backAction() { if (!closeTopLayer() && state.running) setPaused(true); }

    $('#newGameBtn').addEventListener('click', function () { resetGame(); hide(el.start); show(el.tutorial); });
    $('#continueBtn').addEventListener('click', function () { hide(el.start); state.running = true; updateCamera(true); });
    $('#creditsBtn').addEventListener('click', function () { el.startInfo.textContent = 'Created by Tremell Horn • Built for legacy.'; });
    $('#startRunBtn').addEventListener('click', function () { hide(el.tutorial); state.running = true; updateCamera(true); });
    $('#resumeBtn').addEventListener('click', function () { setPaused(false); });
    $('#pauseCreditsBtn').addEventListener('click', function () { hide(el.pause); state.paused = false; say('CREDITS', 'FAST LN is a living world about pressure, purpose, family, and the choices that outlive you.'); });
    el.phoneBtn.addEventListener('click', function () { openPhone('messages'); }); el.phoneClose.addEventListener('click', backAction);
    $all('[data-app]').forEach(function (button) { button.addEventListener('click', function () { openPhone(button.getAttribute('data-app')); }); });
    el.touchInteract.addEventListener('click', primaryAction); el.touchBack.addEventListener('click', backAction);
    el.touchPause.addEventListener('click', function () { if (state.running) setPaused(!state.paused); });

    $all('[data-key]').forEach(function (button) {
      var key = button.getAttribute('data-key');
      function begin(event) { event.preventDefault(); if (!state.running || state.paused || state.dialogueOpen || state.choiceOpen) return; state.keys[key] = true; button.classList.add('pressed'); }
      function end(event) { if (event) event.preventDefault(); state.keys[key] = false; button.classList.remove('pressed'); }
      button.addEventListener('touchstart', begin, { passive: false }); button.addEventListener('touchend', end, { passive: false }); button.addEventListener('touchcancel', end, { passive: false });
      button.addEventListener('mousedown', begin); button.addEventListener('mouseup', end); button.addEventListener('mouseleave', end);
    });

    window.addEventListener('keydown', function (event) {
      var key = event.key.toLowerCase();
      if (key === 'escape' || key === 'backspace' || key === 'q') { event.preventDefault(); backAction(); return; }
      if (state.choiceOpen && (key === 'arrowup' || key === 'w')) { event.preventDefault(); moveChoice(-1); return; }
      if (state.choiceOpen && (key === 'arrowdown' || key === 's')) { event.preventDefault(); moveChoice(1); return; }
      if (key === 'e' || key === 'enter' || key === ' ') { event.preventDefault(); primaryAction(); return; }
      if (key === 'p') { openPhone('messages'); return; }
      if (!state.running || state.paused || state.dialogueOpen || state.choiceOpen) return;
      if (state.keys.hasOwnProperty(key)) { event.preventDefault(); state.keys[key] = true; }
    });
    window.addEventListener('keyup', function (event) { var key = event.key.toLowerCase(); if (state.keys.hasOwnProperty(key)) state.keys[key] = false; });
    window.addEventListener('blur', clearMovement); document.addEventListener('visibilitychange', function () { if (document.hidden) clearMovement(); });

    function buttonPressed(gp, index) { return !!(gp.buttons[index] && gp.buttons[index].pressed); }
    function edgeButton(gp, index, name, callback) {
      var now = buttonPressed(gp, index), before = !!state.gamepad.prevButtons[name];
      if (now && !before) callback(); state.gamepad.prevButtons[name] = now;
    }
    function pollGamepad() {
      var pads = navigator.getGamepads ? navigator.getGamepads() : [];
      var gp = state.gamepad.index !== null ? pads[state.gamepad.index] : null;
      if (!gp) {
        for (var i = 0; i < pads.length; i += 1) if (pads[i]) { gp = pads[i]; state.gamepad.index = i; break; }
      }
      if (!gp) { el.controllerStatus.textContent = 'CONTROLLER: TOUCH / KEYBOARD'; return { x: 0, y: 0 }; }
      if (!state.gamepad.connected) { state.gamepad.connected = true; toast('DUALSENSE CONNECTED'); }
      el.controllerStatus.textContent = 'CONTROLLER: ' + (gp.id.toLowerCase().indexOf('dualsense') >= 0 || gp.id.toLowerCase().indexOf('wireless controller') >= 0 ? 'DUALSENSE 5' : 'GAMEPAD');
      edgeButton(gp, 0, 'a', primaryAction); edgeButton(gp, 1, 'b', backAction); edgeButton(gp, 9, 'pause', function () { if (state.running) setPaused(!state.paused); });
      edgeButton(gp, 12, 'up', function () { if (state.choiceOpen) moveChoice(-1); }); edgeButton(gp, 13, 'down', function () { if (state.choiceOpen) moveChoice(1); });
      var x = Math.abs(gp.axes[0] || 0) > .18 ? gp.axes[0] : 0, y = Math.abs(gp.axes[1] || 0) > .18 ? gp.axes[1] : 0;
      if (buttonPressed(gp, 14)) x = -1; if (buttonPressed(gp, 15)) x = 1; if (buttonPressed(gp, 12)) y = -1; if (buttonPressed(gp, 13)) y = 1;
      return { x: x, y: y };
    }
    window.addEventListener('gamepadconnected', function (event) { state.gamepad.index = event.gamepad.index; state.gamepad.connected = true; toast('CONTROLLER CONNECTED — X = A, CIRCLE = B, OPTIONS = PAUSE'); });
    window.addEventListener('gamepaddisconnected', function () { state.gamepad.index = null; state.gamepad.connected = false; state.gamepad.prevButtons = {}; });

    function tick() {
      var stick = pollGamepad();
      if (state.running && !state.paused && !state.dialogueOpen && !state.choiceOpen) {
        var v = movementVector(), dx = v.x, dy = v.y;
        if (stick.x || stick.y) {
          var mag = Math.sqrt(stick.x * stick.x + stick.y * stick.y) || 1;
          dx = stick.x / Math.max(1, mag) * state.player.speed; dy = stick.y / Math.max(1, mag) * state.player.speed;
        }
        if (dx || dy) applyMove(dx, dy); updateCamera(false); checkStoryTrigger();
      }
      finishFinaleIfNeeded(); requestAnimationFrame(tick);
    }

    render(); show(el.start); requestAnimationFrame(tick);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot); else boot();
}());
