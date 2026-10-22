/* FAST LN: Street Kings. No framework, build step, account, or external assets required. */
(() => {
  "use strict";
  const core = window.FightCore;
  if (!core) throw new Error("Combat engine did not load");
  if (!window.FASTLNGamepad) throw new Error("Gamepad reader did not load");
  const padReader = window.FASTLNGamepad.createReader();
  let padState = { connected: false, move: 0, guard: false };
  let controllerLabel = "";
  const $ = id => document.getElementById(id);
  const cv = $("arena"), ctx = cv.getContext("2d");
  const C = core.RIVALS;
  const SAVE_KEY = "fastln_street_kings_v1";
  const cl = (x, a, b) => Math.max(a, Math.min(b, x));
  const stat = { wins: 0, losses: 0, cash: 0, unlocked: 0 };
  try {
    const saved = JSON.parse(localStorage.getItem(SAVE_KEY) || "null");
    if (saved && typeof saved === "object") {
      for (const key of ["wins", "losses", "cash", "unlocked"]) {
        if (Number.isSafeInteger(saved[key]) && saved[key] >= 0) stat[key] = saved[key];
      }
      stat.unlocked = cl(stat.unlocked, 0, C.length - 1);
    }
  } catch (_) { /* Private browsing may block storage; gameplay still works. */ }
  let chosen = stat.unlocked;
  let game = core.createMatch(chosen);
  let paused = false, soundOn = true, accumulator = 0, last = 0;
  let tickTime = 0, cameraShake = 0, announcer = 0, particles = [];
  let impactFreeze = 0, comboVisible = 0;
  let pending = null, pendingDodge = false, input = { left: false, right: false, guard: false };
  let audioContext = null, settleToken = 0;
  const $all = selector => Array.from(document.querySelectorAll(selector));
  function save() { try { localStorage.setItem(SAVE_KEY, JSON.stringify(stat)); } catch (_) {} }
  function updateCareer() {
    $("menuWins").textContent = stat.wins;
    $("menuLosses").textContent = stat.losses;
    $("menuCash").textContent = "$" + stat.cash;
    $("recordLabel").textContent = "CAREER " + stat.wins + "W / " + stat.losses + "L";
    $("rivalList").innerHTML = "";
    C.forEach((r, i) => {
      const unlocked = i <= stat.unlocked, b = document.createElement("button");
      b.type = "button";
      b.className = "rival-card" + (chosen === i ? " chosen" : "");
      b.disabled = !unlocked;
      b.setAttribute("aria-pressed", String(chosen === i));
      b.innerHTML = "<span><strong></strong><small></small></span><span class='state'></span>";
      b.querySelector("strong").textContent = r.name;
      b.querySelector("small").textContent = r.title;
      b.querySelector(".state").textContent = unlocked ? (i === chosen ? "SELECTED ✓" : "$" + r.payout + " / WIN") : "🔒 LOCKED";
      b.addEventListener("click", () => { chosen = i; updateCareer(); sound("select"); });
      $("rivalList").appendChild(b);
    });
  }
  function openMenu() {
    settleToken++;
    game.phase = "ready";
    paused = false;
    resetInput();
    $("resultOverlay").classList.add("hidden");
    $("pauseOverlay").classList.add("hidden");
    $("menuOverlay").classList.remove("hidden");
    updateCareer();
    updateHud();
  }
  function resetInput() {
    input.left = input.right = input.guard = false;
    pending = null; pendingDodge = false;
    $all("[data-hold]").forEach(b => b.classList.remove("is-held"));
  }
  function startMatch() {
    game = core.createMatch(chosen);
    resetInput();
    paused = false;
    particles = []; cameraShake = 0; impactFreeze = 0; comboVisible = 0;
    $("comboCallout").classList.remove("visible");
    $("menuOverlay").classList.add("hidden");
    $("resultOverlay").classList.add("hidden");
    $("pauseOverlay").classList.add("hidden");
    core.startRound(game);
    $("arenaStatus").textContent = "FIGHT IN PROGRESS";
    announce("ROUND 1 · FIGHT!");
    sound("round");
    updateHud();
  }
  function announce(message) {
    const el = $("fightAnnouncement");
    el.textContent = message;
    el.classList.remove("show");
    void el.offsetWidth;
    el.classList.add("show");
    announcer = 1.05;
  }
  function finishMatch() {
    if (game.phase !== "matchOver") return;
    const victory = game.score[0] > game.score[1];
    if (victory) {
      stat.wins++;
      stat.cash += C[game.rivalIndex].payout;
      stat.unlocked = Math.max(stat.unlocked, Math.min(C.length - 1, game.rivalIndex + 1));
      chosen = stat.unlocked;
    } else {
      stat.losses++;
      chosen = game.rivalIndex;
    }
    save();
    updateCareer();
  }
  function presentResult() {
    if (game.phase !== "matchOver" && game.phase !== "roundOver") return;
    const finished = game.phase === "matchOver";
    const tie = game.winner === -1;
    const playerWon = game.winner === 0;
    const matchWon = game.score[0] > game.score[1];
    $("resultKicker").textContent = finished ? "FIGHT CARD COMPLETE" : ("ROUND " + game.round + " COMPLETE");
    $("resultHeading").textContent = finished ? (matchWon ? "VICTORY." : "DEFEAT.") : tie ? "DRAW." : (playerWon ? "ROUND WON." : "ROUND LOST.");
    $("resultHeading").style.color = (finished ? matchWon : playerWon) ? "#f5c867" : "#ff8277";
    $("resultDetails").textContent = finished ? (matchWon ? "Respect earned. +$" + C[game.rivalIndex].payout + " paid to your career. The next challenge awaits." : "The block is unforgiving. Study the patterns, then run it back.") : tie ? "Dead even. This round will be replayed." : (playerWon ? "Keep the pressure on. One more round could seal it." : "Recover, manage stamina, and look for the counter.");
    $("resultPlayerWins").textContent = game.score[0];
    $("resultEnemyWins").textContent = game.score[1];
    $("resultEnemyName").textContent = C[game.rivalIndex].name;
    $("resultBtn").textContent = finished ? (matchWon ? "CHOOSE NEXT CHALLENGER →" : "RUN IT BACK →") : "NEXT ROUND →";
    $("resultOverlay").classList.remove("hidden");
  }
  function endEvents(events) {
    for (const e of events) {
      if (e.type === "hit" || e.type === "block") {
        impactFreeze = Math.max(impactFreeze, e.type === "block" ? .018 : (e.kind === "special" ? .085 : .042));
        if (e.type === "hit" && e.who === 0 && e.combo >= 2) {
          const callout = $("comboCallout");
          callout.textContent = e.combo + " HIT COMBO";
          callout.classList.add("visible");
          comboVisible = .95;
        }
        const f = game.fighters[e.target];
        const x = f.x, y = 296 - (e.kind === "kick" ? 18 : 48);
        burst(x, y, e.type === "block" ? "#a7d8ff" : "#ffe0a2", e.type === "block" ? 7 : 15);
        cameraShake = e.type === "block" ? 3 : (e.kind === "special" ? 14 : 6);
        sound(e.type === "block" ? "block" : "hit");
      }
      if (e.type === "guardBreak") { announce("GUARD BROKEN!"); sound("hit"); }
      if (e.type === "dodge") sound("dodge");
      if (e.type === "end") {
        announce(e.winner === -1 ? "DRAW!" : (e.winner === 0 ? "ROUND TO STAR!" : "ROUND TO " + C[game.rivalIndex].name + "!"));
        if (e.matchOver) finishMatch();
        $("arenaStatus").textContent = e.matchOver ? "MATCH COMPLETE" : "ROUND COMPLETE";
        sound(e.winner === 0 ? "victory" : "round");
        const token = ++settleToken;
        setTimeout(() => { if (token === settleToken) presentResult(); }, 1000);
      }
    }
  }
  function updateHud() {
    const a = game.fighters[0], b = game.fighters[1];
    $("playerHealth").style.width = a.health + "%";
    $("enemyHealth").style.width = b.health + "%";
    $("playerStamina").style.width = a.stamina + "%";
    $("enemyStamina").style.width = b.stamina + "%";
    $("playerPower").style.width = a.meter + "%";
    $("enemyPower").style.width = b.meter + "%";
    $("playerHpLabel").textContent = Math.ceil(a.health);
    $("enemyHpLabel").textContent = Math.ceil(b.health);
    $("playerPowerLabel").textContent = Math.floor(a.meter) + "%";
    $("enemyPowerLabel").textContent = Math.floor(b.meter) + "%";
    $("playerWins").textContent = "◆ ".repeat(game.score[0]) + "◇ ".repeat(2 - game.score[0]);
    $("enemyWins").textContent = "◆ ".repeat(game.score[1]) + "◇ ".repeat(2 - game.score[1]);
    $("roundLabel").textContent = "ROUND " + game.round;
    $("timer").textContent = String(Math.ceil(game.time));
    $("enemyName").textContent = C[game.rivalIndex].name;
    $("enemyTitle").textContent = C[game.rivalIndex].title;
    $("specialBtn").disabled = a.meter < 65 || game.phase !== "fighting" || paused;
  }
  function moveCommand() {
    const manual = (input.right ? 1 : 0) - (input.left ? 1 : 0);
    return cl(manual || padState.move || 0, -1, 1);
  }
  function readController() {
    // Browsers, including iOS Safari, may hide paired pads until their first button press.
    let pads = [];
    try {
      if (typeof navigator !== "undefined" && typeof navigator.getGamepads === "function") {
        pads = navigator.getGamepads() || [];
      }
    } catch (_) { /* Touch/keyboard still work if Gamepad API is blocked. */ }
    const next = padReader.poll(pads);
    if (next.newConnection || next.disconnected) {
      const status = $("controllerStatus");
      status.textContent = next.connected ? "🎮 DS4 / PAD CONNECTED" : "🎮 DISCONNECTED · TOUCH READY";
      status.title = next.connected ? next.name : "Controller disconnected; reconnect or use touch";
      $("controllerGuide").textContent = next.connected
        ? "Controller ready! Left stick or D-pad to move · ✕ jab · □ hook · △ kick · ◯ dodge · L1/L2 guard · R1/R2 finisher · OPTIONS pause."
        : "Controller lost connection. Press a controller button to reconnect, or continue with touch controls.";
      if (next.disconnected && game.phase === "fighting" && !paused) setPaused(true);
    }
    padState = next;
    if (!next.connected) return;
    const pressed = new Set(next.edges);
    if (pressed.has("options")) {
      if (game.phase === "fighting") setPaused(!paused);
      else if (!$("pauseOverlay").classList.contains("hidden")) setPaused(false);
      return;
    }
    if (!$("menuOverlay").classList.contains("hidden")) {
      const direction = (pressed.has("down") || pressed.has("right") ? 1 : 0)
        - (pressed.has("up") || pressed.has("left") ? 1 : 0);
      if (direction) { chosen = cl(chosen + direction, 0, stat.unlocked); updateCareer(); sound("select"); }
      if (pressed.has("cross")) startMatch();
      return;
    }
    if (!$("resultOverlay").classList.contains("hidden")) {
      if (pressed.has("cross")) $("resultBtn").click();
      else if (pressed.has("circle")) $("exitBtn").click();
      return;
    }
    if (!$("pauseOverlay").classList.contains("hidden")) {
      if (pressed.has("cross")) setPaused(false);
      else if (pressed.has("circle")) openMenu();
      return;
    }
    if (game.phase !== "fighting" || paused) return;
    if (pressed.has("cross")) setAction("jab");
    if (pressed.has("square")) setAction("hook");
    if (pressed.has("triangle")) setAction("kick");
    if (pressed.has("circle")) setAction("dodge");
    if (pressed.has("r1") || pressed.has("r2")) setAction("special");
  }
  function setAction(action) {
    if (game.phase !== "fighting" || paused) return;
    if (action === "dodge") pendingDodge = true;
    else pending = { name: action, ttl: .15 };
  }
  const moves = { a:"left", arrowleft:"left", d:"right", arrowright:"right", " ":"guard", space:"guard" };
  const actions = { j:"jab", k:"hook", l:"kick", u:"special", shift:"dodge" };
  function setPaused(value) {
    if (game.phase !== "fighting") return;
    paused = Boolean(value);
    resetInput();
    $("pauseOverlay").classList.toggle("hidden", !paused);
    $("arenaStatus").textContent = paused ? "PAUSED" : "FIGHT IN PROGRESS";
    updateHud();
  }
  document.addEventListener("keydown", e => {
    const key = e.key.toLowerCase();
    if (key === "escape") { e.preventDefault(); if (game.phase === "fighting") setPaused(!paused); return; }
    if (moves[key]) { e.preventDefault(); if (game.phase === "fighting" && !paused) input[moves[key]] = true; }
    if (actions[key]) { e.preventDefault(); if (!e.repeat) setAction(actions[key]); }
  });
  document.addEventListener("keyup", e => { const key = moves[e.key.toLowerCase()]; if (key) input[key] = false; });
  window.addEventListener("blur", resetInput);
  document.addEventListener("visibilitychange", () => { if (document.hidden && game.phase === "fighting" && !paused) setPaused(true); });
  $all("[data-hold]").forEach(button => {
    const key = button.dataset.hold;
    button.addEventListener("pointerdown", e => {
      if (game.phase !== "fighting" || paused) return;
      e.preventDefault();
      try { button.setPointerCapture(e.pointerId); } catch (_) {}
      input[key] = true;
      button.classList.add("is-held");
    });
    for (const type of ["pointerup", "pointercancel", "lostpointercapture"]) {
      button.addEventListener(type, () => { input[key] = false; button.classList.remove("is-held"); });
    }
  });
  $all("[data-action]").forEach(button => {
    button.addEventListener("pointerdown", e => { e.preventDefault(); if (!button.disabled) { setAction(button.dataset.action); button.classList.add("is-held"); } });
    button.addEventListener("pointerup", () => button.classList.remove("is-held"));
    button.addEventListener("pointercancel", () => button.classList.remove("is-held"));
    button.addEventListener("click", e => { if (e.detail === 0 && !button.disabled) setAction(button.dataset.action); });
  });
  window.addEventListener("pointerup", () => { if (!document.querySelector(".control-btn.is-held[data-hold]")) { input.left = input.right = input.guard = false; } });
  $("fightBtn").addEventListener("click", startMatch);
  $("resultBtn").addEventListener("click", () => {
    if (game.phase === "roundOver") {
      $("resultOverlay").classList.add("hidden");
      core.startNextRound(game); core.startRound(game);
      $("arenaStatus").textContent = "FIGHT IN PROGRESS";
      announce("ROUND " + game.round + " · FIGHT!");
      sound("round");
    } else openMenu();
    updateHud();
  });
  $("exitBtn").addEventListener("click", openMenu);
  $("pauseBtn").addEventListener("click", () => setPaused(!paused));
  $("resumeBtn").addEventListener("click", () => setPaused(false));
  $("quitBtn").addEventListener("click", openMenu);
  $("soundBtn").addEventListener("click", () => {
    soundOn = !soundOn;
    $("soundBtn").textContent = soundOn ? "♫" : "♪̸";
    $("soundBtn").setAttribute("aria-pressed", String(soundOn));
    if (soundOn) sound("select");
  });
  function sound(kind) {
    if (!soundOn) return;
    try {
      audioContext ||= new (window.AudioContext || window.webkitAudioContext)();
      if (audioContext.state === "suspended") audioContext.resume();
      const osc = audioContext.createOscillator(), gain = audioContext.createGain();
      const now = audioContext.currentTime;
      const freq = {hit:100,block:350,round:440,victory:650,select:530,dodge:230}[kind] || 180;
      osc.type = kind === "hit" ? "sawtooth" : "triangle";
      osc.frequency.setValueAtTime(freq, now);
      osc.frequency.exponentialRampToValueAtTime(Math.max(50,freq*.45), now+.14);
      gain.gain.setValueAtTime(.065,now);gain.gain.exponentialRampToValueAtTime(.001,now+.17);
      osc.connect(gain).connect(audioContext.destination);osc.start(now);osc.stop(now+.18);
    } catch (_) { soundOn = false; }
  }
  function burst(x, y, color, n) {
    for (let i = 0; i < n; i++) {
      const angle = i * 6.283 / n + Math.random() * .3, speed = 85 + Math.random() * 170;
      particles.push({x,y,vx:Math.cos(angle)*speed,vy:Math.sin(angle)*speed-55,life:.35+Math.random()*.25,color,size:2+Math.random()*5});
    }
    if (particles.length > 150) particles = particles.slice(-150);
  }
  function fillPoly(points, color) {
    ctx.beginPath(); ctx.moveTo(points[0][0],points[0][1]);
    for (let i=1;i<points.length;i++) ctx.lineTo(points[i][0],points[i][1]);
    ctx.closePath(); ctx.fillStyle=color;ctx.fill();
  }
  function ellipse(x,y,rx,ry,color) {
    ctx.beginPath();ctx.ellipse(x,y,rx,ry,0,0,Math.PI*2);ctx.fillStyle=color;ctx.fill();
  }
  function line(points,color,width) {
    ctx.beginPath();ctx.moveTo(points[0][0],points[0][1]);
    for(let i=1;i<points.length;i++)ctx.lineTo(points[i][0],points[i][1]);
    ctx.strokeStyle=color;ctx.lineWidth=width;ctx.lineJoin="round";ctx.lineCap="round";ctx.stroke();
  }
  function backdrop(t) {
    const sky=ctx.createLinearGradient(0,0,0,520);
    sky.addColorStop(0,"#091321");sky.addColorStop(.52,"#1d3443");sky.addColorStop(1,"#121b21");
    ctx.fillStyle=sky;ctx.fillRect(0,0,960,520);
    // Far skyline with lit apartment windows.
    for(let i=0;i<21;i++){
      const x=i*51-30,h=65+(i*73%96);
      ctx.fillStyle=i%3===0?"#121b29":"#152334";
      ctx.fillRect(x,298-h,49,h+65);
      for(let w=0;w<3;w++)for(let r=0;r<5;r++){
        if((i*7+w*13+r*11)%4===0){ctx.fillStyle="#e7b76b70";ctx.fillRect(x+8+w*13,308-h+r*19,5,8);}
      }
    }
    // Rooftop signage + wires.
    ctx.strokeStyle="#344251";ctx.lineWidth=2;
    ctx.beginPath();ctx.moveTo(0,126);ctx.bezierCurveTo(325,177,630,98,960,146);ctx.stroke();
    ctx.beginPath();ctx.moveTo(0,145);ctx.bezierCurveTo(325,196,630,117,960,165);ctx.stroke();
    const wall=ctx.createLinearGradient(0,222,0,397);
    wall.addColorStop(0,"#293a48");wall.addColorStop(1,"#172834");
    ctx.fillStyle=wall;ctx.fillRect(0,255,960,142);
    ctx.fillStyle="#1f2e39";for(let y=274;y<398;y+=27){ctx.fillRect(0,y,960,2)}
    ctx.fillStyle="#7487952d";for(let x=0;x<960;x+=80){ctx.fillRect(x,258,2,138)}
    ctx.save();ctx.translate(118,332);ctx.rotate(-.07);
    ctx.font="900 67px Impact, sans-serif";ctx.textAlign="left";
    ctx.strokeStyle="#14202c";ctx.lineWidth=9;ctx.strokeText("FAST LN",0,0);
    ctx.fillStyle="#49c7a2aa";ctx.fillText("FAST LN",0,0);
    ctx.restore();
    ctx.fillStyle="#ca9c65aa";ctx.font="900 34px Impact, sans-serif";ctx.fillText("THE BLOCK",676,334);
    // Streetlamps and pools of light.
    for(const x of [46,913]){
      ctx.fillStyle="#080f16";ctx.fillRect(x-4,92,8,307);
      ctx.fillRect(x-42,86,47,7);
      ellipse(x-39,96,28,7,"#ffdf9777");
      const beam=ctx.createRadialGradient(x-38,172,12,x-38,220,245);
      beam.addColorStop(0,"#f7cc7b20");beam.addColorStop(1,"#f7cc7b00");
      ctx.fillStyle=beam;ctx.fillRect(x-250,95,500,340);
    }
    // Fence + low audience silhouettes.
    ctx.strokeStyle="#66778640";ctx.lineWidth=1;
    for(let x=-10;x<980;x+=24){line([[x,336],[x+50,399]],"#77879733",1);line([[x+50,336],[x,399]],"#77879733",1)}
    for(let i=0;i<34;i++){const x=i*31-6, y=371+(i*11%7);ellipse(x,y,10,12,i%2?"#0e1c26":"#11242d");ctx.fillStyle="#12212a";ctx.fillRect(x-9,y+5,18,30)}
    ctx.fillStyle="#22313a";ctx.fillRect(0,395,960,125);
    const road=ctx.createLinearGradient(0,390,0,520);road.addColorStop(0,"#354047");road.addColorStop(1,"#171d28");
    ctx.fillStyle=road;ctx.fillRect(0,402,960,118);
    ctx.strokeStyle="#65707055";ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(0,415);ctx.lineTo(960,415);ctx.stroke();
    for(let i=0;i<12;i++){const x=i*91-24;ctx.fillStyle="#8e9a9930";ctx.fillRect(x,482,47,3)}
    for(let i=0;i<35;i++){const x=(i*107)%960,y=415+(i*43)%104;ctx.fillStyle=i%3?"#d5b47a19":"#6ac6ad1e";ctx.fillRect(x,y,4+(i%4)*8,1)}
    const reflected=ctx.createRadialGradient(420,465,15,420,465,510);
    reflected.addColorStop(0,"#43848a24");reflected.addColorStop(1,"#07102000");ctx.fillStyle=reflected;ctx.fillRect(0,370,960,150);
    // Animated signal in the distance.
    ellipse(803,239,3+Math.sin(t*2)*.7,3,"#ff9b8d");
  }
  function drawFighter(f,i,t) {
    const y=425 + (Math.abs(f.moving)>.1 ? Math.sin(t*16)*3 : Math.sin(t*2+i)*1.4);
    ellipse(f.x,440,51,10,"#05080ca8");
    ctx.save();ctx.translate(f.x,y);ctx.scale(f.facing,1);
    const att=f.attack, active=Boolean(att);
    const lunge=active ? (att==="special"?19:att==="kick"?12:8)*Math.sin((1-f.attackClock/core.MOVES[att].duration)*Math.PI) : 0;
    const lean=f.stun>0 ? -11*Math.sin(t*25) : active?lunge*.5 : 0;
    ctx.translate(lean,0);
    if(f.dodge>0) ctx.globalAlpha=.65;
    if(f.meter>=65){const glow=ctx.createRadialGradient(0,-105,7,0,-105,100);glow.addColorStop(0,i?"#ffab583c":"#4cffe43b");glow.addColorStop(1,"#0000");ctx.fillStyle=glow;ctx.fillRect(-100,-230,200,240)}
    // Rear leg, trouser panel, shoe.
    line([[-16,-94],[-22,-46],[-27,-9]],"#0a121b",26);
    line([[-16,-94],[-22,-46],[-27,-9]],i?"#35324d":"#1b5560",19);
    fillPoly([[-46,-15],[-13,-15],[-10,-3],[-49,-2]],"#0d141a");
    // Front leg changes into an extending kick.
    if(att==="kick"||att==="special"){
      const progress=1-f.attackClock/core.MOVES[att].duration, extension=Math.sin(Math.PI*cl(progress,0,1));
      const fx=16+extension*105,fy=-12-extension*82;
      line([[16,-92],[23,-54],[fx,fy]],"#0a121b",27);
      line([[16,-92],[23,-54],[fx,fy]],i?"#534461":"#2d7a82",19);
      ellipse(fx+15,fy+1,24,12,"#0c1018");
      fillPoly([[fx+5,fy-8],[fx+31,fy-9],[fx+36,fy],[fx+3,fy+3]],"#e7ddcc");
    }else{
      line([[16,-93],[22,-44],[24,-10]],"#0a121b",27);
      line([[16,-93],[22,-44],[24,-10]],i?"#534461":"#2d7a82",20);
      ellipse(31,-5,27,10,"#0d131b");
      ctx.fillStyle="#f1e8d8";ctx.fillRect(24,-12,27,5);
    }
    // Rear arm and glove.
    line([[-30,-171],[-43,-130],[-12,-111]],"#101821",25);
    line([[-30,-171],[-43,-130],[-12,-111]],i?"#9b6740":"#287d79",17);
    ellipse(-9,-112,17,15,i?"#f4a26b":"#58efc5");
    // Torso, waist belt and collar.
    fillPoly([[-35,-176],[24,-180],[45,-100],[27,-86],[-29,-89],[-46,-108]],"#0d131e");
    fillPoly([[-29,-171],[20,-173],[35,-104],[23,-92],[-25,-95],[-36,-112]],f.color);
    fillPoly([[-10,-172],[8,-171],[19,-96],[-3,-96]],"#0918204d");
    ctx.fillStyle="#0a1421";ctx.fillRect(-27,-101,55,10);
    // Costume detail.
    ctx.save();ctx.rotate(-.1);ctx.fillStyle="#071721";ctx.font="900 20px Impact,sans-serif";ctx.fillText(i?"VX":"LN",-12,-127);ctx.restore();
    // Neck + head.
    ctx.fillStyle=f.skin;ctx.fillRect(-11,-196,22,29);
    ellipse(0,-219,29,34,f.skin);
    ellipse(25,-220,6,10,f.skin);
    // Hair or headband.
    fillPoly([[-29,-229],[-23,-249],[-11,-254],[11,-253],[27,-241],[27,-226],[17,-240],[0,-240],[-12,-235],[-25,-225]],i?"#121119":"#18131c");
    if(i){ctx.fillStyle="#f0a557";ctx.fillRect(-29,-238,60,7);ctx.fillStyle="#11182a";ctx.fillRect(3,-241,32,10)}
    ctx.fillStyle="#0b1016";ctx.fillRect(10,-218,13,3);
    line([[7,-207],[18,-205]],"#38211d",2);
    // Front glove, straight jab or hook.
    let gx=30,gy=-131;
    if(f.guard){gx=11;gy=-198}
    else if(att==="jab"){const p=Math.sin(Math.PI*(1-f.attackClock/core.MOVES.jab.duration));gx=32+100*Math.max(0,p);gy=-169}
    else if(att==="hook"){const p=Math.sin(Math.PI*(1-f.attackClock/core.MOVES.hook.duration));gx=34+78*Math.max(0,p);gy=-181+15*p}
    else if(att==="special"){const p=Math.sin(Math.PI*(1-f.attackClock/core.MOVES.special.duration));gx=45+116*Math.max(0,p);gy=-170}
    line([[29,-165],[44,-145],[gx,gy]],"#11151d",26);
    line([[29,-165],[44,-145],[gx,gy]],i?"#8c5460":"#1c8d79",18);
    ellipse(gx+6,gy,18,16,i?"#ffa36e":"#6ef4d8");
    ellipse(gx+11,gy-4,10,7,"#ffffff27");
    if(f.guard){ellipse(-15,-190,19,16,i?"#ffa36e":"#6ef4d8")}
    if(f.stun>0){ctx.fillStyle="#fff5ba";ctx.font="900 15px Impact";ctx.fillText("✦",32,-250)}
    ctx.restore();
    // Name tag in arena.
    ctx.fillStyle="#050a10af";ctx.fillRect(f.x-41,455,82,20);
    ctx.fillStyle=i?"#f8b17c":"#87f7db";
    ctx.font="900 15px Impact,sans-serif";ctx.textAlign="center";ctx.fillText(f.name,f.x,470);
    ctx.textAlign="left";
  }
  function drawParticles(dt) {
    for(const p of particles){
      p.x+=p.vx*dt;p.y+=p.vy*dt;p.vy+=260*dt;p.life-=dt;
      ctx.globalAlpha=cl(p.life*2.2,0,1);ctx.fillStyle=p.color;ctx.fillRect(p.x,p.y,p.size,p.size);
    }
    ctx.globalAlpha=1;
    particles=particles.filter(p=>p.life>0);
  }
  function draw(dt) {
    ctx.clearRect(0,0,960,520);
    ctx.save();
    if(cameraShake>.2){ctx.translate((Math.random()-.5)*cameraShake,(Math.random()-.5)*cameraShake);cameraShake*=.78;}
    backdrop(tickTime);
    const fighters=[...game.fighters];
    fighters.sort((a,b)=>a.x-b.x);
    for(const f of fighters)drawFighter(f,game.fighters.indexOf(f),tickTime);
    drawParticles(dt);
    ctx.restore();
  }
  function frame(now) {
    if(!last)last=now;
    const delta=Math.min((now-last)/1000,.08);last=now;
    if (!document.hidden) readController();
    comboVisible = Math.max(0, comboVisible - delta);
    if (comboVisible === 0) $("comboCallout").classList.remove("visible");
    const freeze=paused || game.phase==="roundOver" || game.phase==="matchOver";
    if(!freeze)tickTime+=delta;
    if(game.phase==="fighting"&&!paused){
      // Brief hitstop freezes combat time as well as movement to sell impact.
      const combatDelta = impactFreeze > 0 ? 0 : delta;
      impactFreeze = Math.max(0, impactFreeze - delta);
      accumulator+=combatDelta;
      let cycles=0;
      while(accumulator>=1/60&&cycles++<5){
        const action=pending?.name||null, ctl={move:moveCommand(),guard:input.guard || padState.guard,action,dodge:pendingDodge};
        endEvents(core.step(game,ctl,1/60));
        pendingDodge=false;
        if(pending){pending.ttl-=1/60;if(pending.ttl<=0||game.fighters[0].attack===pending.name)pending=null;}
        accumulator-=1/60;
        if(game.phase!=="fighting")break;
      }
      updateHud();
    }else{accumulator=0;}
    draw(freeze?0:delta);
    requestAnimationFrame(frame);
  }
  updateCareer();
  updateHud();
  requestAnimationFrame(frame);
})();
